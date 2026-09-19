import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const navigationItems = [
  { id: "profile", label: "Profile" },
  { id: "chats", label: "Chats" },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const [imageFailed, setImageFailed] = useState(false);
  const profileName = user.profile?.name || user.email || "Q";
  const avatarUrl = user.profile?.profile_picture_url;

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-gray-900/30 md:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-gray-200 bg-white shadow-xl transition-transform duration-200 md:static md:z-auto md:min-h-[calc(100vh-73px)] md:w-60 md:translate-x-0 md:shadow-none ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
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

        <nav className="flex flex-col gap-2 p-3">
          {navigationItems.map((item) => (
            <NavLink
              key={item.id}
              to={`/${item.id}`}
              onClick={onClose}
              className={({ isActive }) =>
                `flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`
              }
            >
              <span
                className="flex h-6 w-6 items-center justify-center"
                aria-hidden="true"
              >
                {item.id === "profile" ? (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                  >
                    <circle cx="12" cy="8" r="3.25" />
                    <path
                      strokeLinecap="round"
                      d="M5.5 19c.8-3.1 3.1-4.75 6.5-4.75s5.7 1.65 6.5 4.75"
                    />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5.5 6.5h13a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-7l-4.5 3v-3h-1.5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2Z"
                    />
                  </svg>
                )}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={logout}
          className="m-3 mt-auto rounded-md px-3 py-2 text-left text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900"
        >
          Log out
        </button>
      </aside>
    </>
  );
}
