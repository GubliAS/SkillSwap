export interface Skill {
  name: string;
  level: "beginner" | "intermediate" | "advanced";
  category?: string;
}

export interface CourseEntry {
  code: string;
  name: string;
  level: "beginner" | "intermediate" | "advanced";
}

export const STUDENT_LEVELS = [100, 200, 300, 400] as const;
export type StudentLevel = typeof STUDENT_LEVELS[number];

export interface Profile {
  id: string;
  name: string;
  email: string;
  faculty: string;
  student_level: StudentLevel | null;
  bio: string;
  avatar_url: string;
  skills_to_teach: Skill[];
  skills_to_learn: Skill[];
  courses_to_teach: CourseEntry[];
  courses_to_learn: CourseEntry[];
  availability: string[];
  preferred_mode: "online" | "offline" | "both";
  contact: string;
  whatsapp: string;
  session_duration_pref: 30 | 60 | 120;
  learning_goals: Record<string, string>;
  profile_visibility: "public" | "department";
  response_rate: number;
  rating: number;
  total_ratings: number;
  xp: number;
  last_seen: string;
  created_at: string;
}

export interface TeacherSubRatings {
  teaching_clarity: number;
  patience: number;
  punctuality: number;
}

export interface LearnerSubRatings {
  engagement: number;
  preparation: number;
  punctuality: number;
}

export interface Session {
  id: string;
  teacher_id: string;
  learner_id: string;
  skill: string;
  date: string;
  time: string;
  duration: number; // minutes
  mode: "online" | "offline";
  location: string;
  status: "pending" | "accepted" | "completed" | "cancelled";
  teacher_rating?: number;
  learner_rating?: number;
  teacher_feedback?: string;
  learner_feedback?: string;
  teacher_sub_ratings?: LearnerSubRatings | null;
  learner_sub_ratings?: TeacherSubRatings | null;
  checked_in_at?: string | null;
  reschedule_date?: string | null;
  reschedule_time?: string | null;
  reschedule_proposed_by?: string | null;
  notes: string;
  created_at: string;
}

export interface SessionStats {
  total_completed: number;
  total_hours: number;
  most_taught_skill: string | null;
  learning_streak: number;
  sessions_as_teacher: number;
  sessions_as_learner: number;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  type: "text" | "resource" | "audio" | "image" | "document";
  read: boolean;
  delivered: boolean;
  created_at: string;
  reply_to?: string | null;
  reply_preview?: string | null;
  reply_sender_id?: string | null;
  deleted_at?: string | null;
  pinned?: boolean;
  edited_at?: string | null;
  forwarded_from?: string | null;
  reactions?: Reaction[];
}

export interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link: string;
  read: boolean;
  created_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const FACULTIES = [
  "College of Engineering",
  "College of Science",
  "College of Art & Built Environment",
  "College of Humanities & Social Sciences",
  "College of Health Sciences",
  "College of Agriculture & Natural Resources",
];

export const SKILL_CATEGORIES = [
  "Programming",
  "Design",
  "Mathematics",
  "Languages",
  "Science",
  "Business",
  "Engineering",
  "Music & Arts",
  "Communication",
  "Other",
];

export interface StudyGroup {
  id: string;
  name: string;
  course_code: string;
  department: string;
  creator_id: string;
  description: string;
  max_members: number;
  schedule_days: string[];
  schedule_time: string;
  location: string;
  created_at: string;
  member_count?: number;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: "coordinator" | "member";
  status: "pending" | "approved";
  joined_at: string;
  profile?: Profile;
}

export interface GroupMessage {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: Profile;
}

export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export type ReportReason = "harassment" | "spam" | "inappropriate" | "other";

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reported_message_id?: string | null;
  reason: ReportReason;
  details: string;
  status: "pending" | "reviewed" | "dismissed";
  created_at: string;
}

export interface ReviewHelpfulVote {
  id: string;
  session_id: string;
  voter_id: string;
  created_at: string;
}

export interface ReviewReply {
  id: string;
  session_id: string;
  teacher_id: string;
  content: string;
  created_at: string;
}
