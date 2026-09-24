export default function Flashcard({ card, flipped, onFlip }) {
  return <button type="button" className={`flashcard ${flipped ? 'is-flipped' : ''}`} onClick={onFlip}
    aria-label={flipped ? 'Show question' : 'Show answer'} aria-pressed={flipped}>
    <span className={`difficulty difficulty-${card.difficulty}`}>{card.difficulty}</span>
    <span className="card-label">{flipped ? 'ANSWER' : 'QUESTION'}</span>
    <span className="card-copy">{flipped ? card.answer : card.question}</span>
    <span className="flip-hint">{flipped ? 'Tap to see question' : 'Tap to reveal answer'} <span>↻</span></span>
  </button>;
}
