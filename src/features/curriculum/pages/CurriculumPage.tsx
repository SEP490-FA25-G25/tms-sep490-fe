import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SubjectList } from "../components/SubjectList";
import { CourseList } from "../components/CourseList";
import { LevelList } from "../components/LevelList";
import { DashboardLayout } from "@/components/DashboardLayout";

import { useAuth } from "@/contexts/AuthContext";

export default function CurriculumPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isSubjectLeader = user?.roles?.includes("SUBJECT_LEADER");

    return (
        <DashboardLayout
            title="Quản lý Chương trình đào tạo"
            description="Quản lý môn học, cấp độ và đề cương khóa học."
        >
            <Tabs defaultValue="courses" className="space-y-4">
                <div className="flex items-center justify-between">
                    <TabsList>
                        <TabsTrigger value="subjects">Môn học</TabsTrigger>
                        <TabsTrigger value="levels">Cấp độ</TabsTrigger>
                        <TabsTrigger value="courses">Khóa học</TabsTrigger>
                    </TabsList>
                    <div className="flex items-center gap-2">
                        {isSubjectLeader && (
                            <Button onClick={() => navigate("/curriculum/courses/create")}>
                                <Plus className="mr-2 h-4 w-4" />
                                Tạo Khóa học
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => navigate("/curriculum/levels/create")}>
                            <Plus className="mr-2 h-4 w-4" />
                            Tạo Cấp độ
                        </Button>
                        <Button variant="outline" onClick={() => navigate("/curriculum/subjects/create")}>
                            <Plus className="mr-2 h-4 w-4" />
                            Tạo Môn học
                        </Button>
                    </div>
                </div>

                <TabsContent value="subjects" className="space-y-4">
                    <SubjectList />
                </TabsContent>
                <TabsContent value="levels" className="space-y-4">
                    <LevelList />
                </TabsContent>
                <TabsContent value="courses" className="space-y-4">
                    <CourseList />
                </TabsContent>
            </Tabs>
        </DashboardLayout>
    );
}
