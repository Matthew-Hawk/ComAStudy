export default function Layers() {
  return (
    <>
      {["Guest operating system", "Hypervisor", "Physical resources"].map(
        (s, i) => (
          <g key={s} className={`layer layer-${i}`}>
            <rect
              x={95 + i * 15}
              y={25 + i * 45}
              width={320 - i * 30}
              height="34"
              rx="7"
            />
            <text x="255" y={47 + i * 45}>
              {s}
            </text>
          </g>
        ),
      )}
    </>
  );
}
