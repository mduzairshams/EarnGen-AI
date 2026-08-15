import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { Shell, Card } from "@/components/Layout";
import { RequireAuth } from "@/components/RequireAuth";
import { useAppState } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { readLeaderboard } from "@/lib/assessmentStore";
import {
  Trophy,
  Search,
  Award,
  Sparkles,
  BookOpen,
  Briefcase,
  User,
  CheckCircle2,
  GraduationCap,
  Star,
  Users,
  Compass,
  MessageSquare,
  Clock,
  Send,
} from "lucide-react";

export const Route = createFileRoute("/upskill")({
  head: () => ({
    meta: [
      { title: "Peer-to-Peer Skill Exchange — EARNGEN-AI" },
      { name: "description", content: "Implement Peer-to-Peer skill exchanges with top-ranked student earners. Request live demo sessions." },
    ],
  }),
  component: UpskillPage,
});

type PeerStudent = {
  id: string;
  name: string;
  rank: number;
  points: number;
  college: string;
  organization: string;
  mode: "Learning" | "Working" | "Both";
  skills: { name: string; level: "Beginner" | "Intermediate" | "Advanced"; score: number }[];
};

const FAKE_PEERS: PeerStudent[] = [
  {
    id: "p-1",
    name: "Priya Sharma",
    rank: 1,
    points: 4800,
    college: "IIIT Hyderabad",
    organization: "Zelvora Technologies",
    mode: "Both",
    skills: [
      { name: "React", level: "Advanced", score: 95 },
      { name: "Figma", level: "Advanced", score: 92 },
    ],
  },
  {
    id: "p-2",
    name: "Rahul Verma",
    rank: 2,
    points: 4200,
    college: "IIT Bombay",
    organization: "Same as college",
    mode: "Working",
    skills: [
      { name: "Python", level: "Advanced", score: 88 },
      { name: "SQL", level: "Intermediate", score: 75 },
    ],
  },
  {
    id: "p-3",
    name: "Sneha Patel",
    rank: 3,
    points: 3900,
    college: "NID Ahmedabad",
    organization: "Same as college",
    mode: "Learning",
    skills: [
      { name: "Canva", level: "Advanced", score: 80 },
      { name: "Video Editing", level: "Intermediate", score: 70 },
    ],
  },
  {
    id: "p-4",
    name: "Amit Gupta",
    rank: 4,
    points: 3500,
    college: "Delhi Technological University",
    organization: "Microsoft Internship",
    mode: "Both",
    skills: [
      { name: "Figma", level: "Advanced", score: 70 },
      { name: "UI Design", level: "Intermediate", score: 68 },
    ],
  },
  {
    id: "p-5",
    name: "Neha Rao",
    rank: 5,
    points: 3200,
    college: "St. Xavier's Mumbai",
    organization: "Freelancer Studio",
    mode: "Working",
    skills: [
      { name: "Content Writing", level: "Advanced", score: 65 },
      { name: "SEO Optimization", level: "Intermediate", score: 60 },
    ],
  },
  {
    id: "p-6",
    name: "Rohan Das",
    rank: 6,
    points: 2800,
    college: "SRFTI Kolkata",
    organization: "Red Chillies VFX",
    mode: "Working",
    skills: [
      { name: "Video Editing", level: "Advanced", score: 45 },
      { name: "Premiere Pro", level: "Advanced", score: 42 },
    ],
  },
  {
    id: "p-7",
    name: "Aisha Khan",
    rank: 7,
    points: 2400,
    college: "LSR Delhi",
    organization: "Same as college",
    mode: "Learning",
    skills: [
      { name: "Excel", level: "Advanced", score: 35 },
      { name: "Data Analysis", level: "Intermediate", score: 32 },
    ],
  },
  {
    id: "p-8",
    name: "Devendra Singh",
    rank: 8,
    points: 2100,
    college: "BITS Pilani",
    organization: "Same as college",
    mode: "Both",
    skills: [
      { name: "Node.js", level: "Advanced", score: 85 },
      { name: "MongoDB", level: "Intermediate", score: 72 },
    ],
  },
  {
    id: "p-9",
    name: "Kavya Nair",
    rank: 9,
    points: 1900,
    college: "Christ University Bangalore",
    organization: "GrowthX Interns",
    mode: "Learning",
    skills: [
      { name: "Copywriting", level: "Advanced", score: 78 },
      { name: "Digital Marketing", level: "Intermediate", score: 65 },
    ],
  },
  {
    id: "p-10",
    name: "Vikram Malhotra",
    rank: 10,
    points: 1750,
    college: "FMS Delhi",
    organization: "Same as college",
    mode: "Working",
    skills: [
      { name: "Product Management", level: "Advanced", score: 82 },
      { name: "Agile Scrums", level: "Intermediate", score: 70 },
    ],
  },
  {
    id: "p-11",
    name: "Ananya Sen",
    rank: 11,
    points: 1500,
    college: "Jadavpur University",
    organization: "Same as college",
    mode: "Learning",
    skills: [
      { name: "TailwindCSS", level: "Advanced", score: 80 },
      { name: "HTML/CSS", level: "Advanced", score: 78 },
    ],
  },
  {
    id: "p-12",
    name: "Pranav Joshi",
    rank: 12,
    points: 1300,
    college: "IIT Guwahati",
    organization: "Adobe Campus",
    mode: "Both",
    skills: [
      { name: "Graphic Design", level: "Advanced", score: 75 },
      { name: "Photoshop", level: "Advanced", score: 72 },
    ],
  },
];

function UpskillPage() {
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState<string>("all");
  const [sessionRequestedPeer, setSessionRequestedPeer] = useState<string | null>(null);
  
  const { state, requestChat } = useAppState();
  const navigate = useNavigate();
  const [chatToastPeer, setChatToastPeer] = useState<{ id: string; name: string } | null>(null);
  const [dbPeers, setDbPeers] = useState<any[]>([]);

  // Fetch real registered earner profiles from Supabase profiles table
  useEffect(() => {
    supabase
      .from("profiles")
      .select("*")
      .then(({ data, error }) => {
        if (!error && data) {
          const mapped = data.map((prof, idx) => {
            const lb = readLeaderboard();
            const matchingLb = lb.find((e) => e.name === prof.full_name);
            const score = matchingLb ? matchingLb.score : 0;
            const rank = matchingLb ? lb.indexOf(matchingLb) + 1 : lb.length + idx + 1;

            return {
              id: prof.id,
              name: prof.full_name || "Anonymous Learner",
              rank: rank,
              points: score * 100 || 500,
              college: prof.college || "Local University",
              organization: "EARNGEN Earner",
              mode: "Both",
              skills: matchingLb
                ? [{ name: matchingLb.skill, level: matchingLb.level, score: matchingLb.score }]
                : [{ name: "Upskilling", level: "Beginner", score: 20 }],
            };
          });
          setDbPeers(mapped);
        }
      });
  }, [state.chats]); // Sync if chats state updates

  // Request demo session action
  const handleRequestDemo = (peerName: string) => {
    setSessionRequestedPeer(peerName);
    setTimeout(() => {
      setSessionRequestedPeer(null);
    }, 4000);
  };

  // Request chat action - triggers request state in local/global sync
  const handleRequestChat = (peerId: string, peerName: string) => {
    requestChat(peerId, peerName);
    setChatToastPeer({ id: peerId, name: peerName });
    
    // Auto dismiss request notification after a few seconds
    setTimeout(() => {
      setChatToastPeer(null);
    }, 5000);
  };

  // Combined hardcoded peers and database-registered real accounts!
  const allPeers = useMemo(() => {
    const filteredFake = FAKE_PEERS.filter(
      (fake) => !dbPeers.some((real) => real.name.toLowerCase() === fake.name.toLowerCase())
    );
    return [...dbPeers, ...filteredFake].sort((a, b) => a.rank - b.rank);
  }, [dbPeers]);

  // Filter combined list
  const filtered = useMemo(() => {
    return allPeers.filter((peer) => {
      const matchesSearch =
        peer.name.toLowerCase().includes(search.toLowerCase()) ||
        peer.skills.some((sk: any) => sk.name.toLowerCase().includes(search.toLowerCase())) ||
        peer.college.toLowerCase().includes(search.toLowerCase());

      const matchesMode =
        modeFilter === "all" || peer.mode.toLowerCase() === modeFilter.toLowerCase();

      return matchesSearch && matchesMode;
    });
  }, [allPeers, search, modeFilter]);

  return (
    <Shell>
      <RequireAuth>
        <div className="space-y-8 relative">
          
          {/* Custom Success Banner Modal popup */}
          {sessionRequestedPeer && (
            <div className="fixed top-20 right-4 sm:right-6 z-50 animate-fade-in max-w-sm w-full">
              <div className="bg-foreground text-background rounded-2xl p-4 shadow-2xl border border-border flex items-start gap-3 relative overflow-hidden">
                <div className="absolute inset-0 bg-brand/[0.03] pointer-events-none" />
                <CheckCircle2 className="size-6 text-brand shrink-0 mt-0.5 animate-bounce" />
                <div>
                  <h4 className="font-bold text-sm">Demo Session Requested! 🚀</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    <strong>{sessionRequestedPeer}</strong> has been notified! They will contact you shortly to coordinate a 1-on-1 P2P skill exchange session.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Custom Chat Success/Pending Toast popup */}
          {chatToastPeer && (
            <div className="fixed top-20 right-4 sm:right-6 z-50 animate-fade-in max-w-sm w-full">
              <div className="bg-foreground text-background rounded-2xl p-4 shadow-2xl border border-border flex items-start gap-3 relative overflow-hidden">
                <div className="absolute inset-0 bg-brand/[0.03] pointer-events-none" />
                {(() => {
                  const existingChat = state.chats.find((c) => c.peerId === chatToastPeer.id);
                  const isApproved = existingChat?.status === "Approved";
                  return (
                    <>
                      {isApproved ? (
                        <CheckCircle2 className="size-6 text-brand shrink-0 mt-0.5 animate-bounce" />
                      ) : (
                        <Clock className="size-6 text-yellow-500 shrink-0 mt-0.5 animate-spin" />
                      )}
                      <div>
                        <h4 className="font-bold text-sm">
                          {isApproved ? "Chat Approved! 💬" : "Sending Chat Request... ⏳"}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {isApproved ? (
                            <span>
                              <strong>{chatToastPeer.name}</strong> approved your request! Tap below to open real-time messages.
                            </span>
                          ) : (
                            <span>
                              Requesting to connect with <strong>{chatToastPeer.name}</strong>. Simulating peer approval in a few seconds...
                            </span>
                          )}
                        </p>
                        {isApproved && (
                          <Link
                            to="/chats"
                            search={{ peerId: chatToastPeer.id }}
                            onClick={() => setChatToastPeer(null)}
                            className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold text-brand hover:underline"
                          >
                            Open Chat Workspace →
                          </Link>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Header */}
          <header className="fade-up flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-2xl bg-brand/10 flex items-center justify-center relative overflow-hidden shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-brand/20 to-transparent" />
                <Users className="size-6 text-brand" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-brand uppercase tracking-widest">Collab Space</span>
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-brand/15 text-[10px] font-medium text-brand">
                    <Sparkles className="size-2.5 animate-pulse" /> P2P Exchange
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Peer-to-Peer Upskilling</h1>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              Learn new, high-income skills directly from other top student earners. Request live demo sessions to trade knowledge!
            </p>
          </header>

          {/* Search & Filter card */}
          <Card className="p-4 md:p-6 fade-up">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              {/* Search input */}
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                <input
                  type="text"
                  placeholder="Search by student name, skill, or college..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-muted/50 ring-1 ring-border rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand transition-all"
                />
              </div>

              {/* Filter controls */}
              <div className="flex gap-1.5 self-stretch md:self-auto overflow-x-auto pb-1 md:pb-0">
                {[
                  { id: "all", label: "🌍 All Peers" },
                  { id: "learning", label: "🌱 Learning" },
                  { id: "working", label: "💼 Working" },
                  { id: "both", label: "⚡ Both" },
                ].map((f) => {
                  const active = modeFilter === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setModeFilter(f.id)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
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
          </Card>

          {/* Peers List (3-Column Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 fade-up">
            {filtered.length === 0 ? (
              <Card className="p-8 text-center md:col-span-2 lg:col-span-3">
                <Compass className="size-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-semibold text-sm">No P2P peers found matching your criteria</p>
                <p className="text-xs text-muted-foreground mt-1">Try resetting your search filters to find more creators!</p>
              </Card>
            ) : (
              filtered.map((peer) => (
                <Card
                  key={peer.id}
                  className="p-5 flex flex-col justify-between gap-5 relative overflow-hidden group border border-border/80 hover:border-brand/40 hover:shadow-lg transition-all duration-300"
                >
                  {/* Status overlay */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-bl-full pointer-events-none group-hover:bg-brand/10 transition-colors" />

                  {/* Header: Name, Rank, Mode */}
                  <div className="space-y-3 relative z-10">
                    <div className="flex items-start justify-between">
                      {/* Name / initials */}
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-brand text-brand-foreground flex items-center justify-center font-bold text-sm ring-2 ring-brand-foreground/20">
                          {peer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground group-hover:text-brand transition-colors">
                            {peer.name}
                          </h3>
                          <span className={`inline-flex items-center text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mt-1 ${
                            peer.mode === "Working"
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                              : peer.mode === "Both"
                              ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                              : "bg-green-500/10 text-green-600 dark:text-green-400"
                          }`}>
                            {peer.mode === "Both" ? "⚡ Both" : peer.mode === "Working" ? "💼 Working" : "🌱 Learning"}
                          </span>
                        </div>
                      </div>

                      {/* Rank tag */}
                      <span className={`inline-flex items-center gap-0.5 px-2 py-1 rounded-md text-[10px] font-bold ${
                        peer.rank === 1
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20"
                          : peer.rank === 2
                          ? "bg-slate-400/10 text-slate-600 dark:text-slate-400 ring-1 ring-slate-400/20"
                          : peer.rank === 3
                          ? "bg-amber-700/10 text-amber-700 dark:text-amber-500 ring-1 ring-amber-700/20"
                          : "bg-muted text-muted-foreground ring-1 ring-border"
                      }`}>
                        <Trophy className="size-3" /> #{peer.rank}
                      </span>
                    </div>

                    {/* Stats details (Institution / Points) */}
                    <div className="space-y-1.5 pt-2 text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <GraduationCap className="size-3.5 shrink-0 text-brand" />
                        <span className="truncate">{peer.college}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Briefcase className="size-3.5 shrink-0 text-brand" />
                        <span className="truncate">
                          {peer.organization === "Same as college" ? "Same as College" : peer.organization}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-brand font-bold">
                        <Star className="size-3.5 shrink-0 fill-brand" />
                        <span>{peer.points.toLocaleString()} Points</span>
                      </div>
                    </div>
                  </div>

                  {/* Skills lists */}
                  <div className="space-y-3 pt-3 border-t border-border/60 relative z-10 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Skills & Competency
                      </p>
                      <div className="space-y-2.5">
                        {peer.skills.map((skill: any) => (
                          <div key={skill.name} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-foreground">{skill.name}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                skill.level === "Advanced"
                                  ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                                  : skill.level === "Intermediate"
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                  : "bg-green-500/10 text-green-600 dark:text-green-400"
                              }`}>
                                {skill.level}
                              </span>
                            </div>
                            <div className="h-1 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-brand transition-all rounded-full"
                                style={{ width: `${skill.score}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CTA Action Buttons: Request Session & Chat Options */}
                    <div className="space-y-2 mt-4 pt-2">
                      <button
                        type="button"
                        onClick={() => handleRequestDemo(peer.name)}
                        className="w-full bg-foreground text-background py-2.5 rounded-xl text-xs font-semibold hover:opacity-95 active:scale-98 transition-all shadow-sm"
                      >
                        Request Demo Session
                      </button>

                      {(() => {
                        const existingChat = state.chats.find((c) => c.peerId === peer.id);
                        if (!existingChat) {
                          return (
                            <button
                              type="button"
                              onClick={() => handleRequestChat(peer.id, peer.name)}
                              className="w-full inline-flex items-center justify-center gap-1.5 border border-brand/20 bg-brand/5 hover:bg-brand/10 text-brand py-2.5 rounded-xl text-xs font-bold active:scale-98 transition-all"
                            >
                              <MessageSquare className="size-3.5" /> Request to Chat
                            </button>
                          );
                        } else if (existingChat.status === "Pending Approval") {
                          return (
                            <div className="space-y-1.5">
                              <button
                                disabled
                                className="w-full inline-flex items-center justify-center gap-1.5 border border-yellow-500/20 bg-yellow-500/5 text-yellow-600 dark:text-yellow-400 py-2.5 rounded-xl text-xs font-bold cursor-not-allowed select-none opacity-80"
                              >
                                <Clock className="size-3.5 animate-spin" /> Pending Approval ⏳
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRequestChat(peer.id, peer.name)}
                                className="w-full text-center text-[10px] text-brand hover:underline font-bold"
                              >
                                Check status or view request...
                              </button>
                            </div>
                          );
                        } else {
                          return (
                            <Link
                              to="/chats"
                              search={{ peerId: peer.id }}
                              className="w-full inline-flex items-center justify-center gap-1.5 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 py-2.5 rounded-xl text-xs font-black active:scale-98 transition-all text-center"
                            >
                              <MessageSquare className="size-3.5" /> Open Chat 💬
                            </Link>
                          );
                        }
                      })()}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </RequireAuth>
    </Shell>
  );
}
