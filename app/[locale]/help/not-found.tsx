import { Link } from '@/i18n/navigation';

export default function HelpNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Article or category not found</h1>
        <p className="text-gray-600 mb-6">The help page you’re looking for doesn’t exist or was moved.</p>
        <Link
          href="/help"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Help Center
        </Link>
      </div>
    </div>
  );
}
