export default function StudyBlocks({ blocks }) {
  return <div className="study-blocks" aria-label="Study materials">
    {blocks.filter((block) => block.type !== 'card').map((block) => block.type === 'chart'
      ? <article className="content-block chart-block" key={block.id}><h3>{block.title}</h3><div className="chart-bars" role="img" aria-label={`${block.title}: ${block.labels.map((label, index) => `${label} ${block.values[index]}`).join(', ')}`}>
        {block.labels.map((label, index) => { const max = Math.max(...block.values, 1); return <div className="chart-row" key={`${block.id}-${label}`}><span>{label}</span><i><b style={{ width: `${Math.max(4, block.values[index] / max * 100)}%` }} /></i><strong>{block.values[index]}</strong></div>; })}
      </div></article>
      : <article className="content-block checklist-block" key={block.id}><h3>{block.title}</h3><ul>{block.items.map((item) => <li key={item}>✓ <span>{item}</span></li>)}</ul></article>)}
  </div>;
}
