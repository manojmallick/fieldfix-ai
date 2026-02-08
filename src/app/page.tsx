import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="container py-12">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-4xl font-bold mb-4">
          AI-Powered Field Service Assistant
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          Analyze equipment, generate repair plans with KB citations, validate safety requirements, 
          and create work orders—all powered by Gemini 2.0.
        </p>
        
        <div className="card max-w-xl mx-auto">
          <h3 className="text-xl font-semibold mb-4">Features</h3>
          <ul className="text-left space-y-2 mb-6">
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>Multimodal equipment analysis with vision AI</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>Knowledge base search with citation tracking</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>Step-by-step repair plans with time estimates</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>Automated safety checks and PPE requirements</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>Work order generation with parts lists</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>Timeline tracking and metrics dashboard</span>
            </li>
          </ul>
          
          <Link href="/live" className="btn inline-block">
            Try Live Demo →
          </Link>
        </div>
        
        <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>Demo mode uses pre-loaded scenarios. No file uploads required.</p>
        </div>
      </div>
    </div>
  );
}
