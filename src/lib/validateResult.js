export function validateResult(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  if (Object.keys(value).sort().join(',') !== 'blocks,topic') return null;
  if (typeof value.topic !== 'string' || !value.topic.trim() || !Array.isArray(value.blocks)) return null;
  const cards = value.blocks.filter((block) => block?.type === 'card');
  if (cards.length < 5 || cards.length > 10) return null;
  const ids = new Set();
  for (const block of value.blocks) {
    if (!block || typeof block.id !== 'string' || !block.id.trim() || ids.has(block.id)) return null;
    ids.add(block.id);
    if (block.type === 'card') {
      if (Object.keys(block).sort().join(',') !== 'answer,difficulty,id,question,type'
        || typeof block.question !== 'string' || !block.question.trim()
        || typeof block.answer !== 'string' || !block.answer.trim()
        || !['easy', 'medium', 'hard'].includes(block.difficulty)) return null;
    } else if (block.type === 'chart') {
      if (Object.keys(block).sort().join(',') !== 'id,labels,title,type,values'
        || typeof block.title !== 'string' || !block.title.trim() || !Array.isArray(block.labels)
        || !Array.isArray(block.values) || block.labels.length < 2 || block.labels.length !== block.values.length
        || !block.labels.every((label) => typeof label === 'string' && label.trim())
        || !block.values.every((number) => typeof number === 'number' && Number.isFinite(number))) return null;
    } else if (block.type === 'checklist') {
      if (Object.keys(block).sort().join(',') !== 'id,items,title,type'
        || typeof block.title !== 'string' || !block.title.trim() || !Array.isArray(block.items)
        || !block.items.length || !block.items.every((item) => typeof item === 'string' && item.trim())) return null;
    } else return null;
  }
  return { topic: value.topic.trim(), blocks: value.blocks, cards };
}
