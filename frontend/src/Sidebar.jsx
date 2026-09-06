import { useState } from "react";

const navigationItems = [
  { id: "profile", label: "Profile", icon: "P" },
  { id: "chats", label: "Chats", icon: "C" },
];

export default function Sidebar({ activeTab, onTabChange, user, onLogout }) {
  const [imageFailed, setImageFailed] = useState(false);
  const profileName = user.profile?.name || user.email || "Q";
  const avatarUrl = user.profile?.profile_picture_url;

  return (
    <aside className="flex w-full flex-col border-b border-gray-200 bg-white md:min-h-[calc(100vh-73px)] md:w-60 md:border-b-0 md:border-r">
      <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-5">
        {avatarUrl && !imageFailed ? (
          <img
            src={avatarUrl}
            alt=""
            onError={() => setImageFailed(true)}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
            {profileName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">
            {profileName}
          </p>
          <p className="truncate text-xs text-gray-500">{user.email}</p>
        </div>
      </div>

      <nav className="flex gap-2 p-3 md:block md:space-y-1">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onTabChange(item.id)}
            className={`flex flex-1 items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium transition md:w-full ${
              activeTab === item.id
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded border border-current text-xs">
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </nav>

      <button
        type="button"
        onClick={onLogout}
        className="m-3 mt-auto rounded-md px-3 py-2 text-left text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900"
      >
        Log out
      </button>
    </aside>
  );
}
