import Sun from "./Sun";
import Moon from "./Moon";
import Cloud from "./Cloud";

export default function SkyDecoration({ isDark, onToggle }) {
  return (
    <div
      className={`mc-sky-decoration ${isDark ? "mc-sky-decoration--night" : "mc-sky-decoration--day"}`}
    >
      {isDark ? <Moon onClick={onToggle} /> : <Sun onClick={onToggle} />}
      <Cloud className="mc-cloud--near" />
      <Cloud className="mc-cloud--middle" />
      <Cloud className="mc-cloud--far" />
    </div>
  );
}
