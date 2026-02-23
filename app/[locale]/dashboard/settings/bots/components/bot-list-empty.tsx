'use client';

import { Bot } from 'lucide-react';

type Props = {
  onAdd: () => void;
  title: string;
  description: string;
  addLabel: string;
};

export function BotListEmpty({ onAdd, title, description, addLabel }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <Bot className="w-16 h-16 text-muted-foreground text-gray-400 mb-4" aria-hidden />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-md">{description}</p>
      <button
        type="button"
        onClick={onAdd}
        className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
      >
        {addLabel}
      </button>
    </div>
  );
}
