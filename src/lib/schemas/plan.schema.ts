import { z } from 'zod';

export const PlanStepSchema = z.object({
  stepNumber: z.number(),
  action: z.string(),
  duration: z.number(),
  citations: z.array(z.string()).min(1),
});

export const PlanSchema = z.object({
  steps: z.array(PlanStepSchema).min(3),
});

export type PlanStep = z.infer<typeof PlanStepSchema>;
export type Plan = z.infer<typeof PlanSchema>;
