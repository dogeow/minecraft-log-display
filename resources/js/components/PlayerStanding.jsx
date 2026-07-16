export default function PlayerStanding({ players }) {
  if (!players?.length) return null;

  return (
    <div className="mc-standing-players" aria-hidden="true">
      {players.map((player) => (
        <img
          key={player}
          src={`https://minotar.net/body/${player}/64.png`}
          className="mc-standing-player"
          alt={`${player} 的 Minecraft 角色`}
        />
      ))}
    </div>
  );
}
