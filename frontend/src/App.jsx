import { useCallback, useEffect, useState } from "react";
import Auth from "./Auth.jsx";
import Dashboard from "./Dashboard.jsx";
import ProfileSetup from "./ProfileSetup.jsx";
import { supabase } from "./supabaseClient.js";

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
            setUser({ ...parsedUser, ...data.user, ...data });
            localStorage.setItem(
              "quadcoach-user",
              JSON.stringify({ ...parsedUser, ...data.user, ...data }),
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

  const handleLogin = useCallback(async (userData) => {
    setLoading(true);
    localStorage.setItem("quadcoach-user", JSON.stringify(userData));

    try {
      const response = await fetch(`${API_URL}/api/me`, {
        headers: { Authorization: `Bearer ${userData.access_token}` },
      });
      if (!response.ok) {
        throw new Error("Could not load the user profile.");
      }

      const data = await response.json();
      const hydratedUser = { ...userData, ...data.user, ...data };
      setUser(hydratedUser);
      localStorage.setItem("quadcoach-user", JSON.stringify(hydratedUser));
    } catch (error) {
      console.error("Could not load profile status:", error);
      setUser(null);
      localStorage.removeItem("quadcoach-user");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleProfileComplete = useCallback(
    (profile) => {
      const updatedUser = { ...user, profile, profile_complete: true };
      setUser(updatedUser);
      localStorage.setItem("quadcoach-user", JSON.stringify(updatedUser));
    },
    [user],
  );

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
      if (supabase) {
        await supabase.auth.signOut();
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
          user.profile_complete ? (
            <Dashboard user={user} onLogout={handleLogout} />
          ) : (
            <ProfileSetup
              user={user}
              onComplete={handleProfileComplete}
              onLogout={handleLogout}
            />
          )
        ) : (
          <Auth onLogin={handleLogin} />
        )}
      </main>
    </div>
  );
}
