export function scheduleNextReview(previous = {}, rating, now = Date.now()) {
  if (!['again', 'hard', 'good', 'easy'].includes(rating)) throw new TypeError('Unknown recall rating');
  const repetitions = previous.repetitions || 0;
  const priorInterval = previous.intervalDays || 0;
  const ease = Math.max(1.3, (previous.ease || 2.5) + (rating === 'easy' ? 0.15 : rating === 'hard' ? -0.15 : rating === 'again' ? -0.25 : 0));
  const intervalDays = rating === 'again' ? 10 / 1440
    : rating === 'hard' ? Math.max(0.5, priorInterval * 1.2)
      : rating === 'easy' ? (priorInterval ? priorInterval * ease * 1.3 : 4)
        : repetitions === 0 ? 1 : repetitions === 1 ? 3 : priorInterval * ease;
  return {
    repetitions: rating === 'again' ? 0 : repetitions + 1,
    intervalDays,
    ease,
    lastRating: rating,
    dueAt: now + intervalDays * 86400000,
  };
}
