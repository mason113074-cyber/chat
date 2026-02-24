import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock getSupabaseAdmin before importing the route
const mockDelete = vi.fn();
const mockFrom = vi.fn(() => ({
  delete: vi.fn(() => ({
    eq: vi.fn(() => ({
      lt: vi.fn(() => mockDelete()),
    })),
  })),
}));

vi.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: () => ({ from: mockFrom }),
}));

const { GET } = await import('../route');

function makeRequest(authHeader?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (authHeader) headers['authorization'] = authHeader;
  return new NextRequest('http://localhost/api/cron/cleanup-webhook-events', { headers });
}

describe('GET /api/cron/cleanup-webhook-events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.WEBHOOK_CLEANUP_CRON_SECRET;
  });

  it('returns 401 when no secret env is configured', async () => {
    const res = await GET(makeRequest('Bearer any-secret'));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 when no Authorization header is provided', async () => {
    process.env.WEBHOOK_CLEANUP_CRON_SECRET = 'test-secret';
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it('returns 401 when wrong secret is provided', async () => {
    process.env.WEBHOOK_CLEANUP_CRON_SECRET = 'correct-secret';
    const res = await GET(makeRequest('Bearer wrong-secret'));
    expect(res.status).toBe(401);
  });

  it('returns 200 with deletion counts when correct secret is provided', async () => {
    process.env.WEBHOOK_CLEANUP_CRON_SECRET = 'correct-secret';
    mockDelete.mockResolvedValue({ count: 5, error: null });

    const res = await GET(makeRequest('Bearer correct-secret'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.deleted).toHaveProperty('processed');
    expect(body.deleted).toHaveProperty('failed');
    expect(body.deleted).toHaveProperty('pending');
    expect(typeof body.total).toBe('number');
    expect(body.timestamp).toBeDefined();
  });

  it('returns 207 with errors when Supabase delete fails', async () => {
    process.env.WEBHOOK_CLEANUP_CRON_SECRET = 'correct-secret';
    mockDelete.mockResolvedValue({ count: null, error: { message: 'DB error' } });

    const res = await GET(makeRequest('Bearer correct-secret'));
    expect(res.status).toBe(207);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.errors).toBeDefined();
  });
});
