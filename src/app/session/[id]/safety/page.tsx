import { ensureSqliteSchema } from '@/lib/db';
import { prisma } from '@/lib/store/db';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SafetyPage({ params }: PageProps) {
  const { id } = await params;

  await ensureSqliteSchema();
  
  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      safetyChecks: true,
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
  
  const safety = session.safetyChecks[0];
  const ppeRequired: string[] = safety ? JSON.parse(safety.ppeRequired) : [];
  const hazards: string[] = safety ? JSON.parse(safety.hazards) : [];
  const presteps: string[] = safety ? JSON.parse(safety.requiredPresteps) : [];
  
  return (
    <div className="container py-8">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-2">Safety Check</h2>
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
        
        {safety ? (
          <>
            {/* Safety Status */}
            <div className="card mb-6">
              <div className="flex items-center gap-4">
                <div className={`text-4xl ${safety.pass ? 'text-green-600' : 'text-red-600'}`}>
                  {safety.pass ? '✓' : '✗'}
                </div>
                <div>
                  <h3 className="text-2xl font-bold">
                    {safety.pass ? 'Safety Check Passed' : 'Safety Check Failed'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {safety.pass 
                      ? 'All safety requirements can be met with proper precautions'
                      : 'Safety concerns must be addressed before proceeding'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Hazards */}
            {hazards.length > 0 && (
              <div className="card mb-6">
                <h3 className="text-xl font-semibold mb-4">⚠️ Identified Hazards</h3>
                <ul className="space-y-2">
                  {hazards.map((hazard, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-red-600 mr-2">•</span>
                      <span className="text-gray-700 dark:text-gray-300">{hazard}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Required Pre-steps */}
            {presteps.length > 0 && (
              <div className="card mb-6">
                <h3 className="text-xl font-semibold mb-4">🔒 Required Pre-Steps</h3>
                <ol className="list-decimal list-inside space-y-2">
                  {presteps.map((step, i) => (
                    <li key={i} className="text-gray-700 dark:text-gray-300">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}
            
            {/* PPE Required */}
            <div className="card">
              <h3 className="text-xl font-semibold mb-4">🦺 Required PPE</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {ppeRequired.map((ppe, i) => (
                  <div key={i} className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <span className="font-medium text-blue-900 dark:text-blue-100">
                      {ppe}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="card">
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              No safety check found for this session yet. Run Safety after the plan is ready.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
