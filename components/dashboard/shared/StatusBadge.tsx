'use client';

import type { TestStatus } from '../test-dashboard/types';

interface StatusBadgeProps {
  status: TestStatus;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<TestStatus, { icon: string; color: string; label: string }> = {
  pending: {
    icon: '⏳',
    color: 'bg-gray-100 text-gray-700',
    label: 'Pending',
  },
  running: {
    icon: '🔄',
    color: 'bg-blue-100 text-blue-700 animate-pulse',
    label: 'Running',
  },
  success: {
    icon: '✅',
    color: 'bg-green-100 text-green-700',
    label: 'Success',
  },
  error: {
    icon: '❌',
    color: 'bg-red-100 text-red-700',
    label: 'Error',
  },
  warning: {
    icon: '⚠️',
    color: 'bg-amber-100 text-amber-700',
    label: 'Warning',
  },
};

const sizeStyles = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-3xl',
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.pending;

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full h-10 w-10 ${config.color}`}
      title={config.label}
      aria-label={config.label}
    >
      <span className={sizeStyles[size]}>{config.icon}</span>
    </div>
  );
}
