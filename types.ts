// Represents a file stored in Supabase Storage
export interface FileObject {
  name: string;
  path: string;       // Path in the storage bucket, e.g., "public/course-files/lecture1.pdf"
  publicUrl: string;  // Publicly accessible URL for viewing/downloading
  type: string;       // IANA media type, e.g., 'application/pdf'
}

export interface Lecture {
  id: string; // UUID from Supabase
  name: string;
  file: FileObject | null;
  completed: boolean;
  course_id: string; // Foreign key to the courses table
}

export interface Section {
  id: string; // UUID from Supabase
  name: string;
  file: FileObject | null;
  completed: boolean;
  course_id: string; // Foreign key to the courses table
}

// Represents the basic structure of a course (shell) before it's inserted into the DB
// or as returned by the Gemini API.
export interface CourseShell {
  nameAr: string;
  nameEn: string;
  doctor: string;
  taName?: string;
  lectureDay?: string; // يوم المحاضرة
  sectionDay?: string; // يوم السكشن
}

// Represents the full course object, assembled from DB tables for use in the UI.
export interface Course extends CourseShell {
  id: string; // UUID from Supabase, mandatory here
  lectures: Lecture[];
  sections: Section[];
}