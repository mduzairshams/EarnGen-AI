import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { DEFAULT_GROQ_MODEL, groqGenerateContent } from "@/lib/groq";
import type { AssessmentQuestion } from "@/lib/assessmentStore";

const InputSchema = z.object({
  skills: z.array(z.string().min(1).max(50)).min(1).max(10),
  difficulty: z.enum(["easy", "medium", "hard", "mixed"]).optional().default("mixed"),
});

/** Fallback questions used if Groq fails or returns malformed data. */
function fallbackQuestions(skills: string[]): AssessmentQuestion[] {
  const base: AssessmentQuestion[] = [];
  skills.forEach((skill, si) => {
    base.push(
      {
        id: `fb-${si}-0`,
        skill,
        type: "mcq",
        question: `Which best describes your experience level with ${skill}?`,
        options: ["I have never used it", "I have tried it a few times", "I use it regularly", "I have taught others"],
        correctIndex: 2,
        explanation: `Regular practice is the mark of a working ${skill} skill.`,
        difficulty: "easy",
        weight: 1,
      },
      {
        id: `fb-${si}-1`,
        skill,
        type: "scenario",
        question: `A client needs a ${skill} task done in 48 hours. Your first step is to:`,
        options: [
          "Agree immediately without clarifying",
          "Clarify requirements, check feasibility, then commit",
          "Decline if unsure",
          "Ask another freelancer to do it",
        ],
        correctIndex: 1,
        explanation: "Always clarify scope before committing to deadlines.",
        difficulty: "medium",
        weight: 2,
      },
      {
        id: `fb-${si}-2`,
        skill,
        type: "reasoning",
        question: `What is the best way to show proven ${skill} skills to a new client?`,
        options: [
          "Verbally claim expertise",
          "Share a portfolio or past work samples",
          "List it on your resume only",
          "Ask friends to vouch for you",
        ],
        correctIndex: 1,
        explanation: "Tangible proof of work is the most trusted signal for clients.",
        difficulty: "medium",
        weight: 2,
      },
      {
        id: `fb-${si}-3`,
        skill,
        type: "mcq",
        question: `What is the primary indicator of growth and proficiency in ${skill}?`,
        options: [
          "Familiarity with shortcuts and tools",
          "The speed of completing baseline tasks",
          "The ability to debug or troubleshoot complex issues independently",
          "Memorizing the standard documentation",
        ],
        correctIndex: 2,
        explanation: "Independent troubleshooting is the ultimate signal of deep understanding and proficiency.",
        difficulty: "medium",
        weight: 2,
      },
      {
        id: `fb-${si}-4`,
        skill,
        type: "scenario",
        question: `While working on a ${skill} deliverable, you realize you made a fundamental error that will push back delivery by 4 hours. You should:`,
        options: [
          "Deliver late and hope they do not notice",
          "Immediately contact the client, explain the issue, and provide a revised, guaranteed delivery time",
          "Submit the incorrect deliverable to meet the deadline",
          "Blame a technical glitch or power cut",
        ],
        correctIndex: 1,
        explanation: "Honesty and proactive communication are key to keeping trust high when issues arise.",
        difficulty: "medium",
        weight: 2,
      },
      {
        id: `fb-${si}-5`,
        skill,
        type: "reasoning",
        question: `Why is iterative feedback important when working on a high-stakes ${skill} project?`,
        options: [
          "It minimizes major revisions near the deadline by aligning expectations early",
          "It allows you to get paid earlier",
          "It shows the client you do not know how to do the job",
          "It reduces the total number of hours you need to work",
        ],
        correctIndex: 0,
        explanation: "Early alignments prevent costly rebuilds and maintain high satisfaction rates.",
        difficulty: "hard",
        weight: 3,
      },
      {
        id: `fb-${si}-6`,
        skill,
        type: "mcq",
        question: `When optimizing your workflow for ${skill}, what should be your main focus?`,
        options: [
          "Using only premium paid add-ons",
          "Automating repetitive tasks to save time for high-value creative work",
          "Working as slowly as possible to bill more hours",
          "Skipping quality assurance to ship faster",
        ],
        correctIndex: 1,
        explanation: "Workflow optimization focuses on freeing up mental space for highly technical, high-leverage challenges.",
        difficulty: "easy",
        weight: 1,
      },
      {
        id: `fb-${si}-7`,
        skill,
        type: "scenario",
        question: `A client asks you to implement a feature or style in ${skill} that violates established industry standards. How do you respond?`,
        options: [
          "Refuse to work with them",
          "Do exactly as they asked without saying anything",
          "Politely explain the trade-offs and standard practices, then let them make the informed decision",
          "Argue that your way is the only right way",
        ],
        correctIndex: 2,
        explanation: "Acting as an expert advisor build trust and helps clients avoid costly downstream mistakes.",
        difficulty: "hard",
        weight: 3,
      },
      {
        id: `fb-${si}-8`,
        skill,
        type: "reasoning",
        question: `Which of the following is most critical when collaborating on ${skill} with team members?`,
        options: [
          "Ensuring clear documentation, consistent conventions, and clean assets/code",
          "Restricting access to your files so others do not edit them",
          "Always working in isolation without communication",
          "Avoiding standard tools and using unique customized setups",
        ],
        correctIndex: 0,
        explanation: "Shared understanding through documentation and conventions is the foundation of high-velocity teamwork.",
        difficulty: "easy",
        weight: 1,
      },
      {
        id: `fb-${si}-9`,
        skill,
        type: "mcq",
        question: `What is the most effective strategy to stay current with the constant updates in the ${skill} ecosystem?`,
        options: [
          "Ignoring all updates until they are at least five years old",
          "Engaging with community discussions, official release logs, and building small test cases",
          "Reading general tech news articles occasionally",
          "Relying solely on outdated tutorials and textbooks",
        ],
        correctIndex: 1,
        explanation: "Hands-on testing combined with active community reading keeps your practical skill set cutting-edge.",
        difficulty: "hard",
        weight: 3,
      }
    );
  });
  return base;
}

function parseGroqQuestions(text: string, skills: string[]): AssessmentQuestion[] | null {
  try {
    // Groq json_object mode wraps the array in an object key — handle both cases
    const cleaned = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```\s*$/i, "").trim();
    let raw = JSON.parse(cleaned);

    // If Groq wraps the array in { questions: [...] } or { data: [...] }, unwrap it
    if (raw && !Array.isArray(raw)) {
      raw = raw.questions ?? raw.data ?? raw.items ?? Object.values(raw)[0];
    }

    if (!Array.isArray(raw) || raw.length === 0) return null;

    const valid: AssessmentQuestion[] = [];
    for (const q of raw) {
      if (
        typeof q.id === "string" &&
        typeof q.skill === "string" &&
        typeof q.question === "string" &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        typeof q.correctIndex === "number" &&
        q.correctIndex >= 0 &&
        q.correctIndex <= 3 &&
        typeof q.explanation === "string" &&
        ["easy", "medium", "hard"].includes(q.difficulty) &&
        typeof q.weight === "number" &&
        ["mcq", "scenario", "reasoning"].includes(q.type)
      ) {
        valid.push(q as AssessmentQuestion);
      }
    }
    if (valid.length < skills.length * 5) return null;
    return valid;
  } catch {
    return null;
  }
}

export const generateAssessment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<{ questions: AssessmentQuestion[]; error?: string }> => {
    const { skills, difficulty } = data;
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      // Graceful degradation — assessment still works without API key
      console.warn("[Assessment] No GROQ_API_KEY found. Using fallback questions.");
      return { questions: fallbackQuestions(skills) };
    }

    const model = process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL;

    const systemInstruction = `You are an expert skill assessor for a freelance income platform targeting students in India.
Your task is to generate skill assessment questions and return them as a JSON object with a "questions" key containing an array.
Each question must follow this exact structure:
{
  "id": "q-<skillSlug>-<index>",
  "skill": "<exact skill name from input>",
  "type": "mcq" | "scenario" | "reasoning",
  "question": "<question text>",
  "options": ["<A>", "<B>", "<C>", "<D>"],
  "correctIndex": <0-3>,
  "explanation": "<why the correct answer is right>",
  "difficulty": "easy" | "medium" | "hard",
  "weight": <1 | 2 | 3>
}
Rules:
- weight must be 1 for easy, 2 for medium, 3 for hard
- options array must have exactly 4 strings
- correctIndex must be 0, 1, 2, or 3
- Return ONLY the JSON object, no prose or markdown`;

    const userText = `Generate exactly 10 questions for EACH of these skills: ${skills.join(", ")}.
For each skill include: at least 4 MCQs (type: "mcq"), 3 scenario-based (type: "scenario"), 3 reasoning (type: "reasoning").
${difficulty === "mixed" ? "Mix difficulty levels (easy, medium, hard) across questions for each skill." : `All questions MUST be of "${difficulty}" difficulty.`}
Return JSON object with key "questions" containing the array of all questions.`;

    const { text, error } = await groqGenerateContent({
      apiKey,
      model,
      systemInstruction,
      userText,
      jsonMode: true,
    });

    if (error || !text) {
      console.warn("[Assessment] Groq error, using fallback:", error);
      return { questions: fallbackQuestions(skills) };
    }

    const questions = parseGroqQuestions(text, skills);
    if (!questions) {
      console.warn("[Assessment] Invalid Groq response shape, using fallback. Raw:", text.slice(0, 200));
      return { questions: fallbackQuestions(skills) };
    }

    return { questions };
  });
