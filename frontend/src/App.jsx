import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Auth from './Auth.jsx'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">QuadCoach</h1>
      </header>

      <main className="px-6 py-8">
        {loading ? (
          <p className="text-center text-gray-500">Loading…</p>
        ) : user ? (
          <div className="mx-auto max-w-sm rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
            <p className="mb-4 text-gray-700">
              Logged in as <span className="font-medium">{user.email}</span>
            </p>
            <button
              onClick={handleLogout}
              className="rounded-md bg-gray-800 px-3 py-2 text-sm font-medium text-white hover:bg-gray-900"
            >
              Log Out
            </button>
          </div>
        ) : (
          <Auth onLogin={setUser} />
        )}
      </main>
    </div>
  )
}
