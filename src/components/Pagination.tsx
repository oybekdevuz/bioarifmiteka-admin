interface Props {
  page: number;
  pages: number;
  total: number;
  onPageChange: (p: number) => void;
}

export default function Pagination({ page, pages, total, onPageChange }: Props) {
  if (pages <= 1) return null;

  const go = (p: number) => {
    if (p < 1 || p > pages || p === page) return;
    onPageChange(p);
  };

  const window = 2;
  const visible = new Set<number>([1, pages, page]);
  for (let i = 1; i <= window; i += 1) {
    visible.add(page - i);
    visible.add(page + i);
  }
  const pageNums = Array.from(visible)
    .filter((n) => n >= 1 && n <= pages)
    .sort((a, b) => a - b);

  return (
    <nav className="d-flex justify-content-between align-items-center mt-3">
      <div className="text-muted small">Jami: {total}</div>
      <ul className="pagination mb-0">
        <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
          <button
            className="page-link"
            onClick={() => go(page - 1)}
            type="button"
          >
            Oldingi
          </button>
        </li>
        {pageNums.map((p, idx) => {
          const prev = pageNums[idx - 1];
          const gap = prev && p - prev > 1;
          return (
            <span key={p} className="d-inline-flex">
              {gap && (
                <li className="page-item disabled">
                  <span className="page-link">…</span>
                </li>
              )}
              <li className={`page-item ${p === page ? "active" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => go(p)}
                  type="button"
                >
                  {p}
                </button>
              </li>
            </span>
          );
        })}
        <li className={`page-item ${page === pages ? "disabled" : ""}`}>
          <button
            className="page-link"
            onClick={() => go(page + 1)}
            type="button"
          >
            Keyingi
          </button>
        </li>
      </ul>
    </nav>
  );
}
