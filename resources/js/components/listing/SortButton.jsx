import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

export default function SortButton({
  field,
  activeField,
  direction,
  onSort,
  children,
}) {
  const isActive = activeField === field;
  const Icon = !isActive
    ? ArrowUpDown
    : direction === "asc"
      ? ArrowUp
      : ArrowDown;
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={`inline-flex items-center gap-1.5 hover:underline ${isActive ? "text-primary" : ""}`}
      aria-label={`${children}，${isActive && direction === "asc" ? "改为降序" : "改为升序"}`}
    >
      {children}
      <Icon size={14} aria-hidden="true" />
    </button>
  );
}
