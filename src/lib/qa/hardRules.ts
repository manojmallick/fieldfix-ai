export type QAIssue = {
  type: 'MISSING_CITATIONS' | 'UNKNOWN_CITATION';
  detail: string;
  step_n: number | null;
};

function getPlanSteps(plan: unknown): unknown[] {
  if (Array.isArray((plan as { steps?: unknown[] } | null)?.steps)) {
    return (plan as { steps: unknown[] }).steps;
  }
  if (Array.isArray((plan as { stepsRequired?: unknown[] } | null)?.stepsRequired)) {
    return (plan as { stepsRequired: unknown[] }).stepsRequired;
  }
  if (Array.isArray((plan as { plan?: { steps?: unknown[] } } | null)?.plan?.steps)) {
    return (plan as { plan: { steps: unknown[] } }).plan.steps;
  }
  return [];
}

type PlanStepLite = { n?: number; citations?: string[] };

export function validateHardQA(
  plan: unknown,
  kbSnapshots: { kbId?: string; id?: string }[]
): { pass: boolean; issues: QAIssue[] } {
  const issues: QAIssue[] = [];
  const steps = getPlanSteps(plan) as PlanStepLite[];

  if (!Array.isArray(steps) || steps.length === 0) {
    issues.push({
      type: 'MISSING_CITATIONS',
      detail: 'Plan has no steps to validate.',
      step_n: null,
    });
    return { pass: false, issues };
  }

  const allowed = new Set<string>();
  for (const snapshot of kbSnapshots) {
    if (snapshot.kbId) allowed.add(snapshot.kbId);
    if (!snapshot.kbId && snapshot.id) allowed.add(snapshot.id);
  }

  steps.forEach((step, index) => {
    const stepNumber = typeof step?.n === 'number' ? step.n : index + 1;
    const citations = Array.isArray(step?.citations) ? step.citations : [];

    if (citations.length === 0) {
      issues.push({
        type: 'MISSING_CITATIONS',
        detail: 'Step has no citations.',
        step_n: stepNumber,
      });
      return;
    }

    for (const citation of citations) {
      if (!allowed.has(citation)) {
        issues.push({
          type: 'UNKNOWN_CITATION',
          detail: `Unknown citation: ${citation}.`,
          step_n: stepNumber,
        });
      }
    }
  });

  return { pass: issues.length === 0, issues };
}
