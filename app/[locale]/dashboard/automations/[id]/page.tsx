'use client';

import { useState, useEffect, useRef } from 'react';
import { Link } from '@/i18n/navigation';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Save, Play } from 'lucide-react';
import { FlowEditor, type FlowEditorHandle } from '@/components/automations/FlowEditor';
import type { Node, Edge } from '@xyflow/react';

export default function AutomationEditorPage() {
  const params = useParams();
  const id = params?.id as string;
  const t = useTranslations('automations');
  const flowRef = useRef<FlowEditorHandle>(null);
  const [workflow, setWorkflow] = useState<{ name: string; description: string | null; is_active: boolean; nodes: unknown[]; edges: unknown[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [testResult, setTestResult] = useState<object | null>(null);

  useEffect(() => {
    (async () => {
      if (!id) return;
      try {
        const res = await fetch(`/api/workflows/${id}`, { credentials: 'include' });
        if (res.ok) {
          const w = await res.json();
          setWorkflow(w);
        } else setWorkflow(null);
      } catch {
        setWorkflow(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleSave = async () => {
    if (!id || saving) return;
    const nodes = flowRef.current?.getNodes() ?? [];
    const edges = flowRef.current?.getEdges() ?? [];
    setSaving(true);
    try {
      const res = await fetch(`/api/workflows/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ nodes, edges }),
      });
      if (res.ok) {
        const w = await res.json();
        setWorkflow(w);
      } else {
        const json = await res.json();
        alert(json.error ?? '儲存失敗');
      }
    } catch {
      alert('儲存失敗');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/workflows/${id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ testMessage }),
      });
      const json = await res.json();
      setTestResult(json);
    } catch {
      setTestResult({ error: '執行失敗' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-gray-500">{t('loading')}</p>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-700">找不到工作流程</p>
        <Link href="/dashboard/automations" className="mt-4 inline-block text-indigo-600 hover:underline">
          {t('back')}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/automations"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('back')}
          </Link>
          <h1 className="text-xl font-bold text-gray-900">{workflow.name}</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTestOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Play className="h-4 w-4" />
            {t('test')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {t('save')}
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 rounded-xl border border-gray-200 bg-white overflow-hidden">
        <FlowEditor
          ref={flowRef}
          key={id}
          initialNodes={(Array.isArray(workflow?.nodes) ? workflow.nodes : []) as Node[]}
          initialEdges={(Array.isArray(workflow?.edges) ? workflow.edges : []) as Edge[]}
        />
      </div>

      {testOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setTestOpen(false)}>
          <div
            className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">{t('test')}</h3>
            <textarea
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="輸入模擬客戶訊息..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleTest}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                執行
              </button>
              <button
                onClick={() => { setTestOpen(false); setTestResult(null); }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                關閉
              </button>
            </div>
            {testResult && (
              <pre className="mt-4 p-3 rounded-lg bg-gray-100 text-xs overflow-auto max-h-48">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
