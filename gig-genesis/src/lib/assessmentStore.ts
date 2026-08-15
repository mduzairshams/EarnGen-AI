// Isolated assessment store — separate key from main app state.
// Pattern mirrors src/lib/store.ts.
import { useEffect, useState } from "react";
import { getKV, setKV } from "./kvStore";

export type QuestionType = "mcq" | "scenario" | "reasoning";
export type Difficulty = "easy" | "medium" | "hard";

export type AssessmentQuestion = {
  id: string;
  skill: string;
  type: QuestionType;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: Difficulty;
  weight: number;
};

export type SkillResult = {
  skill: string;
  score: number;
  maxScore: number;
  pct: number;
  rank: "Beginner" | "Intermediate" | "Advanced";
};

export type AssessmentResult = {
  completedAt: string;
  skills: string[];
  overallPct: number;
  overallRank: "Beginner" | "Intermediate" | "Advanced";
  skillResults: SkillResult[];
};

export type AssessmentState = {
  skills: string[];
  questions: AssessmentQuestion[];
  answers: Record<string, number>; // questionId → chosen option index
  result: AssessmentResult | null;
  generatedAt: string | null;
};

const KEY = "earngen.assessment.v1";

const empty: AssessmentState = {
  skills: [],
  questions: [],
  answers: {},
  result: null,
  generatedAt: null,
};

const listeners = new Set<() => void>();

function read(): AssessmentState {
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    return { ...empty, ...JSON.parse(raw) } as AssessmentState;
  } catch {
    return empty;
  }
}

function write(s: AssessmentState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
  listeners.forEach((l) => l());
}

export function clearAssessment() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
  listeners.forEach((l) => l());
}

export function saveAssessment(skills: string[], questions: AssessmentQuestion[]) {
  write({ ...empty, skills, questions, generatedAt: new Date().toISOString() });
}

export function saveAnswer(questionId: string, optionIndex: number) {
  const next = read();
  next.answers = { ...next.answers, [questionId]: optionIndex };
  write(next);
}

export function computeAndSaveResult(): AssessmentResult {
  const s = read();
  const bySkill: Record<string, { score: number; max: number }> = {};

  for (const q of s.questions) {
    if (!bySkill[q.skill]) bySkill[q.skill] = { score: 0, max: 0 };
    bySkill[q.skill].max += q.weight;
    const chosen = s.answers[q.id];
    if (chosen !== undefined && chosen === q.correctIndex) {
      bySkill[q.skill].score += q.weight;
    }
  }

  function rankOf(pct: number): "Beginner" | "Intermediate" | "Advanced" {
    if (pct >= 76) return "Advanced";
    if (pct >= 41) return "Intermediate";
    return "Beginner";
  }

  const skillResults: SkillResult[] = Object.entries(bySkill).map(([skill, { score, max }]) => {
    const pct = max === 0 ? 0 : Math.round((score / max) * 100);
    return { skill, score, maxScore: max, pct, rank: rankOf(pct) };
  });

  const totalScore = skillResults.reduce((a, r) => a + r.score, 0);
  const totalMax = skillResults.reduce((a, r) => a + r.maxScore, 0);
  const overallPct = totalMax === 0 ? 0 : Math.round((totalScore / totalMax) * 100);

  const result: AssessmentResult = {
    completedAt: new Date().toISOString(),
    skills: s.skills,
    overallPct,
    overallRank: rankOf(overallPct),
    skillResults,
  };

  write({ ...s, result });
  return result;
}

export function useAssessmentState() {
  const [state, setState] = useState<AssessmentState>(() => read());

  useEffect(() => {
    const l = () => setState(read());
    listeners.add(l);
    setState(read());
    return () => { listeners.delete(l); };
  }, []);

  return state;
}

/* ─── Leaderboard State Management ──────────────────────────────── */
export type LeaderboardEntry = {
  id: string;
  name: string;
  skill: string;
  score: number; // overall percentage
  level: "Beginner" | "Intermediate" | "Advanced";
  completedAt: string;
  isSelf?: boolean;
};

const LEADERBOARD_KEY = "earngen.leaderboard.v1";
const leaderboardListeners = new Set<() => void>();

const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  { id: "lb-1", name: "Priya Sharma", skill: "React", score: 95, level: "Advanced", completedAt: new Date(Date.now() - 4 * 3600000).toISOString() },
  { id: "lb-2", name: "Rahul Verma", skill: "Python", score: 88, level: "Advanced", completedAt: new Date(Date.now() - 12 * 3600000).toISOString() },
  { id: "lb-3", name: "Sneha Patel", skill: "Canva", score: 80, level: "Advanced", completedAt: new Date(Date.now() - 24 * 3600000).toISOString() },
  { id: "lb-4", name: "Amit Gupta", skill: "Figma", score: 70, level: "Intermediate", completedAt: new Date(Date.now() - 48 * 3600000).toISOString() },
  { id: "lb-5", name: "Neha Rao", skill: "Content Writing", score: 65, level: "Intermediate", completedAt: new Date(Date.now() - 72 * 3600000).toISOString() },
  { id: "lb-6", name: "Rohan Das", skill: "Video Editing", score: 45, level: "Intermediate", completedAt: new Date(Date.now() - 96 * 3600000).toISOString() },
  { id: "lb-7", name: "Aisha Khan", skill: "Excel", score: 35, level: "Beginner", completedAt: new Date(Date.now() - 120 * 3600000).toISOString() },
];

export function readLeaderboard(): LeaderboardEntry[] {
  if (typeof window === "undefined") return INITIAL_LEADERBOARD;
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (!raw) {
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(INITIAL_LEADERBOARD));
      return INITIAL_LEADERBOARD;
    }
    return JSON.parse(raw) as LeaderboardEntry[];
  } catch {
    return INITIAL_LEADERBOARD;
  }
}

export function writeLeaderboard(list: LeaderboardEntry[]) {
  if (typeof window === "undefined") return;
  // Sort descending by score
  const sorted = [...list].sort((a, b) => b.score - a.score);
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(sorted));
  // Sync to shared global database bucket in background
  setKV("earngen_global_leaderboard", sorted);
  leaderboardListeners.forEach((l) => l());
}

export function addToLeaderboard(name: string, result: AssessmentResult) {
  const current = readLeaderboard();
  
  // Since user might have tested multiple skills, add an entry for each skill result in the list!
  const newEntries: LeaderboardEntry[] = result.skillResults.map((sr, idx) => ({
    id: `self-${Date.now()}-${idx}`,
    name,
    skill: sr.skill,
    score: sr.pct,
    level: sr.rank,
    completedAt: result.completedAt,
    isSelf: true,
  }));

  // Prevent duplicate self records for the exact same skill by updating or appending
  let updated = [...current];
  for (const entry of newEntries) {
    updated = updated.filter((e) => !(e.isSelf && e.skill === entry.skill));
    updated.push(entry);
  }

  writeLeaderboard(updated);
}

export function useLeaderboard() {
  const [board, setBoard] = useState<LeaderboardEntry[]>(() => readLeaderboard());

  useEffect(() => {
    const l = () => setBoard(readLeaderboard());
    leaderboardListeners.add(l);
    setBoard(readLeaderboard());

    // Fetch from shared KV database in background and write locally to trigger reactive state sync
    getKV<LeaderboardEntry[]>("earngen_global_leaderboard", INITIAL_LEADERBOARD).then((sharedList) => {
      const local = readLeaderboard();
      // Keep local self completed entries
      const merged = [...sharedList];
      const selfEntries = local.filter((e) => e.isSelf);
      for (const selfEntry of selfEntries) {
        if (!merged.some((e) => e.name === selfEntry.name && e.skill === selfEntry.skill)) {
          merged.push(selfEntry);
        }
      }
      writeLeaderboard(merged);
    });

    return () => {
      leaderboardListeners.delete(l);
    };
  }, []);

  return board;
}
