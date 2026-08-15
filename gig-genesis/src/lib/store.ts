// Lightweight localStorage-backed store with React subscription.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getKV, setKV } from "./kvStore";

export type IncomeEntry = {
  id: string;
  amount: number;
  client: string;
  platform: string;
  skill: string;
  project: string;
  date: string; // ISO date
};

export type SprintState = {
  gigTitle: string;
  startedAt: string;
  completedDays: number[]; // 1..7
};

export type ChatMessage = {
  id: string;
  sender: "me" | "peer";
  text: string;
  timestamp: string;
};

export type ChatThread = {
  peerId: string;
  peerName: string;
  status: "Pending Approval" | "Approved" | "Rejected";
  messages: ChatMessage[];
};

export type AppState = {
  user: { name: string; college: string; city: string };
  skills: string[];
  level: "Beginner" | "Intermediate" | "Pro";
  income: IncomeEntry[];
  sprint: SprintState | null;
  rewardPoints: number;
  chats: ChatThread[];
};

const KEY = "skillsync.state.v2";

const seed: AppState = {
  user: { name: "", college: "", city: "" },
  skills: ["React", "Figma", "Python", "Canva"],
  level: "Beginner",
  income: [
    {
      id: "inc-1",
      amount: 1500,
      client: "Acme Corp",
      platform: "Upwork",
      skill: "React",
      project: "React Dashboard Integration",
      date: daysAgo(2),
    },
    {
      id: "inc-2",
      amount: 850,
      client: "Zelvora Technologies",
      platform: "Fiverr",
      skill: "Figma",
      project: "Figma Landing Page Design",
      date: daysAgo(5),
    },
    {
      id: "inc-3",
      amount: 620,
      client: "Globex Ltd",
      platform: "Freelancer",
      skill: "Python",
      project: "Python Automation Script",
      date: daysAgo(8),
    },
    {
      id: "inc-4",
      amount: 350,
      client: "Local Bakery",
      platform: "Direct Client",
      skill: "Canva",
      project: "Social Media Canva Graphics",
      date: daysAgo(12),
    },
  ],
  sprint: {
    gigTitle: "Responsive React SaaS Landing Page",
    startedAt: daysAgo(4),
    completedDays: [1, 2, 3, 4],
  },
  rewardPoints: 1250,
  chats: [
    {
      peerId: "p-1",
      peerName: "Priya Sharma",
      status: "Approved",
      messages: [
        {
          id: "m-1",
          sender: "me",
          text: "Hey Priya, I loved your portfolio! Can you guide me on advanced React hooks?",
          timestamp: daysAgo(2),
        },
        {
          id: "m-2",
          sender: "peer",
          text: "Hey! Thank you so much. I'd love to help! Let me know if you want to trade React tips for Python lessons.",
          timestamp: daysAgo(2),
        },
      ],
    },
    {
      peerId: "p-2",
      peerName: "Rahul Verma",
      status: "Pending Approval",
      messages: [
        {
          id: "m-3",
          sender: "me",
          text: "Hey Rahul, let's learn Python together!",
          timestamp: daysAgo(1),
        },
      ],
    },
  ],
};

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

const listeners = new Set<() => void>();

function read(): AppState {
  if (typeof window === "undefined") return seed;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seed;
    const parsed = JSON.parse(raw);
    if (!parsed.skills || parsed.skills.length === 0) {
      parsed.skills = seed.skills;
    }
    if (!parsed.income || parsed.income.length === 0) {
      parsed.income = seed.income;
    }
    if (!parsed.sprint) {
      parsed.sprint = seed.sprint;
    }
    if (parsed.rewardPoints === undefined) {
      parsed.rewardPoints = seed.rewardPoints;
    }
    if (!parsed.chats || parsed.chats.length === 0) {
      parsed.chats = seed.chats;
    }
    return { ...seed, ...parsed } as AppState;
  } catch {
    return seed;
  }
}

function write(s: AppState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
  listeners.forEach((l) => l());
}

export function useAppState() {
  const [state, setState] = useState<AppState>(() => read());
  useEffect(() => {
    const l = () => setState(read());
    listeners.add(l);
    setState(read());
    return () => {
      listeners.delete(l);
    };
  }, []);

  return {
    state,
    update(patch: Partial<AppState>) {
      write({ ...read(), ...patch });
    },
    addIncome(entry: Omit<IncomeEntry, "id">) {
      const next = read();
      next.income = [{ ...entry, id: crypto.randomUUID() }, ...next.income];
      write(next);
    },
    removeIncome(id: string) {
      const next = read();
      next.income = next.income.filter((e) => e.id !== id);
      write(next);
    },
    setSprint(sprint: SprintState | null) {
      const next = read();
      next.sprint = sprint;
      write(next);
    },
    toggleDay(day: number) {
      const next = read();
      if (!next.sprint) return;
      const set = new Set(next.sprint.completedDays);
      let added = false;
      if (set.has(day)) {
        set.delete(day);
      } else {
        set.add(day);
        added = true;
      }
      next.sprint.completedDays = Array.from(set).sort((a, b) => a - b);
      
      // Award or deduct 250 points on sprint day completion/uncheck
      if (added) {
        next.rewardPoints += 250;
      } else {
        next.rewardPoints = Math.max(0, next.rewardPoints - 250);
      }
      
      write(next);
    },
    deductPoints(points: number) {
      const next = read();
      next.rewardPoints = Math.max(0, next.rewardPoints - points);
      write(next);
    },
    async requestChat(peerId: string, peerName: string) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const myId = user.id;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", myId)
        .maybeSingle();

      const myName = profile?.full_name || user.email || "Real Earner";
      const roomId = [myId, peerId].sort().join('_');

      // 1. Initialize room status in shared KV store
      const room = await getKV<any>(`earngen_room_${roomId}`, null);
      if (!room) {
        await setKV(`earngen_room_${roomId}`, {
          status: "Pending Approval",
          messages: [],
        });
      }

      // 2. Append room index to sender active threads list
      const myThreads = await getKV<any[]>(`earngen_user_chats_${myId}`, []);
      if (!myThreads.some((t) => t.peerId === peerId)) {
        myThreads.push({
          peerId,
          peerName,
          status: "Pending Approval",
          roomId,
        });
        await setKV(`earngen_user_chats_${myId}`, myThreads);
      }

      // 3. Append room index to recipient active threads list
      const peerThreads = await getKV<any[]>(`earngen_user_chats_${peerId}`, []);
      if (!peerThreads.some((t) => t.peerId === myId)) {
        peerThreads.push({
          peerId: myId,
          peerName: myName,
          status: "Pending Approval",
          roomId,
        });
        await setKV(`earngen_user_chats_${peerId}`, peerThreads);
      }

      // Update local storage active state for fallback compatibility
      const next = read();
      if (!next.chats.some((c) => c.peerId === peerId)) {
        next.chats.push({
          peerId,
          peerName,
          status: "Pending Approval",
          messages: [],
        });
        write(next);
      }
    },
    approveChat(peerId: string) {
      const next = read();
      const thread = next.chats.find((c) => c.peerId === peerId);
      if (thread) {
        thread.status = "Approved";
        write(next);
      }
    },
    sendChatMessage(peerId: string, sender: "me" | "peer", text: string) {
      const next = read();
      const thread = next.chats.find((c) => c.peerId === peerId);
      if (thread) {
        const msg: ChatMessage = {
          id: crypto.randomUUID(),
          sender,
          text,
          timestamp: new Date().toISOString(),
        };
        thread.messages = [...thread.messages, msg];
        write(next);
      }
    },
    reset() {
      write(seed);
    },
  };
}

export function totalEarned(income: IncomeEntry[]) {
  return income.reduce((s, e) => s + e.amount, 0);
}
