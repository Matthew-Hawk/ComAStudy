export default function Connectors() {
  return (
    <>
      {["USB-C", "HDMI", "Ethernet"].map((s, i) => (
        <g key={s} transform={`translate(${65 + i * 145},44)`}>
          <rect x="0" y="0" width="90" height="60" rx={i === 0 ? 26 : 7} />
          <rect
            className="detail"
            x="13"
            y="17"
            width="64"
            height="24"
            rx={i === 0 ? 12 : 3}
          />
          {[0, 1, 2, 3].map((n) => (
            <path className="detail" key={n} d={`M${28 + n * 10} 27v9`} />
          ))}
          <text x="45" y="96">
            {s}
          </text>
        </g>
      ))}
    </>
  );
}
