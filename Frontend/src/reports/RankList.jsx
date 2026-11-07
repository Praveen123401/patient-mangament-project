// <RankList items={[{ name: "CBC", value: 12 }]} format={(v) => `${v} orders`} />
export default function RankList({ items = [], format = (v) => v, empty = "No data for this period" }) {
  if (!items.length) return <p className="muted">{empty}</p>;
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="rank">
      {items.map((i) => (
        <li key={i.name}>
          <div className="rank-top">
            <span>{i.name}</span>
            <b>{format(i.value)}</b>
          </div>
          <div className="rank-bar">
            <i style={{ width: `${(i.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}