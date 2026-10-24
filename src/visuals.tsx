import { useState } from "react";
import { Pause, Play } from "lucide-react";
import { useStudy } from "./storage";
import { visualIds } from "./content/schema";
function Network() {
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
function Board() {
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
function Connectors() {
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
function Layers() {
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
function Raid() {
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
function Cycle() {
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
export const visualRegistry = {
  "network-packet-hop": Network,
  "memory-board": Board,
  "connector-sheet": Connectors,
  "virtual-layers": Layers,
  "raid-mirror": Raid,
  "support-cycle": Cycle,
} satisfies Record<(typeof visualIds)[number], React.ComponentType>;
const captions: Record<string, string> = {
  "network-packet-hop": "A packet travels through connected devices.",
  "memory-board": "Processor and memory on a simplified system board.",
  "connector-sheet":
    "Three common connector shapes. Capabilities depend on the device and cable.",
  "virtual-layers": "A simplified virtual machine stack.",
  "raid-mirror": "Mirrored drives store matching data blocks.",
  "support-cycle":
    "Observe the symptom, test a change, verify the outcome, and record it.",
};
export function Visual({ id }: { id: (typeof visualIds)[number] }) {
  const [paused, setPaused] = useState(false);
  const motion = useStudy((s) => s.progress.motion);
  const Component = visualRegistry[id];
  return (
    <figure className={`visual ${paused || !motion ? "paused" : ""}`}>
      <svg viewBox="0 0 510 190" role="img" aria-label={captions[id]}>
        <Component />
      </svg>
      <figcaption>{captions[id]}</figcaption>
      {motion && (
        <button
          className="icon-button visual-toggle"
          aria-label={paused ? "Play illustration" : "Pause illustration"}
          aria-pressed={paused}
          onClick={() => setPaused(!paused)}
        >
          {paused ? <Play size={15} /> : <Pause size={15} />}
        </button>
      )}
    </figure>
  );
}
