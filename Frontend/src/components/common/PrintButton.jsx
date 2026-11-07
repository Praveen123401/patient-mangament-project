import { Printer } from "lucide-react";

export default function PrintButton({ title = "Print" }) {
  return (
    <button
      type="button"
      className="btn btn-outline no-print"
      onClick={() => window.print()}
    >
      <Printer size={16} />
      {title}
    </button>
  );
}
