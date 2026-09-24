import { useEffect, useRef, useState } from 'react';
import PromptInput from './components/PromptInput.jsx';
import LoadingState from './components/LoadingState.jsx';
import ErrorState from './components/ErrorState.jsx';
import FlashcardDeck from './components/FlashcardDeck.jsx';
import QuizMode from './components/QuizMode.jsx';
import EchoMesh from './components/EchoMesh.jsx';
import StudyBlocks from './components/StudyBlocks.jsx';
import { generateStudySet } from './lib/api.js';
import { scheduleNextReview } from './lib/reviewSchedule.js';
import { decodeSharedSet, encodeSharedSet } from './lib/share.js';
import './styles.css';

const STORAGE_PREFIX = 'chat-is-this-real-';
const LEGACY_STORAGE_PREFIX = 'studyloop-';

function readStoredValue(name, fallback, parseJson = false) {
  try {
    const key = `${STORAGE_PREFIX}${name}`;
    let value = localStorage.getItem(key);
    if (value === null) {
      value = localStorage.getItem(`${LEGACY_STORAGE_PREFIX}${name}`);
      if (value !== null) {
        localStorage.setItem(key, value);
        localStorage.removeItem(`${LEGACY_STORAGE_PREFIX}${name}`);
      }
    }
    return value === null ? fallback : (parseJson ? JSON.parse(value) : value);
  } catch { return fallback; }
}

function readSharedSet() {
  try {
    const encoded = new URLSearchParams(window.location.hash.slice(1)).get('share');
    if (!encoded) return null;
    return decodeSharedSet(encoded);
  } catch { return null; }
}
function deckKey(set) {
  const source = `${set.topic}:${set.cards.map((card) => `${card.id}:${card.question}`).join('|')}`;
  const hash = [...source].reduce((value, char) => Math.imul(value ^ char.charCodeAt(0), 16777619), 2166136261) >>> 0;
  return `${set.topic}:${hash.toString(36)}`;
}

export default function App() {
  const [result, setResult] = useState(() => readSharedSet());
  const [readOnly, setReadOnly] = useState(() => Boolean(readSharedSet()));
  const [phase, setPhase] = useState(() => readSharedSet() ? 'ready' : 'idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [errorKind, setErrorKind] = useState('http');
  const [mode, setMode] = useState('cards');
  const [inputVersion, setInputVersion] = useState(0);
  const [streamLength, setStreamLength] = useState(0);
  const [streamedBlocks, setStreamedBlocks] = useState([]);
  const [refinement, setRefinement] = useState('');
  const [theme, setTheme] = useState(() => readStoredValue('theme', 'light'));
  const [savedSets, setSavedSets] = useState(() => readStoredValue('sessions', [], true));
  const [progress, setProgress] = useState(() => readStoredValue('progress', {}, true));
  const [shareMessage, setShareMessage] = useState('');
  const requestId = useRef(0);
  const lastInput = useRef('');

  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem(`${STORAGE_PREFIX}theme`, theme); }, [theme]);
  useEffect(() => {
    if (!result || readOnly) return;
    const entry = { id: `${result.topic}-${Date.now()}`, topic: result.topic, blocks: result.blocks, cards: result.cards, savedAt: Date.now() };
    setSavedSets((previous) => {
      const next = [entry, ...previous.filter((set) => set.topic !== result.topic)].slice(0, 12);
      localStorage.setItem(`${STORAGE_PREFIX}sessions`, JSON.stringify(next)); return next;
    });
  }, [result, readOnly]);

  useEffect(() => { localStorage.setItem(`${STORAGE_PREFIX}progress`, JSON.stringify(progress)); }, [progress]);

  async function generate(value = lastInput.current) {
    const input = value.trim();
    if (!input) return;
    lastInput.current = input;
    const currentId = ++requestId.current;
    setPhase('loading'); setErrorMessage(''); setErrorKind('http');
    try {
      setStreamLength(0);
      setStreamedBlocks([]);
      const data = await generateStudySet(input, (text, blocks) => { if (currentId === requestId.current) { setStreamLength((length) => length + text.length); setStreamedBlocks(blocks); } });
      if (currentId !== requestId.current) return;
      setResult(data); setMode('cards'); setPhase('ready');
    } catch (error) {
      if (currentId !== requestId.current) return;
      setErrorMessage(error.message || 'request_failed'); setErrorKind(error.kind || 'http'); setPhase('error');
    }
  }

  async function refineResult(event) {
    event.preventDefault();
    if (!refinement.trim() || !result) return;
    const currentId = ++requestId.current;
    setPhase('loading'); setStreamLength(0); setStreamedBlocks([]);
    try {
      const data = await generateStudySet('', (text, blocks) => { if (currentId === requestId.current) { setStreamLength((length) => length + text.length); setStreamedBlocks(blocks); } }, result, refinement.trim());
      if (currentId !== requestId.current) return;
      setResult(data); setRefinement(''); setPhase('ready'); setMode('cards');
    } catch (error) {
      if (currentId !== requestId.current) return;
      setErrorKind(error.kind || 'http'); setErrorMessage(error.message || 'request_failed'); setPhase('error');
    }
  }

  function retry() { generate(lastInput.current); }
  function newSet() {
    ++requestId.current; setResult(null); setReadOnly(false); setPhase('idle'); setMode('cards');
    setInputVersion((version) => version + 1);
  }

  function recordReview(cardId, rating) {
    if (!result || readOnly) return;
    const key = deckKey(result); const now = Date.now();
    setProgress((current) => {
      const deck = current[key] || { schedules: {}, history: [], quizCount: 0, bestScore: null };
      const schedule = scheduleNextReview(deck.schedules[cardId], rating, now);
      return { ...current, [key]: { ...deck, schedules: { ...deck.schedules, [cardId]: schedule } } };
    });
  }

  function recordQuiz({ score, total, missedIds }) {
    if (!result || readOnly) return;
    const key = deckKey(result); const completedAt = Date.now();
    setProgress((current) => {
      const deck = current[key] || { schedules: {}, history: [], quizCount: 0, bestScore: null };
      return { ...current, [key]: { ...deck, quizCount: deck.quizCount + 1, bestScore: Math.max(deck.bestScore ?? 0, score), history: [{ completedAt, score, total, missedIds }, ...deck.history].slice(0, 30) } };
    });
  }

  function exportSet() {
    if (!result) return;
    const blob = new Blob([JSON.stringify({ topic: result.topic, blocks: result.blocks }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = `${result.topic.replace(/[^a-z0-9-_]+/gi, '-').toLowerCase() || 'study-set'}.json`;
    link.click(); URL.revokeObjectURL(url);
  }

  async function shareSet() {
    if (!result) return;
    const shareCode = encodeSharedSet(result);
    const url = `${window.location.origin}${window.location.pathname}${window.location.search}#share=${shareCode}`;
    try { await navigator.clipboard.writeText(url); setShareMessage('Read-only link copied. Anyone with it can view this deck.'); }
    catch { setShareMessage(url); }
  }

  const status = phase === 'loading' ? 'Building your study set'
    : phase === 'error' ? 'Needs another try'
      : phase === 'ready' ? 'Study set ready' : 'Ready when you are';
  const overallQuizCount = Object.values(progress).reduce((sum, deck) => sum + (deck.quizCount || 0), 0);
  const overallMissCount = Object.values(progress).reduce((sum, deck) => sum + (deck.history || []).reduce((misses, session) => misses + session.missedIds.length, 0), 0);

  return <main className="app-screen" id="study-space">
    <EchoMesh />
    <div className="app-shell">
      <header className="app-header">
        <a className="app-brand" href="#study-space" aria-label="Chat Is This Real home">
          <span className="brand-symbol" aria-hidden="true">◌</span>
          <span><strong>Chat Is This Real</strong><small>your quiet study space</small></span>
        </a>
        <div className="app-header-actions">
          {readOnly && <span className="readonly-badge">READ ONLY</span>}
          <label className="session-picker">Saved sets <select aria-label="Load saved study set" value="" onChange={(event) => { const saved = savedSets.find((set) => set.id === event.target.value); if (saved) { setResult(saved); setReadOnly(false); setPhase('ready'); setMode('cards'); } }}><option value="">Open…</option>{savedSets.map((set) => <option value={set.id} key={set.id}>{set.topic}</option>)}</select></label>
          <button className="theme-toggle" type="button" onClick={() => setTheme((value) => value === 'light' ? 'dark' : 'light')} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>{theme === 'light' ? '☾' : '☀'}</button>
          <div className={`status ${phase === 'error' ? 'warn' : phase === 'ready' ? 'ready' : ''}`} role="status"><i /><span>{status}</span></div>
        </div>
      </header>

      <section className="app-intro" aria-labelledby="page-title">
        <p className="eyebrow">STUDY SPACE</p>
        <h2 id="page-title">What would you like<br /><em>to remember?</em></h2>
        <p>Bring your notes. Leave with a clear next step.</p>
      </section>

      <section className="study-workspace" aria-label="Study workspace">
        <div className="workspace-main">
          {phase !== 'ready' && <article className="card prompt-card">
            <div className="card-head"><div><p className="eyebrow">YOUR SOURCE NOTES</p><h2>Start with what you know</h2></div><span className="card-spark" aria-hidden="true">✦</span></div>
            <PromptInput key={inputVersion} onGenerate={generate} loading={phase === 'loading'} initialValue={lastInput.current} />
          </article>}
          {phase === 'loading' && <LoadingState streamLength={streamLength} blocks={streamedBlocks} />}
          {phase === 'error' && <ErrorState kind={errorKind} onRetry={retry} retrying={false} />}

          {phase === 'ready' && result && <section className="ready-area" aria-label="Generated study set">
              <div className="ready-heading"><div><p className="eyebrow">STUDY SET READY</p><h2>{result.topic}</h2><p>{result.cards.length} cards · Take a moment to learn, then test your recall.</p></div>
              {!readOnly && <div className="set-actions"><button className="text-button" type="button" onClick={exportSet}>↓ Export</button><button className="text-button" type="button" onClick={shareSet}>↗ Share</button><button className="text-button" type="button" onClick={newSet}>＋ New set</button></div>}</div>
            {shareMessage && <p className="share-message" role="status">{shareMessage}</p>}
            {!readOnly && <div className="study-tabs" role="tablist" aria-label="Study mode">
              <button role="tab" aria-selected={mode === 'cards'} className={mode === 'cards' ? 'active' : ''} onClick={() => setMode('cards')}><span>▤</span> Flashcards</button>
              <button role="tab" aria-selected={mode === 'quiz'} className={mode === 'quiz' ? 'active' : ''} onClick={() => setMode('quiz')}><span>◉</span> Quick quiz</button>
            </div>}
            {(readOnly || mode === 'cards') ? <><FlashcardDeck key={result.topic} cards={result.cards} reviewDue={progress[deckKey(result)]?.schedules || {}} onReview={recordReview} readOnly={readOnly} /><StudyBlocks blocks={result.blocks} /></> : <QuizMode key={result.topic} cards={result.cards} onComplete={recordQuiz} />}
            {!readOnly && <><div className="progress-card"><b>Study progress</b><span>{progress[deckKey(result)]?.quizCount || 0} quizzes for this deck</span><span>{progress[deckKey(result)]?.bestScore ?? '—'} best correct</span><span>{Object.values(progress[deckKey(result)]?.schedules || {}).filter((item) => item.dueAt <= Date.now()).length} cards due</span><small>Across saved sets: {overallQuizCount} completed sessions · {overallMissCount} missed responses tracked.</small><small>{progress[deckKey(result)]?.history?.[0] ? `Last quiz ${new Date(progress[deckKey(result)].history[0].completedAt).toLocaleDateString()} · missed: ${result.cards.filter((card) => progress[deckKey(result)].history[0].missedIds.includes(card.id)).map((card) => card.question).join('; ') || 'none'}` : 'Quiz scores and missed cards will appear here.'}</small></div>
              <form className="refine-form" onSubmit={refineResult}><label htmlFor="refinement">Refine this set</label><div><input id="refinement" value={refinement} onChange={(event) => setRefinement(event.target.value)} placeholder="Add a checklist, simplify answers…" maxLength={500} /><button className="button button-dark" disabled={!refinement.trim()}>Apply</button></div></form></>}
          </section>}
        </div>

        <aside className="workspace-side" aria-label="Study guidance">
          {phase === 'ready' && result ? <article className="card side-card">
            <p className="eyebrow">IN THIS SET</p><h2>A little practice goes a long way</h2>
            <div className="set-stats"><div><span>{result.cards.length}</span><small>flashcards</small></div><div><span>{new Set(result.cards.map((card) => card.difficulty)).size}</span><small>difficulty levels</small></div></div>
            <div className="difficulty-list">{['easy', 'medium', 'hard'].map((difficulty) => {
              const count = result.cards.filter((card) => card.difficulty === difficulty).length;
              return <div key={difficulty}><span className={`difficulty-dot dot-${difficulty}`} />{difficulty}<b>{count}</b></div>;
            })}</div>
            <div className="side-note"><span aria-hidden="true">✦</span><p>Try a card first. When you’re ready, switch to the quiz and see what stayed with you.</p></div>
          </article> : <article className="card side-card guide-card">
            <p className="eyebrow">A SIMPLE STUDY FLOW</p><h2>Make space for it to stick</h2>
            <div className="guide-step"><span>01</span><div><strong>Start anywhere</strong><p>Paste class notes or enter a topic in your own words.</p></div></div>
            <div className="guide-step"><span>02</span><div><strong>Take one card at a time</strong><p>Flip to reveal the answer and move at your own pace.</p></div></div>
            <div className="guide-step"><span>03</span><div><strong>Check your recall</strong><p>Take a short quiz, then revisit the answers you missed.</p></div></div>
            <div className="side-note"><span aria-hidden="true">✦</span><p>Your study set is ready in a few moments. No extra setup needed.</p></div>
          </article>}
        </aside>
      </section>

      <footer className="app-trust"><span>MADE FOR FOCUSED MINDS</span><span>Flashcards · Quick quizzes · Your pace</span><span aria-hidden="true">☼</span></footer>
    </div>
  </main>;
}
