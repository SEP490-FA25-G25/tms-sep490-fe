export interface CourseBasicInfo {
    subjectId: string;
    levelId: string;
    name: string;
    code: string;
    hoursPerSession?: number;
    scoreScale?: string;
    effectiveDate?: string;
    targetAudience?: string;
    teachingMethods?: string;
    description?: string;
    prerequisites?: string;
    durationHours?: number;
    numberOfSessions?: number;
    thumbnailUrl?: string;
}

export interface CLO {
    id?: string;
    code: string;
    description: string;
    mappedPLOs?: string[];
}

export interface Session {
    id: string;
    sequence?: number;
    topic: string;
    studentTask: string;
    skills: string[];
    cloIds: string[];
}

export interface Phase {
    id: string;
    name: string;
    description?: string;
    sessions: Session[];
}

export interface Assessment {
    id?: string;
    name: string;
    type: "QUIZ" | "MIDTERM" | "FINAL" | "MOCK_TEST" | "PHASE_TEST" | "PLACEMENT_TEST" | "HOMEWORK" | "ORAL" | "PRACTICE" | "OTHER";
    durationMinutes?: number;
    maxScore?: number;
    skills?: string[];
    description?: string;
    note?: string;
    cloIds: string[];
}

export interface Material {
    id?: string;
    name: string;
    type: string;
    scope: string;
    url: string;
    phaseId?: string;
    sessionId?: string;
}

export interface CourseData {
    id?: number;
    basicInfo: CourseBasicInfo;
    clos: CLO[];
    structure: Phase[];
    assessments: Assessment[];
    materials: Material[];
    status?: string;
}
