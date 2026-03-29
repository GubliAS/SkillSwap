"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { updateProfile } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { Skill, FACULTIES, SKILL_CATEGORIES, DAYS_OF_WEEK } from "@/lib/types";
import { toast } from "sonner";
import { Plus, X, Camera } from "lucide-react";

export default function ProfilePage() {
  const { user, isLoading, refreshProfile } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [faculty, setFaculty] = useState("");
  const [contact, setContact] = useState("");
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
      setContact(user.contact || "");
      setPreferredMode(user.preferred_mode || "online");
      setAvailability(user.availability || []);
      setSkillsToTeach(user.skills_to_teach || []);
      setSkillsToLearn(user.skills_to_learn || []);
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
      name, bio, faculty, contact,
      preferred_mode: preferredMode as "online" | "offline" | "both",
      availability,
      skills_to_teach: skillsToTeach,
      skills_to_learn: skillsToLearn,
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact (WhatsApp / phone)</label>
            <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="+233..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
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
    </main>
  );
}
