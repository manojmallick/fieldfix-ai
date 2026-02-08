import { ensureSqliteSchema } from '@/lib/db';
import { prisma } from '@/lib/store/db';
import Link from 'next/link';
import GeminiEvidence from '@/components/GeminiEvidence';
import IncidentMemory from '@/components/IncidentMemory';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SessionPage({ params }: PageProps) {
  const { id } = await params;

  await ensureSqliteSchema();
  
  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      observations: true,
      plans: true,
      safetyChecks: true,
      workOrders: true,
      events: {
        orderBy: { timestamp: 'asc' },
      },
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
          <div className="mb-4">
            <p className="mb-2">Start a new demo (choose a scenario):</p>
            <div className="flex gap-2 flex-wrap">
              <Link href="/live?mode=demo&scenario=scenario1" className="btn-secondary">
                Overheating HVAC Unit
              </Link>
              <Link href="/live?mode=demo&scenario=scenario2" className="btn-secondary">
                Generator Malfunction
              </Link>
              <Link href="/live?mode=demo&scenario=scenario3" className="btn-secondary">
                Water Pump Failure (Hazard)
              </Link>
              <Link href="/live?mode=demo" className="btn-secondary">
                Start default demo
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  const observation = session.observations[0];
  
  // Find similar sessions for incident memory
  const similarSessions = await prisma.session.findMany({
    where: {
      id: { not: id },
      scenario: session.scenario,
    },
    take: 3,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      scenario: true,
      createdAt: true,
    },
  });
  
  return (
    <div className="container py-8">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-2">Session Overview</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Session ID: {session.id}
        </p>
        
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
        
        {/* Gemini Evidence Panel */}
        <GeminiEvidence events={session.events} />
        
        {/* Incident Memory */}
        <IncidentMemory sessions={similarSessions} />
        
        {/* Observation Summary */}
        {observation && (
          <div className="card mb-6">
            <h3 className="text-xl font-semibold mb-4">Observation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-semibold">Equipment Type:</span>
                <p>{observation.equipmentType}</p>
              </div>
              <div>
                <span className="font-semibold">Status:</span>
                <span className={`badge ml-2 ${
                  session.status === 'complete' ? 'badge-success' :
                  session.status === 'error' ? 'badge-error' :
                  'badge-info'
                }`}>
                  {session.status}
                </span>
              </div>
            </div>
            <div className="mt-4">
              <span className="font-semibold">Problem Summary:</span>
              <p className="text-gray-700 dark:text-gray-300 mt-1">
                {observation.problemSummary}
              </p>
            </div>
            {observation.riskFlags && JSON.parse(observation.riskFlags).length > 0 && (
              <div className="mt-4">
                <span className="font-semibold">Risk Flags:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {JSON.parse(observation.riskFlags).map((flag: string, i: number) => (
                    <span key={i} className="badge badge-warning">
                      {flag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Timeline */}
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Timeline</h3>
          <div className="space-y-3">
            {session.events.map((event) => (
              <div key={event.id} className="flex items-start border-l-2 border-blue-500 pl-4">
                <div className="flex-1">
                  <div className="font-semibold">{event.eventType}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(event.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
