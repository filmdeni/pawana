import { createClient } from '@/lib/supabase/server'
import LoginForm from './LoginForm'

async function getRecentAvatars(): Promise<string[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('profiles')
      .select('avatar_url')
      .not('avatar_url', 'is', null)
      .neq('avatar_url', '')
      .order('created_at', { ascending: false })
      .limit(5)
    return (data ?? []).map((r: { avatar_url: string }) => r.avatar_url).filter(Boolean)
  } catch {
    return []
  }
}

export default async function LoginPage() {
  const avatarUrls = await getRecentAvatars()
  return <LoginForm avatarUrls={avatarUrls} />
}
