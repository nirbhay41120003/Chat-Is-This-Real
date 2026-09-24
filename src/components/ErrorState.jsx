const messages = {
  malformed: 'The study set came back in an unreadable format. Please try again.',
  shape: 'The study set was missing required details. Please try again.',
  empty: 'No flashcards came back for that request. Try adding more notes.',
  timeout: 'This is taking longer than expected. Your request timed out; please retry.',
  network: 'We could not reach the study service. Check your connection and retry.',
  http: 'The study service could not complete that request. Please try again shortly.',
};
export default function ErrorState({ kind = 'http', onRetry, retrying }) {
  return <section className="error-panel" role="alert"><span className="error-icon">!</span>
    <div><h2>We couldn’t make that set</h2><p>{messages[kind] || messages.http}</p>
      <button className="button button-dark" onClick={onRetry} disabled={retrying}>{retrying ? 'Retrying…' : 'Try again'}</button></div>
  </section>;
}
