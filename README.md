# Study Mate AI

A study companion web app: upload a PDF, auto-scan it for important
questions, turn any topic into an assignment, self-test with a quiz,
and manage a to-do list + weekly timetable.

**Stack:** plain HTML/CSS/JavaScript (no build step) + Firebase
(Authentication + Firestore) + [pdf.js](https://mozilla.github.io/pdf.js/) for
in-browser PDF text extraction. Question detection is rule-based
(keywords like "explain", "define", numbered questions, lines ending
in "?", etc.) — no external AI API or key is required.

## 1. Create a Firebase project

1. Go to <https://console.firebase.google.com> → **Add project**.
2. Once created, open **Build → Authentication → Get started** → enable
   the **Email/Password** sign-in method.
3. Open **Build → Firestore Database → Create database** → start in
   **production mode** (rules are provided below).
4. Go to **Project settings (gear icon) → General → Your apps** → click
   the **</>** (web) icon → register an app (no hosting needed) → copy
   the `firebaseConfig` object it gives you.

## 2. Add your config

Open `js/firebase-config.js` and replace the placeholder values with
the config you copied:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

## 3. Firestore security rules

In **Firestore → Rules**, replace the default rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /documents/{docId} {
      allow read, delete, update: if request.auth != null && resource.data.uid == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.uid == request.auth.uid;
    }

    match /assignments/{docId} {
      allow read, delete, update: if request.auth != null && resource.data.uid == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.uid == request.auth.uid;
    }

    match /quizResults/{docId} {
      allow read, delete: if request.auth != null && resource.data.uid == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.uid == request.auth.uid;
    }

    match /todos/{docId} {
      allow read, delete, update: if request.auth != null && resource.data.uid == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.uid == request.auth.uid;
    }

    match /timetables/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 4. Run it locally

This app has no build step — but browsers block ES module imports
(`type="module"`) over `file://`, so serve it with any static server:

```bash
cd studymate-ai
python3 -m http.server 8080
# then open http://localhost:8080/login.html
```

Or use the VS Code "Live Server" extension, or `npx serve`.

## 5. Deploy (optional)

Easiest option is **Firebase Hosting**, since you already have a
Firebase project:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting     # pick your project, public dir = this folder
firebase deploy
```

## File guide

| File | Purpose |
|---|---|
| `login.html` | Sign up / sign in (Firebase Auth) |
| `index.html` | Dashboard — stats, recent documents, upcoming to-dos |
| `upload.html` | Upload a PDF, extract text with pdf.js, scan for important questions, save to Firestore |
| `assignment.html` | Pick a saved document + topic → auto-builds assignment questions & reference content, downloadable as `.txt` |
| `quiz.html` | Self-check flashcard quiz generated from a document's important questions, with score history |
| `todo.html` | To-do list + editable weekly timetable grid |
| `js/utils.js` | Shared helpers: the question-extraction logic, auth guard, toasts |
| `js/firebase-config.js` | Your Firebase project config (edit this) |
| `css/style.css` | Shared design system |

## How "important question" scanning works

There's no LLM involved — `js/utils.js` → `extractImportantQuestions()`
splits the extracted PDF text into lines/sentences and scores each one:

- Ends with `?` → higher score
- Starts with a number/letter marker (`1.`, `Q2.`, `(a)`) → higher score
- Starts with or contains words like *define, explain, describe,
  differentiate, list, discuss, compare* → higher score
- Contains hint words like *important, exam, marks, frequently asked*
  → small bonus
- Too short or too long → penalized (filters out headers/junk)

Lines scoring 3+ are kept, deduplicated, and sorted by score. This
works best on PDFs that already contain numbered question lists,
review questions, or "important questions" sections — it's a pattern
matcher, not a language model, so results are only as good as the
source PDF's structure. If you later want smarter, topic-aware
question generation, you'd swap this for a call to an LLM API (Gemini/
OpenAI/Claude) inside `upload.html` — happy to help wire that up if
you want it later.
