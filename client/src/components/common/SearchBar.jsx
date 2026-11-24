import React from "react";
import { Search } from "lucide-react";

export default function SearchBar({ value, onChange, placeholder = "Tìm kiếm...", children }) {
  return (
    <div className="search-bar">
      <div className="search-input">
        <Search size={18} />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
      {children}
    </div>
  );
}
