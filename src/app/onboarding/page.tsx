"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { updateProfile } from "@/lib/data";
import { Skill, SKILL_CATEGORIES, DAYS_OF_WEEK } from "@/lib/types";
import { toast } from "sonner";
import { Plus, X, ChevronRight, ChevronLeft } from "lucide-react";

export default function OnboardingPage() {
  const { user, isLoading, refreshProfile } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [skillsToTeach, setSkillsToTeach] = useState<Skill[]>([]);
  const [skillsToLearn, setSkillsToLearn] = useState<Skill[]>([]);
  const [availability, setAvailability] = useState<string[]>([]);
  const [preferredMode, setPreferredMode] = useState<"online" | "offline" | "both">("online");
  const [newTeachSkill, setNewTeachSkill] = useState("");
  const [newTeachLevel, setNewTeachLevel] = useState<Skill["level"]>("intermediate");
  const [newTeachCategory, setNewTeachCategory] = useState("Other");
  const [newLearnSkill, setNewLearnSkill] = useState("");
  const [newLearnLevel, setNewLearnLevel] = useState<Skill["level"]>("beginner");
  const [newLearnCategory, setNewLearnCategory] = useState("Other");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [isLoading, user, router]);

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

  const toggleDay = (day: string) => {
    setAvailability((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await updateProfile(user.id, {
      skills_to_teach: skillsToTeach,
      skills_to_learn: skillsToLearn,
      availability,
      preferred_mode: preferredMode,
    });
    if (error) {
      toast.error("Failed to save profile");
      setSaving(false);
      return;
    }
    await refreshProfile();
    toast.success("Profile set up! Welcome to SkillSwap 🎉");
    router.push("/dashboard");
  };

  if (isLoading || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`flex-1 h-1.5 rounded-full transition-colors ${s <= step ? "bg-navy-800" : "bg-gray-200"}`} />
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          {step === 1 && (
            <div>
              <h1 className="text-2xl font-bold text-navy-800 mb-1">What can you teach?</h1>
              <p className="text-gray-500 text-sm mb-6">Add skills you&apos;re confident enough to share with others.</p>
              <div className="flex flex-wrap gap-2 mb-4 min-h-[40px]">
                {skillsToTeach.map((s, i) => (
                  <span key={i} className="flex items-center gap-1 px-3 py-1.5 bg-sky-100 text-sky-700 text-sm rounded-full">
                    {s.name} <span className="text-xs opacity-60">({s.level})</span>
                    <button onClick={() => setSkillsToTeach((prev) => prev.filter((_, j) => j !== i))}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="space-y-2">
                <input value={newTeachSkill} onChange={(e) => setNewTeachSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTeachSkill())}
                  placeholder="e.g. Python, UI Design, Mathematics..."
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
                <div className="flex gap-2">
                  <select value={newTeachLevel} onChange={(e) => setNewTeachLevel(e.target.value as Skill["level"])}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                  <select value={newTeachCategory} onChange={(e) => setNewTeachCategory(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white">
                    {SKILL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button onClick={addTeachSkill} className="px-3 py-2 rounded-lg bg-sky-500 text-white hover:bg-sky-400 transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h1 className="text-2xl font-bold text-navy-800 mb-1">What do you want to learn?</h1>
              <p className="text-gray-500 text-sm mb-6">Add skills you&apos;re looking to develop or learn from others.</p>
              <div className="flex flex-wrap gap-2 mb-4 min-h-[40px]">
                {skillsToLearn.map((s, i) => (
                  <span key={i} className="flex items-center gap-1 px-3 py-1.5 bg-violet-100 text-violet-700 text-sm rounded-full">
                    {s.name}
                    <button onClick={() => setSkillsToLearn((prev) => prev.filter((_, j) => j !== i))}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="space-y-2">
                <input value={newLearnSkill} onChange={(e) => setNewLearnSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLearnSkill())}
                  placeholder="e.g. Photography, Data Analysis..."
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
                <div className="flex gap-2">
                  <select value={newLearnLevel} onChange={(e) => setNewLearnLevel(e.target.value as Skill["level"])}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                  <select value={newLearnCategory} onChange={(e) => setNewLearnCategory(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white">
                    {SKILL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button onClick={addLearnSkill} className="px-3 py-2 rounded-lg bg-violet-500 text-white hover:bg-violet-400 transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h1 className="text-2xl font-bold text-navy-800 mb-1">When are you available?</h1>
              <p className="text-gray-500 text-sm mb-6">Choose the days and how you prefer to meet.</p>
              <div className="mb-5">
                <p className="text-sm font-medium text-gray-700 mb-2">Available days</p>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <button key={day} type="button" onClick={() => toggleDay(day)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        availability.includes(day) ? "bg-navy-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}>
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Preferred meeting mode</p>
                <div className="grid grid-cols-3 gap-2">
                  {(["online", "offline", "both"] as const).map((m) => (
                    <button key={m} onClick={() => setPreferredMode(m)}
                      className={`py-2.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                        preferredMode === m ? "bg-navy-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}>
                      {m === "offline" ? "In-person" : m === "both" ? "Both" : "Online"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Nav buttons */}
          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <button onClick={() => setStep(step - 1)} className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <div />
            )}
            {step < 3 ? (
              <button onClick={() => setStep(step + 1)} className="flex items-center gap-1 px-5 py-2 rounded-lg bg-navy-800 text-white text-sm font-semibold hover:bg-navy-700 transition-colors">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleFinish} disabled={saving} className="flex items-center gap-1 px-5 py-2 rounded-lg bg-navy-800 text-white text-sm font-semibold hover:bg-navy-700 transition-colors disabled:opacity-60">
                {saving ? "Saving..." : "Finish Setup"}
              </button>
            )}
          </div>

          {step < 3 && (
            <button onClick={() => router.push("/dashboard")} className="w-full mt-3 text-center text-xs text-gray-400 hover:text-gray-600">
              Skip for now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
