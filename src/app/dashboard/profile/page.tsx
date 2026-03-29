"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { updateProfile } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { Skill, CourseEntry, FACULTIES, SKILL_CATEGORIES, DAYS_OF_WEEK, STUDENT_LEVELS, StudentLevel } from "@/lib/types";
import { toast } from "sonner";
import { Plus, X, Camera } from "lucide-react";

export default function ProfilePage() {
  const { user, isLoading, refreshProfile } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [faculty, setFaculty] = useState("");
  const [studentLevel, setStudentLevel] = useState<StudentLevel | null>(null);
  const [contact, setContact] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [sessionDurationPref, setSessionDurationPref] = useState<30 | 60 | 120>(60);
  const [learningGoals, setLearningGoals] = useState<Record<string, string>>({});
  const [preferredMode, setPreferredMode] = useState("online");
  const [availability, setAvailability] = useState<string[]>([]);
  const [skillsToTeach, setSkillsToTeach] = useState<Skill[]>([]);
  const [skillsToLearn, setSkillsToLearn] = useState<Skill[]>([]);
  const [newTeachSkill, setNewTeachSkill] = useState("");
  const [newTeachLevel, setNewTeachLevel] = useState<Skill["level"]>("intermediate");
  const [newTeachCategory, setNewTeachCategory] = useState("Other");
  const [newLearnSkill, setNewLearnSkill] = useState("");
  const [newLearnLevel, setNewLearnLevel] = useState<Skill["level"]>("beginner");
  const [newLearnCategory, setNewLearnCategory] = useState("Other");
  const [coursesToTeach, setCoursesToTeach] = useState<CourseEntry[]>([]);
  const [newTeachCode, setNewTeachCode] = useState("");
  const [newTeachCourseName, setNewTeachCourseName] = useState("");
  const [newTeachCourseLevel, setNewTeachCourseLevel] = useState<CourseEntry["level"]>("intermediate");
  const [coursesToLearn, setCoursesToLearn] = useState<CourseEntry[]>([]);
  const [newLearnCode, setNewLearnCode] = useState("");
  const [newLearnCourseName, setNewLearnCourseName] = useState("");
  const [newLearnCourseLevel, setNewLearnCourseLevel] = useState<CourseEntry["level"]>("beginner");
  const [profileVisibility, setProfileVisibility] = useState<"public" | "department">("public");
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [isLoading, user, router]);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setBio(user.bio || "");
      setFaculty(user.faculty || "");
      setStudentLevel(user.student_level || null);
      setContact(user.contact || "");
      setWhatsapp(user.whatsapp || "");
      setSessionDurationPref(user.session_duration_pref || 60);
      setLearningGoals(user.learning_goals || {});
      setProfileVisibility(user.profile_visibility || "public");
      setPreferredMode(user.preferred_mode || "online");
      setAvailability(user.availability || []);
      setSkillsToTeach(user.skills_to_teach || []);
      setSkillsToLearn(user.skills_to_learn || []);
      setCoursesToTeach(user.courses_to_teach || []);
      setCoursesToLearn(user.courses_to_learn || []);
    }
  }, [user]);

  const toggleDay = (day: string) => {
    setAvailability((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const addTeachSkill = () => {
    if (!newTeachSkill.trim()) return;
    setSkillsToTeach((prev) => [...prev, { name: newTeachSkill.trim(), level: newTeachLevel, category: newTeachCategory }]);
    setNewTeachSkill("");
  };

  const addLearnSkill = () => {
    if (!newLearnSkill.trim()) return;
    setSkillsToLearn((prev) => [...prev, { name: newLearnSkill.trim(), level: newLearnLevel, category: newLearnCategory }]);
    setNewLearnSkill("");
  };

  const addTeachCourse = () => {
    if (!newTeachCode.trim() || !newTeachCourseName.trim()) return;
    setCoursesToTeach((prev) => [...prev, { code: newTeachCode.trim().toUpperCase(), name: newTeachCourseName.trim(), level: newTeachCourseLevel }]);
    setNewTeachCode("");
    setNewTeachCourseName("");
  };

  const addLearnCourse = () => {
    if (!newLearnCode.trim() || !newLearnCourseName.trim()) return;
    setCoursesToLearn((prev) => [...prev, { code: newLearnCode.trim().toUpperCase(), name: newLearnCourseName.trim(), level: newLearnCourseLevel }]);
    setNewLearnCode("");
    setNewLearnCourseName("");
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setAvatarUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadError) { toast.error("Avatar upload failed"); setAvatarUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    await updateProfile(user.id, { avatar_url: publicUrl });
    await refreshProfile();
    toast.success("Avatar updated!");
    setAvatarUploading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await updateProfile(user.id, {
      name, bio, faculty, contact, whatsapp,
      student_level: studentLevel,
      session_duration_pref: sessionDurationPref,
      learning_goals: learningGoals,
      profile_visibility: profileVisibility,
      preferred_mode: preferredMode as "online" | "offline" | "both",
      availability,
      skills_to_teach: skillsToTeach,
      skills_to_learn: skillsToLearn,
      courses_to_teach: coursesToTeach,
      courses_to_learn: coursesToLearn,
    });
    if (error) {
      toast.error("Failed to save profile");
    } else {
      await refreshProfile();
      toast.success("Profile saved!");
    }
    setSaving(false);
  };

  if (isLoading || !user) return null;

  const initials = user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy-800">My Profile</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 rounded-lg bg-navy-800 text-white text-sm font-semibold hover:bg-navy-700 transition-colors disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Avatar + basic info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="w-16 h-16 bg-navy-800 rounded-full flex items-center justify-center text-white text-xl font-bold overflow-hidden">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
              ) : initials}
            </div>
            <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-sky-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-sky-400 transition-colors">
              <Camera className="w-3 h-3 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={avatarUploading} />
            </label>
          </div>
          <div>
            <p className="font-semibold text-navy-800">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
            {user.rating > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">⭐ {user.rating.toFixed(1)} · {user.total_ratings} reviews · {user.xp} XP</p>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Faculty</label>
            <select value={faculty} onChange={(e) => setFaculty(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white">
              <option value="">Select faculty</option>
              {FACULTIES.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Year / Level</label>
            <select value={studentLevel ?? ""} onChange={(e) => setStudentLevel(e.target.value ? Number(e.target.value) as StudentLevel : null)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white">
              <option value="">Select level</option>
              {STUDENT_LEVELS.map((l) => <option key={l} value={l}>Level {l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone / Contact</label>
            <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="+233..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp Number</label>
            <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+233XXXXXXXXX"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
            <p className="text-xs text-gray-400 mt-1">Shown as a contact button on your public profile</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Preferred Session Duration</label>
            <div className="flex gap-2">
              {([30, 60, 120] as const).map((d) => (
                <button key={d} type="button" onClick={() => setSessionDurationPref(d)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    sessionDurationPref === d ? "bg-navy-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}>
                  {d === 30 ? "30 min" : d === 60 ? "1 hour" : "2 hours"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Preferred Mode</label>
            <select value={preferredMode} onChange={(e) => setPreferredMode(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white">
              <option value="online">Online</option>
              <option value="offline">In-person</option>
              <option value="both">Both</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Tell others about yourself..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none" />
          </div>
        </div>
      </div>

      {/* Availability */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-navy-800 mb-3">Availability</h3>
        <div className="flex flex-wrap gap-2">
          {DAYS_OF_WEEK.map((day) => (
            <button key={day} type="button" onClick={() => toggleDay(day)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                availability.includes(day) ? "bg-navy-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Profile Visibility */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-navy-800 mb-1">Profile Visibility</h3>
        <p className="text-xs text-gray-400 mb-3">Control who can discover your profile on the Explore page.</p>
        <div className="flex gap-2">
          {(["public", "department"] as const).map((v) => (
            <button key={v} type="button" onClick={() => setProfileVisibility(v)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                profileVisibility === v ? "bg-navy-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>
              {v === "public" ? "Public" : "Department Only"}
            </button>
          ))}
        </div>
      </div>

      {/* Skills to Teach */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-navy-800 mb-3">Skills I Can Teach</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {skillsToTeach.map((s, i) => (
            <span key={i} className="flex items-center gap-1 px-3 py-1.5 bg-sky-100 text-sky-700 text-xs font-medium rounded-full">
              {s.name}
              <button onClick={() => setSkillsToTeach((prev) => prev.filter((_, j) => j !== i))}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <input value={newTeachSkill} onChange={(e) => setNewTeachSkill(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTeachSkill())}
            placeholder="Skill name" className="flex-1 min-w-[140px] px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
          <select value={newTeachLevel} onChange={(e) => setNewTeachLevel(e.target.value as Skill["level"])}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white">
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <select value={newTeachCategory} onChange={(e) => setNewTeachCategory(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white">
            {SKILL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={addTeachSkill} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-sky-500 text-white text-sm font-medium hover:bg-sky-400 transition-colors">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {/* Skills to Learn */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-navy-800 mb-3">Skills I Want to Learn</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {skillsToLearn.map((s, i) => (
            <span key={i} className="flex items-center gap-1 px-3 py-1.5 bg-violet-100 text-violet-700 text-xs font-medium rounded-full">
              {s.name}
              <button onClick={() => setSkillsToLearn((prev) => prev.filter((_, j) => j !== i))}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <input value={newLearnSkill} onChange={(e) => setNewLearnSkill(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLearnSkill())}
            placeholder="Skill name" className="flex-1 min-w-[140px] px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
          <select value={newLearnLevel} onChange={(e) => setNewLearnLevel(e.target.value as Skill["level"])}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white">
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <select value={newLearnCategory} onChange={(e) => setNewLearnCategory(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white">
            {SKILL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={addLearnSkill} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-violet-500 text-white text-sm font-medium hover:bg-violet-400 transition-colors">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {/* Learning Goals */}
      {skillsToLearn.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-navy-800 mb-1">Learning Goals</h3>
          <p className="text-xs text-gray-400 mb-3">What do you want to achieve with each skill? (optional)</p>
          <div className="space-y-3">
            {skillsToLearn.map((s) => (
              <div key={s.name}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{s.name}</label>
                <input
                  value={learningGoals[s.name] || ""}
                  onChange={(e) => setLearningGoals((prev) => ({ ...prev, [s.name]: e.target.value }))}
                  placeholder={`e.g. Pass the final exam, build a project...`}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Courses I Can Help With */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-navy-800 mb-1">Academic Courses I Can Help With</h3>
        <p className="text-xs text-gray-400 mb-3">Add courses by code so peers can find you for academic help.</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {coursesToTeach.map((c, i) => (
            <span key={i} className="flex items-center gap-1 px-3 py-1 bg-sky-100 text-sky-700 text-xs font-medium rounded-full">
              <span className="font-bold">{c.code}</span> – {c.name}
              <button onClick={() => setCoursesToTeach((prev) => prev.filter((_, j) => j !== i))}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <input value={newTeachCode} onChange={(e) => setNewTeachCode(e.target.value)}
            placeholder="Code e.g. CSM 399" className="w-32 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
          <input value={newTeachCourseName} onChange={(e) => setNewTeachCourseName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTeachCourse())}
            placeholder="Course name" className="flex-1 min-w-[120px] px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
          <select value={newTeachCourseLevel} onChange={(e) => setNewTeachCourseLevel(e.target.value as CourseEntry["level"])}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white">
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <button onClick={addTeachCourse} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-sky-500 text-white text-sm font-medium hover:bg-sky-400 transition-colors">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {/* Courses I Need Help With */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-navy-800 mb-1">Academic Courses I Need Help With</h3>
        <p className="text-xs text-gray-400 mb-3">Add courses you&apos;re struggling with so tutors can find you.</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {coursesToLearn.map((c, i) => (
            <span key={i} className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
              <span className="font-bold">{c.code}</span> – {c.name}
              <button onClick={() => setCoursesToLearn((prev) => prev.filter((_, j) => j !== i))}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <input value={newLearnCode} onChange={(e) => setNewLearnCode(e.target.value)}
            placeholder="Code e.g. MATH 223" className="w-32 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
          <input value={newLearnCourseName} onChange={(e) => setNewLearnCourseName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLearnCourse())}
            placeholder="Course name" className="flex-1 min-w-[120px] px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
          <select value={newLearnCourseLevel} onChange={(e) => setNewLearnCourseLevel(e.target.value as CourseEntry["level"])}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white">
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <button onClick={addLearnCourse} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-400 transition-colors">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>
    </main>
  );
}
