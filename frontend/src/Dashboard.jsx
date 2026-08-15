export default function Dashboard({ user, onLogout }) {
  return (
    <div className="mx-auto max-w-xl rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
      <p className="mb-2 text-sm font-medium uppercase tracking-wide text-blue-600">
        Dashboard
      </p>
      <h2 className="mb-4 text-2xl font-semibold text-gray-900">
        Welcome back, {user.email}
      </h2>
      <p className="mb-6 text-gray-600">
        Your React frontend is now authenticated through the Python backend and protected by a bearer token check.
      </p>

      <div className="rounded-md bg-gray-50 p-4 text-sm text-gray-700">
        <p className="font-medium text-gray-900">Session info</p>
        <p className="mt-2">User ID: {user.id}</p>
        <p>Email: {user.email}</p>
      </div>

      <button
        onClick={onLogout}
        className="mt-6 rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
      >
        Log Out
      </button>
    </div>
  )
}
