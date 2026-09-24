import { useMemo, useState } from 'react';
import ResultsSummary from './ResultsSummary.jsx';

function makeQuestions(cards) {
  return cards.map((card) => {
    // Deduplicate answers so repeated model output cannot create duplicate choices.
    const distractors = [...new Set(cards
      .filter((other) => other.id !== card.id && other.answer !== card.answer)
      .map((other) => other.answer))]
      .sort(() => Math.random() - 0.5).slice(0, 3);
    const options = [...distractors, card.answer].sort(() => Math.random() - 0.5);
    return { ...card, options };
  });
}

export default function QuizMode({ cards, onComplete }) {
  const [round, setRound] = useState(0);
  const [position, setPosition] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [retestIds, setRetestIds] = useState(null);
  const questions = useMemo(() => makeQuestions(cards), [cards, round]);
  const list = retestIds ? questions.filter((question) => retestIds.includes(question.id)) : questions;
  const current = list[position];
  const finished = position >= list.length;
  function choose(option) {
    if (selected !== null) return;
    setSelected(option);
    setAnswers((all) => [...all, { id: current.id, correct: option === current.answer }]);
  }
  function next() {
    if (position === list.length - 1) onComplete?.({ score: answers.filter((answer) => answer.correct).length, total: answers.length, missedIds: answers.filter((answer) => !answer.correct).map((answer) => answer.id) });
    setPosition((p) => p + 1); setSelected(null);
  }
  function retest() {
    const wrong = new Set(answers.filter((answer) => !answer.correct).map((answer) => answer.id));
    setAnswers([]); setPosition(0); setSelected(null); setRound((n) => n + 1);
    // The missed set is stored separately to keep the retest local to this quiz session.
    setRetestIds([...wrong]);
  }
  if (finished) {
    const score = answers.filter((answer) => answer.correct).length;
    return <ResultsSummary score={score} total={answers.length} onRetest={retest} />;
  }
  const quizCard = list[position];
  if (!quizCard) return null;
  return <section className="quiz-panel" aria-label="Quiz">
    <div className="quiz-top"><span className="eyebrow">QUICK QUIZ</span><span>{position + 1} / {list.length}</span></div>
    <div className="deck-progress"><i style={{ width: `${((position + 1) / list.length) * 100}%` }} /></div>
    <h2>{quizCard.question}</h2><p className="quiz-instruction">Choose the best answer.</p>
    <div className="quiz-options">{quizCard.options.map((option, i) => {
      const isCorrect = option === quizCard.answer;
      const state = selected === null ? '' : isCorrect ? 'option-correct' : selected === option ? 'option-wrong' : 'option-muted';
      return <button key={`${quizCard.id}-${i}`} className={`quiz-option ${state}`} onClick={() => choose(option)} disabled={selected !== null}>
        <span className="option-letter">{String.fromCharCode(65 + i)}</span>{option}
        {selected !== null && isCorrect && <span className="option-mark">✓</span>}
      </button>;
    })}</div>
    {selected !== null && <div className={`answer-feedback ${selected === quizCard.answer ? 'feedback-good' : 'feedback-bad'}`}>
      <span>{selected === quizCard.answer ? 'Correct — nice work.' : `Not quite. The answer is: ${quizCard.answer}`}</span>
      <button className="button button-dark" onClick={next}>{position === list.length - 1 ? 'See results' : 'Next question'} <span>→</span></button>
    </div>}
  </section>;
}
