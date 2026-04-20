export type Rating = 0 | 1 | 2 | 3;

export type ReviewState = {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
};

export type Scheduled = ReviewState & { nextReviewAt: Date };

const MIN_EASE = 1.3;
const MAX_EASE = 2.8;
const RELAPSE_MINUTES = 10;

export const MATURE_THRESHOLD_DAYS = 21;

export function schedule(
  prev: ReviewState,
  rating: Rating,
  now: Date = new Date(),
): Scheduled {
  let { easeFactor, intervalDays, repetitions, lapses } = prev;

  if (rating === 0) {
    easeFactor = Math.max(MIN_EASE, easeFactor - 0.2);
    lapses += 1;
    repetitions = 0;
    intervalDays = RELAPSE_MINUTES / (24 * 60);
  } else {
    if (rating === 1) easeFactor = Math.max(MIN_EASE, easeFactor - 0.15);
    else if (rating === 3) easeFactor = Math.min(MAX_EASE, easeFactor + 0.15);

    if (repetitions === 0) {
      intervalDays = rating === 3 ? 4 : 1;
    } else if (repetitions === 1) {
      if (rating === 1) intervalDays = Math.max(intervalDays * 1.2, 1);
      else if (rating === 2) intervalDays = 6;
      else intervalDays = 6 * easeFactor;
    } else {
      if (rating === 1) intervalDays = intervalDays * 1.2;
      else if (rating === 2) intervalDays = intervalDays * easeFactor;
      else intervalDays = intervalDays * easeFactor * 1.3;
    }
    repetitions += 1;
  }

  const nextReviewAt = new Date(now.getTime() + intervalDays * 86_400_000);
  return { easeFactor, intervalDays, repetitions, lapses, nextReviewAt };
}

export function formatInterval(days: number): string {
  if (days < 1 / 24) return `${Math.max(1, Math.round(days * 24 * 60))}m`;
  if (days < 1) return `${Math.round(days * 24)}h`;
  if (days < 30) return `${Math.round(days)}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${Math.round(days / 365)}y`;
}
