import { redirect } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'

export default async function RootPage() {
  const authenticated = await isAuthenticated()

  redirect('/dashboard')

}
