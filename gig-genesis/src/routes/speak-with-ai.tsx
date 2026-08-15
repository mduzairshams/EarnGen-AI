import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo, useEffect, useRef } from "react";
import { Shell, Card } from "@/components/Layout";
import { RequireAuth } from "@/components/RequireAuth";
import { speakWithAi } from "@/lib/chat.functions";
import { suggestGigs, gigApplyLinks, generateSprintPlan, type Gig } from "@/lib/ai";
import { useAppState } from "@/lib/store";
import { useDisplayUser } from "@/lib/useDisplayUser";
import {
  Send,
  Plus,
  Bot,
  Sparkles,
  Trophy,
  Clock,
  ArrowRight,
  ChevronRight,
  Sparkle,
} from "lucide-react";

export const Route = createFileRoute("/speak-with-ai")({
  head: () => ({
    meta: [
      { title: "Speak with AI — EARNGEN-AI" },
      { name: "description", content: "Share your idea and get a practical income plan from AI." },
    ],
  }),
  component: SpeakWithAiPage,
});

/** Extract skill-like keywords from free text to feed into gig matching. */
function extractKeywords(text: string): string[] {
  const lower = text.toLowerCase();
  // Split on whitespace and punctuation, keep tokens >= 3 chars
  const tokens = lower.split(/[\s,.\-!?;:()]+/).filter((t) => t.length >= 3);
  return Array.from(new Set(tokens));
}

type ChatMessage = {
  id: string;
  sender: "me" | "bot";
  text: string;
  gigs?: Gig[];
};

function SpeakWithAiPage() {
  const runChat = useServerFn(speakWithAi);
  const { setSprint } = useAppState();
  const me = useDisplayUser();
  const navigate = useNavigate();

  const [idea, setIdea] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome",
      sender: "bot",
      text: `Hello ${me.name || "there"}! I am your personal AI Earning Coach. 🤖✨

Describe your branch of study, any high-income skill you possess, or simply your daily goal (e.g. "I want to earn ₹2,000 this week from home using Canva").

I will instantly design a step-by-step monetization model, match active gig streams in ${me.city || "your city"}, and outline a 7-day action sprint! How can I help you earn today?`,
    },
  ]);
  const [busy, setBusy] = useState(false);
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);

  const feedEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll feed to bottom
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const sprintDays = useMemo(
    () => (selectedGig ? generateSprintPlan(selectedGig) : []),
    [selectedGig],
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const msg = idea.trim();
    if (!msg || busy) return;

    setIdea("");
    setBusy(true);

    // 1. Add user message
    const userMsgId = `user-${Date.now()}`;
    setMessages((prev) => [...prev, { id: userMsgId, sender: "me", text: msg }]);

    try {
      // 2. Fetch AI advice
      const out = await runChat({ data: { message: msg } });
      
      // 3. Extract keywords and match gigs
      const keywords = extractKeywords(msg);
      const matchedGigs = suggestGigs(keywords, me.city || "India", me.name || "there");

      const botMsgId = `bot-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: botMsgId,
          sender: "bot",
          text: out.reply || out.error || "I generated an plan for your skill! Check out the matches below.",
          gigs: matchedGigs,
        },
      ]);
    } catch (ex) {
      const botMsgId = `bot-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: botMsgId,
          sender: "bot",
          text: "I apologize, but my connection failed. Please try expressing your earning goal again!",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function startSprint(g: Gig) {
    setSprint({ gigTitle: g.title, startedAt: new Date().toISOString(), completedDays: [] });
    navigate({ to: "/sprint" });
  }

  return (
    <Shell>
      <RequireAuth>
        <div className="flex flex-col min-h-[calc(100vh-140px)] relative">
          
          {/* ── Conversation Stream Container (ChatGPT styled) ── */}
          <div className="flex-1 max-w-3xl w-full mx-auto pb-36 space-y-8 px-2 sm:px-4">
            
            {messages.map((msg) => {
              const isMe = msg.sender === "me";
              return (
                <div key={msg.id} className="animate-fade-in space-y-4">
                  <div className={`flex ${isMe ? "justify-end" : "justify-start"} items-start gap-3.5`}>
                    
                    {/* Bot Avatar Icon */}
                    {!isMe && (
                      <div className="size-8.5 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0 shadow-sm mt-0.5 select-none">
                        <Bot className="size-4.5 text-brand" />
                      </div>
                    )}

                    {/* Speech Bubbles */}
                    <div
                      className={`text-sm leading-relaxed ${
                        isMe
                          ? "bg-muted/95 text-foreground border border-border/40 rounded-2xl rounded-tr-none px-4.5 py-3.5 max-w-[80%] shadow-md whitespace-pre-wrap"
                          : "text-foreground whitespace-pre-wrap flex-1 mt-0.5 font-normal tracking-wide space-y-3"
                      }`}
                    >
                      {isMe ? (
                        msg.text
                      ) : (
                        // Format paragraphs beautifully for chatbot style
                        msg.text.split("\n\n").map((para, idx) => (
                          <p key={idx} className="leading-relaxed text-[13.5px] text-foreground/90 select-text">
                            {para}
                          </p>
                        ))
                      )}
                    </div>

                    {/* User Initials Circle */}
                    {isMe && (
                      <div className="size-8.5 rounded-full bg-brand text-brand-foreground flex items-center justify-center font-bold text-xs shrink-0 ring-1 ring-border mt-0.5 select-none">
                        {(me.name || "U").charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Curated matched gigs inline for bot responses */}
                  {!isMe && msg.gigs && msg.gigs.length > 0 && (
                    <div className="pl-12 space-y-5 animate-fade-in">
                      <div className="flex items-center gap-2 text-brand font-bold text-xs uppercase tracking-wider select-none">
                        <Sparkles className="size-3.5 animate-pulse" /> Matched Income Channels for You
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {msg.gigs.map((g) => {
                          const links = gigApplyLinks(g.title, me.city || "India");
                          const isSelected = selectedGig?.id === g.id;
                          return (
                            <Card
                              key={g.id}
                              className={`p-4 border transition-all cursor-pointer ${
                                isSelected ? "ring-2 ring-brand bg-brand/5" : "hover:ring-brand/30 hover:border-brand/20 bg-card/60"
                              }`}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="size-10 rounded-lg bg-brand/10 grid place-items-center text-xl shrink-0 select-none">
                                  {g.emoji}
                                </div>
                                <span
                                  className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                                    g.difficulty === "Easy"
                                      ? "bg-brand/10 text-brand"
                                      : g.difficulty === "Medium"
                                        ? "bg-amber-500/10 text-amber-500"
                                        : "bg-red-500/10 text-red-500"
                                  }`}
                                >
                                  {g.difficulty}
                                </span>
                              </div>

                              <h4 className="font-bold text-sm text-foreground">{g.title}</h4>
                              <p className="text-[11.5px] text-muted-foreground mt-1 leading-relaxed">
                                {g.description}
                              </p>

                              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-3 text-[10px] text-muted-foreground">
                                <span>📍 {g.platforms.join(" · ")}</span>
                                <span>⏱ ~{g.daysToFirstEarn}d to earn</span>
                              </div>

                              {/* Action links */}
                              <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border/40">
                                <a
                                  href={links.fiverr}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[9.5px] font-bold rounded bg-muted/65 hover:bg-muted border border-border px-2 py-1 transition select-none"
                                >
                                  Fiverr ↗
                                </a>
                                <a
                                  href={links.unstop}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[9.5px] font-bold rounded bg-muted/65 hover:bg-muted border border-border px-2 py-1 transition select-none"
                                >
                                  Unstop ↗
                                </a>
                                <a
                                  href={links.youtube}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[9.5px] font-bold rounded bg-muted/65 hover:bg-muted border border-border px-2 py-1 transition select-none"
                                >
                                  YouTube ↗
                                </a>
                              </div>

                              {/* Price + Action */}
                              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/40 gap-2">
                                <span className="text-xs font-bold text-foreground shrink-0">
                                  ₹{g.minPrice.toLocaleString("en-IN")} – ₹{g.maxPrice.toLocaleString("en-IN")}
                                </span>
                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedGig(isSelected ? null : g)}
                                    className="text-[10px] font-bold px-2 py-1.5 rounded bg-muted/40 hover:bg-muted border border-border transition select-none"
                                  >
                                    {isSelected ? "Hide Plan" : "Plan"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => startSprint(g)}
                                    className="bg-brand text-brand-foreground text-[10px] font-bold px-3 py-1.5 rounded hover:brightness-105 active:scale-95 transition select-none shrink-0"
                                  >
                                    Start
                                  </button>
                                </div>
                              </div>

                              {/* 7-Day Action Plan Nested */}
                              {isSelected && sprintDays.length > 0 && (
                                <div className="mt-4 pt-3 border-t border-border/50 space-y-2.5 animate-fade-in">
                                  <p className="text-[9px] font-bold uppercase tracking-wider text-brand select-none">
                                    7-Day Action Plan
                                  </p>
                                  {sprintDays.map((d) => (
                                    <div key={d.day} className="flex gap-2">
                                      <div className="size-5 rounded-full bg-brand/10 text-brand text-[9px] font-bold flex items-center justify-center shrink-0">
                                        {d.day}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-[11px] font-semibold truncate">{d.title}</p>
                                        <p className="text-[9.5px] text-muted-foreground mt-0.5 leading-normal">
                                          {d.detail}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={() => startSprint(g)}
                                    className="w-full mt-2 bg-brand text-brand-foreground text-[10px] font-bold py-2 rounded hover:brightness-105 active:scale-95 transition select-none"
                                  >
                                    Launch Earning Sprint 🚀
                                  </button>
                                </div>
                              )}
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Typing Loader / Thinking indicators */}
            {busy && (
              <div className="flex justify-start items-center gap-3.5 animate-pulse pl-1">
                <div className="size-8.5 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
                  <Bot className="size-4.5 text-brand" />
                </div>
                <div className="flex gap-1.5 items-center bg-muted/30 border border-border/40 px-4 py-3 rounded-2xl rounded-tl-none select-none">
                  <span className="size-2 rounded-full bg-brand/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="size-2 rounded-full bg-brand/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="size-2 rounded-full bg-brand/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            
            <div ref={feedEndRef} />
          </div>

          {/* ── Floating Center Bottom Chatbar (ChatGPT styled) ── */}
          <div className="fixed bottom-6 left-0 right-0 z-20 flex justify-center px-4 pointer-events-none">
            <div className="max-w-3xl w-full bg-card/90 backdrop-blur-md border border-border/80 shadow-2xl rounded-2xl p-2.5 flex items-center gap-3 pointer-events-auto transition-all relative">
              
              {/* Floating gradient fade above the input field to overlay scrollable messages */}
              <div className="absolute top-[-90px] left-0 right-0 h-[90px] bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none z-10" />

              {/* Left Plus attachment button */}
              <button
                type="button"
                className="size-8 rounded-full bg-muted/65 hover:bg-muted text-muted-foreground flex items-center justify-center transition cursor-pointer active:scale-95 shrink-0 select-none"
                title="Attach context"
              >
                <Plus className="size-4" />
              </button>

              {/* Input Form */}
              <form onSubmit={submit} className="flex-1 flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Ask anything..."
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  disabled={busy}
                  className="flex-1 bg-transparent border-0 outline-none text-xs text-foreground placeholder:text-muted-foreground/60 py-2.5 px-1 min-w-0"
                />

                {/* Right Action buttons inside chatbar */}
                <button
                  type="submit"
                  disabled={busy || !idea.trim()}
                  className="size-8.5 rounded-full bg-brand disabled:bg-muted disabled:text-muted-foreground text-brand-foreground flex items-center justify-center shadow-lg shadow-brand/10 hover:shadow-brand/20 active:scale-95 transition shrink-0 select-none"
                  title="Send message"
                >
                  <Send className="size-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </RequireAuth>
    </Shell>
  );
}
