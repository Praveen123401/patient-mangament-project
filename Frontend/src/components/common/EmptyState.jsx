import { Inbox } from "lucide-react";

export default function EmptyState({ title = "Nothing here yet", text, action, icon: Icon = Inbox }) {
  return (
    <div className="empty">
      <Icon size={36} />
      <h4>{title}</h4>
      {text && <p className="muted">{text}</p>}
      {action}
    </div>
  );
}