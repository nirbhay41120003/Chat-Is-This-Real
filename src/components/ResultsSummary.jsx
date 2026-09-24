export default function ResultsSummary({ score, total, onRetest }) {
  const percent = total ? Math.round((score / total) * 100) : 0;
  return <section className="results-summary"><div className="score-ring" style={{ '--score': `${percent}%` }}><span>{percent}<small>%</small></span></div>
    <div><span className="eyebrow">SESSION COMPLETE</span><h2>{score} of {total} correct</h2>
      <p>{percent >= 80 ? 'Great recall. You’ve got this.' : 'A little more practice will help it stick.'}</p>
      {score < total && <button className="button button-dark" onClick={onRetest}>Retest wrong answers <span>↗</span></button>}</div>
  </section>;
}
