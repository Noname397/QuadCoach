import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import ProfileSetup from "./ProfileSetup.jsx";
import { useAuth } from "../context/AuthContext.jsx";

function Avatar({ name, url, sizeClass }) {
  const [imageFailed, setImageFailed] = useState(false);
  const initial = name.charAt(0).toUpperCase();

  if (!url || imageFailed) {
    return (
      <div
        className={`flex ${sizeClass} items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700`}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={`${name}'s profile`}
      onError={() => setImageFailed(true)}
      className={`${sizeClass} rounded-full object-cover`}
    />
  );
}

function ProfileView({ user }) {
  const profileName = user.profile?.name || user.email;
  const avatarUrl = user.profile?.profile_picture_url;

  return (
    <section className="max-w-2xl">
      <p className="mb-2 text-sm font-medium uppercase tracking-wide text-blue-600">
        Profile
      </p>
      <h2 className="mb-2 text-2xl font-semibold text-gray-900">
        Welcome back, {profileName}
      </h2>
      <p className="mb-6 text-gray-600">Your account is ready for QuadCoach.</p>

      <div className="flex items-center justify-between gap-5 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-5">
          <Avatar
            name={profileName}
            url={avatarUrl}
            sizeClass="h-20 w-20 text-2xl"
          />
          <div>
            <p className="text-lg font-semibold text-gray-900">{profileName}</p>
            <p className="mt-1 text-sm text-gray-500">Your QuadCoach profile</p>
          </div>
        </div>
        <Link
          to="/profile/edit"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Edit profile
        </Link>
      </div>
    </section>
  );
}

function ChatsView() {
  return (
    <section className="max-w-2xl">
      <p className="mb-2 text-sm font-medium uppercase tracking-wide text-blue-600">
        Chats
      </p>
      <h2 className="mb-2 text-2xl font-semibold text-gray-900">
        Your coaching conversations
      </h2>
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
        <p className="font-medium text-gray-900">No chats yet</p>
        <p className="mt-2 text-sm text-gray-500">
          Your coaching conversations will appear here.
        </p>
      </div>
    </section>
  );
}

export default function Dashboard({ menuOpen, onMenuClose }) {
  const { user } = useAuth();
  const location = useLocation();
  const activeTab = location.pathname === "/chats" ? "chats" : "profile";
  const editingProfile = location.pathname === "/profile/edit";

  return (
    <div className="-mx-6 flex max-w-6xl flex-col overflow-hidden rounded-lg border border-gray-200 bg-gray-50 shadow-sm md:flex-row">
      <Sidebar isOpen={menuOpen} onClose={onMenuClose} />
      <main className="min-w-0 flex-1 p-6 sm:p-8">
        {activeTab === "profile" ? (
          editingProfile ? (
            <ProfileSetup editing />
          ) : (
            <ProfileView user={user} />
          )
        ) : (
          <ChatsView />
        )}
      </main>
    </div>
  );
}
