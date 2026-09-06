import Auth from "./component/Auth.jsx";
import Dashboard from "./component/Dashboard.jsx";
import ProfileSetup from "./component/ProfileSetup.jsx";
import { useAuth } from "./context/AuthContext.jsx";

export default function App() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">QuadCoach</h1>
      </header>

      <main className="px-6 py-8">
        {loading ? (
          <p className="text-center text-gray-500">Loading…</p>
        ) : user ? (
          user.profile_complete ? (
            <Dashboard />
          ) : (
            <ProfileSetup />
          )
        ) : (
          <Auth />
        )}
      </main>
    </div>
  );
}
