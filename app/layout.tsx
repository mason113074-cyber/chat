import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CustomerAIPro - AI 智能客服平台',
  description: 'CustomerAIPro 是一個整合 LINE、OpenAI 的 AI 智能客服平台',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body className="antialiased">{children}</body>
    </html>
  );
}
