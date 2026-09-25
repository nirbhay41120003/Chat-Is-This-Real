<div align="center">
  <img src="docs/chat-is-this-real-mark.svg" alt="Chat Is This Real logo" width="88" height="88">
  <h1>Chat Is This Real</h1>
  <p><strong>Turn your notes into a study set you can actually quiz yourself on.</strong></p>
  <p>
    <a href="https://chat-is-this-real.vercel.app/">Website</a> ·
    <a href="#run-it-locally">Run it locally</a> ·
    <a href="#how-it-works">How it works</a> ·
    <a href="#model-and-ai-generation">Model and AI generation</a> ·
    <a href="#project-layout">Project layout</a>
  </p>
  <p>
    <img src="https://img.shields.io/github/last-commit/nirbhay41120003/chat-is-this-real" alt="Last commit">
    <img src="https://img.shields.io/badge/stack-React%20%2B%20Express-blue" alt="React + Express">
    <img src="https://img.shields.io/badge/model-Groq-success" alt="Groq">
  </p>
</div>

Chat Is This Real is a focused study workspace. Give it class notes or a topic and it builds flashcards, and when useful, a chart or checklist. You can study the cards, check your recall with a multiple-choice quiz, and come back to cards when their review date is due.

The frontend is a React single-page app built with Vite. An Express API sends generation requests to Groq. The Groq API key stays on the server and is never included in the browser bundle.


Website: https://chat-is-this-real.vercel.app/

video explanation: https://youtu.be/8jnL8kygeyI
## Features

- Paste notes or import selectable text from PDF, TXT, and Markdown files.
- Generate 5–10 question-and-answer cards with easy, medium, and hard difficulty labels.
- Add an optional chart or checklist when that format suits the source material.
- Stream generation progress while the model is responding.
- Flip through flashcards, rate recall, and schedule a next review.
- Take a multiple-choice quiz, review the score, and retry missed cards.
- Refine a generated set with a short follow-up instruction.
- Save recent sets in this browser, export a set as JSON, or copy a read-only share link.
- Switch between light and dark themes.

## How it works

1. **Provide source material.** Paste notes into the input or import a file. PDF import extracts selectable text in the browser; scanned pages are not OCR processed. Files must be smaller than 8 MB, and the text passed to the model is capped at 12,000 characters.
2. **Request a study set.** The browser sends the input to `POST /api/generate`. When you refine an existing set, it sends the current set and your instruction to `POST /api/refine`.
3. **Generate structured content.** The API builds a system and user prompt, requests JSON output from Groq, and streams text events back to the browser. The browser can show complete blocks as they arrive.
4. **Validate the result.** The server checks that the response has a topic, 5–10 valid cards, unique block IDs, and correctly shaped optional charts or checklists. The frontend validates it again before displaying it.
5. **Study and track recall.** Flashcard ratings set review intervals. Quiz choices are drawn from other answers in the deck, and scores and missed-card history are saved locally.

The server times out a generation request after 15 seconds. A rate limit or malformed model response is surfaced as an error so you can retry.

## Model and AI generation

Requests go through Groq's OpenAI-compatible chat completions endpoint. The default model is **`openai/gpt-oss-20b`**, selected in `server/index.js`. Set `GROQ_MODEL` on the server to choose another model available to your Groq account. The request uses JSON-object response mode, a temperature of `0.4`, and streaming.

The prompt in `server/prompt.js` asks for JSON with a `topic` and typed `blocks`: cards with a question, answer, and difficulty; optional charts with matching labels and numeric values; and optional checklists. A refinement request includes the existing result and the follow-up instruction so the model can update the study material.

Model output can still contain mistakes. Review generated material against your source notes before relying on it.

## Run it locally

### Requirements

- Node.js with npm
- A Groq API key for generating or refining study sets

### Setup

```sh
git clone https://github.com/nirbhay41120003/chat-is-this-real.git
cd chat-is-this-real
npm install
npm --prefix server install
```

Create `server/.env` with your server-side credentials and (optionally) a model override:

```dotenv
GROQ_API_KEY=your_groq_api_key
# Optional; defaults to openai/gpt-oss-20b
GROQ_MODEL=openai/gpt-oss-20b
```

Start both the Express API and Vite development server:

```sh
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` requests to the Express server at `http://localhost:3001`. Build the frontend with `npm run build`; the output is written to `dist/`.

## Data and privacy

- Notes are sent to the configured Groq model endpoint when you generate or refine a set.
- Generated sets, theme preference, review schedules, and quiz history are stored in this browser's local storage. They do not sync between browsers or devices, and clearing browser data removes them.
- The app keeps up to 12 saved sets in the browser.
- Export creates a JSON file on your device.
- Share creates a read-only URL with the study set encoded in its URL fragment. Anyone with that link can view the set. The app does not host, protect, or revoke shared links.
- Imported files are read in the browser; extracted text is then sent with a generation request.

## Deployment

The repository is configured for Vercel with a Vite build and an Express API function at `api/[...path].js`. Set `GROQ_API_KEY` in the deployment environment. `GROQ_MODEL` is optional and defaults to `openai/gpt-oss-20b`. The Vite development proxy is only for local development.

## Project layout

| Path | Purpose |
| --- | --- |
| `src/App.jsx` | Main app state, saved sets, progress, sharing, and study modes |
| `src/components/` | Input, flashcards, quiz, loading, result, and study block views |
| `src/lib/api.js` | Browser API requests and streamed event parsing |
| `src/lib/importNotes.js` | PDF, TXT, and Markdown text extraction |
| `src/lib/reviewSchedule.js` | Recall rating and next-review interval calculation |
| `src/lib/share.js` | Encode and decode read-only share links |
| `src/lib/validateResult.js` | Client-side study result validation |
| `server/index.js` | Express API, Groq request, streaming, and server validation |
| `server/prompt.js` | Structured generation and refinement prompt |
| `api/[...path].js` | Vercel serverless API entry point |
| `docs/chat-is-this-real-mark.svg` | Logo shown in this README |
| `public/favicon.svg` | Browser favicon, using the same mark |

---

Built by me and Codex.
