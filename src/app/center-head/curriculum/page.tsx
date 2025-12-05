"use client";

import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Eye, BookOpen, GraduationCap, Layers } from "lucide-react";
import { useGetAllCoursesQuery, type CourseDTO } from "@/store/services/courseApi";
import { useGetSubjectsWithLevelsQuery, useGetLevelsQuery, type SubjectWithLevelsDTO, type LevelDTO } from "@/store/services/curriculumApi";

const PAGE_SIZE = 10;

export default function CenterHeadCurriculumPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [currentTab, setCurrentTab] = useState(
    searchParams.get("tab") || "courses"
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch data
  const { data: coursesData, isLoading: isLoadingCourses } = useGetAllCoursesQuery();
  const { data: subjectsData, isLoading: isLoadingSubjects } = useGetSubjectsWithLevelsQuery();
  const { data: levelsData, isLoading: isLoadingLevels } = useGetLevelsQuery(undefined);

  const courses: CourseDTO[] = coursesData ?? [];
  const subjects: SubjectWithLevelsDTO[] = subjectsData?.data ?? [];
  const levels: LevelDTO[] = levelsData?.data ?? [];

  // Filter courses
  const filteredCourses = useMemo(() => {
    let result = courses;

    if (statusFilter !== "all") {
      result = result.filter((c: CourseDTO) => c.status === statusFilter);
    }

    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(
        (c: CourseDTO) =>
          c.name?.toLowerCase().includes(term) ||
          c.code?.toLowerCase().includes(term)
      );
    }

    return result;
  }, [courses, statusFilter, search]);

  // Pagination for courses
  const totalCoursePages = Math.ceil(filteredCourses.length / PAGE_SIZE);
  const paginatedCourses = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredCourses.slice(start, start + PAGE_SIZE);
  }, [filteredCourses, currentPage]);

  // Filter subjects
  const filteredSubjects = useMemo(() => {
    if (!search.trim()) return subjects;
    const term = search.toLowerCase();
    return subjects.filter(
      (s: SubjectWithLevelsDTO) =>
        s.name?.toLowerCase().includes(term) ||
        s.code?.toLowerCase().includes(term)
    );
  }, [subjects, search]);

  // Filter levels
  const filteredLevels = useMemo(() => {
    if (!search.trim()) return levels;
    const term = search.toLowerCase();
    return levels.filter(
      (l: LevelDTO) =>
        l.name?.toLowerCase().includes(term) ||
        l.code?.toLowerCase().includes(term)
    );
  }, [levels, search]);

  const handleTabChange = (value: string) => {
    setCurrentTab(value);
    setSearchParams({ tab: value });
    setCurrentPage(1);
    setSearch("");
    setStatusFilter("all");
  };

  // Stats
  const stats = useMemo(() => ({
    totalCourses: courses.length,
    activeCourses: courses.filter((c: CourseDTO) => c.status === "ACTIVE").length,
    totalSubjects: subjects.length,
    totalLevels: levels.length,
  }), [courses, subjects, levels]);

  return (
    <DashboardLayout
      title="Chương trình đào tạo"
      description="Xem danh sách khóa học, môn học và cấp độ đào tạo."
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng khóa học</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCourses}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeCourses} đang hoạt động
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Môn học</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSubjects}</div>
              <p className="text-xs text-muted-foreground">Danh mục môn học</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cấp độ</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLevels}</div>
              <p className="text-xs text-muted-foreground">Cấp độ đào tạo</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trạng thái</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {Math.round((stats.activeCourses / Math.max(stats.totalCourses, 1)) * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">Khóa học active</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={currentTab} onValueChange={handleTabChange}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <TabsList>
              <TabsTrigger value="courses">Khóa học</TabsTrigger>
              <TabsTrigger value="subjects">Môn học</TabsTrigger>
              <TabsTrigger value="levels">Cấp độ</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-8 w-[250px]"
                />
              </div>
              {currentTab === "courses" && (
                <Select
                  value={statusFilter}
                  onValueChange={(v) => {
                    setStatusFilter(v);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                    <SelectItem value="DRAFT">Nháp</SelectItem>
                    <SelectItem value="INACTIVE">Ngưng</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-4">
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã khóa học</TableHead>
                    <TableHead>Tên khóa học</TableHead>
                    <TableHead>Môn học</TableHead>
                    <TableHead>Cấp độ</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingCourses ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <TableRow key={idx}>
                        {Array.from({ length: 6 }).map((_, colIdx) => (
                          <TableCell key={colIdx}>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : paginatedCourses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Không tìm thấy khóa học nào.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedCourses.map((course: CourseDTO) => (
                      <TableRow key={course.id}>
                        <TableCell className="font-mono text-sm">{course.code}</TableCell>
                        <TableCell className="font-medium">{course.name}</TableCell>
                        <TableCell>{course.subjectName || "N/A"}</TableCell>
                        <TableCell>{course.levelName || "N/A"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              course.status === "ACTIVE"
                                ? "default"
                                : course.status === "DRAFT"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {course.status === "ACTIVE"
                              ? "Hoạt động"
                              : course.status === "DRAFT"
                              ? "Nháp"
                              : "Ngưng"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/center-head/curriculum/courses/${course.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Xem
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalCoursePages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.min(totalCoursePages, 5) }, (_, i) => (
                    <PaginationItem key={i + 1}>
                      <PaginationLink
                        onClick={() => setCurrentPage(i + 1)}
                        isActive={currentPage === i + 1}
                        className="cursor-pointer"
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage((p) => Math.min(totalCoursePages, p + 1))}
                      className={currentPage === totalCoursePages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </TabsContent>

          {/* Subjects Tab */}
          <TabsContent value="subjects" className="space-y-4">
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã môn</TableHead>
                    <TableHead>Tên môn học</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingSubjects ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <TableRow key={idx}>
                        {Array.from({ length: 4 }).map((_, colIdx) => (
                          <TableCell key={colIdx}>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : filteredSubjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Không tìm thấy môn học nào.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubjects.map((subject: SubjectWithLevelsDTO) => (
                      <TableRow key={subject.id}>
                        <TableCell className="font-mono text-sm">{subject.code}</TableCell>
                        <TableCell className="font-medium">{subject.name}</TableCell>
                        <TableCell className="text-muted-foreground max-w-md truncate">
                          {subject.description || "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={subject.status === "ACTIVE" ? "default" : "secondary"}>
                            {subject.status === "ACTIVE" ? "Hoạt động" : "Ngưng"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Levels Tab */}
          <TabsContent value="levels" className="space-y-4">
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã cấp độ</TableHead>
                    <TableHead>Tên cấp độ</TableHead>
                    <TableHead>Thứ tự</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingLevels ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <TableRow key={idx}>
                        {Array.from({ length: 5 }).map((_, colIdx) => (
                          <TableCell key={colIdx}>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : filteredLevels.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Không tìm thấy cấp độ nào.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLevels.map((level: LevelDTO) => (
                      <TableRow key={level.id}>
                        <TableCell className="font-mono text-sm">{level.code}</TableCell>
                        <TableCell className="font-medium">{level.name}</TableCell>
                        <TableCell>{level.sortOrder ?? "N/A"}</TableCell>
                        <TableCell className="text-muted-foreground max-w-md truncate">
                          {level.description || "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={level.status === "ACTIVE" ? "default" : "secondary"}>
                            {level.status === "ACTIVE" ? "Hoạt động" : "Ngưng"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
