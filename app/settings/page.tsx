import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SettingsForm from './SettingsForm';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data } = await supabase
    .from('users')
    .select('system_prompt')
    .eq('id', user.id)
    .maybeSingle();

  const systemPrompt = data?.system_prompt ?? '';

  return (
    <div className="mx-auto w-full max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900">{'\u8A2D\u5B9A'}</h1>
      <p className="mt-1 text-gray-600">
        {'\u81EA\u8A02 AI \u7CFB\u7D71\u63D0\u793A\u8A5E\uFF0C\u7ACB\u5373\u5F71\u97FF\u56DE\u8986\u5167\u5BB9'}
      </p>

      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <SettingsForm
          userId={user.id}
          userEmail={user.email ?? ''}
          initialPrompt={systemPrompt}
        />
      </div>
    </div>
  );
}
