import React from "react";

export default function Metric({ icon: Icon, label, value, foot, tone = "blue" }) {
  return (
    <div className="metric">
      <div className={`metric-icon ${tone}`}>
        <Icon size={21} />
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{foot}</small>
    </div>
  );
}
