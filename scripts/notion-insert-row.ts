/**
 * Insert a new row into a Notion database using natural-language property values.
 * Handles property name matching (case-insensitive, trimmed) and validation.
 *
 * Usage:
 *   npx tsx scripts/notion-insert-row.ts <databaseIdOrUrl> "Prop1=value1" "Prop2=value2" ...
 *   or with JSON: npx tsx scripts/notion-insert-row.ts <databaseIdOrUrl> '{"Title":"My row","Status":"Done"}'
 *
 * Requires NOTION_API_KEY in env (or .env.local with dotenv).
 */

const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

function getApiKey(): string {
  const key = process.env.NOTION_API_KEY;
  if (!key) {
    console.error('Missing NOTION_API_KEY. Set it in .env.local or environment.');
    process.exit(1);
  }
  return key;
}

function parseDatabaseId(input: string): string {
  const trimmed = input.trim();
  // URL: https://notion.so/workspace/xxx or https://www.notion.so/xxx (with or without dashes)
  const match = trimmed.match(/(?:notion\.so\/|notion\.so\/[^/]+\/)([a-f0-9-]{32,36})/i)
    ?? trimmed.match(/([a-f0-9-]{32,36})/);
  if (match) return match[1].replace(/-/g, '');
  return trimmed;
}

type NotionPropType =
  | 'title' | 'rich_text' | 'number' | 'select' | 'multi_select'
  | 'date' | 'checkbox' | 'url' | 'email' | 'phone_number' | 'formula' | 'rollup' | 'relation' | 'files';

interface DbSchema {
  [propName: string]: { type: NotionPropType; select?: { options: { name: string }[] }; multi_select?: { options: { name: string }[] } };
}

async function fetchDatabaseSchema(apiKey: string, databaseId: string): Promise<DbSchema> {
  const res = await fetch(`${NOTION_API}/databases/${databaseId}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Notion API error ${res.status}: ${body}`);
  }
  const data = await res.json();
  const schema: DbSchema = {};
  for (const [name, prop] of Object.entries(data.properties || {}) as [string, Record<string, unknown>][]) {
    schema[name] = {
      type: (prop.type as NotionPropType) ?? 'rich_text',
      select: prop.select as DbSchema[string]['select'],
      multi_select: prop.multi_select as DbSchema[string]['multi_select'],
    };
  }
  return schema;
}

function normalizeKey(key: string): string {
  return key.trim().toLowerCase().replace(/\s+/g, ' ');
}

function matchPropertyName(userKey: string, schema: DbSchema): string | null {
  const n = normalizeKey(userKey);
  const exact = Object.keys(schema).find((k) => normalizeKey(k) === n);
  if (exact) return exact;
  return Object.keys(schema).find((k) => normalizeKey(k).includes(n) || n.includes(normalizeKey(k))) ?? null;
}

function buildPropertyPayload(
  schemaKey: string,
  type: NotionPropType,
  value: string,
  schema: DbSchema
): Record<string, unknown> | null {
  const v = value.trim();
  const def = schema[schemaKey];
  if (!def) return null;

  if (['formula', 'rollup', 'relation'].includes(type)) return null;
  switch (type) {
    case 'title':
    case 'rich_text':
      return { [type]: [{ type: 'text', text: { content: v || ' ' } }] };
    case 'number': {
      const num = Number(v);
      if (Number.isNaN(num)) return null;
      return { number: num };
    }
    case 'select': {
      const options = def.select?.options?.map((o) => o.name) ?? [];
      const name = options.find((o) => o.toLowerCase() === v.toLowerCase()) ?? v;
      return { select: { name } };
    }
    case 'multi_select': {
      const options = def.multi_select?.options?.map((o) => o.name) ?? [];
      const names = v.split(/[,，、;；]/).map((s) => s.trim()).filter(Boolean);
      const resolved = names.map((n) => options.find((o) => o.toLowerCase() === n.toLowerCase()) ?? n);
      return { multi_select: resolved.map((name) => ({ name })) };
    }
    case 'date': {
      const dateStr = v;
      const iso = /^\d{4}-\d{2}-\d{2}/.test(dateStr)
        ? dateStr
        : new Date(dateStr).toISOString().slice(0, 10);
      if (iso === 'Invalid Date') return null;
      return { date: { start: iso } };
    }
    case 'checkbox':
      return { checkbox: /^(1|true|yes|on|是|✓)$/i.test(v) };
    case 'url':
    case 'email':
    case 'phone_number':
      return { [type]: v || null };
    default:
      return { rich_text: [{ type: 'text', text: { content: v || ' ' } }] };
  }
}

function parseArgs(args: string[]): { databaseId: string; props: Record<string, string> } {
  if (args.length < 2) {
    console.error('Usage: notion-insert-row.ts <databaseIdOrUrl> "Key=value" ... or \'{"Key":"value"}\'');
    process.exit(1);
  }
  const databaseId = parseDatabaseId(args[0]);
  const props: Record<string, string> = {};
  const rest = args.slice(1);
  if (rest.length === 1 && (rest[0].startsWith('{') || rest[0].startsWith('['))) {
    try {
      const parsed = JSON.parse(rest[0]) as Record<string, string>;
      Object.assign(props, parsed);
    } catch {
      console.error('Invalid JSON for properties.');
      process.exit(1);
    }
  } else {
    for (const pair of rest) {
      const idx = pair.indexOf('=');
      if (idx <= 0) continue;
      const key = pair.slice(0, idx).trim();
      const val = pair.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (key) props[key] = val;
    }
  }
  if (Object.keys(props).length === 0) {
    console.error('No properties provided.');
    process.exit(1);
  }
  return { databaseId, props };
}

async function main(): Promise<void> {
  const apiKey = getApiKey();
  const { databaseId, props: rawProps } = parseArgs(process.argv.slice(2));

  const schema = await fetchDatabaseSchema(apiKey, databaseId);
  const properties: Record<string, unknown> = {};
  const errors: string[] = [];

  for (const [userKey, value] of Object.entries(rawProps)) {
    const schemaKey = matchPropertyName(userKey, schema);
    if (!schemaKey) {
      errors.push(`Unknown property: "${userKey}". Available: ${Object.keys(schema).join(', ')}`);
      continue;
    }
    const def = schema[schemaKey];
    const payload = buildPropertyPayload(schemaKey, def.type, value, schema);
    if (payload === null) {
      errors.push(`Invalid value for "${schemaKey}" (type: ${def.type}): ${value}`);
      continue;
    }
    properties[schemaKey] = payload;
  }

  if (errors.length > 0) {
    errors.forEach((e) => console.error(e));
    process.exit(1);
  }

  const res = await fetch(`${NOTION_API}/pages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Notion API error ${res.status}: ${body}`);
    process.exit(1);
  }

  const page = await res.json();
  console.log('Created page:', (page as { url?: string }).url ?? page.id);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
