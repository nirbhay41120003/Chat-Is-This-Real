import { useEffect, useState } from 'react';
import Flashcard from './Flashcard.jsx';

export default function FlashcardDeck({ cards, reviewDue = {}, onReview = () => {}, readOnly = false }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [dueOnly, setDueOnly] = useState(false);
  const dueCards = cards.filter((card) => !reviewDue[card.id]?.dueAt || reviewDue[card.id].dueAt <= Date.now());
  const shownCards = dueOnly ? dueCards : cards;
  useEffect(() => { setIndex(0); setFlipped(false); }, [cards, dueOnly]);
  useEffect(() => { setIndex((current) => Math.min(current, Math.max(0, shownCards.length - 1))); }, [shownCards.length]);
  useEffect(() => {
    function onKey(event) {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      if (event.key === 'ArrowRight') { setIndex((i) => Math.min(shownCards.length - 1, i + 1)); setFlipped(false); }
      if (event.key === 'ArrowLeft') { setIndex((i) => Math.max(0, i - 1)); setFlipped(false); }
      if (event.code === 'Space' && document.activeElement?.tagName !== 'BUTTON') { event.preventDefault(); setFlipped((v) => !v); }
    }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [shownCards.length]);
  const move = (delta) => { setIndex((i) => Math.max(0, Math.min(shownCards.length - 1, i + delta))); setFlipped(false); };
  const card = shownCards[index];
  function grade(rating) { onReview(card.id, rating); setFlipped(false); }
  return <section className="deck-panel" aria-label="Flashcards">
    <div className="deck-meta"><span>{dueOnly ? 'DUE FOR REVIEW' : 'YOUR DECK'}</span><span>{String(shownCards.length ? index + 1 : 0).padStart(2, '0')} <b>/</b> {String(shownCards.length).padStart(2, '0')}</span></div>
    <div className="deck-progress"><i style={{ width: `${shownCards.length ? ((index + 1) / shownCards.length) * 100 : 0}%` }} /></div>
    {!readOnly && <div className="review-tools"><span>{dueCards.length} due for review</span><button type="button" onClick={() => setDueOnly((value) => !value)}>{dueOnly ? 'Show all cards' : 'Review due cards'}</button></div>}
    {card ? <><Flashcard card={card} flipped={flipped} onFlip={() => setFlipped((v) => !v)} />
      {flipped && !readOnly && <div className="review-grades"><span>How well did you recall it?</span>{[['again', 'Again'], ['hard', 'Hard'], ['good', 'Good'], ['easy', 'Easy']].map(([value, label]) => <button type="button" key={value} onClick={() => grade(value)}>{label}</button>)}</div>}
      <div className="deck-controls"><button className="icon-button" onClick={() => move(-1)} disabled={index === 0} aria-label="Previous card">←</button><span>{index + 1} / {shownCards.length}</span><button className="icon-button" onClick={() => move(1)} disabled={index === shownCards.length - 1} aria-label="Next card">→</button></div>
      <p className="keyboard-hint">Use <kbd>←</kbd> <kbd>→</kbd> to move <span>·</span> <kbd>Space</kbd> to flip</p>
    </> : <p className="due-empty">Nothing is due right now. Your next review is scheduled.</p>}
  </section>;
}
