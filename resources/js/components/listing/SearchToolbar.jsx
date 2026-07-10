import { Link } from "react-router-dom";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

export default function SearchToolbar({
  value,
  onChange,
  clearTo,
  placeholder,
  className = "mb-3",
}) {
  return (
    <form className={`flex gap-2 ${className}`}>
      <Input
        type="search"
        name="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
      <Button type="submit" variant="default">
        搜索
      </Button>
      {value && (
        <Link to={clearTo}>
          <Button type="button" variant="secondary">
            清除
          </Button>
        </Link>
      )}
    </form>
  );
}
