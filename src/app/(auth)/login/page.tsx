'use client';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClient } from '../../../lib/supabase/cliant';

export default function Login() {
  const supabase = createClient();

  return (
    <div style={{ width: '100%', maxWidth: '420px', margin: 'auto', paddingTop: '50px' }}>
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        providers={['google', 'github']} // お好みのプロバイダーを追加
        redirectTo={`${process.env.NEXT_PUBLIC_SITE_URL}/auth/route`}
      />
    </div>
  );
}