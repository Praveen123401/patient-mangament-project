import SearchBar from "./SearchBar";

export default function FilterBar({ search, onSearch, placeholder, onReset, children }) {
  return (
    <div className="filter-bar">
      <SearchBar value={search} onChange={onSearch} placeholder={placeholder} />
      {children}
      <button type="button" className="btn btn-ghost" onClick={onReset}>
        Reset
      </button>
    </div>
  );
}
