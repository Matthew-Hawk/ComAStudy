export default function Cycle() {
  return (
    <>
      {["Observe", "Test", "Verify", "Record"].map((s, i) => (
        <g key={s} transform={`translate(${45 + i * 125},45)`}>
          <circle className={`pulse step-${i}`} cx="28" cy="35" r="26" />
          <text x="28" y="40">
            {i + 1}
          </text>
          <text x="28" y="90">
            {s}
          </text>
          {i < 3 && <path className="wire" d="M62 35h50" />}
        </g>
      ))}
    </>
  );
}
