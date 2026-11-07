export default function Card({ title, actions, children }) {
  return (
    <section className="card">
      {(title || actions) && (
        <header className="card-head">
          {title && <h3>{title}</h3>}
          {actions}
        </header>
      )}
      <div className="card-body">{children}</div>
    </section>
  );
}
