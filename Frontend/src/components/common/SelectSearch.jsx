import { useEffect, useRef, useState } from "react";

export default function SelectSearch({
  label,
  placeholder,
  fetcher,
  getLabel,
  getSub,
  value,
  onSelect,
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (value || !query.trim()) {
      setResults([]);
      setError("");
      setLoading(false);
      return undefined;
    }

    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const items = await fetcherRef.current(query.trim());
        if (active) setResults(Array.isArray(items) ? items : []);
      } catch {
        if (active) {
          setResults([]);
          setError("Unable to search. Please try again.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, value]);

  return (
    <div className="field" style={{ position: "relative" }}>
      <label>{label}</label>
      <input
        type="search"
        placeholder={placeholder}
        value={value ? getLabel(value) : query}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          onSelect(null);
          setQuery(event.target.value);
          setOpen(true);
        }}
        aria-label={label}
        aria-expanded={open && !value}
        aria-autocomplete="list"
      />
      {open && !value && query.trim() && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            zIndex: 10,
            top: "100%",
            left: 0,
            right: 0,
            maxHeight: 240,
            overflowY: "auto",
            background: "white",
            border: "1px solid var(--border)",
            borderRadius: 8,
          }}
        >
          {loading && <div style={{ padding: 10 }}>Searching...</div>}
          {error && <div className="error" style={{ padding: 10 }}>{error}</div>}
          {!loading && !error && results.length === 0 && (
            <div style={{ padding: 10 }}>No results found.</div>
          )}
          {results.map((item) => (
            <button
              key={item._id}
              type="button"
              role="option"
              aria-selected="false"
              onClick={() => {
                onSelect(item);
                setQuery("");
                setResults([]);
                setOpen(false);
              }}
              style={{
                display: "block",
                width: "100%",
                padding: 10,
                border: 0,
                background: "white",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <span>{getLabel(item)}</span>
              {getSub(item) && (
                <span className="muted" style={{ display: "block" }}>
                  {getSub(item)}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
