'use client';

import { createContext, useContext } from 'react';
import type { KBContextValue } from './kb-types';

export const KBContext = createContext<KBContextValue | null>(null);

export function useKB(): KBContextValue {
  const ctx = useContext(KBContext);
  if (!ctx) throw new Error('useKB must be used within KBContext.Provider');
  return ctx;
}
