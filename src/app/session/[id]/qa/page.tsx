import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PlanStep } from '@/lib/schemas/plan.schema';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function QAPage({ params }: PageProps) {
  const { id } = await params;
  
  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      plans: true,
      events: true,
      kbSnapshots: true,
    },
  });
  
  if (!session) {
    notFound();
  }
  
  const plan = session.plans[0];
  
  if (!plan) {
    return (
      <div className="container py-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">QA Gate</h2>
          <p className="text-gray-600">No plan found for this session.</p>
        </div>
      </div>
    );
  }
  
  // Check if QA has already been run (stored in events)
  const qaEvent = session.events.find(e => e.eventType === 'QA_CHECK');
  let qaResult = null;
  
  if (qaEvent && qaEvent.data) {
    try {
      qaResult = JSON.parse(qaEvent.data as string);
    } catch (e) {
      console.error('Failed to parse QA event data:', e);
    }
  }

  // Hard rule checks: citations must exist and map to KB snapshots
  let planSteps: PlanStep[] = [];
  try {
    planSteps = JSON.parse(plan.steps) as PlanStep[];
  } catch (e) {
    console.error('Failed to parse plan steps:', e);
  }

  const kbIdSet = new Set(session.kbSnapshots.map(s => s.kbId));
  const ruleIssues: string[] = [];

  if (planSteps.length === 0) {
    ruleIssues.push('Plan has no steps to validate.');
  }

  planSteps.forEach((step, index) => {
    const citations = step.citations || [];
    if (citations.length === 0) {
      ruleIssues.push(`Step ${index + 1} has no citations.`);
      return;
    }

    for (const citation of citations) {
      if (!kbIdSet.has(citation)) {
        ruleIssues.push(`Step ${index + 1} cites unknown KB ID: ${citation}.`);
      }
    }
  });

  const rulePass = ruleIssues.length === 0;

  const mergedPass = (qaResult?.pass ?? true) && rulePass;
  const mergedIssues = [...(qaResult?.issues ?? []), ...ruleIssues];
  const mergedScore = qaResult?.score ?? (rulePass ? 100 : 0);
  const displayResult = qaResult
    ? { ...qaResult, pass: mergedPass, issues: mergedIssues, score: mergedScore }
    : { pass: mergedPass, issues: mergedIssues, recommendations: [], score: mergedScore };
  
  // If no QA result in events, we would call /api/qa on client side
  // For now, showing placeholder if no result exists
  
  return (
    <div className="container py-8">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-2">QA Gate</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Session ID: {session.id}
        </p>
        
        {/* Session Nav */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Link href={`/session/${id}`} className="btn-secondary">
            Overview
          </Link>
          <Link href={`/session/${id}/plan`} className="btn-secondary">
            Plan
          </Link>
          <Link href={`/session/${id}/safety`} className="btn-secondary">
            Safety
          </Link>
          <Link href={`/session/${id}/workorder`} className="btn-secondary">
            Work Order
          </Link>
          <Link href={`/session/${id}/qa`} className="btn-secondary">
            QA Gate
          </Link>
          <Link href={`/session/${id}/metrics`} className="btn-secondary">
            Metrics
          </Link>
        </div>
        
        {displayResult ? (
          <>
            {/* QA Result Badge */}
            <div className="card mb-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Quality Assessment</h3>
                <div className={`badge text-lg px-4 py-2 ${
                  displayResult.pass ? 'badge-success' : 'badge-error'
                }`}>
                  {displayResult.pass ? '✓ PASS' : '✗ FAIL'}
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">Quality Score</span>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${
                        displayResult.score >= 80 ? 'bg-green-500' :
                        displayResult.score >= 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${displayResult.score}%` }}
                    />
                  </div>
                  <span className="text-2xl font-bold">{displayResult.score}/100</span>
                </div>
              </div>
            </div>
            
            {/* Issues */}
            {displayResult.issues && displayResult.issues.length > 0 && (
              <div className="card mb-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <span className="text-red-500">⚠</span>
                  Issues Identified
                </h3>
                <ul className="space-y-2">
                  {displayResult.issues.map((issue: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded">
                      <span className="text-red-500 font-bold">{i + 1}.</span>
                      <span className="flex-1">{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Recommendations */}
            {displayResult.recommendations && displayResult.recommendations.length > 0 && (
              <div className="card">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <span className="text-blue-500">💡</span>
                  Recommendations
                </h3>
                <ul className="space-y-2">
                  {displayResult.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                      <span className="text-blue-500 font-bold">{i + 1}.</span>
                      <span className="flex-1">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <div className="card">
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              QA check has not been run for this session yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
