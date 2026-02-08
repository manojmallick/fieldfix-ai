import { ensureSqliteSchema } from '@/lib/db';
import { prisma } from '@/lib/store/db';
import Link from 'next/link';
import RunQAGateButton from '@/components/RunQAGateButton';

interface PageProps {
  params: Promise<{ id: string }>;
}

interface QAEventPayload {
  pass: boolean;
  issues?: Array<{ detail?: string; step_n?: number | null }>;
  source?: string;
}

export default async function QAPage({ params }: PageProps) {
  const { id } = await params;

  await ensureSqliteSchema();
  
  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      plans: true,
      events: true,
      kbSnapshots: true,
    },
  });
  
  if (!session) {
    return (
      <div className="container py-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Session expired</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This demo uses ephemeral storage on Vercel, so the session may have been cleared.
          </p>
          <Link href="/live?mode=demo&scenario=scenario3" className="btn-secondary">
            Start a new demo
          </Link>
        </div>
      </div>
    );
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
  
  const qaEvent = [...session.events]
    .reverse()
    .find((event) => event.eventType === 'QA_DONE');
  let displayResult: QAEventPayload | null = null;

  if (qaEvent?.data) {
    try {
      displayResult = JSON.parse(qaEvent.data as string);
    } catch (e) {
      console.error('Failed to parse QA event data:', e);
    }
  }
  
  // If no QA result in events, we would call /api/qa on client side
  // For now, showing placeholder if no result exists
  
  return (
    <div className="container py-8">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-2">QA Gate</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Session ID: {session.id}
        </p>

        <div className="mb-6">
          <RunQAGateButton sessionId={session.id} />
        </div>
        
        {/* Session Nav */}
        <div className="flex flex-wrap gap-2 mb-6">
          <a className="btn-secondary" href={`/api/sessions/${id}/export`}>
            Export Evidence Pack
          </a>
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
            </div>
            
            {/* Issues */}
            {displayResult.issues && displayResult.issues.length > 0 && (
              <div className="card mb-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <span className="text-red-500">⚠</span>
                  Issues Identified
                </h3>
                <ul className="space-y-2">
                  {displayResult.issues.map((issue, i: number) => (
                    <li key={i} className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded">
                      <span className="text-red-500 font-bold">{i + 1}.</span>
                      <span className="flex-1">
                        {issue?.step_n ? `Step ${issue.step_n}: ` : ''}{issue?.detail ?? String(issue)}
                      </span>
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
