import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import logoUrl from "@/assets/logo-cropped.png";
import { useState, useEffect, useRef, useMemo } from "react";
import { Shell, Card } from "@/components/Layout";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/lib/auth";
import { useAppState } from "@/lib/store";
import { useLeaderboard } from "@/lib/assessmentStore";
import { User, Mail, GraduationCap, MapPin, CheckCircle, AlertCircle, Camera, Loader2, Star, Award, Brain, Trophy, Zap, ChevronRight, Briefcase, BookOpen, Sparkles, CircleDollarSign, X, Sun, Moon, Monitor } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — EARNGEN-AI" },
      { name: "description", content: "View and update your EARNGEN-AI profile." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile, avatarUrl, updateProfile, uploadAvatar, loading } = useAuth();
  const { state, update } = useAppState();
  const board = useLeaderboard();

  const [newSkillInput, setNewSkillInput] = useState("");

  const handleAddSkill = () => {
    const trimmed = newSkillInput.trim();
    if (!trimmed) return;
    if (state.skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setNewSkillInput("");
      return;
    }
    update({
      skills: [...state.skills, trimmed],
      rewardPoints: (state.rewardPoints ?? 0) + 100, // Award 100 PTS for adding a new skill!
    });
    setNewSkillInput("");
  };

  const handleRemoveSkill = (skill: string) => {
    update({ skills: state.skills.filter((s) => s !== skill) });
  };

  // Find all user records in the leaderboard
  const userLeaderboardRecords = useMemo(() => {
    const name = profile?.full_name || (user?.email ? user.email.split("@")[0] : "Member");
    return board.filter(
      (e) => e.isSelf || e.name.toLowerCase() === name.toLowerCase()
    );
  }, [board, profile?.full_name, user?.email]);

  // Find overall highest rank
  const userBestRank = useMemo(() => {
    if (userLeaderboardRecords.length === 0) return null;
    const ranks = userLeaderboardRecords.map((rec) => board.findIndex((e) => e.id === rec.id) + 1);
    return Math.min(...ranks);
  }, [board, userLeaderboardRecords]);

  const [theme, setTheme] = useState<"light" | "dark" | "system">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("earngen.theme") as any) || "system";
    }
    return "system";
  });

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    localStorage.setItem("earngen.theme", newTheme);
    const root = document.documentElement;
    if (newTheme === "dark" || (newTheme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  const [isLaunching, setIsLaunching] = useState(false);
  const [launchStage, setLaunchStage] = useState<"idle" | "igniting" | "blastoff">("idle");
  const navigate = useNavigate();

  const triggerRocketTransition = () => {
    setIsLaunching(true);
    setLaunchStage("igniting");
    
    // Play ignition shake for 1.1 seconds
    setTimeout(() => {
      setLaunchStage("blastoff");
      
      // Navigate after blastoff flies off screen (800ms)
      setTimeout(() => {
        navigate({ to: "/income" });
      }, 800);
    }, 1100);
  };

  const [form, setForm] = useState({ full_name: "", college: "", city: "" });
  const [extraForm, setExtraForm] = useState({
    organization: "",
    working_or_learning: "Learning",
    same_as_college: false,
  });
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarErr, setAvatarErr] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-populate form whenever profile loads
  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        college: profile.college ?? "",
        city: profile.city ?? "",
      });
    }
  }, [profile]);

  // Load extra custom fields on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("earngen.profile.extra");
        if (raw) {
          const parsed = JSON.parse(raw);
          setExtraForm((prev) => ({ ...prev, ...parsed }));
        }
      } catch (e) {
        console.warn(e);
      }
    }
  }, []);

  const initial = (profile?.full_name || user?.email || "?").charAt(0).toUpperCase();

  const handleCollegeChange = (v: string) => {
    setForm((f) => ({ ...f, college: v }));
    if (extraForm.same_as_college) {
      setExtraForm((ex) => ({ ...ex, organization: v }));
    }
  };

  const handleSameAsCollegeChange = (checked: boolean) => {
    setExtraForm((ex) => ({
      ...ex,
      same_as_college: checked,
      organization: checked ? form.college : ex.organization,
    }));
  };

    async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim()) return;
    setBusy(true);
    setStatus("idle");
    setErrMsg(null);
    const { error } = await updateProfile({
      full_name: form.full_name.trim(),
      college: form.college.trim(),
      city: form.city.trim(),
    });
    setBusy(false);
    if (error) {
      setStatus("error");
      setErrMsg(error);
    } else {
      if (typeof window !== "undefined") {
        localStorage.setItem("earngen.profile.extra", JSON.stringify(extraForm));
      }
      setStatus("success");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarErr(null);
    setAvatarBusy(true);
    const { error } = await uploadAvatar(file);
    setAvatarBusy(false);
    if (error) setAvatarErr(error);
    // Reset input so same file can be re-selected if needed
    e.target.value = "";
  }

  return (
    <Shell>
      <RequireAuth>
        <header className="mb-8 fade-up flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Account</p>
            <h1 className="text-3xl font-semibold tracking-tight">Your Profile</h1>
            <p className="text-muted-foreground mt-1">
              Your information is loaded automatically when you sign in.
            </p>
          </div>
          <button
            onClick={triggerRocketTransition}
            className="inline-flex items-center gap-2 rounded-xl bg-brand text-brand-foreground shadow-lg hover:shadow-brand/20 px-5 py-3 text-sm font-semibold hover:opacity-95 hover:scale-102 active:scale-98 transition-all shrink-0 w-fit cursor-pointer"
          >
            <CircleDollarSign className="size-4.5" /> My Income
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="flex flex-col gap-6 lg:col-span-1">
          {/* Avatar / identity card */}
          <Card className="p-6 flex flex-col items-center text-center gap-4 h-fit">
            {/* Clickable avatar */}
            <div className="relative group">
              <div
                className="size-24 rounded-full overflow-hidden bg-gradient-to-br from-brand to-brand-light grid place-items-center text-4xl font-bold text-white select-none cursor-pointer ring-2 ring-border"
                onClick={() => !avatarBusy && fileInputRef.current?.click()}
                role="button"
                aria-label="Change profile picture"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
              >
                {avatarBusy ? (
                  <Loader2 className="size-8 text-white animate-spin" />
                ) : avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile picture"
                    className="size-full object-cover"
                  />
                ) : (
                  !loading && initial
                )}
              </div>

              {/* Hover overlay */}
              {!avatarBusy && (
                <div
                  className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="size-5 text-white" />
                  <span className="text-[10px] text-white font-medium leading-tight">
                    Change
                  </span>
                </div>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarChange}
            />

            {avatarErr && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="size-3 shrink-0" />
                {avatarErr}
              </p>
            )}

            <p className="text-xs text-muted-foreground -mt-2">
              JPG, PNG, WebP or GIF · max 5 MB
            </p>

            <div>
              <p className="text-lg font-semibold">{profile?.full_name || "—"}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            {profile?.college && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <GraduationCap className="size-3.5 shrink-0" />
                <span>{profile.college}</span>
              </div>
            )}
            {profile?.city && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="size-3.5 shrink-0" />
                <span>{profile.city}</span>
              </div>
            )}
          </Card>

          {/* Gamified Reward Points Card */}
          <Card className="p-6 flex flex-col gap-4 relative overflow-hidden bg-gradient-to-br from-brand/5 via-brand/10 to-brand/5 border border-brand/20">
            {/* Decorative background circle */}
            <div className="absolute -top-12 -right-12 size-28 rounded-full bg-brand/10 blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <Award className="size-5 text-yellow-500 animate-bounce" /> Gamified Rewards
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-widest bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded-full ring-1 ring-yellow-500/20">
                Active Earner
              </span>
            </div>

            <div className="text-center py-4 rounded-2xl bg-background/60 backdrop-blur-md border border-border/40 relative">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center justify-center gap-1.5">
                Your Balance
                {/* Red color 'i' rounded in with hover tooltip */}
                <span className="relative group/tooltip inline-block cursor-help">
                  <span className="size-3.5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 font-black text-[9px] flex items-center justify-center border border-red-500/30 transition-colors select-none">
                    i
                  </span>
                  {/* Premium floating tooltip */}
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 text-[10px] leading-relaxed font-medium bg-red-600 dark:bg-red-700 text-white rounded-xl opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity shadow-lg shadow-red-500/10 text-center z-20">
                    <span className="font-bold block uppercase tracking-wider text-[8px] text-white/95 mb-0.5">⚠️ Inactivity Penalty</span>
                    If you miss your daily sprint or streak for 1 day, <span className="font-black">100 PTS</span> will be deducted!
                    {/* Tooltip arrow */}
                    <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-red-600 dark:border-t-red-700" />
                  </span>
                </span>
              </p>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <span className="text-3xl font-black text-foreground tracking-tight">
                  {(state.rewardPoints ?? 0).toLocaleString()}
                </span>
                <span className="text-brand font-bold text-sm">PTS</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Earn 250 PTS per sprint day completed!
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed text-pretty">
                Complete daily AI-generated gig sprints to accumulate points. Redeem them for exclusive discounts, gift vouchers, and premium rewards!
              </p>
              
              <Link
                to="/redeem"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand text-brand-foreground shadow-lg hover:shadow-brand/20 py-3 text-xs font-bold hover:opacity-95 hover:scale-102 active:scale-98 transition-all"
              >
                <Sparkles className="size-4" /> Redeem Rewards
              </Link>
            </div>
          </Card>

          {/* Theme Settings Card */}
          <Card className="p-6 flex flex-col gap-4">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Sun className="size-4.5 text-brand" /> Theme Preferences
            </h3>
            <p className="text-xs text-muted-foreground -mt-2">
              Personalize your earner workspace dashboard view.
            </p>
            <div className="grid grid-cols-3 gap-2 bg-muted/40 p-1 rounded-xl border border-border/60">
              <button
                type="button"
                onClick={() => handleThemeChange("light")}
                className={`flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold select-none transition-all ${
                  theme === "light"
                    ? "bg-background text-brand shadow-sm"
                    : "text-muted-foreground hover:bg-background/40 hover:text-foreground"
                }`}
              >
                <Sun className="size-4 shrink-0" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange("dark")}
                className={`flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold select-none transition-all ${
                  theme === "dark"
                    ? "bg-background text-brand shadow-sm"
                    : "text-muted-foreground hover:bg-background/40 hover:text-foreground"
                }`}
              >
                <Moon className="size-4 shrink-0" />
                <span>Dark</span>
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange("system")}
                className={`flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold select-none transition-all ${
                  theme === "system"
                    ? "bg-background text-brand shadow-sm"
                    : "text-muted-foreground hover:bg-background/40 hover:text-foreground"
                }`}
              >
                <Monitor className="size-4 shrink-0" />
                <span>System</span>
              </button>
            </div>
          </Card>

          {/* Verified Skill Levels & My Stack Card */}
          <Card className="p-6 flex flex-col gap-4 lg:col-span-1 h-fit">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Brain className="size-5 text-brand" /> My Stack
              </h3>
              <span className="text-xs font-bold bg-brand/10 text-brand px-2 py-0.5 rounded-full">
                {state.skills.length} Skills
              </span>
            </div>

            {/* Inline Add Skill Form */}
            <div className="flex gap-2 bg-muted/30 p-2 rounded-xl border border-border/40">
              <input
                type="text"
                placeholder="Add skill (e.g. React, Figma)..."
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddSkill()}
                className="flex-1 bg-background rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-brand border border-border/80 text-foreground"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-3.5 py-1.5 bg-brand text-brand-foreground text-xs font-semibold rounded-lg hover:opacity-95 active:scale-95 transition-all shrink-0"
              >
                Add
              </button>
            </div>
            
            {userBestRank ? (
              <div className="bg-amber-500/10 rounded-xl p-3 flex items-center gap-2.5 border border-amber-500/20">
                <div className="size-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                  <Trophy className="size-3.5 animate-bounce" />
                </div>
                <div>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider">
                    Global Competency Rank
                  </p>
                  <p className="text-sm font-bold text-foreground">Rank #{userBestRank}</p>
                </div>
              </div>
            ) : (
              <div className="bg-muted/50 rounded-xl p-3 border border-border/80 text-center">
                <p className="text-[11px] text-muted-foreground font-semibold">Unranked on Leaderboard</p>
                <Link
                  to="/assessment"
                  className="inline-flex items-center gap-1 text-[11px] text-brand font-bold hover:underline mt-1"
                >
                  Take Assessment to Rank →
                </Link>
              </div>
            )}

            <div className="space-y-3.5 mt-2">
              {state.skills.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No active skills in your stack. Add some above to get assessed!
                </p>
              ) : (
                state.skills.map((skill) => {
                  // Check if there is a certified record for this skill
                  const rec = userLeaderboardRecords.find((r) => r.skill.toLowerCase() === skill.toLowerCase());
                  
                  return (
                    <div key={skill} className="space-y-1.5 pb-3.5 border-b border-border/40 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                          {skill}
                        </span>
                        <div className="flex items-center gap-2">
                          {rec ? (
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                              rec.level === "Advanced"
                                ? "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                                : rec.level === "Intermediate"
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                : "bg-green-500/15 text-green-600 dark:text-green-400"
                            }`}>
                              {rec.level}
                            </span>
                          ) : (
                            <Link
                              to="/assessment"
                              search={{ skill, difficulty: "medium" }}
                              className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-brand/10 hover:bg-brand/20 text-brand px-2 py-0.5 rounded transition"
                            >
                              <Zap className="size-2" /> Verify Level
                            </Link>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill)}
                            className="text-muted-foreground hover:text-red-500 transition-colors p-0.5 hover:bg-red-500/10 rounded animate-fade-in"
                            title="Remove skill from stack"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      </div>

                      {rec ? (
                        <div className="flex items-center gap-2">
                          <div className="h-1 flex-1 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand rounded-full transition-all duration-500"
                              style={{ width: `${rec.score}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold tabular-nums text-muted-foreground">
                            {rec.score}%
                          </span>
                        </div>
                      ) : (
                        <p className="text-[10px] text-muted-foreground">
                          Not verified yet. Click Verify Level to get ranked!
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            
            <Link
              to="/upskill"
              className="w-full mt-2 text-center inline-flex justify-center items-center gap-1.5 text-xs font-semibold bg-brand text-brand-foreground shadow py-2.5 rounded-lg hover:opacity-90 transition relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Sparkles className="size-3.5 animate-pulse" /> Peer-to-Peer Skill Exchange
            </Link>
          </Card>

          {/* Earned Badges / Achievements Card */}
          <Card className="p-6 flex flex-col gap-4 lg:col-span-1 h-fit">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Trophy className="size-5 text-yellow-500" /> Earned Badges
            </h3>
            <p className="text-xs text-muted-foreground -mt-2">
              Unlock prestigious badges by completing milestones and high-rated gigs.
            </p>

            <div className="flex flex-wrap gap-2.5 mt-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-500/10 text-blue-500 px-3 py-2 rounded-xl border border-blue-500/20">
                🚀 First Gig
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-purple-500/10 text-purple-500 px-3 py-2 rounded-xl border border-purple-500/20">
                ⭐ Top Rated
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-500/10 text-emerald-500 px-3 py-2 rounded-xl border border-emerald-500/20">
                🤝 Fast Payer
              </span>
            </div>
            
            <button className="w-full mt-2 text-xs font-bold ring-1 ring-border py-2.5 rounded-xl hover:bg-muted transition text-muted-foreground">
              View all badges
            </button>
          </Card>
        </div>
        
          {/* Edit form */}
          <Card className="p-6 lg:col-span-2">
            <h2 className="font-semibold mb-1">Edit details</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Changes are saved to your account and reflected everywhere.
            </p>

            {/* Email read-only */}
            <div className="mb-5">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Email
              </label>
              <div className="flex items-center gap-2 rounded-lg ring-1 ring-border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">
                <Mail className="size-4 shrink-0" />
                <span>{user?.email}</span>
                <span className="ml-auto text-xs bg-brand/10 text-brand px-2 py-0.5 rounded font-medium">
                  verified
                </span>
              </div>
            </div>

             <form onSubmit={handleSave} className="space-y-4">
              <ProfileField
                icon={<User className="size-4 text-muted-foreground" />}
                label="Full name"
                value={form.full_name}
                placeholder="Priya Sharma"
                required
                onChange={(v) => setForm((f) => ({ ...f, full_name: v }))}
              />
              <ProfileField
                icon={<GraduationCap className="size-4 text-muted-foreground" />}
                label="College / University"
                value={form.college}
                placeholder="IIIT Hyderabad"
                onChange={handleCollegeChange}
              />
              
              {/* Organization name with same as college option */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-muted-foreground">Organization Name</span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs text-brand font-bold select-none hover:opacity-85 transition">
                    <input
                      type="checkbox"
                      checked={extraForm.same_as_college}
                      onChange={(e) => handleSameAsCollegeChange(e.target.checked)}
                      className="rounded border-border text-brand focus:ring-brand size-3.5 bg-muted"
                    />
                    Same as college
                  </label>
                </div>
                <div className="flex items-center gap-2 rounded-lg ring-1 ring-border bg-background focus-within:ring-2 focus-within:ring-brand px-3 py-0.5 transition-shadow">
                  <Briefcase className="size-4 text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    value={extraForm.organization}
                    onChange={(e) => setExtraForm((ex) => ({ ...ex, organization: e.target.value, same_as_college: false }))}
                    placeholder="Zelvora Technologies"
                    className="flex-1 py-2 text-sm bg-transparent focus:outline-none placeholder:text-muted-foreground/60 text-foreground"
                  />
                </div>
              </div>

              {/* Working or learning selection */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">Status (Working or learning)</span>
                <div className="flex items-center gap-2 rounded-lg ring-1 ring-border bg-background focus-within:ring-2 focus-within:ring-brand px-3 py-1.5 transition-shadow">
                  <BookOpen className="size-4 text-muted-foreground shrink-0" />
                  <select
                    value={extraForm.working_or_learning}
                    onChange={(e) => setExtraForm((ex) => ({ ...ex, working_or_learning: e.target.value }))}
                    className="flex-1 text-sm bg-transparent focus:outline-none text-foreground outline-none border-none py-1 cursor-pointer"
                  >
                    <option value="Learning" className="bg-card text-foreground">🌱 Learning</option>
                    <option value="Working" className="bg-card text-foreground">💼 Working</option>
                    <option value="Both" className="bg-card text-foreground">⚡ Both (Working & Learning)</option>
                  </select>
                </div>
              </div>

              <ProfileField
                icon={<MapPin className="size-4 text-muted-foreground" />}
                label="City"
                value={form.city}
                placeholder="Hyderabad"
                onChange={(v) => setForm((f) => ({ ...f, city: v }))}
              />

              {status === "success" && (
                <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                  <CheckCircle className="size-4" />
                  Profile updated successfully!
                </div>
              )}
              {status === "error" && (
                <div className="flex items-center gap-2 text-sm text-red-500">
                  <AlertCircle className="size-4" />
                  {errMsg || "Something went wrong. Please try again."}
                </div>
              )}

              <button
                type="submit"
                disabled={busy || !form.full_name.trim()}
                className="mt-2 rounded-lg bg-foreground text-background px-5 py-2.5 text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {busy ? "Saving…" : "Save changes"}
              </button>
            </form>
          </Card>
        </div>

        {/* Rocket Launch Overlay Transition */}
        {isLaunching && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-lg select-none pointer-events-none transition-all duration-300">
            {/* Launchpad Container */}
            <div className="flex flex-col items-center gap-6">
              {/* Rocket Circle */}
              <div
                className={`size-32 rounded-full p-1 bg-gradient-to-tr from-brand to-brand-light shadow-2xl relative flex items-center justify-center border-4 border-white dark:border-zinc-950 ${
                  launchStage === "igniting" ? "animate-rocket-rumble" : launchStage === "blastoff" ? "animate-rocket-blastoff" : ""
                }`}
              >
                <img
                  src={logoUrl}
                  alt="Launching"
                  className="size-full rounded-full object-cover bg-white animate-pulse"
                />
                
                {/* Engine thrust glow */}
                {launchStage !== "idle" && (
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-8 h-16 bg-gradient-to-b from-brand via-orange-500 to-red-500 rounded-full animate-engine-fire flex flex-col gap-1 items-center justify-center opacity-90 blur-[1px]">
                    <div className="size-4 bg-white rounded-full blur-[1px]" />
                  </div>
                )}
              </div>

              {/* Sparkles / Smoke Particles */}
              {launchStage === "igniting" && (
                <div className="text-center animate-pulse">
                  <p className="text-brand font-bold text-sm tracking-wider uppercase">Igniting Engines...</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Preparing your income dashboard projection</p>
                </div>
              )}
              {launchStage === "blastoff" && (
                <div className="text-center">
                  <p className="text-brand font-black text-base tracking-widest uppercase animate-bounce">BLASTOFF! 🚀</p>
                </div>
              )}
            </div>
          </div>
        )}
      </RequireAuth>
    </Shell>
  );
}

function ProfileField({
  label,
  value,
  placeholder,
  onChange,
  icon,
  required,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  icon?: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </span>
      <div className="mt-1.5 flex items-center gap-2 rounded-lg ring-1 ring-border bg-background focus-within:ring-2 focus-within:ring-brand px-3 py-0.5 transition-shadow">
        {icon}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="flex-1 py-2 text-sm bg-transparent focus:outline-none placeholder:text-muted-foreground/60"
        />
      </div>
    </label>
  );
}
