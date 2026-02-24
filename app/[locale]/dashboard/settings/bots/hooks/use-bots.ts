'use client';

import { useCallback, useEffect, useState } from 'react';

export type BotItem = {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
};

export function useBots() {
  const [bots, setBots] = useState<BotItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBots = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/settings/bots');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to load bots');
      }
      const data = await res.json();
      setBots(data.bots ?? []);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to load bots'));
      setBots([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBots();
  }, [fetchBots]);

  return {
    bots,
    isLoading,
    isError: error,
    mutate: fetchBots,
  };
}
