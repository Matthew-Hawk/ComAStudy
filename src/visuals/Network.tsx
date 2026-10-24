export default function Network() {
  return (
    <>
      <path className="wire" d="M75 85H435" />
      {["Your device", "Switch", "Router", "Destination"].map((s, i) => (
        <g key={s} transform={`translate(${45 + i * 120},55)`}>
          <rect width="60" height="60" rx="12" />
          <path className="detail" d="M16 24h28m-28 9h18" />
          <text x="30" y="85">
            {s}
          </text>
        </g>
      ))}
      <circle className="packet" cx="75" cy="85" r="7" />
    </>
  );
}
