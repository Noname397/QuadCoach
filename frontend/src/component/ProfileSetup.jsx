import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProfileSetup({ editing = false, onCancel }) {
  const { user, updateProfile, logout } = useAuth();
  const [form, setForm] = useState({
    name: user.profile?.name || "",
    profile_picture: null,
    resume: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateField = (event) => {
    if (event.target.type !== "file") {
      setForm((current) => ({
        ...current,
        [event.target.name]: event.target.value,
      }));
      return;
    }

    const file = event.target.files?.[0] || null;
    if (
      file &&
      ((event.target.name === "profile_picture" &&
        !["image/jpeg", "image/png", "image/webp"].includes(file.type)) ||
        (event.target.name === "resume" && file.type !== "application/pdf") ||
        file.size > 5 * 1024 * 1024)
    ) {
      setError(
        event.target.name === "resume"
          ? "Choose a PDF CV up to 5 MB."
          : "Choose a JPEG, PNG, or WebP image up to 5 MB.",
      );
      event.target.value = "";
      return;
    }
    setError("");
    setForm((current) => ({ ...current, [event.target.name]: file }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const body = new FormData();
      body.append("name", form.name);
      if (form.profile_picture)
        body.append("profile_picture", form.profile_picture);
      if (form.resume) body.append("resume", form.resume);

      await updateProfile(body);
      onCancel?.();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-8 w-full max-w-2xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-8">
        <p className="mb-2 text-sm font-medium uppercase tracking-wide text-blue-600">
          {editing ? "Profile settings" : "First things first"}
        </p>
        <h2 className="text-2xl font-semibold text-gray-900">
          {editing ? "Edit your profile" : "Set up your profile"}
        </h2>
        <p className="mt-2 text-gray-600">
          {editing
            ? "Keep your name, photo, and CV up to date."
            : "Add the details you want to use in QuadCoach."}
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Name <span className="text-red-500">*</span>
            </span>
            <input
              name="name"
              required
              value={form.name}
              onChange={updateField}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              CV / resume{" "}
              <span className="font-normal text-gray-400">(optional, PDF)</span>
            </span>
            <input
              name="resume"
              type="file"
              accept="application/pdf,.pdf"
              onChange={updateField}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {user.profile?.resume_filename && !form.resume && (
              <p className="mt-1 text-xs text-gray-500">
                Current CV: {user.profile.resume_filename}
              </p>
            )}
          </label>
          <div>
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </span>
            <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600">
              {user.email}
            </p>
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Profile picture{" "}
              <span className="font-normal text-gray-400">(optional)</span>
            </span>
            <input
              name="profile_picture"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={updateField}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {!editing && (
              <button
                type="button"
                onClick={logout}
                className="text-sm font-medium text-gray-500 hover:text-gray-800"
              >
                Log out
              </button>
            )}
            {editing && (
              <button
                type="button"
                onClick={onCancel}
                className="text-sm font-medium text-gray-500 hover:text-gray-800"
              >
                Cancel
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading
              ? "Saving..."
              : editing
                ? "Save changes"
                : "Continue to QuadCoach"}
          </button>
        </div>
      </form>
    </div>
  );
}