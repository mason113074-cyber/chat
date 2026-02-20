'use client';

interface ErrorCollapseProps {
  message: string;
}

export function ErrorCollapse({ message }: ErrorCollapseProps) {
  return (
    <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-4">
      <div className="flex gap-3">
        <svg
          className="h-5 w-5 shrink-0 text-red-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="min-w-0 flex-1">
          <h4 className="mb-1 text-sm font-medium text-red-800">Error Details</h4>
          <pre className="whitespace-pre-wrap rounded border border-red-200 bg-white/50 p-3 font-mono text-sm text-red-700">
            {message}
          </pre>
        </div>
      </div>
    </div>
  );
}
