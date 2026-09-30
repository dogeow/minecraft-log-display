export default function PlayerGrid({
  players = [],
  isOnline = true,
  queryAvailable = true,
}) {
  if (!isOnline || !queryAvailable) return null;

  return (
    <section
      className="mc-player-section"
      aria-labelledby="online-players-title"
    >
      <h2 id="online-players-title">在线冒险家</h2>
      {players.length === 0 && (
        <p className="mc-player-empty">
          暂时没有在线冒险家，世界正等待新的足迹
        </p>
      )}
      <div className="mc-player-grid">
        {players.map((player) => (
          <div key={player} className="mc-player-card">
            <img
              src={`https://minotar.net/cube/${encodeURIComponent(player)}/64.png`}
              loading="lazy"
              className="mc-player-avatar"
              alt={`${player} cube`}
            />
            <div>{player}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
