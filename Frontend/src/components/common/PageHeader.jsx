export default function PageHeader({ title, subtitle, actions, children }) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {(actions || children) && <div className="page-actions">{actions}{children}</div>}
    </header>
  );
}
