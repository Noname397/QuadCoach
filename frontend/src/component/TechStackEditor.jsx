export default function TechStackEditor({ label, value, onChange }) {
  const updateTech = (index, technology) => {
    onChange(value.map((item, itemIndex) => (
      itemIndex === index ? technology : item
    )));
  };

  const addTech = () => onChange([...value, ""]);

  const removeTech = (index) => {
    onChange(value.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <div>
      <p className="mb-1 text-xs font-medium text-gray-600">Tech stack</p>
      <div className="flex flex-wrap items-center gap-2">
        {value.map((technology, index) => (
          <div
            key={index}
            className="flex items-center rounded-full border border-gray-300 bg-white pl-3 pr-1 shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
          >
            <input
              type="text"
              aria-label={`${label} technology ${index + 1}`}
              value={technology}
              onChange={(event) => updateTech(index, event.target.value)}
              className="w-28 bg-transparent py-1.5 text-sm text-gray-900 outline-none"
            />
            <button
              type="button"
              aria-label={`Remove ${label} technology ${index + 1}`}
              onClick={() => removeTech(index)}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="none"
                className="h-4 w-4"
              >
                <path
                  d="m6 6 8 8M14 6l-8 8"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        ))}
        <button
          type="button"
          aria-label={`Add technology to ${label}`}
          onClick={addTech}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-gray-400 text-gray-600 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            className="h-5 w-5"
          >
            <path
              d="M10 4v12M4 10h12"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
