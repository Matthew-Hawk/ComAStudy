// Intervals are in days. Ten minutes makes new/lapsed material reappear soon.
export const LEARNING = {
  stepDays: 10 / 1440,
  minEase: 1.3,
  initialEase: 2.5,
  matureDays: 21,
  quickMs: 8000, // Used only to promote an already-mature item to easy; no timer is shown.
  reviewLimit: 12,
  mastery: {
    // Familiar requires broad exposure, mostly independent answers, and half the items at 1+ day.
    familiar: { seen: 0.75, accuracy: 0.6, matureShare: 0.5, intervalDays: 1 },
    // Mastered requires every available item to be stable at 21+ days and 85% independent accuracy.
    mastered: { seen: 1, accuracy: 0.85, matureShare: 1, intervalDays: 21 },
  },
} as const;
