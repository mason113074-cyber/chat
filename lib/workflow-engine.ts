/**
 * Workflow Engine — 自動化工作流程執行引擎
 * 從觸發節點開始，依 nodes/edges 依序執行節點邏輯
 */
import { replyMessage, type LineCredentials } from './line';
import { getSupabaseAdmin, insertConversationMessage } from './supabase';
import { isWithinBusinessHours } from './business-hours';
import { searchKnowledgeWithSources } from './knowledge-search';
import { generateReply } from './openai';

export interface WorkflowNode {
  id: string;
  type: string;
  data?: {
    label?: string;
    summary?: string;
    subType?: string;
    keywords?: string[];
    message?: string;
    buttons?: { label: string; value: string }[];
    field?: string;
    operator?: string;
    compareValue?: string;
    tags?: string;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
}

export interface WorkflowData {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface ExecutionContext {
  message: string;
  contactId: string;
  lineUserId: string;
  ownerUserId: string;
  replyToken: string;
  conversationId?: string;
  isNewCustomer: boolean;
  isOffHours: boolean;
  businessHoursConfig?: unknown;
  systemPrompt?: string;
  aiModel?: string;
  variables: Record<string, unknown>;
  /** 若為 true，不發送 LINE 訊息、不寫入 conversations/contacts（測試用） */
  dryRun?: boolean;
  /** 多 bot：該事件所屬 bot 的憑證；未設則使用全域 env */
  credentials?: LineCredentials;
  /** 多 bot：該事件所屬 bot id（稽核/冪等用） */
  botId?: string;
}

export interface ExecutedNodeRecord {
  nodeId: string;
  type: string;
  subType?: string;
  input?: unknown;
  output?: unknown;
}

export interface ExecutionResult {
  success: boolean;
  executedNodes: ExecutedNodeRecord[];
  error?: string;
}

function findTriggerNodes(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): WorkflowNode[] {
  const targetIds = new Set(edges.map((e) => e.target));
  return nodes.filter((n) => n.type === 'trigger' && !targetIds.has(n.id));
}

function getOutgoingEdges(
  nodeId: string,
  edges: WorkflowEdge[],
  sourceHandle?: string
): WorkflowEdge[] {
  return edges.filter((e) => {
    if (e.source !== nodeId) return false;
    if (sourceHandle != null && e.sourceHandle !== sourceHandle) return false;
    return true;
  });
}

function getNodeById(nodes: WorkflowNode[], id: string): WorkflowNode | undefined {
  return nodes.find((n) => n.id === id);
}

function checkTrigger(
  node: WorkflowNode,
  ctx: ExecutionContext
): boolean {
  const subType = node.data?.subType ?? 'new_message';
  if (subType === 'new_message') return true;
  if (subType === 'keywords') {
    const keywords = (node.data?.keywords ?? []) as string[];
    if (keywords.length === 0) return true;
    return keywords.some((k) =>
      ctx.message.toLowerCase().includes(String(k).toLowerCase())
    );
  }
  if (subType === 'new_customer') return ctx.isNewCustomer;
  if (subType === 'off_hours') return ctx.isOffHours;
  return true;
}

async function executeAINode(
  node: WorkflowNode,
  ctx: ExecutionContext
): Promise<unknown> {
  const subType = node.data?.subType ?? 'sentiment';

  if (subType === 'reply') {
    const { text } = await searchKnowledgeWithSources(
      ctx.ownerUserId,
      ctx.message,
      3,
      2000
    );
    const basePrompt =
      (ctx.systemPrompt ?? '') +
      (text
        ? '\n\n## 知識庫參考：\n' + text
        : '\n\n知識庫無相關內容，請禮貌回覆需專人處理。');
    const reply = await generateReply(
      ctx.message,
      basePrompt,
      ctx.aiModel,
      ctx.ownerUserId,
      ctx.contactId,
      [],
      { maxReplyLength: 500 }
    );
    ctx.variables.ai_reply = reply;
    return reply;
  }

  if (subType !== 'sentiment' && subType !== 'intent' && subType !== 'language') {
    return ctx.variables[node.data?.field as string];
  }

  let systemPrompt = '';
  if (subType === 'sentiment') {
    systemPrompt =
      '分析以下客戶訊息的情緒，只回覆 positive、neutral 或 negative 其中之一。';
  } else if (subType === 'intent') {
    systemPrompt =
      '分析以下客戶訊息的意圖，只回覆以下其中一個：inquiry（詢價）、aftersales（售後）、complaint（投訴）、general（一般諮詢）。';
  } else {
    systemPrompt =
      '偵測以下訊息的語言，只回覆語言代碼，如 zh-TW、en、ja。';
  }

  const result = await generateReply(
    ctx.message,
    systemPrompt,
    ctx.aiModel ?? 'gpt-4o-mini',
    ctx.ownerUserId,
    ctx.contactId,
    [],
    { maxReplyLength: 20, replyTemperature: 0 }
  );

  const trimmed = result.trim().toLowerCase();
  if (subType === 'sentiment') ctx.variables.sentiment = trimmed;
  if (subType === 'intent') ctx.variables.intent = trimmed;
  if (subType === 'language') ctx.variables.language = trimmed;
  return trimmed;
}

function evaluateCondition(
  node: WorkflowNode,
  ctx: ExecutionContext
): string {
  const field = (node.data?.field ?? 'sentiment') as string;
  const operator = (node.data?.operator ?? 'equals') as string;
  const compareValue = String(node.data?.compareValue ?? '').toLowerCase();
  const actualValue = String(ctx.variables[field] ?? '').toLowerCase();

  let match = false;
  if (operator === 'equals') match = actualValue === compareValue;
  else if (operator === 'contains') match = actualValue.includes(compareValue);
  else if (operator === 'not_equals') match = actualValue !== compareValue;

  return match ? 'output-1' : 'output-2';
}

async function executeActionNode(
  node: WorkflowNode,
  ctx: ExecutionContext
): Promise<void> {
  const subType = node.data?.subType ?? 'send_message';
  let actionMessage = (node.data?.message ?? '') as string;
  actionMessage = actionMessage.replace(/\{\{customer_name\}\}/g, '客戶');
  if (subType === 'send_message' || subType === 'quick_reply') {
    if (ctx.dryRun) return;
    const buttons = (node.data?.buttons ?? []) as { label: string; value: string }[];
    if (buttons.length > 0) {
      await replyMessage(
        ctx.replyToken,
        actionMessage,
        buttons.map((b) => ({ label: b.label, text: b.value })),
        ctx.credentials
      );
    } else {
      await replyMessage(ctx.replyToken, actionMessage, undefined, ctx.credentials);
    }
    if (!ctx.dryRun && ctx.contactId) {
      await insertConversationMessage(ctx.contactId, actionMessage, 'assistant', {
        status: 'ai_handled',
        resolved_by: 'ai',
        is_resolved: true,
      });
    }
  } else if (subType === 'add_tag') {
    if (ctx.dryRun || !ctx.contactId) return;
    const tags = String(node.data?.tags ?? '');
    if (tags) {
      const admin = getSupabaseAdmin();
      const { data: contact } = await admin
        .from('contacts')
        .select('tags')
        .eq('id', ctx.contactId)
        .single();
      const existing = (contact?.tags ?? []) as string[];
      const toAdd = tags.split(/[,，]/).map((t) => t.trim()).filter(Boolean);
      const merged = [...new Set([...existing, ...toAdd])];
      await admin.from('contacts').update({ tags: merged }).eq('id', ctx.contactId);
    }
  }
}

async function executeRoutingNode(
  node: WorkflowNode,
  ctx: ExecutionContext
): Promise<void> {
  const subType = node.data?.subType ?? 'to_human';
  if (subType === 'to_human') {
    if (ctx.dryRun) return;
    const handoffMsg = '您的需求已轉接專人處理，請稍候。';
    await insertConversationMessage(ctx.contactId, handoffMsg, 'assistant', {
      status: 'needs_human',
      resolved_by: 'unresolved',
      is_resolved: false,
    });
    await replyMessage(ctx.replyToken, handoffMsg, undefined, ctx.credentials);
  }
}

async function executeEndNode(): Promise<void> {
  // 結束節點：可在此標記 conversation resolved 等
}

export class WorkflowEngine {
  static async execute(
    workflow: WorkflowData,
    ctx: ExecutionContext
  ): Promise<ExecutionResult> {
    const { nodes, edges } = workflow;
    const executed: ExecutedNodeRecord[] = [];

    const triggerNodes = findTriggerNodes(nodes, edges);
    if (triggerNodes.length === 0) {
      return { success: false, executedNodes: executed, error: '無觸發節點' };
    }

    if (!ctx.dryRun && ctx.contactId) {
      await insertConversationMessage(ctx.contactId, ctx.message, 'user');
    }

    let queue: { nodeId: string; sourceHandle?: string }[] = triggerNodes.map(
      (n) => ({ nodeId: n.id })
    );
    const visited = new Set<string>();

    while (queue.length > 0) {
      const { nodeId, sourceHandle } = queue.shift()!;
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      const node = getNodeById(nodes, nodeId);
      if (!node) continue;

      try {
        if (node.type === 'trigger') {
          if (!checkTrigger(node, ctx)) continue;
          executed.push({ nodeId, type: 'trigger', subType: node.data?.subType });
        } else if (node.type === 'ai') {
          const output = await executeAINode(node, ctx);
          executed.push({
            nodeId,
            type: 'ai',
            subType: node.data?.subType,
            output,
          });
        } else if (node.type === 'condition') {
          const chosenHandle = evaluateCondition(node, ctx);
          executed.push({
            nodeId,
            type: 'condition',
            output: chosenHandle,
          });
          const outgoing = getOutgoingEdges(nodeId, edges, chosenHandle);
          for (const e of outgoing) {
            queue.push({ nodeId: e.target });
          }
          continue;
        } else if (node.type === 'action') {
          await executeActionNode(node, ctx);
          executed.push({ nodeId, type: 'action', subType: node.data?.subType });
        } else if (node.type === 'routing') {
          await executeRoutingNode(node, ctx);
          executed.push({ nodeId, type: 'routing', subType: node.data?.subType });
        } else if (node.type === 'end') {
          await executeEndNode();
          executed.push({ nodeId, type: 'end', subType: node.data?.subType });
          continue;
        }

        const outgoing = getOutgoingEdges(nodeId, edges);
        for (const e of outgoing) {
          queue.push({ nodeId: e.target });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          success: false,
          executedNodes: executed,
          error: msg,
        };
      }
    }

    return { success: true, executedNodes: executed };
  }
}
