export default function Board() {
  return (
    <>
      <rect x="75" y="22" width="360" height="125" rx="14" className="board" />
      <path className="wire" d="M140 80h200M250 45v75M160 110h180" />
      <rect x="210" y="48" width="70" height="63" rx="6" className="pulse" />
      <text x="245" y="85">
        CPU
      </text>
      {[0, 1, 2].map((i) => (
        <rect key={i} x={315 + i * 25} y="45" width="15" height="75" rx="3" />
      ))}
      <text x="245" y="173">
        Working memory supports active tasks
      </text>
    </>
  );
}
