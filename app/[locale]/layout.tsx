import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale, setRequestLocale } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { SetLocaleHtml } from '@/components/SetLocaleHtml';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const messages = await getMessages();
  const currentLocale = await getLocale();

  return (
    <>
      <SetLocaleHtml locale={currentLocale} />
      <NextIntlClientProvider locale={currentLocale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </>
  );
}
