"use client";

import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AdminRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/app/academic/student-requests/components/DataTable";
import { createUserColumns } from "./components/userColumns";
import { CreateUserDialog } from "./components/CreateUserDialog";
import { EditUserDialog } from "./components/EditUserDialog";
import { DeleteUserDialog } from "./components/DeleteUserDialog";
import { UserDetailDialog } from "./components/UserDetailDialog";
import {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useUpdateUserStatusMutation,
  useDeleteUserMutation,
  type UserResponse,
} from "@/store/services/userApi";
import { ROLES } from "@/hooks/useRoleBasedAccess";

const PAGE_SIZE = 100; // Increased to show more users per page for better filtering

const ROLE_OPTIONS = [
  { value: "ALL", label: "Tất cả vai trò" },
  { value: ROLES.ADMIN, label: "Quản trị viên" },
  { value: ROLES.MANAGER, label: "Quản lý" },
  { value: ROLES.CENTER_HEAD, label: "Trưởng trung tâm" },
  { value: ROLES.SUBJECT_LEADER, label: "Trưởng bộ môn" },
  { value: ROLES.ACADEMIC_AFFAIR, label: "Giáo vụ" },
  { value: ROLES.TEACHER, label: "Giáo viên" },
  { value: ROLES.STUDENT, label: "Học viên" },
  { value: ROLES.QA, label: "Kiểm định chất lượng" },
];

const STATUS_OPTIONS = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "ACTIVE", label: "Hoạt động" },
  { value: "INACTIVE", label: "Không hoạt động" },
  { value: "SUSPENDED", label: "Tạm khóa" },
];

export default function AdminUsersPage() {
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [userDetail, setUserDetail] = useState<UserResponse | null>(null);
  const [userToEdit, setUserToEdit] = useState<UserResponse | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserResponse | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Fetch users with server-side filtering
  const {
    data: usersResponse,
    isFetching: isLoadingUsers,
    isError: isUsersError,
    error: usersError,
    refetch: refetchUsers,
  } = useGetUsersQuery({
    page,
    size: PAGE_SIZE,
    sort: "id,asc", // Sort ascending to show staff (ID 1-35) before students (ID 100+)
    search: searchTerm || undefined,
    role: roleFilter !== "ALL" ? roleFilter : undefined,
    status: statusFilter !== "ALL" ? statusFilter : undefined,
  });

  // Debug: Log API errors
  if (isUsersError) {
    console.error("Error fetching users:", usersError);
  }

  const [updateUserStatus] = useUpdateUserStatusMutation();
  const [deleteUser] = useDeleteUserMutation();
  
  // Get refetch function for user detail if userDetail is open
  const { refetch: refetchUserDetail } = useGetUserByIdQuery(userDetail?.id ?? 0, {
    skip: !userDetail?.id,
  });

  // Extract users from API response
  // Response structure: { success, message, data: PageableResponse<UserResponse> }
  const pageData = usersResponse?.data;
  const users = pageData?.content || [];
  const totalElements = pageData?.totalElements || 0;
  const totalPages = pageData?.totalPages || 0;

  // Reset page to 0 when filters change
  useEffect(() => {
    setPage(0);
  }, [searchTerm, roleFilter, statusFilter]);

  // Server-side filtering is now handled by the backend API
  // Users are already filtered on the server, no client-side filtering needed

  const columns = createUserColumns({
    onView: (user) => setUserDetail(user),
    onEdit: (user) => setUserToEdit(user),
    onStatusChange: async (user, newStatus) => {
      try {
        await updateUserStatus({ id: user.id, status: newStatus }).unwrap();
        toast.success(
          `Đã ${
            newStatus === "ACTIVE"
              ? "kích hoạt"
              : newStatus === "INACTIVE"
              ? "vô hiệu hóa"
              : "tạm khóa"
          } tài khoản`
        );
        refetchUsers();
      } catch (error: any) {
        toast.error(error?.data?.message || "Cập nhật trạng thái thất bại");
      }
    },
    onDelete: (user) => {
      setUserToDelete(user);
    },
  });

  const handleDeleteUser = async (userId: number) => {
    try {
      await deleteUser(userId).unwrap();
      toast.success("Xóa người dùng thành công");
      refetchUsers();
    } catch (error: any) {
      toast.error(error?.data?.message || "Xóa người dùng thất bại");
    }
  };

  return (
    <AdminRoute>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                {/* Header */}
                <div className="px-4 lg:px-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight">
                        Quản lý Người dùng
                      </h1>
                      <p className="text-muted-foreground mt-1">
                      Quản lý người dùng, vai trò và quyền hạn trong hệ thống
                    </p>
                    </div>
                    <Button
                      onClick={() => setShowCreateDialog(true)}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Tạo người dùng
                    </Button>
                  </div>
                </div>

                {/* Filters */}
                <div className="px-4 lg:px-6 space-y-3">
                  <div className="flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setPage(0);
                        }}
                        className="pl-10"
                      />
                    </div>
                    <Select
                      value={roleFilter}
                      onValueChange={(value) => {
                        setRoleFilter(value);
                        setPage(0);
                      }}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Vai trò" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={statusFilter}
                      onValueChange={(value) => {
                        setStatusFilter(value);
                        setPage(0);
                      }}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Users Table */}
                <div className="px-4 lg:px-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Tất cả Người dùng</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoadingUsers ? (
                        <div className="space-y-3">
                          {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-16 w-full" />
                          ))}
                        </div>
                      ) : isUsersError ? (
                        <div className="text-center py-12">
                          <p className="text-destructive font-medium">
                            Lỗi khi tải danh sách người dùng
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">
                            {usersError && "data" in usersError
                              ? (usersError.data as any)?.message ||
                                "Vui lòng thử lại sau"
                              : "Không thể kết nối đến máy chủ"}
                        </p>
                          <Button
                            onClick={() => refetchUsers()}
                            variant="outline"
                            className="mt-4"
                          >
                            Thử lại
                          </Button>
                        </div>
                      ) : users.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          {users.length === 0 ? (
                            <>
                              <p>Chưa có người dùng nào trong hệ thống</p>
                              <Button
                                onClick={() => setShowCreateDialog(true)}
                                variant="outline"
                                className="mt-4"
                              >
                                Tạo người dùng đầu tiên
                              </Button>
                            </>
                          ) : (
                            <p>
                              Không tìm thấy người dùng nào phù hợp với bộ lọc
                            </p>
                          )}
                        </div>
                      ) : (
                        <>
                          <DataTable columns={columns} data={users} />
                          {totalPages > 1 && (
                            <div className="mt-4">
                              <Pagination>
                                <PaginationContent>
                                  <PaginationItem>
                                    <PaginationPrevious
                                      onClick={() =>
                                        page > 0 && setPage(page - 1)
                                      }
                                      className={
                                        page === 0
                                          ? "pointer-events-none opacity-50"
                                          : "cursor-pointer"
                                      }
                                    />
                                  </PaginationItem>
                                  {[...Array(totalPages)].map((_, i) => (
                                    <PaginationItem key={i}>
                                      <PaginationLink
                                        onClick={() => setPage(i)}
                                        isActive={page === i}
                                        className="cursor-pointer"
                                      >
                                        {i + 1}
                                      </PaginationLink>
                                    </PaginationItem>
                                  ))}
                                  <PaginationItem>
                                    <PaginationNext
                                      onClick={() =>
                                        page < totalPages - 1 &&
                                        setPage(page + 1)
                                      }
                                      className={
                                        page >= totalPages - 1
                                          ? "pointer-events-none opacity-50"
                                          : "cursor-pointer"
                                      }
                                    />
                                  </PaginationItem>
                                </PaginationContent>
                              </Pagination>
                      </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

      <CreateUserDialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) {
            refetchUsers();
          }
        }}
      />

      <EditUserDialog
        open={!!userToEdit}
        onOpenChange={(open) => {
          if (!open) {
            setUserToEdit(null);
            refetchUsers();
            // If user detail dialog is open for the same user, refetch it
            if (userDetail && userToEdit && userDetail.id === userToEdit.id) {
              refetchUserDetail();
            }
          }
        }}
        user={userToEdit}
        onUpdateSuccess={() => {
          refetchUsers();
          // If user detail dialog is open for the same user, refetch it
          if (userDetail && userToEdit && userDetail.id === userToEdit.id) {
            refetchUserDetail();
          }
        }}
      />

      {/* Delete Confirmation Dialog */}
      <UserDetailDialog
        user={userDetail}
        open={!!userDetail}
        onOpenChange={(open) => {
          if (!open) setUserDetail(null);
        }}
      />

      <DeleteUserDialog
        user={userToDelete}
        open={!!userToDelete && !showCreateDialog}
        onOpenChange={(open) => {
          if (!open) setUserToDelete(null);
        }}
        onConfirm={async () => {
          if (userToDelete) {
            await handleDeleteUser(userToDelete.id);
            setUserToDelete(null);
          }
        }}
      />
    </AdminRoute>
  );
}
