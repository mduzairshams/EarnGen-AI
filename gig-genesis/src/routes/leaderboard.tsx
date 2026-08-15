import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Shell, Card } from "@/components/Layout";
import { RequireAuth } from "@/components/RequireAuth";
import { useLeaderboard } from "@/lib/assessmentStore";
import { useDisplayUser } from "@/lib/useDisplayUser";
import {
  Trophy,
  Search,
  Award,
  Filter,
  Star,
  User,
  Calendar,
  Sparkles,
  TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Skill Leaderboard — EARNGEN-AI" },
      { name: "description", content: "EarnGen-AI global skill assessment leaderboard. Compare your performance with top student earners." },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const board = useLeaderboard();
  const me = useDisplayUser();
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");

  // Format date helper
  function timeAgo(dateStr: string) {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    } catch {
      return "just now";
    }
  }

  // Filtered leaderboard records
  const filtered = useMemo(() => {
    return board.filter((entry) => {
      const matchesSearch =
        entry.name.toLowerCase().includes(search.toLowerCase()) ||
        entry.skill.toLowerCase().includes(search.toLowerCase());
      const matchesLevel =
        levelFilter === "all" || entry.level.toLowerCase() === levelFilter.toLowerCase();
      return matchesSearch && matchesLevel;
    });
  }, [board, search, levelFilter]);

  // Statistics
  const highestScore = useMemo(() => {
    if (board.length === 0) return 0;
    return Math.max(...board.map((e) => e.score));
  }, [board]);

  const selfRecord = useMemo(() => {
    return board.find((e) => e.isSelf);
  }, [board]);

  const selfRank = useMemo(() => {
    if (!selfRecord) return null;
    return board.findIndex((e) => e.id === selfRecord.id) + 1;
  }, [board, selfRecord]);

  return (
    <Shell>
      <RequireAuth>
        <div className="space-y-8">
          {/* Header */}
          <header className="fade-up flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-2xl bg-brand/10 flex items-center justify-center relative overflow-hidden animate-pulse">
                <div className="absolute inset-0 bg-gradient-to-br from-brand/20 to-transparent" />
                <Trophy className="size-6 text-brand" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-brand uppercase tracking-widest">Global Arena</span>
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-brand/15 text-[10px] font-medium text-brand">
                    <Sparkles className="size-2.5" /> Live
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">EarnGen Skill Leaderboard</h1>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              Compare competency scores, prove your high-income skills, and rank higher to attract top-paying client opportunities!
            </p>
          </header>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 fade-up">
            <Card className="p-5 flex items-center gap-4 relative overflow-hidden">
              <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                <Trophy className="size-5 animate-bounce" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Top Competency Score</p>
                <p className="text-2xl font-bold tracking-tight mt-0.5">{highestScore}%</p>
              </div>
            </Card>

            <Card className="p-5 flex items-center gap-4 relative overflow-hidden">
              <div className="size-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand shrink-0">
                <TrendingUp className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Certified Earners</p>
                <p className="text-2xl font-bold tracking-tight mt-0.5">{board.length}</p>
              </div>
            </Card>

            <Card className="p-5 flex items-center gap-4 relative overflow-hidden border-brand/20 bg-brand/[0.02]">
              <div className="size-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
                <Star className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Your Best Rank</p>
                <p className="text-2xl font-bold tracking-tight mt-0.5">
                  {selfRank ? `#${selfRank}` : "Unranked"}
                </p>
              </div>
            </Card>
          </div>

          {/* Filters Control Card */}
          <Card className="p-4 md:p-6 fade-up">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              {/* Search input */}
              <div className="relative w-full md:max-w-md flex gap-2 shrink-0">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                  <input
                    type="text"
                    placeholder="Search student or skill..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-muted/50 ring-1 ring-border rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand transition-all"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setSearch(me.name)}
                  className="px-4 py-2.5 bg-brand/10 hover:bg-brand/20 text-brand text-xs font-semibold rounded-xl whitespace-nowrap transition-all border border-brand/20 flex items-center gap-1.5 shrink-0"
                >
                  <User className="size-3.5" /> Find Me
                </button>
              </div>

              {/* Levels filter buttons */}
              <div className="flex gap-1.5 self-stretch md:self-auto overflow-x-auto pb-1 md:pb-0">
                {[
                  { id: "all", label: "🎯 All Levels" },
                  { id: "beginner", label: "🌱 Beginner" },
                  { id: "intermediate", label: "⚡ Moderate" },
                  { id: "advanced", label: "🚀 Advanced" },
                ].map((f) => {
                  const active = levelFilter === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setLevelFilter(f.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                        active
                          ? "bg-brand text-brand-foreground shadow"
                          : "bg-muted/50 hover:bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Competitors List / Table */}
            <div className="mt-6 overflow-x-auto border border-border/60 rounded-xl bg-card">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/80 text-xs font-semibold text-muted-foreground bg-muted/20 uppercase tracking-wider">
                    <th className="px-5 py-4 w-16 text-center">Rank</th>
                    <th className="px-5 py-4">Student Name</th>
                    <th className="px-5 py-4">Skill Stack</th>
                    <th className="px-5 py-4">Assessment Level</th>
                    <th className="px-5 py-4">Competency Score</th>
                    <th className="px-5 py-4 w-28 text-right">Certified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-sm">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-muted-foreground">
                        <Award className="size-10 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="font-medium text-sm">No leaderboard results found</p>
                        <p className="text-xs text-muted-foreground/80 mt-1">Try tweaking your search filters or take an assessment to get featured!</p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((entry, idx) => {
                      // Original global rank is index + 1
                      const actualRank = board.findIndex((e) => e.id === entry.id) + 1;
                      
                      // Row highlight for active user
                      const isMe = entry.isSelf || entry.name.toLowerCase() === me.name.toLowerCase();

                      // Dynamic level badges
                      let levelColor = "bg-green-500/10 text-green-600 dark:text-green-400";
                      if (entry.level === "Advanced") {
                        levelColor = "bg-purple-500/10 text-purple-600 dark:text-purple-400";
                      } else if (entry.level === "Intermediate" || entry.level === "Moderate" as any) {
                        levelColor = "bg-amber-500/10 text-amber-600 dark:text-amber-400";
                      }

                      return (
                        <tr
                          key={entry.id}
                          className={`group transition-all hover:bg-muted/30 ${
                            isMe ? "bg-brand/[0.03] font-medium" : ""
                          }`}
                        >
                          {/* Rank badge / place */}
                          <td className="px-5 py-4 text-center font-bold">
                            {actualRank === 1 ? (
                              <span className="inline-flex size-7 rounded-full bg-amber-500/10 text-amber-500 items-center justify-center ring-1 ring-amber-500/30">
                                🥇
                              </span>
                            ) : actualRank === 2 ? (
                              <span className="inline-flex size-7 rounded-full bg-slate-400/15 text-slate-500 items-center justify-center ring-1 ring-slate-400/30">
                                🥈
                              </span>
                            ) : actualRank === 3 ? (
                              <span className="inline-flex size-7 rounded-full bg-amber-700/10 text-amber-700 items-center justify-center ring-1 ring-amber-700/30">
                                🥉
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">{actualRank}</span>
                            )}
                          </td>

                          {/* Student Name */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className={`size-8 rounded-full flex items-center justify-center font-bold text-xs ring-1 ${
                                isMe 
                                  ? "bg-brand text-brand-foreground ring-brand"
                                  : "bg-muted text-muted-foreground ring-border"
                              }`}>
                                {entry.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span className={`flex items-center gap-1.5 ${isMe ? "text-brand font-semibold" : "text-foreground"}`}>
                                  {entry.name}
                                  {isMe && (
                                    <span className="px-1.5 py-0.5 rounded bg-brand/10 text-[9px] font-semibold text-brand tracking-wide uppercase">
                                      You
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Skill tested */}
                          <td className="px-5 py-4">
                            <span className="text-xs font-semibold bg-brand/5 border border-brand/10 text-brand px-2.5 py-1 rounded-full uppercase tracking-wider">
                              {entry.skill}
                            </span>
                          </td>

                          {/* Level badge */}
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${levelColor}`}>
                              {entry.level}
                            </span>
                          </td>

                          {/* Competency Score / Progress bar */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3 max-w-[200px]">
                              <span className="font-bold text-xs tabular-nums text-foreground">{entry.score}%</span>
                              <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-brand transition-all duration-500 rounded-full"
                                  style={{ width: `${entry.score}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Time completed */}
                          <td className="px-5 py-4 text-right text-xs text-muted-foreground tracking-wide tabular-nums">
                            {timeAgo(entry.completedAt)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </RequireAuth>
    </Shell>
  );
}
