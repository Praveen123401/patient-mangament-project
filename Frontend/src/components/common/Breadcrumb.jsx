import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Breadcrumb({ items = [] }) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span className="bc-item" key={`${item.label}-${index}`}>
          {index > 0 && <ChevronRight size={14} aria-hidden="true" />}
          {item.to && index < items.length - 1
            ? <Link to={item.to}>{item.label}</Link>
            : <span aria-current={index === items.length - 1 ? "page" : undefined}>{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}
