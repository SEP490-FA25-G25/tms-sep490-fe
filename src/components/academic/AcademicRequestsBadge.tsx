import { Badge } from "@/components/ui/badge";
import { useGetPendingRequestsQuery } from "@/store/services/studentRequestApi";
import { useGetStaffRequestsQuery } from "@/store/services/teacherRequestApi";
import { useAuth } from "@/hooks/useAuth";

/**
 * Badge hiển thị số lượng student requests đang chờ xử lý
 * Dùng trong sidebar menu cho Academic Affairs
 */
export function StudentRequestsBadge() {
  const { data: response, isLoading } = useGetPendingRequestsQuery({
    page: 0,
    size: 1,
  });

  const count = response?.data?.summary?.totalPending ?? 0;
  const displayCount = count > 99 ? "99+" : count;

  if (!isLoading && count === 0) {
    return null;
  }

  return (
    <Badge
      variant="destructive"
      className="ml-auto flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-semibold"
    >
      {isLoading ? "…" : displayCount}
    </Badge>
  );
}

/**
 * Badge hiển thị số lượng teacher requests đang chờ xử lý
 * Dùng trong sidebar menu cho Academic Affairs
 */
export function TeacherRequestsBadge() {
  const { selectedBranchId } = useAuth();
  const { data: response, isLoading } = useGetStaffRequestsQuery({
    status: "PENDING",
    branchId: selectedBranchId || undefined,
  });

  const count = response?.data?.length ?? 0;
  const displayCount = count > 99 ? "99+" : count;

  if (!isLoading && count === 0) {
    return null;
  }

  return (
    <Badge
      variant="destructive"
      className="ml-auto flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-semibold"
    >
      {isLoading ? "…" : displayCount}
    </Badge>
  );
}
