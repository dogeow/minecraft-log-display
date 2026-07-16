export default function PlayerGrid({ players = [] }) {
  if (players.length === 0) return null;

  return (
    <section className="mc-player-section" aria-labelledby="online-players-title">
      <h2 id="online-players-title">在线冒险家</h2>
      <div className="mc-player-grid">
        {players.map((player) => (
          <div key={player} className="mc-player-card">
            <img
              src={`https://minotar.net/cube/${player}/64.png`}
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
