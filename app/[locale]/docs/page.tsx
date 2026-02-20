import { redirect } from '@/i18n/navigation';

type Props = { params: Promise<{ locale: string }> };

export default async function DocsPage({ params }: Props) {
  const { locale } = await params;
  redirect({ href: '/help', locale: locale as 'zh-TW' | 'en' });
}
