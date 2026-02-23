'use client';

import { useTranslations } from 'next-intl';
import type { TabId } from './settings-types';
import { TAB_IDS } from './settings-types';

const TAB_LABEL_KEYS: Record<TabId, string> = {
  general: 'tabsGeneral',
  personality: 'tabsPersonality',
  behavior: 'tabsBehavior',
  experience: 'tabsExperience',
  optimize: 'tabsOptimize',
  integrations: 'tabsIntegrations',
};

type Props = {
  activeTab: TabId;
  setTab: (id: TabId) => void;
};

export function SettingsTabNav({ activeTab, setTab }: Props) {
  const t = useTranslations('settings');
  return (
    <nav className="mt-6 flex gap-1 border-b border-gray-200" aria-label={t('tabsGeneral')}>
      {TAB_IDS.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => setTab(id)}
          className={`px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 -mb-px transition-colors ${
            activeTab === id
              ? 'border-indigo-600 text-indigo-600 bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          {t(TAB_LABEL_KEYS[id])}
        </button>
      ))}
    </nav>
  );
}
