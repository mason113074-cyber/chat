'use client';

import { ReactNode } from 'react';

type StatCardVariant = 'default' | 'success' | 'error' | 'warning';

interface StatCardProps {
  title: string;
  value: number | string;
  variant: StatCardVariant;
  icon?: ReactNode;
  description?: string;
}

const variantStyles: Record<StatCardVariant, string> = {
  default: 'border-gray-200 bg-white',
  success: 'border-green-200 bg-green-50',
  error: 'border-red-200 bg-red-50',
  warning: 'border-amber-200 bg-amber-50',
};

const textColorStyles: Record<StatCardVariant, string> = {
  default: 'text-gray-900',
  success: 'text-green-700',
  error: 'text-red-700',
  warning: 'text-amber-700',
};

const iconColorStyles: Record<StatCardVariant, string> = {
  default: 'text-gray-600',
  success: 'text-green-600',
  error: 'text-red-600',
  warning: 'text-amber-600',
};

export function StatCard({
  title,
  value,
  variant,
  icon,
  description,
}: StatCardProps) {
  return (
    <div
      className={`rounded-lg border p-6 shadow-sm transition-shadow hover:shadow-md ${variantStyles[variant]}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${iconColorStyles[variant]}`}>{title}</p>
          <p className={`mt-2 text-3xl font-bold ${textColorStyles[variant]}`}>{value}</p>
          {description != null && description !== '' && (
            <p className="mt-1 text-xs text-gray-600">{description}</p>
          )}
        </div>
        {icon != null && (
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/50 ${iconColorStyles[variant]}`}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
