export default function Moon({ onClick }) {
  return (
    <button
      type="button"
      className="mc-celestial mc-moon"
      onClick={onClick}
      aria-label="切换到白天主题"
      title="切换到白天"
    >
      <span className="mc-moon__crater mc-moon__crater--one" />
      <span className="mc-moon__crater mc-moon__crater--two" />
      <span className="mc-moon__crater mc-moon__crater--three" />
    </button>
  );
}
