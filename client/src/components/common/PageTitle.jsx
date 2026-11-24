import React from "react";

export default function PageTitle({ kicker, title, description, action }) {
  return (
    <div className="page-title">
      <div>
        <span className="eyebrow">{kicker || "QUẢN LÝ KÝ TÚC XÁ"}</span>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="title-action">{action}</div>}
    </div>
  );
}
