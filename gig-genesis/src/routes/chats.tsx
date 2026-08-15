import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import { Shell, Card } from "@/components/Layout";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/lib/auth";
import { getKV, setKV } from "@/lib/kvStore";
import {
  MessageSquare,
  Send,
  Clock,
  CheckCircle2,
  Trophy,
  GraduationCap,
  Sparkles,
  ArrowLeft,
  Search,
  User,
  AlertCircle,
} from "lucide-react";

// Support peerId search parameter for direct chat linking
type ChatsSearch = {
  peerId?: string;
};

export const Route = createFileRoute("/chats")({
  validateSearch: (search: Record<string, unknown>): ChatsSearch => {
    return {
      peerId: typeof search.peerId === "string" ? search.peerId : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Messages & P2P Chats — EARNGEN-AI" },
      { name: "description", content: "Chat with top student earners and coordinate peer-to-peer upskilling and gig feedback." },
    ],
  }),
  component: ChatsPage,
});

// Mock metadata for loading profile stats
const PEER_META: Record<string, { college: string; skill: string; rank: number }> = {
  "p-1": { college: "IIIT Hyderabad", skill: "React", rank: 1 },
  "p-2": { college: "IIT Bombay", skill: "Python", rank: 2 },
  "p-3": { college: "NID Ahmedabad", skill: "Canva", rank: 3 },
  "p-4": { college: "Delhi Tech Univ", skill: "Figma", rank: 4 },
  "p-5": { college: "St. Xavier's Mumbai", skill: "SEO Optimization", rank: 5 },
  "p-6": { college: "SRFTI Kolkata", skill: "Video Editing", rank: 6 },
  "p-7": { college: "LSR Delhi", skill: "Data Analysis", rank: 7 },
  "p-8": { college: "BITS Pilani", skill: "Node.js", rank: 8 },
  "p-9": { college: "Christ Univ", skill: "Copywriting", rank: 9 },
  "p-10": { college: "FMS Delhi", skill: "Product Management", rank: 10 },
};

function ChatsPage() {
  const { peerId: queryPeerId } = Route.useSearch();
  const { user, profile } = useAuth();
  
  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [chatThreads, setChatThreads] = useState<any[]>([]);
  const [activeRoom, setActiveRoom] = useState<{ status: string; messages: any[] } | null>(null);
  const [approving, setApproving] = useState(false);
  
  const feedEndRef = useRef<HTMLDivElement>(null);

  // 1. Poll active conversations list for logged-in user in real-time (every 2.5s)
  useEffect(() => {
    if (!user) return;
    
    let active = true;
    const fetchThreads = async () => {
      const dbList = await getKV<any[]>(`earngen_user_chats_${user.id}`, []);
      
      // Default initial demo conversations
      const seeded = [
        {
          peerId: "p-1",
          peerName: "Priya Sharma",
          status: "Approved",
          roomId: "seed_react_priya",
        },
        {
          peerId: "p-2",
          peerName: "Rahul Verma",
          status: "Pending Approval",
          roomId: "seed_python_rahul",
        },
      ];

      const combined = [...dbList];
      for (const seed of seeded) {
        if (!combined.some((c) => c.peerId === seed.peerId)) {
          combined.push(seed);
        }
      }

      if (active) {
        setChatThreads(combined);
      }
    };

    fetchThreads();
    const interval = setInterval(fetchThreads, 2500);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [user]);

  // Find active chat details
  const activeChat = useMemo(() => {
    return chatThreads.find((c) => c.peerId === selectedPeerId) || null;
  }, [chatThreads, selectedPeerId]);

  // Sync selected peer from query search parameters or first conversation
  useEffect(() => {
    if (queryPeerId) {
      setSelectedPeerId(queryPeerId);
    } else if (chatThreads.length > 0 && !selectedPeerId) {
      setSelectedPeerId(chatThreads[0].peerId);
    }
  }, [queryPeerId, chatThreads, selectedPeerId]);

  // 2. Poll active message feed from shared KV database in real-time (every 2s)
  useEffect(() => {
    if (!user || !selectedPeerId || !activeChat) return;

    let active = true;
    const fetchRoom = async () => {
      const room = await getKV<{ status: string; messages: any[] }>(
        `earngen_room_${activeChat.roomId}`,
        { status: activeChat.status, messages: [] }
      );

      // Pre-fill demo conversations if empty
      if (activeChat.roomId.startsWith("seed_")) {
        if (room.messages.length === 0) {
          if (activeChat.roomId === "seed_react_priya") {
            room.messages = [
              {
                id: "m-1",
                senderId: "p-1",
                text: "Hey! Thank you so much for reaching out. I'd love to help you optimize React hooks like useMemo! Let me know if you want to trade React tips.",
                timestamp: new Date(Date.now() - 3600000).toISOString(),
              },
            ];
          } else {
            room.messages = [
              {
                id: "m-2",
                senderId: user.id,
                text: "Hey Rahul, let's learn Python together! Let me know when you can approve my chat request.",
                timestamp: new Date(Date.now() - 7200000).toISOString(),
              },
            ];
          }
        }
      }

      if (active) {
        setActiveRoom(room);
      }
    };

    fetchRoom();
    const interval = setInterval(fetchRoom, 2000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [user, selectedPeerId, activeChat]);



  // Filtered chats list for sidebar
  const filteredChats = useMemo(() => {
    return chatThreads.filter((c) =>
      c.peerName.toLowerCase().includes(sidebarSearch.toLowerCase())
    );
  }, [chatThreads, sidebarSearch]);

  // 3. Real multi-account peer approval handler!
  const handleApproveRequest = async () => {
    if (!user || !selectedPeerId || !activeChat || approving) return;
    setApproving(true);
    try {
      const roomId = activeChat.roomId;

      // Update room status
      const room = await getKV<any>(`earngen_room_${roomId}`, { status: "Pending Approval", messages: [] });
      room.status = "Approved";
      await setKV(`earngen_room_${roomId}`, room);

      // Update recipient (logged in user) thread index
      const myThreads = await getKV<any[]>(`earngen_user_chats_${user.id}`, []);
      const myIndex = myThreads.findIndex((t) => t.peerId === selectedPeerId);
      if (myIndex !== -1) {
        myThreads[myIndex].status = "Approved";
        await setKV(`earngen_user_chats_${user.id}`, myThreads);
      }

      // Update sender (peer) thread index
      const peerThreads = await getKV<any[]>(`earngen_user_chats_${selectedPeerId}`, []);
      const peerIndex = peerThreads.findIndex((t) => t.peerId === user.id);
      if (peerIndex !== -1) {
        peerThreads[peerIndex].status = "Approved";
        await setKV(`earngen_user_chats_${selectedPeerId}`, peerThreads);
      }

      // Append standard greeting from recipient
      const msg = {
        id: crypto.randomUUID(),
        senderId: user.id,
        text: "I approved your chat request! Let's trade skills in real-time. ⚡",
        timestamp: new Date().toISOString(),
      };
      room.messages.push(msg);
      await setKV(`earngen_room_${roomId}`, room);
      
      // Update local reactive states
      setActiveRoom(room);
    } catch (e) {
      console.error(e);
    } finally {
      setApproving(false);
    }
  };

  // 4. Send Message in real-time
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPeerId || !inputText.trim() || !activeChat || !activeRoom) return;

    const text = inputText.trim();
    setInputText("");

    const msg = {
      id: crypto.randomUUID(),
      senderId: user.id,
      text: text,
      timestamp: new Date().toISOString(),
    };

    try {
      const room = await getKV<any>(`earngen_room_${activeChat.roomId}`, { status: activeChat.status, messages: [] });
      room.messages.push(msg);
      await setKV(`earngen_room_${activeChat.roomId}`, room);
      
      // Update local reactive state instantly for better UX
      setActiveRoom(room);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Shell>
      <RequireAuth>
        <div className="space-y-6">
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-2xl bg-brand/10 flex items-center justify-center shrink-0">
                <MessageSquare className="size-5.5 text-brand" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">P2P Chat Workspace</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Coordinate live demo sessions, request design feedback, and trade high-income skills in real-time.
                </p>
              </div>
            </div>

            <Link
              to="/upskill"
              className="inline-flex items-center gap-1.5 text-xs font-bold bg-muted/65 hover:bg-muted text-foreground border border-border px-4 py-2.5 rounded-xl transition"
            >
              <ArrowLeft className="size-3.5" /> Back to Upskill Peers
            </Link>
          </header>

          {/* Grid Layout: Sidebar + Active Chat */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[600px] lg:h-[650px]">
            {/* Sidebar Columns (4 cols) */}
            <Card className="lg:col-span-4 flex flex-col p-4 gap-4 h-full relative overflow-hidden">
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-foreground">Conversations</h3>
                <p className="text-[10px] text-muted-foreground">Select a peer student to begin messaging.</p>
              </div>

              {/* Sidebar Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-3.5" />
                <input
                  type="text"
                  placeholder="Search active chats..."
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  className="w-full bg-muted/50 border border-border/80 rounded-lg pl-9 pr-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-brand text-foreground"
                />
              </div>

              {/* Chats List */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {filteredChats.length === 0 ? (
                  <div className="text-center py-10 space-y-2">
                    <MessageSquare className="size-6 text-muted-foreground/30 mx-auto" />
                    <p className="text-xs text-muted-foreground">No conversations found</p>
                    <Link
                      to="/upskill"
                      className="text-[10px] text-brand font-bold hover:underline"
                    >
                      Find Peers in Directory
                    </Link>
                  </div>
                ) : (
                  filteredChats.map((chat) => {
                    const active = chat.peerId === selectedPeerId;
                    const meta = PEER_META[chat.peerId];
                    const isPending = chat.status === "Pending Approval";

                    return (
                      <button
                        key={chat.peerId}
                        type="button"
                        onClick={() => setSelectedPeerId(chat.peerId)}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 relative ${
                          active
                            ? "bg-brand/10 border-brand/20 shadow-sm"
                            : "bg-muted/30 border-border/40 hover:bg-muted/60"
                        }`}
                      >
                        {/* Status notification dot */}
                        {isPending && (
                          <span className="absolute top-2 right-2 size-2 rounded-full bg-yellow-500 animate-pulse" />
                        )}
                        
                        {/* Initials Circle */}
                        <div className="size-9 rounded-full bg-brand text-brand-foreground flex items-center justify-center font-bold text-xs shrink-0 ring-1 ring-border">
                          {chat.peerName.charAt(0).toUpperCase()}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-xs text-foreground truncate block">
                              {chat.peerName}
                            </span>
                            {meta && (
                              <span className="text-[9px] font-semibold text-brand bg-brand/10 px-1.5 py-0.2 rounded shrink-0">
                                {meta.skill}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                            {isPending ? (
                              <span className="text-yellow-600 dark:text-yellow-400 font-semibold flex items-center gap-0.5">
                                <Clock className="size-2.5 animate-spin" /> Pending Approval
                              </span>
                            ) : (
                              "Tap to view messages..."
                            )}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </Card>

            {/* Active Chat Column (8 cols) */}
            <Card className="lg:col-span-8 flex flex-col h-full overflow-hidden p-0 relative border border-border/80">
              {activeChat && activeRoom ? (
                <div className="flex flex-col h-full">
                  {/* Chat Header */}
                  <div className="p-4 border-b border-border/60 bg-muted/20 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-brand text-brand-foreground flex items-center justify-center font-bold text-sm ring-1 ring-border">
                        {activeChat.peerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                          {activeChat.peerName}
                          {(() => {
                            const meta = PEER_META[activeChat.peerId];
                            return (
                              meta && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-bold">
                                  <Trophy className="size-2.5" /> #{meta.rank}
                                </span>
                              )
                            );
                          })()}
                        </h4>
                        {(() => {
                          const meta = PEER_META[activeChat.peerId];
                          return (
                            meta ? (
                              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <GraduationCap className="size-3 text-brand" /> {meta.college}
                              </p>
                            ) : (
                              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <User className="size-3 text-brand" /> Registered Earnen Member
                              </p>
                            )
                          );
                        })()}
                      </div>
                    </div>

                    {/* Chat Status Pill */}
                    {activeRoom.status === "Approved" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                        <CheckCircle2 className="size-3 animate-bounce" /> Exchange Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-[10px] font-bold border border-yellow-500/20 animate-pulse">
                        <Clock className="size-3 animate-spin" /> Pending Approval
                      </span>
                    )}
                  </div>

                  {/* Message Feed Area */}
                  <div className="flex-1 p-4 overflow-y-auto bg-muted/10 space-y-4">
                    {activeRoom.messages.length === 0 ? (
                      <div className="h-full flex flex-col justify-center items-center text-center space-y-3">
                        <div className="size-12 rounded-full bg-brand/10 flex items-center justify-center text-brand animate-pulse">
                          <MessageSquare className="size-5" />
                        </div>
                        <div>
                          <p className="font-bold text-xs">This is the start of your P2P Chat!</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Type a friendly greeting to introduce yourself and coordinate learning goals.
                          </p>
                        </div>
                      </div>
                    ) : (
                      activeRoom.messages.map((msg) => {
                        const isMe = msg.senderId === user?.id || msg.senderId === "me";
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isMe ? "justify-end" : "justify-start"} animate-fade-in`}
                          >
                            <div
                              className={`max-w-[70%] p-3 rounded-2xl text-xs leading-relaxed ${
                                isMe
                                  ? "bg-brand text-brand-foreground rounded-tr-none shadow-md shadow-brand/5"
                                  : "bg-muted text-foreground rounded-tl-none border border-border/30"
                              }`}
                            >
                              <p className="whitespace-pre-wrap">{msg.text}</p>
                              <span
                                className={`block text-[8px] mt-1.5 text-right font-medium tracking-wider uppercase select-none ${
                                  isMe ? "text-brand-foreground/80" : "text-muted-foreground"
                                }`}
                              >
                                {new Date(msg.timestamp).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={feedEndRef} />
                  </div>

                  {/* Bottom Panel: Message Input OR Recipient Approval Widget */}
                  {activeRoom.status === "Pending Approval" ? (
                    <div className="p-4 border-t border-border/60 bg-yellow-500/5 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
                      <div className="flex items-start gap-2.5">
                        <AlertCircle className="size-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5 animate-pulse" />
                        <div>
                          <h5 className="font-bold text-xs text-yellow-700 dark:text-yellow-500">
                            Chat Request Pending
                          </h5>
                          <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">
                            You can approve this request to start exchanging real-time messages with {activeChat.peerName}!
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleApproveRequest}
                        disabled={approving}
                        className="inline-flex items-center gap-1 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-yellow-950 text-xs font-bold rounded-xl transition shadow active:scale-95 shrink-0"
                      >
                        <Sparkles className="size-3.5" /> Approve Chat Request
                      </button>
                    </div>
                  ) : (
                    <form
                      onSubmit={handleSendMessage}
                      className="p-4 border-t border-border/60 bg-muted/20 flex gap-2 shrink-0 items-center"
                    >
                      <input
                        type="text"
                        placeholder={`Type a message to ${activeChat.peerName}...`}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="flex-1 bg-background border border-border/80 rounded-xl px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-brand text-foreground"
                      />
                      <button
                        type="submit"
                        disabled={!inputText.trim()}
                        className="px-4 py-2.5 bg-brand text-brand-foreground rounded-xl text-xs font-bold hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center shrink-0 shadow-lg shadow-brand/10 active:scale-95"
                      >
                        <Send className="size-3.5" />
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col justify-center items-center text-center p-8 space-y-4">
                  <div className="size-16 rounded-3xl bg-brand/10 flex items-center justify-center text-brand relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand/20 to-transparent" />
                    <MessageSquare className="size-7" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Select a Peer to Chat</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[340px] leading-relaxed">
                      Choose an active conversation from the sidebar list, or visit the Upskilling directory to connect with expert peers.
                    </p>
                  </div>
                  <Link
                    to="/upskill"
                    className="inline-flex items-center gap-1.5 text-xs font-bold bg-brand text-brand-foreground shadow-lg hover:shadow-brand/20 px-5 py-3 rounded-xl transition"
                  >
                    Browse P2P Directory
                  </Link>
                </div>
              )}
            </Card>
          </div>
        </div>
      </RequireAuth>
    </Shell>
  );
}
