import { Search } from "lucide-react";

export default function SearchBar({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="search-box">
      <Search size={16} />
      <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}