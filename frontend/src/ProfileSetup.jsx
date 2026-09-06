import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const experienceLevels = ["Student", "Entry level", "Mid level", "Senior", "Executive"];

export default function ProfileSetup({ user, onComplete, onLogout }) {
  const [form, setForm] = useState({
    name: "",
    target_role: "",
    experience_level: "",
    profile_picture: "",
    target_company: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.access_token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save your profile.");
      onComplete(data.profile);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-8 w-full max-w-2xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-8">
        <p className="mb-2 text-sm font-medium uppercase tracking-wide text-blue-600">First things first</p>
        <h2 className="text-2xl font-semibold text-gray-900">Set up your profile</h2>
        <p className="mt-2 text-gray-600">Tell us what you are working toward so QuadCoach can tailor your experience.</p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Name <span className="text-red-500">*</span></span>
            <input name="name" required value={form.name} onChange={updateField} className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </label>
          <div>
            <span className="mb-1 block text-sm font-medium text-gray-700">Email</span>
            <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600">{user.email}</p>
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Target role <span className="text-red-500">*</span></span>
            <input name="target_role" required value={form.target_role} onChange={updateField} placeholder="e.g. Product Designer" className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Experience level <span className="text-red-500">*</span></span>
            <select name="experience_level" required value={form.experience_level} onChange={updateField} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="">Select level</option>
              {experienceLevels.map((level) => <option key={level}>{level}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Profile picture <span className="font-normal text-gray-400">(optional)</span></span>
            <input name="profile_picture" type="url" value={form.profile_picture} onChange={updateField} placeholder="https://..." className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Target company <span className="font-normal text-gray-400">(optional)</span></span>
            <input name="target_company" value={form.target_company} onChange={updateField} placeholder="e.g. Acme Inc." className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </label>
        </div>

        <div className="rounded-md bg-gray-50 p-4 text-sm text-gray-600">
          <p><span className="font-medium text-gray-800">Auth provider:</span> {user.auth_provider || "email"}</p>
          <p className="mt-1 break-all"><span className="font-medium text-gray-800">User ID:</span> {user.id}</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex items-center justify-between gap-4">
          <button type="button" onClick={onLogout} className="text-sm font-medium text-gray-500 hover:text-gray-800">Log out</button>
          <button type="submit" disabled={loading} className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{loading ? "Saving..." : "Continue to QuadCoach"}</button>
        </div>
      </form>
    </div>
  );
}