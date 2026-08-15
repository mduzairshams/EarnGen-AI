import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, useMemo } from "react";
import { Shell, Card } from "@/components/Layout";
import { RequireAuth } from "@/components/RequireAuth";
import { useAppState } from "@/lib/store";
import { generateAssessment } from "@/lib/assessment.functions";
import {
  saveAssessment,
  saveAnswer,
  computeAndSaveResult,
  clearAssessment,
  useAssessmentState,
  addToLeaderboard,
  type AssessmentQuestion,
  type AssessmentResult,
} from "@/lib/assessmentStore";
import { useDisplayUser } from "@/lib/useDisplayUser";
import {
  Brain,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Trophy,
  Zap,
  Sprout,
  ArrowRight,
  RotateCcw,
  Loader2,
} from "lucide-react";

type AssessmentSearchParams = {
  skill?: string;
  difficulty?: "easy" | "medium" | "hard" | "mixed";
  onboard?: boolean;
};

export const Route = createFileRoute("/assessment")({
  validateSearch: (search: Record<string, unknown>): AssessmentSearchParams => {
    return {
      skill: search.skill as string | undefined,
      difficulty: search.difficulty as "easy" | "medium" | "hard" | "mixed" | undefined,
      onboard: search.onboard === true || search.onboard === "true",
    };
  },
  head: () => ({
    meta: [
      { title: "Skill Assessment — EARNGEN-AI" },
      { name: "description", content: "Take your AI-powered skill assessment and discover your level." },
    ],
  }),
  component: AssessmentPage,
});

/* ─── Phase management ──────────────────────────────────────────── */
type Phase = "select" | "loading" | "quiz" | "results";

/* ─── Rank config ─────────────────────────────────────────────────*/
const RANK_CONFIG = {
  Beginner: { icon: Sprout, color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20", label: "🌱 Beginner", description: "Great start! Practice daily to level up." },
  Intermediate: { icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20", label: "⚡ Intermediate", description: "Solid foundation! You're ready for real gigs." },
  Advanced: { icon: Trophy, color: "text-brand", bg: "bg-brand/10 border-brand/20", label: "🚀 Advanced", description: "Impressive! You can command premium rates." },
} as const;

/* ─── Sub-components ──────────────────────────────────────────────*/
function LoadingScreen() {
  const [step, setStep] = useState(0);
  const steps = [
    "Analysing your skill stack…",
    "Generating MCQs…",
    "Crafting scenario questions…",
    "Building reasoning challenges…",
    "Almost ready…",
  ];

  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % steps.length), 1200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 fade-up">
      <div className="relative">
        <div className="size-20 rounded-full bg-brand/10 flex items-center justify-center">
          <Brain className="size-10 text-brand" />
        </div>
        <div className="absolute inset-0 rounded-full border-2 border-brand/30 border-t-brand animate-spin" />
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Generating your assessment</h2>
        <p className="text-muted-foreground text-sm animate-pulse">{steps[step]}</p>
      </div>
      <div className="flex gap-1.5 mt-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={"size-1.5 rounded-full transition-all duration-500 " + (i === step ? "bg-brand w-4" : "bg-muted")}
          />
        ))}
      </div>
    </div>
  );
}

function QuizScreen({
  questions,
  onComplete,
}: {
  questions: AssessmentQuestion[];
  onComplete: () => void;
}) {
  const asmState = useAssessmentState();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const current = questions[currentIdx];
  const totalAnswered = Object.keys(asmState.answers).length;
  const progress = Math.round((totalAnswered / questions.length) * 100);

  // Group questions by skill for section headers
  const skills = useMemo(() => [...new Set(questions.map((q) => q.skill))], [questions]);
  const currentSkillIdx = skills.indexOf(current.skill);

  function handleSelect(optionIdx: number) {
    if (selectedOption !== null) return; // already answered
    setSelectedOption(optionIdx);
    saveAnswer(current.id, optionIdx);
    setShowExplanation(true);
  }

  function handleNext() {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      onComplete();
    }
  }

  const isLast = currentIdx === questions.length - 1;
  const isCorrect = selectedOption === current.correctIndex;

  const diffColors = {
    easy: "bg-emerald-500/10 text-emerald-600",
    medium: "bg-amber-500/10 text-amber-600",
    hard: "bg-red-500/10 text-red-500",
  };
  const typeLabels = {
    mcq: "Multiple Choice",
    scenario: "Scenario",
    reasoning: "Reasoning",
  };

  return (
    <div className="max-w-2xl mx-auto fade-up">
      {/* Progress header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="font-medium text-brand">
            Skill {currentSkillIdx + 1}/{skills.length}: {current.skill}
          </span>
          <span className="text-muted-foreground">
            {currentIdx + 1} / {questions.length}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-brand rounded-full transition-all duration-500"
            style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <Card className="p-6 md:p-8">
        {/* Question meta */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <span className={"text-[10px] font-semibold uppercase px-2 py-1 rounded " + diffColors[current.difficulty]}>
            {current.difficulty}
          </span>
          <span className="text-[10px] font-semibold uppercase px-2 py-1 rounded bg-muted text-muted-foreground">
            {typeLabels[current.type]}
          </span>
          <span className="text-[10px] font-semibold uppercase px-2 py-1 rounded bg-brand/10 text-brand">
            {current.weight}× weight
          </span>
        </div>

        {/* Question */}
        <p className="text-lg font-semibold mb-6 leading-snug">{current.question}</p>

        {/* Options */}
        <div className="space-y-3">
          {current.options.map((option, idx) => {
            let optionClass =
              "w-full text-left px-4 py-3 rounded-xl ring-1 text-sm font-medium transition-all ";

            if (selectedOption === null) {
              optionClass += "ring-border hover:ring-brand/50 hover:bg-brand/5 bg-background";
            } else if (idx === current.correctIndex) {
              optionClass += "ring-emerald-500 bg-emerald-500/10 text-emerald-700";
            } else if (idx === selectedOption && selectedOption !== current.correctIndex) {
              optionClass += "ring-red-500 bg-red-500/10 text-red-600";
            } else {
              optionClass += "ring-border bg-muted/40 text-muted-foreground";
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={selectedOption !== null}
                className={optionClass}
              >
                <div className="flex items-center gap-3">
                  <span className="size-6 rounded-full bg-muted/80 flex items-center justify-center text-xs font-bold shrink-0">
                    {["A", "B", "C", "D"][idx]}
                  </span>
                  <span>{option}</span>
                  {selectedOption !== null && idx === current.correctIndex && (
                    <CheckCircle2 className="size-4 text-emerald-500 ml-auto shrink-0" />
                  )}
                  {selectedOption !== null && idx === selectedOption && idx !== current.correctIndex && (
                    <XCircle className="size-4 text-red-500 ml-auto shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div
            className={
              "mt-5 p-4 rounded-xl text-sm leading-relaxed border " +
              (isCorrect
                ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                : "bg-amber-500/5 border-amber-500/20 text-amber-800 dark:text-amber-300")
            }
          >
            <p className="font-semibold mb-1">{isCorrect ? "✓ Correct!" : "✗ Not quite."}</p>
            <p>{current.explanation}</p>
          </div>
        )}

        {/* Next button */}
        {selectedOption !== null && (
          <button
            onClick={handleNext}
            className="mt-6 w-full bg-brand text-brand-foreground py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:brightness-105 transition fade-up"
          >
            {isLast ? "Submit Assessment →" : "Next Question"}
            <ChevronRight className="size-4" />
          </button>
        )}
      </Card>
    </div>
  );
}

function ResultsScreen({
  result,
  onContinue,
  onRetake,
}: {
  result: AssessmentResult;
  onContinue: () => void;
  onRetake: () => void;
}) {
  const rankCfg = RANK_CONFIG[result.overallRank];
  const RankIcon = rankCfg.icon;

  return (
    <div className="max-w-2xl mx-auto fade-up space-y-6">
      {/* Overall result */}
      <Card className={`p-8 text-center border ${rankCfg.bg}`}>
        <div className={`inline-flex size-16 rounded-full items-center justify-center mb-4 ${rankCfg.bg}`}>
          <RankIcon className={`size-8 ${rankCfg.color}`} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
          Assessment Complete
        </p>
        <h1 className={`text-4xl font-bold mb-2 ${rankCfg.color}`}>{rankCfg.label}</h1>
        <p className="text-muted-foreground text-sm mb-4">{rankCfg.description}</p>
        <div className="inline-flex items-center gap-2 bg-background/60 rounded-full px-4 py-1.5">
          <span className="text-2xl font-bold">{result.overallPct}%</span>
          <span className="text-sm text-muted-foreground">overall score</span>
        </div>
      </Card>

      {/* Per-skill breakdown */}
      <div className="space-y-3">
        <h2 className="font-semibold text-lg px-1">Skill Breakdown</h2>
        {result.skillResults.map((sr) => {
          const cfg = RANK_CONFIG[sr.rank];
          const Ic = cfg.icon;
          return (
            <Card key={sr.skill} className="p-4 flex items-center gap-4">
              <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                <Ic className={`size-5 ${cfg.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-sm truncate">{sr.skill}</span>
                  <span className={`text-xs font-bold ${cfg.color}`}>{sr.pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${sr.rank === "Advanced" ? "bg-brand" : sr.rank === "Intermediate" ? "bg-amber-500" : "bg-emerald-500"}`}
                    style={{ width: `${sr.pct}%` }}
                  />
                </div>
              </div>
              <span className={`text-[10px] font-semibold uppercase px-2 py-1 rounded shrink-0 ${cfg.bg} ${cfg.color}`}>
                {sr.rank}
              </span>
            </Card>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          onClick={onContinue}
          className="flex-1 bg-brand text-brand-foreground py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:brightness-105 transition"
        >
          Continue to Opportunities <ArrowRight className="size-4" />
        </button>
        <button
          onClick={onRetake}
          className="flex items-center justify-center gap-2 ring-1 ring-border py-3 px-5 rounded-xl font-semibold text-sm hover:bg-muted transition"
        >
          <RotateCcw className="size-4" /> Retake
        </button>
      </div>
    </div>
  );
}

function SelectSkillScreen({
  userSkills,
  onStart,
}: {
  userSkills: string[];
  onStart: (skill: string, difficulty: "easy" | "medium" | "hard" | "mixed") => void;
}) {
  const [selectedSkill, setSelectedSkill] = useState("");
  const [customSkill, setCustomSkill] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [selectedDiff, setSelectedDiff] = useState<"easy" | "medium" | "hard" | "mixed">("medium");

  const popularSkills = ["Python", "Canva", "Content Writing", "Video Editing", "Figma", "Excel", "Photography", "React", "Copywriting"];
  const allSkills = Array.from(new Set([...userSkills, ...popularSkills]));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const skill = isCustom ? customSkill.trim() : selectedSkill;
    if (!skill) return;
    onStart(skill, selectedDiff);
  };

  return (
    <div className="max-w-xl mx-auto fade-up mt-4">
      <Card className="p-6 md:p-8">
        <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
          <Brain className="size-5 text-brand" />
          Choose a Skill to Assess
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Select one of your skills or enter a custom one. We will generate a dedicated, interactive assessment with moderate-level MCQs and scenario challenges.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Skill Name
            </label>
            {isCustom ? (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Enter custom skill (e.g. React, UI Design)..."
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  className="w-full bg-muted/50 ring-1 ring-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand"
                  required
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsCustom(false);
                    setCustomSkill("");
                  }}
                  className="text-xs text-brand font-semibold hover:underline"
                >
                  ← Select from list instead
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {allSkills.slice(0, 8).map((s) => {
                    const active = selectedSkill === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSelectedSkill(s)}
                        className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                          active
                            ? "border-brand bg-brand/5 text-brand"
                            : "border-border hover:border-brand/40 bg-card"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustom(true);
                    setSelectedSkill("");
                  }}
                  className="text-xs text-brand font-semibold hover:underline block"
                >
                  + Or type a custom skill...
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Assessment Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "easy", label: "🌱 Easy" },
                { id: "medium", label: "⚡ Moderate" },
                { id: "hard", label: "🚀 Hard" },
              ].map((d) => {
                const active = selectedDiff === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelectedDiff(d.id as any)}
                    className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      active
                        ? "border-brand bg-brand/5 text-brand"
                        : "border-border hover:border-brand/40 bg-card"
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              * Moderate level features intermediate reasoning and scenario-based MCQs.
            </p>
          </div>

          <button
            type="submit"
            disabled={!(isCustom ? customSkill.trim() : selectedSkill)}
            className="w-full bg-brand text-brand-foreground py-3.5 rounded-xl font-semibold hover:brightness-105 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Take Assessment <ArrowRight className="size-4" />
          </button>
        </form>
      </Card>
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────────────────*/
function AssessmentPage() {
  const runGenerate = useServerFn(generateAssessment);
  const { state } = useAppState();
  const asmState = useAssessmentState();
  const navigate = useNavigate();
  const me = useDisplayUser();
  const { skill, difficulty, onboard } = Route.useSearch();
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);

  const targetSkills = useMemo(() => {
    if (skill) return [skill];
    if (onboard && state.skills.length > 0) return state.skills;
    return [];
  }, [skill, onboard, state.skills]);

  const targetDiff = difficulty || (onboard ? "mixed" : "medium");

  // Kick off generation on mount or search parameter change
  useEffect(() => {
    // If no explicit skill or onboard request, show the skill selector screen
    if (!skill && !onboard) {
      setPhase("select");
      return;
    }

    if (targetSkills.length === 0) {
      setPhase("select");
      return;
    }

    // If we already have questions for the same skill set, go straight to quiz/results
    if (
      asmState.questions.length > 0 &&
      JSON.stringify([...asmState.skills].sort()) === JSON.stringify([...targetSkills].sort())
    ) {
      if (asmState.result) {
        setPhase("results");
      } else {
        setPhase("quiz");
      }
      return;
    }

    // Fresh generation
    setPhase("loading");
    clearAssessment();
    runGenerate({ data: { skills: targetSkills, difficulty: targetDiff } })
      .then(({ questions, error: genError }) => {
        if (genError) {
          // Still show fallback questions — never block the user
          console.warn("[Assessment]", genError);
        }
        saveAssessment(targetSkills, questions);
        setPhase("quiz");
      })
      .catch((ex) => {
        setError(ex instanceof Error ? ex.message : "Generation failed");
        setPhase("quiz"); // will show empty quiz; shouldn't happen
      });
  }, [targetSkills, targetDiff, skill, onboard]);

  function handleStartCustom(selectedSkill: string, selectedDiff: "easy" | "medium" | "hard" | "mixed") {
    navigate({
      to: "/assessment",
      search: { skill: selectedSkill, difficulty: selectedDiff },
    });
  }

  function handleQuizComplete() {
    const result = computeAndSaveResult();
    addToLeaderboard(me.name, result);
    setPhase("results");
  }

  function handleContinue() {
    navigate({ to: "/opportunities" });
  }

  function handleRetake() {
    clearAssessment();
    setPhase("loading");
    runGenerate({ data: { skills: targetSkills, difficulty: targetDiff } })
      .then(({ questions }) => {
        saveAssessment(targetSkills, questions);
        setPhase("quiz");
      })
      .catch(() => setPhase("quiz"));
  }

  return (
    <Shell>
      <RequireAuth>
        <header className="mb-8 fade-up flex items-center gap-3">
          <div className="size-10 rounded-xl bg-brand/10 flex items-center justify-center">
            <Brain className="size-5 text-brand" />
          </div>
          <div>
            <p className="text-xs font-semibold text-brand uppercase tracking-widest">AI Assessment</p>
            <h1 className="text-2xl font-semibold tracking-tight">Skill Assessment</h1>
          </div>
          {phase === "quiz" && targetSkills.length > 0 && (
            <div className="ml-auto flex flex-wrap gap-1.5">
              {targetSkills.map((s) => (
                <span key={s} className="text-xs font-medium bg-brand/10 text-brand px-2 py-1 rounded-md">
                  {s}
                </span>
              ))}
            </div>
          )}
        </header>

        {error && (
          <Card className="p-4 mb-6 bg-destructive/5 border-destructive/20">
            <p className="text-sm text-destructive">{error}</p>
          </Card>
        )}

        {phase === "select" && (
          <SelectSkillScreen userSkills={state.skills} onStart={handleStartCustom} />
        )}

        {phase === "loading" && <LoadingScreen />}

        {phase === "quiz" && asmState.questions.length > 0 && (
          <QuizScreen questions={asmState.questions} onComplete={handleQuizComplete} />
        )}

        {phase === "results" && asmState.result && (
          <ResultsScreen
            result={asmState.result}
            onContinue={handleContinue}
            onRetake={handleRetake}
          />
        )}
      </RequireAuth>
    </Shell>
  );
}
