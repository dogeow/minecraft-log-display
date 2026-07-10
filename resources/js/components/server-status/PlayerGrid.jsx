export default function PlayerGrid({ players = [], isDark }) {
  if (players.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="flex flex-wrap content-center justify-center gap-2">
        {players.map((player) => (
          <div
            key={player}
            className={`m-1 flex flex-col gap-1 rounded-lg border p-2 backdrop-blur ${isDark ? "border-[#FFAA00] bg-white/10" : "border-yellow-400 bg-gray-100"}`}
          >
            <img
              src={`https://minotar.net/cube/${player}/64.png`}
              className="mx-auto h-8 w-8"
              alt={`${player} cube`}
            />
            <div className="text-center text-sm">{player}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
