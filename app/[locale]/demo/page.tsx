import { redirect } from 'next/navigation';

type Props = { params: Promise<{ locale: string }> };

/** Demo is no longer promoted; redirect to Help Center. */
export default async function DemoRedirectPage({ params }: Props) {
  const { locale } = await params;
  redirect(`/${locale}/help`);
}
