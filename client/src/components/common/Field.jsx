import React, { useState } from "react";
import SearchableSelect from "./SearchableSelect";

/**
 * Render component trường nhập liệu (hỗ trợ chế độ searchable select để lọc thời gian thực)
 */
export default function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  options,
  searchable = false,
  required = false,
  placeholder,
  min,
  step,
  rows,
  hint,
  minLength,
  maxLength,
  autoComplete,
}) {
  const [fieldError, setFieldError] = useState("");
  const change = (event) => {
    setFieldError("");
    onChange(event);
  };
  const invalid = (event) => {
    event.preventDefault();
    setFieldError(
      event.target.validity.typeMismatch
        ? `${label} không hợp lệ.`
        : `Vui lòng kiểm tra ${label.toLowerCase()}.`,
    );
  };
  const isCustom = searchable && options;
  const Wrapper = isCustom ? "div" : "label";
  return (
    <Wrapper className="field">
      <span>
        {label}
        {required && <em>*</em>}
      </span>
      {isCustom ? (
        <SearchableSelect
          name={name}
          value={value}
          onChange={(val) => change({ target: { name, value: val } })}
          options={options}
          placeholder={placeholder || `Nhập để lọc ${label.toLowerCase()}...`}
          required={required}
        />
      ) : options ? (
        <select
          name={name}
          value={value ?? ""}
          onChange={change}
          onInvalid={invalid}
          required={required}
        >
          <option value="">Chọn {label.toLowerCase()}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : rows ? (
        <textarea
          name={name}
          value={value ?? ""}
          onChange={change}
          onInvalid={invalid}
          required={required}
          placeholder={placeholder}
          rows={rows}
        />
      ) : (
        <input
          name={name}
          value={value ?? ""}
          onChange={change}
          onInvalid={invalid}
          type={type}
          required={required}
          placeholder={placeholder}
          min={min}
          step={step}
          minLength={minLength}
          maxLength={maxLength}
          autoComplete={autoComplete}
        />
      )}{" "}
      {hint && <small>{hint}</small>}
      {fieldError && <small className="field-error">{fieldError}</small>}
    </Wrapper>
  );
}
