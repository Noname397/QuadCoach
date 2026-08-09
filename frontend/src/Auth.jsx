import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function Auth({ onLogin }) {
  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setMessage({ type: 'error', text: `Login failed: ${error.message}` })
    } else {
      onLogin(data.user)
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    const { data, error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) {
      setMessage({ type: 'error', text: `Signup failed: ${error.message}` })
    } else if (data.user) {
      setMessage({ type: 'success', text: 'Account created. You can log in now.' })
    } else {
      setMessage({ type: 'warning', text: 'Signup returned no user — check Supabase logs.' })
    }
  }

  const messageStyles = {
    error: 'text-red-600',
    success: 'text-green-600',
    warning: 'text-amber-600',
  }

  return (
    <div className="mx-auto mt-16 w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex border-b border-gray-200">
        <button
          className={`flex-1 pb-2 text-sm font-medium ${
            tab === 'login' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'
          }`}
          onClick={() => {
            setTab('login')
            setMessage(null)
          }}
        >
          Login
        </button>
        <button
          className={`flex-1 pb-2 text-sm font-medium ${
            tab === 'signup' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'
          }`}
          onClick={() => {
            setTab('signup')
            setMessage(null)
          }}
        >
          Sign Up
        </button>
      </div>

      <form className="space-y-4" onSubmit={tab === 'login' ? handleLogin : handleSignUp}>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {message && <p className={`text-sm ${messageStyles[message.type]}`}>{message.text}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Please wait…' : tab === 'login' ? 'Log In' : 'Sign Up'}
        </button>
      </form>
    </div>
  )
}
