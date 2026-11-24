import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pager({ data, page, setPage }) {
  if (!data || data.pages <= 1) return null;
  return (
    <div className="pager">
      <span>
        Trang {data.page} / {data.pages} · {data.total} mục
      </span>
      <div>
        <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
          <ChevronLeft size={18} />
        </button>
        <button disabled={page >= data.pages} onClick={() => setPage(page + 1)}>
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

export default function Pagination({ page, total, onChange }) {
  return (
    <Pager
      data={{ page, pages: total, total }}
      page={page}
      setPage={onChange}
    />
  );
}
