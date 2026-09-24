export default function LoadingState({ streamLength = 0, blocks = [] }) {
  return <section className="loading-panel" role="status" aria-live="polite">
    <div className="spinner" /><div><h2>Making your study set</h2><p>{streamLength ? `Receiving streamed study content (${streamLength} characters)…` : 'Finding the key ideas and turning them into clear questions.'}</p></div>
    <div className="skeletons"><i /><i /><i /></div>
    {blocks.length > 0 && <div className="stream-preview" aria-live="polite">{blocks.map((block) => <article key={block.id}><small>{block.type}</small><strong>{block.type === 'card' ? block.question : block.title}</strong></article>)}</div>}
  </section>;
}
