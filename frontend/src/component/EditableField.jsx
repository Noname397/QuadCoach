import { useId } from "react";

export default function EditableField({
  label,
  value,
  onChange,
  multiline = false,
  type = "text",
  allowPresent = false,
}) {
  const inputId = useId();
  const inputClassName =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
  const isPresent = allowPresent && value.trim().toLowerCase() === "present";
  const monthValue = type === "month" ? toMonthValue(value) : value;
  const hasUnrecognizedMonth =
    type === "month" && value.trim() && !monthValue && !isPresent;

  return (
    <div className="block">
      <div className="mb-1 flex min-h-5 items-center justify-between gap-2">
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-gray-600"
        >
          {label}
        </label>
        {allowPresent && (
          <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={isPresent}
              onChange={(event) =>
                onChange(event.target.checked ? "Present" : "")
              }
              aria-label="Mark end date as present"
              className="peer sr-only"
            />
            <span
              aria-hidden="true"
              className="relative h-4 w-7 rounded-full bg-gray-300 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-3 after:w-3 after:rounded-full after:bg-white after:transition-transform peer-checked:bg-blue-600 peer-checked:after:translate-x-3 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue-500"
            />
            Present
          </label>
        )}
      </div>
      {multiline ? (
        <textarea
          id={inputId}
          rows={3}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={inputClassName}
        />
      ) : (
        <>
          {!isPresent && (
            <>
              {hasUnrecognizedMonth && (
                <span className="mb-1 block text-xs text-amber-700">
                  Extracted value: {value}
                </span>
              )}
              <input
                id={inputId}
                type={type}
                value={monthValue}
                onChange={(event) => onChange(event.target.value)}
                className={inputClassName}
              />
            </>
          )}
          {isPresent && (
            <div
              id={inputId}
              className={`${inputClassName} flex items-center gap-2 bg-gray-50 text-gray-600`}
              aria-live="polite"
            >
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full bg-green-500"
              />
              Present
            </div>
          )}
        </>
      )}
    </div>
  );
}

function toMonthValue(value) {
  const trimmed = value.trim();
  const numericDate = trimmed.match(/^(\d{4})[-/](\d{1,2})(?:[-/]\d{1,2})?$/);
  if (numericDate) {
    const month = Number(numericDate[2]);
    return month >= 1 && month <= 12
      ? `${numericDate[1]}-${numericDate[2].padStart(2, "0")}`
      : "";
  }

  const monthFirstDate = trimmed.match(/^(\d{1,2})\/(\d{4})$/);
  if (monthFirstDate) {
    const month = Number(monthFirstDate[1]);
    return month >= 1 && month <= 12
      ? `${monthFirstDate[2]}-${monthFirstDate[1].padStart(2, "0")}`
      : "";
  }

  const parsedDate = new Date(`${trimmed} 1`);
  if (!Number.isNaN(parsedDate.getTime())) {
    return `${parsedDate.getFullYear()}-${String(
      parsedDate.getMonth() + 1,
    ).padStart(2, "0")}`;
  }
  return "";
}
