import { ensureSqliteSchema, prisma } from '@/lib/db';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MetricsPage({ params }: PageProps) {
  const { id } = await params;

  await ensureSqliteSchema();
  
  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      events: {
        orderBy: { timestamp: 'asc' },
      },
      workOrders: true,
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
  
  // Calculate metrics from events
  const events = session.events;
  const analyzeStart = events.find(e => e.eventType === 'ANALYZE_START');
  const analyzeDone = events.find(e => e.eventType === 'ANALYZE_DONE');
  const planStart = events.find(e => e.eventType === 'PLAN_START');
  const planReady = events.find(e => e.eventType === 'PLAN_READY');
  const woCreated = events.find(e => e.eventType === 'WO_CREATED');
  
  let analyzeLatency = 0;
  let planLatency = 0;
  let endToEndTime = 0;
  
  if (analyzeStart && analyzeDone) {
    analyzeLatency = Math.round(
      (new Date(analyzeDone.timestamp).getTime() - new Date(analyzeStart.timestamp).getTime()) / 1000
    );
  }
  
  if (planStart && planReady) {
    planLatency = Math.round(
      (new Date(planReady.timestamp).getTime() - new Date(planStart.timestamp).getTime()) / 1000
    );
  }
  
  if (events.length > 0 && woCreated) {
    endToEndTime = Math.round(
      (new Date(woCreated.timestamp).getTime() - new Date(events[0].timestamp).getTime()) / 1000
    );
  }
  
  // Baseline comparison (35 minutes manual process)
  const baselineMinutes = 35;
  const timeSaved = baselineMinutes - (endToEndTime / 60);
  const efficiencyGain = ((timeSaved / baselineMinutes) * 100).toFixed(1);
  
  return (
    <div className="container py-8">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-2">Metrics & Analytics</h2>
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
        
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Analysis Time
            </h3>
            <p className="text-3xl font-bold text-blue-600">{analyzeLatency}s</p>
          </div>
          
          <div className="card bg-green-50 dark:bg-green-900/20">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Plan Generation
            </h3>
            <p className="text-3xl font-bold text-green-600">{planLatency}s</p>
          </div>
          
          <div className="card bg-purple-50 dark:bg-purple-900/20">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
              End-to-End
            </h3>
            <p className="text-3xl font-bold text-purple-600">{endToEndTime}s</p>
          </div>
          
          <div className="card bg-orange-50 dark:bg-orange-900/20">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Total Events
            </h3>
            <p className="text-3xl font-bold text-orange-600">{events.length}</p>
          </div>
        </div>
        
        {/* Time Savings */}
        <div className="card mb-6">
          <h3 className="text-xl font-semibold mb-4">⚡ Time Savings Analysis</h3>
          
          {/* Credibility Disclaimer */}
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border-l-4 border-blue-500">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Note:</strong> Time savings apply to diagnosis and planning phases only. 
              Physical repair work time remains unchanged. Baseline assumes manual photo review, 
              equipment manual lookup, and handwritten plan creation (~35 minutes).
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Baseline Manual Process (Diagnosis + Planning)
              </p>
              <p className="text-4xl font-bold text-gray-600">{baselineMinutes * 60}s</p>
              <p className="text-lg text-gray-500 mt-1">
                ({baselineMinutes} min)
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                AI-Assisted Process
              </p>
              <p className="text-4xl font-bold text-blue-600">
                {endToEndTime}s
              </p>
              <p className="text-lg text-gray-500 mt-1">
                ({(endToEndTime / 60).toFixed(1)} min)
              </p>
            </div>
          </div>
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                  Estimated Time Saved (Diagnosis + Planning)
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {Math.round(timeSaved * 60)}s
                </p>
                <p className="text-lg text-green-700 dark:text-green-300 mt-1">
                  (~{timeSaved.toFixed(1)} minutes)
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                  Efficiency Gain
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {efficiencyGain}%
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Event Timeline */}
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">📊 Event Timeline</h3>
          <div className="space-y-2">
            {events.map((event, i) => {
              const prevTime = i > 0 ? new Date(events[i - 1].timestamp).getTime() : null;
              const currentTime = new Date(event.timestamp).getTime();
              const delta = prevTime ? Math.round((currentTime - prevTime) / 1000) : 0;
              
              return (
                <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded">
                  <div>
                    <span className="font-medium">{event.eventType}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {delta > 0 && (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      +{delta}s
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
