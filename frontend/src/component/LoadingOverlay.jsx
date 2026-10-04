export default function LoadingOverlay({ visible, message = "Loading..." }) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/40 p-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-center gap-3 rounded-lg bg-white px-5 py-4 text-gray-700 shadow-xl">
        <span
          aria-hidden="true"
          className="h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600"
        />
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}
