// Transcribed from /docs/220-1201-objectives.pdf (v3.0), page 3,
// and /docs/220-1202-objectives.pdf (v2.0), page 3, read on 2026-10-24.
export const EXAM_WEIGHTS = {
  "220-1201": {
    "mobile-devices": 13,
    networking: 23,
    hardware: 25,
    "virtualization-cloud": 11,
    "hardware-troubleshooting": 28,
  },
  "220-1202": {
    "operating-systems": 28,
    security: 28,
    "software-troubleshooting": 23,
    "operational-procedures": 21,
  },
} as const;
export type ExamCode = keyof typeof EXAM_WEIGHTS;
export const EXAM_LENGTHS = { Short: 15, Medium: 45, Full: 90 } as const;
