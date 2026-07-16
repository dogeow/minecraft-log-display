export default function SkyBackground({ isDark }) {
  return (
    <div
      className={`mc-sky-background ${isDark ? "mc-sky-background--night" : "mc-sky-background--day"}`}
      aria-hidden="true"
    />
  );
}
