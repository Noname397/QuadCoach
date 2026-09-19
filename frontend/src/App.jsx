import Auth from "./component/Auth.jsx";
import Dashboard from "./component/Dashboard.jsx";
import ProfileSetup from "./component/ProfileSetup.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { Navigate, Route, Routes } from "react-router-dom";
import { useState } from "react";

export default function App() {
  const { user, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const showMenu = Boolean(user?.profile_complete);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          {showMenu && (
            <button
              type="button"
              aria-label={
                menuOpen ? "Close navigation menu" : "Open navigation menu"
              }
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((isOpen) => !isOpen)}
              className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-md text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 md:hidden"
            >
              <span className="h-0.5 w-5 bg-current" />
              <span className="h-0.5 w-5 bg-current" />
              <span className="h-0.5 w-5 bg-current" />
            </button>
          )}
          <h1 className="text-xl font-semibold text-gray-900">QuadCoach</h1>
        </div>
      </header>

      <main className="px-6 pb-8 pt-0">
        {loading ? (
          <p className="text-center text-gray-500">Loading…</p>
        ) : user ? (
          user.profile_complete ? (
            <Routes>
              <Route
                path="/profile"
                element={
                  <Dashboard
                    menuOpen={menuOpen}
                    onMenuClose={() => setMenuOpen(false)}
                  />
                }
              />
              <Route
                path="/chats"
                element={
                  <Dashboard
                    menuOpen={menuOpen}
                    onMenuClose={() => setMenuOpen(false)}
                  />
                }
              />
              <Route path="*" element={<Navigate to="/profile" replace />} />
            </Routes>
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
