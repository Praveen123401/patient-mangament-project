
export default function FormField({
  as = "input",
  label,
  name,
  value,
  onChange,
  error,
  options = [],
  required = false,
  children,
  placeholder,
  ...rest
}) {
  return (
    <div className="field">
      {label && (
        <label htmlFor={name}>
          {label} {required && <span className="error">*</span>}
        </label>
      )}

      {as === "select" ? (
        <select
          id={name}
          name={name}
          value={value ?? ""}
          onChange={onChange}
          required={required}
          {...rest}
        >
          <option value="">
            {placeholder || "Select an option"}
          </option>

          {options
            .filter((option) =>
              typeof option === "string"
                ? option !== ""
                : option.value !== ""
            )
            .map((option) => {
              const item =
                typeof option === "string"
                  ? { value: option, label: option }
                  : option;

              return (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              );
            })}
        </select>
      ) : as === "textarea" ? (
        <textarea
          id={name}
          name={name}
          rows={3}
          value={value ?? ""}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          {...rest}
        />
      ) : (
        <input
          id={name}
          name={name}
          value={value ?? ""}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          {...rest}
        />
      )}

      {children}

      {error && <small className="error">{error}</small>}
    </div>
  );
}
