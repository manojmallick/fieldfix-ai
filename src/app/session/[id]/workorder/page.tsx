import { ensureSqliteSchema, prisma } from '@/lib/db';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkOrderPage({ params }: PageProps) {
  const { id } = await params;

  await ensureSqliteSchema();
  
  const session = await prisma.session.findUnique({
    where: { id },
    include: {
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
          <Link href="/live" className="btn-secondary">
            Start a new demo
          </Link>
        </div>
      </div>
    );
  }
  
  const wo = session.workOrders[0];
  const parts: string[] = wo ? JSON.parse(wo.parts) : [];
  
  return (
    <div className="container py-8">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-2">Work Order</h2>
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
        
        {wo ? (
          <>
            {/* Work Order Header */}
            <div className="card mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-blue-600">{wo.workOrderNumber}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Created: {new Date(wo.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className="badge badge-success text-base px-4 py-2">
                  Active
                </span>
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-gray-700 dark:text-gray-300">{wo.summary}</p>
              </div>
            </div>
            
            {/* Parts List */}
            <div className="card mb-6">
              <h3 className="text-xl font-semibold mb-4">📦 Required Parts</h3>
              <div className="space-y-2">
                {parts.map((part, i) => (
                  <div key={i} className="flex items-center p-3 bg-gray-50 dark:bg-gray-900 rounded">
                    <span className="text-blue-600 mr-3 font-bold">{i + 1}</span>
                    <span>{part}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Time Estimate */}
            <div className="card">
              <h3 className="text-xl font-semibold mb-4">⏱️ Time Estimate</h3>
              <div className="flex items-center gap-4">
                <div className="text-5xl font-bold text-blue-600">
                  {wo.estimatedTime}
                </div>
                <div>
                  <div className="text-xl font-semibold">minutes</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Estimated completion time
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="card">
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              No work order found for this session yet. Generate a work order after plan and safety.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
