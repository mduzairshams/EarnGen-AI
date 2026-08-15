import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Shell } from "@/components/Layout";
import { useAppState } from "@/lib/store";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EARNGEN-AI — Turn your skills into verified income" },
      { name: "description", content: "Enter your skills. Get a 7-day plan to your first ₹1,000. Mint verified proof-of-work for recruiters." },
      { property: "og:title", content: "EARNGEN-AI — Skill-to-Income Engine" },
      { property: "og:description", content: "From skill to ₹1,000 in 7 days. Verified earnings recruiters can actually trust." },
    ],
  }),
  component: Index,
});

const SUGGESTED = ["Canva", "Instagram Reels", "Content Writing", "Python", "Video Editing", "Figma", "Excel", "Photography"];

function Index() {
  const { user, loading } = useAuth();
  const { state, update } = useAppState();
  const [input, setInput] = useState("");
  const [skills, setSkills] = useState<string[]>(state.skills);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: "/speak-with-ai" });
    }
  }, [user, loading, navigate]);

  function add(s: string) {
    if (!user) return;
    const v = s.trim();
    if (!v || skills.includes(v)) return;
    setSkills([...skills, v]);
    setInput("");
  }
  function remove(s: string) {
    if (!user) return;
    setSkills(skills.filter((k) => k !== s));
  }

  function generate() {
    if (!user || skills.length === 0) return;
    update({ skills });
    navigate({ to: "/assessment", search: { onboard: true } });
  }

  const locked = !user;
  const showSpinner = loading;

  return (
    <Shell>
      <section className="pt-8 pb-16 fade-up">
        <div className="inline-flex items-center gap-2 rounded-full bg-brand/10 ring-1 ring-brand/20 px-3 py-1 mb-6">
          <span className="size-1.5 rounded-full bg-brand pulse-dot" />
          <span className="text-xs font-medium text-brand">AI-powered · Live</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-balance max-w-[20ch]">
          Turn your skill stack into <span className="text-brand">verified income.</span>
        </h1>
        <p className="text-lg text-muted-foreground mt-6 max-w-[58ch] text-pretty">
          After you sign in, you can generate a personalized 7-day roadmap, run sprints, and chat with AI about your ideas. The model name above is what the app will use once you are signed in.
        </p>

        <div className="mt-10 max-w-2xl">
          <div className={"rounded-2xl bg-card ring-1 ring-border p-2 shadow-sm " + (locked ? "opacity-90" : "")}>
            {locked ? (
              <p className="text-sm text-muted-foreground px-4 pt-3 pb-1">
                <Link to="/auth" className="font-semibold text-brand underline">
                  Sign in
                </Link>{" "}
                to add skills and generate your roadmap. Nothing runs until you are signed in.
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2 px-3 pt-3">
              {skills.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => remove(s)}
                  disabled={locked}
                  className="group inline-flex items-center gap-1 rounded-lg bg-brand/10 text-brand text-sm font-medium px-3 py-1.5 ring-1 ring-brand/20 hover:bg-brand/15 disabled:pointer-events-none"
                >
                  {s}
                  <span className="text-brand/60 group-hover:text-brand">×</span>
                </button>
              ))}
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") add(input);
                }}
                disabled={locked}
                placeholder={locked ? "Sign in to add skills…" : skills.length ? "Add another…" : "Type a skill — Canva, Python, Reels…"}
                className="flex-1 min-w-[180px] bg-transparent border-none outline-none px-2 py-2 text-sm placeholder:text-muted-foreground disabled:cursor-not-allowed"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 mt-2">
              <div className="flex flex-wrap gap-2">
                {SUGGESTED.filter((s) => !skills.includes(s))
                  .slice(0, 5)
                  .map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={locked}
                      onClick={() => add(s)}
                      className="text-xs font-medium text-muted-foreground hover:text-foreground rounded-md border border-dashed border-border px-2 py-1 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      + {s}
                    </button>
                  ))}
              </div>
              <button
                type="button"
                onClick={generate}
                disabled={locked || !skills.length || showSpinner}
                className="bg-brand text-brand-foreground text-sm font-semibold py-2.5 px-5 rounded-lg ring-2 ring-brand/20 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-105 shrink-0"
              >
                Generate Roadmap →
              </button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 ml-1">
            {locked ? "Roadmap and AI chat are available after sign-in only." : "We will match gigs to your skills and open your opportunities list."}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
        {[
          ["₹0", "Start tracking after first gig"],
          ["You", "Verified earner profile"],
          ["7 days", "Structured sprint"],
          ["AI", "Gemini-powered plans"],
        ].map(([v, l]) => (
          <div key={l} className="p-5 rounded-xl bg-card ring-1 ring-border">
            <p className="text-2xl font-semibold tracking-tight">{v}</p>
            <p className="text-xs text-muted-foreground mt-1">{l}</p>
          </div>
        ))}
      </section>

      <section className="mb-20">
        <h2 className="text-3xl font-semibold tracking-tight mb-2">From skill to salary in 4 steps</h2>
        <p className="text-muted-foreground mb-10">Sign in, then use Speak with AI or the roadmap flow.</p>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { n: "01", t: "Sign in", d: "Create a free account so AI features and your progress are unlocked." },
            { n: "02", t: "Speak with AI or add skills", d: "Share an idea in chat, or list skills for gig matching." },
            { n: "03", t: "Run the 7-day sprint", d: "Daily tasks, outreach drafts, and links — tied to your gig." },
            { n: "04", t: "Log income & proof", d: "Every paid gig strengthens your verified Proof-of-Work." },
          ].map((s) => (
            <div key={s.n} className="p-6 rounded-2xl bg-card ring-1 ring-border">
              <p className="text-xs font-mono text-brand">{s.n}</p>
              <h3 className="mt-3 font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground text-pretty">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-20 rounded-3xl bg-foreground text-background p-10 md:p-16">
        <p className="text-xs font-semibold tracking-widest uppercase text-brand-light">For Recruiters</p>
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mt-3 max-w-[24ch]">
          Stop guessing from CVs. See verified work history.
        </h2>
        <p className="text-background/70 mt-4 max-w-[60ch] text-pretty">
          Every EARNGEN-AI candidate ships with a public profile of completed gigs, real client names, payment history, and a trust score. You filter for proof — not promises.
        </p>
        <Link
          to="/r/$username"
          params={{ username: "priya" }}
          className="inline-flex mt-8 items-center gap-2 bg-brand text-brand-foreground text-sm font-semibold py-3 px-6 rounded-lg"
        >
          See a sample candidate →
        </Link>
      </section>
    </Shell>
  );
}
