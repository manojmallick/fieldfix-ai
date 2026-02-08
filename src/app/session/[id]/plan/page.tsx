import { ensureSqliteSchema, prisma } from '@/lib/db';
import Link from 'next/link';
import { PlanStep } from '@/lib/schemas/plan.schema';
import PlanView from '@/components/PlanView';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PlanPage({ params }: PageProps) {
  const { id } = await params;

  await ensureSqliteSchema();
  
  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      plans: true,
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
          <Link href="/live" className="btn-secondary">
            Start a new demo
          </Link>
        </div>
      </div>
    );
  }
  
  const plan = session.plans[0];
  const steps: PlanStep[] = plan ? JSON.parse(plan.steps) : [];
  const totalTime = steps.reduce((sum, step) => sum + step.duration, 0);
  
  return (
    <div className="container py-8">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-2">Repair Plan</h2>
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
        
        {plan ? (
          <>
            {/* Plan Summary */}
            <div className="card mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-lg font-semibold">Total Steps:</span>
                  <span className="ml-2 text-2xl font-bold text-blue-600">{steps.length}</span>
                </div>
                <div>
                  <span className="text-lg font-semibold">Estimated Time:</span>
                  <span className="ml-2 text-2xl font-bold text-blue-600">{totalTime} min</span>
                </div>
              </div>
            </div>
            
            {/* Plan Steps with Citations */}
            <PlanView steps={steps} kbSnapshots={session.kbSnapshots} />
          </>
        ) : (
          <div className="card">
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              No plan found for this session yet. Run Analyze and Plan to generate steps.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
