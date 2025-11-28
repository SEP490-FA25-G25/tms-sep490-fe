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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Plus, Search, Building2, MapPin } from "lucide-react";
import { toast } from "sonner";
import {
  useGetCentersQuery,
  useDeleteCenterMutation,
  type CenterResponse,
} from "@/store/services/centerApi";
import { CreateCenterDialog } from "./components/CreateCenterDialog";
import { EditCenterDialog } from "./components/EditCenterDialog";
import { CenterDetailDialog } from "./components/CenterDetailDialog";
import { DeleteCenterDialog } from "./components/DeleteCenterDialog";

const PAGE_SIZE = 20;

export default function AdminCentersPage() {
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCenter, setSelectedCenter] = useState<CenterResponse | null>(null);
  const [centerToEdit, setCenterToEdit] = useState<CenterResponse | null>(null);
  const [centerToDelete, setCenterToDelete] = useState<CenterResponse | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const {
    data: centersResponse,
    isFetching: isLoadingCenters,
    isError: isCentersError,
    error: centersError,
    refetch: refetchCenters,
  } = useGetCentersQuery({
    page,
    size: PAGE_SIZE,
    sort: "createdAt,desc",
  });

  const [deleteCenter] = useDeleteCenterMutation();

  // Extract centers from API response
  // Response structure: { success, message, data: PageableResponse<CenterResponse> }
  // RTK Query trả về ApiResponse wrapper, nên cần access .data để lấy PageableResponse
  const pageData = centersResponse?.data;
  const centers: CenterResponse[] = pageData?.content || [];
  const totalElements = pageData?.totalElements || 0;
  const totalPages = pageData?.totalPages || 0;

  // Filter centers by search term on client side
  const filteredCenters = centers.filter((center) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      center.name?.toLowerCase().includes(searchLower) ||
      center.code?.toLowerCase().includes(searchLower) ||
      center.address?.toLowerCase().includes(searchLower) ||
      center.email?.toLowerCase().includes(searchLower)
    );
  });

  useEffect(() => {
    setPage(0);
  }, [searchTerm]);

  const handleDeleteCenter = async (centerId: number) => {
    try {
      const result = await deleteCenter(centerId).unwrap();
      if (!result.success) {
        throw new Error(result.message || "Xóa trung tâm thất bại");
      }
      toast.success("Xóa trung tâm thành công");
      refetchCenters();
      setCenterToDelete(null);
    } catch (error: unknown) {
      toast.error((error as { data?: { message?: string } })?.data?.message || "Xóa trung tâm thất bại");
    }
  };

  if (isCentersError) {
    console.error("Error fetching centers:", centersError);
    toast.error("Không thể tải danh sách trung tâm. Vui lòng thử lại.");
  }

  // Debug: Log response để kiểm tra cấu trúc
  useEffect(() => {
    if (centersResponse) {
      console.log("Centers API Response:", centersResponse);
      console.log("Centers Response Data:", centersResponse.data);
      console.log("Page Data:", centersResponse.data || centersResponse);
    }
  }, [centersResponse]);

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
                        Quản lý Trung tâm và Chi nhánh
                      </h1>
                      <p className="text-muted-foreground mt-1">
                        Quản lý trung tâm và các chi nhánh trong hệ thống
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowCreateDialog(true)}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Tạo trung tâm
                    </Button>
                  </div>
                </div>

                {/* Search */}
                <div className="px-4 lg:px-6 space-y-3">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Tìm kiếm theo tên, mã, địa chỉ..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPage(0);
                      }}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Centers Table */}
                <div className="px-4 lg:px-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Danh sách Trung tâm</CardTitle>
                      <CardDescription>
                        Tổng số: {totalElements} trung tâm
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoadingCenters ? (
                        <div className="space-y-3">
                          {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-20 w-full" />
                          ))}
                        </div>
                      ) : filteredCenters.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium">
                            {searchTerm ? "Không tìm thấy trung tâm nào" : "Chưa có trung tâm nào"}
                          </p>
                          <p className="text-sm mt-2">
                            {searchTerm
                              ? "Thử tìm kiếm với từ khóa khác"
                              : "Tạo trung tâm đầu tiên để bắt đầu"}
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="border rounded-lg overflow-hidden">
                            <table className="w-full">
                              <thead className="bg-muted">
                                <tr>
                                  <th className="px-4 py-3 text-left text-sm font-medium">Mã</th>
                                  <th className="px-4 py-3 text-left text-sm font-medium">Tên trung tâm</th>
                                  <th className="px-4 py-3 text-left text-sm font-medium">Địa chỉ</th>
                                  <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                                  <th className="px-4 py-3 text-left text-sm font-medium">Điện thoại</th>
                                  <th className="px-4 py-3 text-right text-sm font-medium">Thao tác</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredCenters.map((center) => (
                                  <tr
                                    key={center.id}
                                    className="border-t hover:bg-muted/50 cursor-pointer"
                                    onClick={() => setSelectedCenter(center)}
                                  >
                                    <td className="px-4 py-3 text-sm font-medium">
                                      {center.code}
                                    </td>
                                    <td className="px-4 py-3 text-sm">{center.name}</td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                      <div className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {center.address || "-"}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                      {center.email || "-"}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                      {center.phone || "-"}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      <div className="flex justify-end gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedCenter(center);
                                          }}
                                        >
                                          Chi tiết
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setCenterToEdit(center);
                                          }}
                                        >
                                          Sửa
                                        </Button>
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setCenterToDelete(center);
                                          }}
                                        >
                                          Xóa
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Pagination */}
                          {totalPages > 1 && (
                            <div className="mt-4">
                              <Pagination>
                                <PaginationContent>
                                  <PaginationItem>
                                    <PaginationPrevious
                                      onClick={() => setPage(Math.max(0, page - 1))}
                                      className={
                                        page === 0 ? "pointer-events-none opacity-50" : "cursor-pointer"
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
                                      onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
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

      {/* Dialogs */}
      {showCreateDialog && (
        <CreateCenterDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={() => {
            setShowCreateDialog(false);
            refetchCenters();
          }}
        />
      )}

      {centerToEdit && (
        <EditCenterDialog
          open={!!centerToEdit}
          center={centerToEdit}
          onOpenChange={(open) => {
            if (!open) setCenterToEdit(null);
          }}
          onSuccess={() => {
            setCenterToEdit(null);
            refetchCenters();
          }}
        />
      )}

      {selectedCenter && (
        <CenterDetailDialog
          open={!!selectedCenter}
          center={selectedCenter}
          onOpenChange={(open) => {
            if (!open) setSelectedCenter(null);
          }}
          onEdit={() => {
            setSelectedCenter(null);
            setCenterToEdit(selectedCenter);
          }}
          onSuccess={() => {
            refetchCenters();
          }}
        />
      )}

      {centerToDelete && (
        <DeleteCenterDialog
          open={!!centerToDelete}
          center={centerToDelete}
          onOpenChange={(open) => {
            if (!open) setCenterToDelete(null);
          }}
          onConfirm={() => {
            handleDeleteCenter(centerToDelete.id);
          }}
        />
      )}
    </AdminRoute>
  );
}
