// ============================================================
// Shared helpers used across pages
// ============================================================

import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ---------- Auth guard: redirect to login if not signed in ----------
export function requireAuth(onReady) {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "login.html";
    } else {
      onReady(user);
    }
  });
}

export function wireLogout(buttonEl) {
  if (!buttonEl) return;
  buttonEl.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
  });
}

// ---------- Toast ----------
export function toast(message) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 2600);
}

// ---------- Important-question extraction (keyword/pattern based, no AI) ----------
// Splits raw PDF text into sentences/lines and scores each one on how
// "question-like" or "exam-important" it looks, using common patterns
// seen in question banks, university papers, and textbook review sections.
const QUESTION_STARTERS = [
  "what", "why", "how", "when", "where", "which", "who", "whom",
  "define", "explain", "describe", "differentiate", "distinguish",
  "list", "state", "discuss", "illustrate", "summarize", "summarise",
  "compare", "contrast", "outline", "derive", "prove", "justify",
  "write a note", "write short note", "write short notes",
  "give reasons", "give an account", "mention", "enumerate",
  "elaborate", "analyse", "analyze", "evaluate", "classify"
];

const IMPORTANCE_HINTS = [
  "important", "note that", "remember", "key point", "must know",
  "exam", "marks", "frequently asked", "repeated question", "recall"
];

function splitIntoCandidateLines(text) {
  // Normalise whitespace, then split on newlines AND sentence boundaries
  // so both "numbered question list" PDFs and "paragraph" PDFs work.
  const normalised = text.replace(/\r/g, "\n").replace(/[ \t]+/g, " ");
  const byLine = normalised.split("\n").map((l) => l.trim()).filter(Boolean);

  const candidates = [];
  byLine.forEach((line) => {
    // A line might itself contain multiple sentences
    const sentences = line.split(/(?<=[.?!])\s+(?=[A-Z0-9(])/);
    sentences.forEach((s) => {
      const clean = s.trim();
      if (clean.length > 0) candidates.push(clean);
    });
  });
  return candidates;
}

function scoreLine(rawLine) {
  const line = rawLine.toLowerCase().replace(/^\s*\(?[a-z0-9]{1,3}[).]\s*/i, "");
  let score = 0;

  if (rawLine.trim().endsWith("?")) score += 3;

  // Starts with a numbered/lettered marker like "1.", "Q1.", "(a)"
  if (/^\s*(q\.?\s?\d+|[0-9]{1,2}[).]|\([a-z]\))/i.test(rawLine)) score += 2;

  for (const starter of QUESTION_STARTERS) {
    if (line.startsWith(starter + " ") || line.includes(" " + starter + " ")) {
      score += 2;
      break;
    }
  }

  for (const hint of IMPORTANCE_HINTS) {
    if (line.includes(hint)) score += 1;
  }

  // Reasonable question length — filter out stray headers/fragments
  const words = rawLine.split(/\s+/).length;
  if (words < 4 || words > 60) score -= 2;

  return score;
}

// Returns an array of { text, score } sorted by importance, deduplicated.
export function extractImportantQuestions(fullText, limit = 40) {
  const candidates = splitIntoCandidateLines(fullText);
  const seen = new Set();
  const scored = [];

  candidates.forEach((line) => {
    const key = line.toLowerCase().replace(/\s+/g, " ").trim();
    if (key.length < 8 || seen.has(key)) return;
    const score = scoreLine(line);
    if (score >= 3) {
      seen.add(key);
      scored.push({ text: line.replace(/\s+/g, " ").trim(), score });
    }
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

// Rough topic/keyword list from the text, used to populate the
// "pick a topic" dropdown on the Assignment page.
const STOPWORDS = new Set(("the a an of to in on for and or is are was were be been being this that "
  + "with as by from at it its into your you can will shall may not no such these those which who whom "
  + "chapter unit page section").split(" "));

export function extractTopics(fullText, limit = 12) {
  const words = fullText
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 4 && !STOPWORDS.has(w));

  const freq = {};
  words.forEach((w) => { freq[w] = (freq[w] || 0) + 1; });

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));
}

// Paragraphs/sentences from the source text that mention a given topic —
// used to assemble assignment content without calling any external AI.
export function extractContentForTopic(fullText, topic, maxSentences = 8) {
  const sentences = fullText
    .replace(/\s+/g, " ")
    .split(/(?<=[.?!])\s+(?=[A-Z0-9(])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);

  const needle = topic.toLowerCase();
  const matches = sentences.filter((s) => s.toLowerCase().includes(needle));
  return matches.slice(0, maxSentences);
}

export function formatDate(d) {
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
