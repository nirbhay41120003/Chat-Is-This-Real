# Chat Is This Real

Chat Is This Real turns notes into a small study set with flashcards, optional charts and checklists, and a multiple-choice quiz. It runs as a React app with an Express API that sends generation requests to Groq. The Groq key stays on the server.

## Run it locally


1. Install the root dependencies: `npm install`.
2. Install the API dependencies: `cd server && npm install && cd ..`.
3. Copy `.env.example` to `server/.env` and add your Groq key as `GROQ_API_KEY`. You can set `GROQ_MODEL` there too; the default is `openai/gpt-oss-20b`.
4. Start the app with `npm run dev`.

Vite runs at `http://localhost:5173` and the API at `http://localhost:3001`. To make a production client build locally, run `npm run build`.

## Use the app

Paste notes or import a text-based PDF, TXT, or Markdown file. Imports are limited to 8 MB and 12,000 characters. Create a set, flip through the cards, then take the quiz. Rate how well you remembered each card to schedule its next review.

Quiz scores, missed cards, review dates, saved sets, and the theme preference are stored in this browser. They are not synced to another device. **Export** downloads a JSON copy of a set. **Share** copies a read-only link containing the set; anyone with the link can view its contents. Scanned PDFs need OCR, which the importer does not provide.


## How generation works

`POST /api/generate` accepts `{ "input": string }`. It streams model output to the browser and sends a completed result with a `topic` and typed `blocks`: 5–10 flashcards, plus optional charts and checklists. The server and browser both validate the result. `POST /api/refine` takes an existing result and a follow-up instruction, then streams back its revision.

The quiz choices use answers from the same deck as distractors. Results, due dates, saved sets, and preferences use local storage, so clearing browser data removes them. Share links contain the deck in the URL fragment; the app does not host or revoke those links.

## Project files

- `src/` contains the React app, study views, validation, import, scheduling, and sharing helpers.
- `server/` contains the Express routes and Groq prompt.
- `index.js` is the Express entry point Vercel detects.
- `vercel.json` sets the Vercel build command.

I along with codex have contributed to this project :). The code and behavior have been reviewed.
