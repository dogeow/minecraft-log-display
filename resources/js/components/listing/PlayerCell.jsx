export default function PlayerCell({ username, compact = false }) {
  return (
    <div className="flex items-center gap-2">
      <img
        src={`https://crafthead.net/avatar/${username}`}
        alt={username}
        className="h-6 w-6 rounded-sm"
      />
      <span className={compact ? "max-w-[80px] truncate" : undefined}>
        {username}
      </span>
    </div>
  );
}
