export default function SortButton({
  field,
  activeField,
  direction,
  onSort,
  children,
}) {
  const isActive = activeField === field;

  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className="flex items-center hover:underline"
    >
      {children}
      {isActive && <span className="ml-1">{direction === "asc" ? "↑" : "↓"}</span>}
    </button>
  );
}
