import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Auth() {
  const { login, signUp, loginWithGoogle, authLoading } = useAuth();
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setMessage(null);

    try {
      await loginWithGoogle();
    } catch (error) {
      setMessage({
        type: "error",
        text: `Google login failed: ${error.message}`,
      });
    }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await login(email, password);
    } catch (error) {
      const message = /verify|confirmed|confirm/i.test(error.message)
        ? "Please verify your email before logging in. Check the email you used to sign up."
        : `Login failed: ${error.message}`;
      setMessage({ type: "error", text: message });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const data = await signUp(email, password);

      if (data.requires_confirmation) {
        setMessage({
          type: "success",
          text: "Account created. Check your email to verify your account before logging in.",
        });
        setTab("login");
        return;
      }

      if (data.user) {
        setMessage({
          type: "success",
          text: "Account created. You can log in now.",
        });
      } else {
        setMessage({
          type: "warning",
          text: "Signup returned no user — check Supabase logs.",
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: `Signup failed: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const messageStyles = {
    error: "text-red-600",
    success: "text-green-600",
    warning: "text-amber-600",
  };

  return (
    <div className="mx-auto mt-16 w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex border-b border-gray-200" role="tablist" aria-label="Authentication options">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "login"}
          aria-controls="auth-form"
          className={`flex-1 pb-2 text-sm font-medium ${
            tab === "login"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500"
          }`}
          onClick={() => {
            setTab("login");
            setMessage(null);
          }}
        >
          Login
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "signup"}
          aria-controls="auth-form"
          className={`flex-1 pb-2 text-sm font-medium ${
            tab === "signup"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500"
          }`}
          onClick={() => {
            setTab("signup");
            setMessage(null);
          }}
        >
          Sign Up
        </button>
      </div>

      <form
        id="auth-form"
        className="space-y-4"
        aria-busy={loading || authLoading}
        onSubmit={tab === "login" ? handleLogin : handleSignUp}
      >
        {tab === "login" && (
          <>
            <button
              type="button"
              disabled={loading || authLoading}
              onClick={handleGoogleLogin}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <span className="text-base font-bold text-blue-600">G</span>
              Continue with Google
            </button>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="h-px flex-1 bg-gray-200" />
              or use email
              <span className="h-px flex-1 bg-gray-200" />
            </div>
          </>
        )}
        <div>
          <label htmlFor="auth-email" className="mb-1 block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="auth-email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="auth-password" className="mb-1 block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="auth-password"
            name="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {message && (
          <p
            role={message.type === "error" ? "alert" : undefined}
            aria-live="polite"
            className={`text-sm ${messageStyles[message.type]}`}
          >
            {message.text}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || authLoading}
          className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Please wait…" : tab === "login" ? "Log In" : "Sign Up"}
        </button>
      </form>
    </div>
  );
}
