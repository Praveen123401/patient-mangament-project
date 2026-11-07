export default function Avatar({ name = "", size = 36 }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <span
      className="avatar"
      style={{ width: size, height: size, fontSize: Math.max(12, size * 0.38) }}
      aria-hidden="true"
    >
      {initials || "?"}
    </span>
  );
}
