import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import Link from 'next/link'

/**
 * Root route — server component.
 * Auth users redirect; others get a bare landing (UI rebuild pending).
 */
export default async function RootPage() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // Server components cannot set cookies — proxy handles this
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    redirect(profile?.onboarding_completed ? '/home' : '/onboarding')
  }

  return (
    <main className="min-h-screen bg-background text-on-surface flex flex-col items-center justify-center p-8">
      <p className="text-xs font-label-caps tracking-widest text-primary-fixed mb-4">
        LOCKEDIN
      </p>
      <h1 className="text-3xl font-headline-md text-primary mb-3 text-center">
        Frontend rebuild in progress
      </h1>
      <p className="text-sm text-on-surface-variant max-w-md text-center mb-8 leading-relaxed">
        Presentation layer was stripped clean. Backend features (auth, sessions, tasks, chat,
        proof, punishment) remain. Sign in to reach the temporary shell.
      </p>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="px-6 py-3 rounded-full bg-primary-fixed text-on-primary-fixed text-sm font-label-caps tracking-wide"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="px-6 py-3 rounded-full border border-outline-variant text-sm font-label-caps tracking-wide text-on-surface"
        >
          Create account
        </Link>
      </div>
    </main>
  )
}
