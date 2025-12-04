# Form Validation Pattern

Hướng dẫn pattern validate form trong React với real-time validation và kiểm tra trùng lặp dữ liệu.

## 1. Cấu trúc cơ bản

### 1.1 Import các hooks cần thiết

```tsx
import { useState, useEffect } from "react";
import { toast } from "sonner";

// Import API hook để lấy dữ liệu hiện có (cho việc check trùng lặp)
import {
  useGetDataQuery,
  useCreateMutation,
  useUpdateMutation,
} from "@/store/services/api";
```

### 1.2 Định nghĩa Error States

Tạo state riêng cho từng field cần validate:

```tsx
const [codeError, setCodeError] = useState<string | null>(null);
const [nameError, setNameError] = useState<string | null>(null);
const [descriptionError, setDescriptionError] = useState<string | null>(null);
const [itemErrors, setItemErrors] = useState<{ [key: number]: string }>({}); // Cho array items
```

### 1.3 Lấy dữ liệu hiện có để check trùng lặp

```tsx
const { data: response } = useGetDataQuery();
const existingItems = response?.data || [];
```

## 2. Validation Functions

### 2.1 Check trùng lặp (case-insensitive)

```tsx
const validateCode = (value: string): string | null => {
  const trimmedValue = value.trim().toLowerCase();

  // Khi edit: loại trừ item đang sửa ra khỏi việc check
  const isDuplicate = existingItems.some(
    (item) =>
      item.code.toLowerCase() === trimmedValue && item.id !== editingItem?.id
  );

  if (isDuplicate) {
    return "Mã đã tồn tại";
  }
  return null;
};

const validateName = (value: string): string | null => {
  const trimmedValue = value.trim().toLowerCase();
  const isDuplicate = existingItems.some(
    (item) =>
      item.name.toLowerCase() === trimmedValue && item.id !== editingItem?.id
  );

  if (isDuplicate) {
    return "Tên đã tồn tại";
  }
  return null;
};
```

### 2.2 Check độ dài tối thiểu (cho phép empty hoặc min length)

```tsx
const validateDescription = (value: string): string | null => {
  if (value.length > 0 && value.length < 10) {
    return "Mô tả phải để trống hoặc có ít nhất 10 ký tự";
  }
  return null;
};
```

### 2.3 Check required field

```tsx
const validateRequired = (value: string, fieldName: string): string | null => {
  if (!value.trim()) {
    return `${fieldName} không được để trống`;
  }
  return null;
};
```

## 3. Real-time Validation trong handleChange

```tsx
const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
) => {
  const { id, value } = e.target;
  setFormData((prev) => ({ ...prev, [id]: value }));
  setIsDirty(true);

  // Validate ngay khi user nhập
  switch (id) {
    case "code":
      setCodeError(validateCode(value));
      break;
    case "name":
      setNameError(validateName(value));
      break;
    case "description":
      setDescriptionError(validateDescription(value));
      break;
  }
};
```

## 4. Validate Array Items (như PLOs)

### 4.1 Update item và clear error

```tsx
const updateItem = (
  index: number,
  field: "code" | "description",
  value: string
) => {
  setFormData((prev) => ({
    ...prev,
    items: prev.items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ),
  }));
  setIsDirty(true);

  // Clear error khi user bắt đầu nhập
  if (field === "description" && value.trim().length > 0) {
    setItemErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[index];
      return newErrors;
    });
  }
};
```

### 4.2 Auto-renumber khi xóa item

```tsx
const handleRemoveItem = (indexToRemove: number) => {
  setFormData((prev) => {
    const newItems = prev.items.filter((_, i) => i !== indexToRemove);

    // Đánh số lại tuần tự
    const renumberedItems = newItems.map((item, index) => ({
      ...item,
      code: `ITEM${index + 1}`,
    }));

    return { ...prev, items: renumberedItems };
  });
};
```

## 5. Validation trong handleSubmit

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // 1. Validate các field chính
  const codeErr = validateCode(formData.code);
  const nameErr = validateName(formData.name);
  const descErr = validateDescription(formData.description);

  if (codeErr) {
    setCodeError(codeErr);
    toast.error(codeErr);
    return;
  }

  if (nameErr) {
    setNameError(nameErr);
    toast.error(nameErr);
    return;
  }

  if (descErr) {
    setDescriptionError(descErr);
    return;
  }

  // 2. Validate array items
  const itemValidationErrors: { [key: number]: string } = {};
  formData.items.forEach((item, index) => {
    if (!item.description.trim()) {
      itemValidationErrors[index] = "Mô tả không được để trống";
    }
  });

  if (Object.keys(itemValidationErrors).length > 0) {
    setItemErrors(itemValidationErrors);
    toast.error("Vui lòng nhập mô tả cho tất cả items");
    return;
  }

  // 3. Submit nếu không có lỗi
  try {
    if (editingItem) {
      await updateMutation({ id: editingItem.id, data: formData }).unwrap();
      toast.success("Cập nhật thành công");
    } else {
      await createMutation(formData).unwrap();
      toast.success("Tạo mới thành công");
    }
    onClose();
  } catch (error) {
    toast.error("Có lỗi xảy ra");
  }
};
```

## 6. Reset Errors khi mở/đóng dialog

```tsx
useEffect(() => {
  if (editingItem) {
    setFormData({
      /* ... load data */
    });
  } else {
    setFormData({
      /* ... default values */
    });
  }

  // Reset tất cả error states
  setCodeError(null);
  setNameError(null);
  setDescriptionError(null);
  setItemErrors({});
  setIsDirty(false);
}, [editingItem, open]);
```

## 7. UI hiển thị lỗi

### 7.1 Input field với error

```tsx
<div className="space-y-2">
  <Label htmlFor="code">
    Mã <span className="text-red-500">*</span>
  </Label>
  <Input
    id="code"
    value={formData.code}
    onChange={handleChange}
    className={codeError ? "border-red-500" : ""}
    required
  />
  {codeError && <p className="text-sm text-red-500">{codeError}</p>}
</div>
```

### 7.2 Input disabled (auto-generated)

```tsx
<Input value={item.code} disabled className="bg-muted" />
```

### 7.3 Table với item errors

```tsx
<TableCell>
  <div className="space-y-1">
    <Input
      value={item.description}
      onChange={(e) => updateItem(index, "description", e.target.value)}
      className={itemErrors[index] ? "border-red-500" : ""}
    />
    {itemErrors[index] && (
      <p className="text-xs text-red-500">{itemErrors[index]}</p>
    )}
  </div>
</TableCell>
```

## 8. Checklist áp dụng

- [ ] Import useState, useEffect
- [ ] Import useGetQuery để lấy dữ liệu check trùng lặp
- [ ] Tạo error states cho từng field
- [ ] Viết validation functions
- [ ] Gọi validation trong handleChange (real-time)
- [ ] Gọi validation trong handleSubmit (trước khi submit)
- [ ] Reset errors trong useEffect khi open/close dialog
- [ ] Thêm className error cho Input (border-red-500)
- [ ] Thêm thông báo lỗi dưới Input
- [ ] Thêm toast.error cho các lỗi quan trọng (trùng lặp)
- [ ] Đánh dấu required fields với \* đỏ

## 9. Ví dụ đầy đủ

Xem file `/src/features/curriculum/components/SubjectDialog.tsx` để tham khảo implementation hoàn chỉnh.
