'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useSettings } from './SettingsContext';

export function SettingsIntegrationsTab() {
  const t = useTranslations('settings');
  const { webhookUrl } = useSettings();

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">{t('integrationsTitle')}</h2>
        <p className="mt-1 text-sm text-gray-600">{t('integrationsDesc')}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/dashboard/settings/bots"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            🤖 {t('linkBots')}
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { id: 'line', name: 'LINE Messaging API', desc: t('connectorLineDesc'), connected: true, icon: 'LINE', href: '/dashboard/settings/bots' },
            { id: 'widget', name: 'Chat Widget', desc: t('connectorWidgetDesc'), connected: true, icon: 'W', href: null },
            { id: 'email', name: t('connectorEmail'), desc: t('connectorEmailDesc'), connected: false, icon: '@', href: null },
            { id: 'sheets', name: 'Google Sheets', desc: t('connectorSheetsDesc'), connected: false, icon: '📊', href: null },
            { id: 'webhook', name: 'Zapier / Make', desc: t('connectorWebhookDesc'), connected: false, icon: '🔗', href: null },
            { id: 'api', name: 'REST API', desc: t('connectorApiDesc'), connected: false, icon: 'API', href: null },
          ].map((conn) => (
            <div key={conn.id} className="rounded-xl border border-gray-200 p-4 transition hover:shadow-md hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium">{conn.icon}</span>
                <span className={`h-2 w-2 rounded-full ${conn.connected ? 'bg-green-500' : 'bg-gray-300'}`} />
              </div>
              <h3 className="mt-2 font-medium text-gray-900">{conn.name}</h3>
              <p className="mt-1 text-xs text-gray-500">{conn.desc}</p>
              {conn.href ? (
                <Link href={conn.href} className="mt-3 inline-block rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                  {conn.connected ? t('settings') : t('connect')}
                </Link>
              ) : (
                <button type="button" className="mt-3 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">{conn.connected ? t('settings') : t('connect')}</button>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">{t('webhookSettings')}</h2>
        <p className="mt-1 text-sm text-gray-600">{t('webhookSettingsDesc')}</p>
        <div className="mt-4 rounded-lg bg-gray-50 p-3">
          <p className="text-xs font-medium text-gray-500 mb-1">{t('webhookUrl')}</p>
          <code className="block text-xs text-gray-700 break-all">{webhookUrl || '...'}</code>
        </div>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">{t('apiKeyTitle')}</h2>
        <p className="mt-1 text-sm text-gray-600">{t('apiKeyDesc')}</p>
        <button type="button" className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">{t('generateApiKey')}</button>
      </div>
    </>
  );
}
