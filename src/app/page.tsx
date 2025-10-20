import { redirect } from 'next/navigation'

export default function Home() {
  // The middleware will handle authentication and redirect to /login if necessary.
  redirect('/dashboard');
}
