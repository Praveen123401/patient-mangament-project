import { ChevronLeft, ChevronRight } from "lucide-react";

// API returns { page, pages, total } - pass them straight in
export default function Pagination({ page, pages, total, onChange }) {
  if (!pages || pages <= 1) return null;
  return (
    <div className="pagination">
      <span className="muted">{total} records</span>
      <div>
        <button className="btn btn-outline" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          <ChevronLeft size={16} />
        </button>
        <span className="pg-now">Page {page} of {pages}</span>
        <button className="btn btn-outline" disabled={page >= pages} onClick={() => onChange(page + 1)}>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}