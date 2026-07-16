export default function Sun({ onClick }) {
  return (
    <button
      type="button"
      className="mc-celestial mc-sun"
      onClick={onClick}
      aria-label="切换到夜晚主题"
      title="切换到夜晚"
    />
  );
}
