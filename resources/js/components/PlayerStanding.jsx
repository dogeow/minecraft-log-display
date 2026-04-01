export default function PlayerStanding({ players }) {
    if (!players?.length) return null;

    return (
        <div className="fixed start-0 end-0 bottom-12 flex items-center justify-center z-[100]">
            {players.map((player) => (
                <img
                    key={player}
                    src={`https://minotar.net/body/${player}/64.png`}
                    className="h-24 mx-1"
                    alt="body"
                />
            ))}
        </div>
    );
}
