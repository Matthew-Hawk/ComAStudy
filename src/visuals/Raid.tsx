export default function Raid() {
  return (
    <>
      {["Drive A", "Drive B"].map((s, i) => (
        <g key={s} transform={`translate(${105 + i * 220},28)`}>
          <rect width="90" height="112" rx="12" />
          <text x="45" y="142">
            {s}
          </text>
          {[0, 1, 2].map((n) => (
            <g key={n}>
              <rect
                className="detail"
                x="14"
                y={14 + n * 30}
                width="62"
                height="22"
                rx="4"
              />
              <text x="45" y={30 + n * 30}>
                {["A", "B", "C"][n]}
              </text>
            </g>
          ))}
        </g>
      ))}
      <path className="wire" d="M202 78h115" />
      <text x="260" y="110">
        Same data
      </text>
    </>
  );
}
