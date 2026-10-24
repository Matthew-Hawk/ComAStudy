export function SmallChart({
  title,
  rows,
  unit = "items",
}: {
  title: string;
  rows: { day: string; value: number }[];
  unit?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  const width = 600;
  const step = width / Math.max(1, rows.length);
  return (
    <section className="chart-panel">
      <h2>{title}</h2>
      <svg
        viewBox="0 0 600 160"
        role="img"
        aria-label={`${title}. ${rows.map((r) => `${r.day}: ${r.value} ${unit}`).join("; ")}`}
      >
        <line x1="0" y1="130" x2="600" y2="130" stroke="var(--muted)" />
        {rows.map((r, i) => (
          <g key={r.day}>
            <rect
              x={i * step + 3}
              y={130 - (r.value / max) * 100}
              width={Math.max(2, step - 6)}
              height={(r.value / max) * 100}
              fill="var(--accent)"
            />
            <text
              x={i * step + step / 2}
              y={Math.max(14, 122 - (r.value / max) * 100)}
              textAnchor="middle"
              fill="var(--text)"
              fontSize={rows.length > 15 ? 9 : 12}
            >
              {r.value}
            </text>
            {(rows.length < 10 || i % 5 === 0) && (
              <text
                x={i * step + step / 2}
                y="153"
                textAnchor="middle"
                fill="var(--muted)"
                fontSize="10"
              >
                {r.day.slice(-5)}
              </text>
            )}
          </g>
        ))}
      </svg>
      <details>
        <summary>View {title.toLowerCase()} data</summary>
        <div className="table-scroll">
          <table>
            <caption>{title}</caption>
            <thead>
              <tr>
                <th scope="col">Date / attempt</th>
                <th scope="col">{unit}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.day}>
                  <th scope="row">{r.day}</th>
                  <td>{r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
