import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SubjectList } from "@/components/curriculum/SubjectList";
import { CourseList } from "@/components/curriculum/CourseList";
import { LevelList } from "@/components/curriculum/LevelList";
import { DashboardLayout } from "@/components/DashboardLayout";

import { useAuth } from "@/contexts/AuthContext";

export default function CurriculumPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuth();
    const isSubjectLeader = user?.roles?.includes("SUBJECT_LEADER");

    const [currentTab, setCurrentTab] = useState(() => {
        const urlTab = searchParams.get("tab");
        if (urlTab) return urlTab;

        const storedTab = typeof window !== "undefined" ? localStorage.getItem("curriculum:lastTab") : null;
        return storedTab || "courses";
    });

    useEffect(() => {
        const urlTab = searchParams.get("tab");
        if (urlTab) {
            setCurrentTab(urlTab);
            localStorage.setItem("curriculum:lastTab", urlTab);
        } else {
            setSearchParams({ tab: currentTab }, { replace: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    const handleTabChange = (value: string) => {
        setCurrentTab(value);
        localStorage.setItem("curriculum:lastTab", value);
        setSearchParams({ tab: value });
    };

    return (
        <DashboardLayout
            title="Quản lý Chương trình đào tạo"
            description="Quản lý môn học, cấp độ và giáo trình khóa học."
        >
            <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-4">
                <div className="flex items-center justify-between">
                    <TabsList>
                        <TabsTrigger value="subjects">Khung chương trình</TabsTrigger>
                        <TabsTrigger value="levels">Cấp độ</TabsTrigger>
                        <TabsTrigger value="courses">Khóa học</TabsTrigger>
                    </TabsList>
                    <div className="flex items-center gap-2">
                        {isSubjectLeader && (
                            <>
                                {currentTab === "courses" && (
                                    <Button onClick={() => navigate("/curriculum/courses/create")}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Tạo Khóa học
                                    </Button>
                                )}
                            </>
                        )}
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
