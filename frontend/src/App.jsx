import { useEffect, useState } from "react";
import Auth from "./Auth.jsx";
import Dashboard from "./Dashboard.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("quadcoach-user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      if (parsedUser.access_token) {
        fetch(`${API_URL}/api/me`, {
          headers: {
            Authorization: `Bearer ${parsedUser.access_token}`,
          },
        })
          .then(async (response) => {
            if (!response.ok) {
              throw new Error("Invalid session");
            }

            const data = await response.json();
            setUser({ ...parsedUser, ...data.user });
            localStorage.setItem(
              "quadcoach-user",
              JSON.stringify({ ...parsedUser, ...data.user }),
            );
          })
          .catch(() => {
            localStorage.removeItem("quadcoach-user");
            setUser(null);
          })
          .finally(() => setLoading(false));
        return;
      }
    }

    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("quadcoach-user", JSON.stringify(userData));
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("quadcoach-user");
      if (token) {
        const parsed = JSON.parse(token);
        await fetch(`${API_URL}/api/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${parsed.access_token || ""}`,
          },
        });
      }
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
      localStorage.removeItem("quadcoach-user");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">QuadCoach</h1>
      </header>

      <main className="px-6 py-8">
        {loading ? (
          <p className="text-center text-gray-500">Loading…</p>
        ) : user ? (
          <Dashboard user={user} onLogout={handleLogout} />
        ) : (
          <Auth onLogin={handleLogin} />
        )}
      </main>
    </div>
  );
}
