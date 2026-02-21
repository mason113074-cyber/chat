import * as fs from 'fs';
import * as path from 'path';
import { defineConfig, devices } from '@playwright/test';

function loadEnvLocal(): void {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const buf = fs.readFileSync(envPath);
  const isUtf16 = (buf[0] === 0xff && buf[1] === 0xfe) || (buf[0] === 0xfe && buf[1] === 0xff);
  let content = isUtf16 ? buf.toString('utf16le') : buf.toString('utf-8');
  content = content.replace(/\uFEFF/g, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  for (const line of content.split('\n')) {
    const trimmed = line.trim().replace(/\0/g, '');
    if (trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const eq = trimmed.indexOf('=');
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!key) continue;
    if (value.startsWith('"') && value.endsWith('"')) {
      process.env[key] = value.slice(1, -1).replace(/\\n/g, '\n');
    } else if (value.startsWith("'") && value.endsWith("'")) {
      process.env[key] = value.slice(1, -1);
    } else {
      process.env[key] = value;
    }
  }
}

loadEnvLocal();
// E2E_BASE_URL 給 production 用（.env.local 通常不設，cross-env 傳入才生效）
const baseURL = process.env.E2E_BASE_URL || process.env.TEST_BASE_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
  webServer: baseURL.startsWith('http://localhost')
    ? {
        command: 'npm run dev',
        url: baseURL,
        reuseExistingServer: true,
        env: { ...process.env } as Record<string, string>,
      }
    : undefined,
});
