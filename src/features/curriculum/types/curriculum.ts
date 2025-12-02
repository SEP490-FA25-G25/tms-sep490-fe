export interface Subject {
  id: string;
  code: string;
  name: string;
  levelCount: number;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface Level {
  id: string;
  code: string;
  name: string;
}

export interface PLO {
  id: string;
  code: string;
  description: string;
}

export interface CLO {
  id: string;
  code: string;
  description: string;
  ploIds: string[]; // Mapped PLOs
}

export interface CourseSession {
  id: string;
  sequence: number;
  topic: string;
  studentTask: string;
  cloIds: string[]; // Mapped CLOs
  skill?: string;
}

export interface CoursePhase {
  id: string;
  name: string;
  sessions: CourseSession[];
}

export interface Assessment {
  id: string;
  name: string;
  type: 'QUIZ' | 'MIDTERM' | 'FINAL' | 'ASSIGNMENT' | 'PROJECT' | 'OTHER';
  weight: number;
  durationMinutes: number;
  cloIds: string[];
}

export interface CourseMaterial {
  id: string;
  name: string;
  type: 'VIDEO' | 'PDF' | 'SLIDE' | 'DOC' | 'OTHER';
  url: string;
  scope: 'COURSE' | 'PHASE' | 'SESSION';
}

export interface CourseFormValues {
  // Step 1
  subjectId: string;
  levelId: string;
  name: string;
  code: string;
  description: string;
  prerequisites: string;
  timeAllocation: {
    totalHours: number;
    weeks: number;
    sessionsPerWeek: number;
    hoursPerSession: number;
  };

  // Step 2
  clos: CLO[];

  // Step 3
  phases: CoursePhase[];

  // Step 4
  assessments: Assessment[];

  // Step 5
  materials: CourseMaterial[];
}
