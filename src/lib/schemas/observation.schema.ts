import { z } from 'zod';

export const ObservationSchema = z.object({
  equipmentType: z.string(),
  problemSummary: z.string(),
  riskFlags: z.array(z.string()),
  environmentalNotes: z.string().optional(),
});

export type Observation = z.infer<typeof ObservationSchema>;
