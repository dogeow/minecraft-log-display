import GrassBlock from "./GrassBlock";
import PlayerStanding from "./PlayerStanding";

export default function GrassFooter({ players }) {
  return (
    <>
      <GrassBlock />
      <PlayerStanding players={players} />
    </>
  );
}
