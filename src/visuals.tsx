import { useState } from "react";
import { Pause, Play } from "lucide-react";
import { useStudy } from "./storage";
import { visualIds } from "./content/schema";
import { Suspense } from "react";
import { visualRegistry } from "./visuals/registry";
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
  const mode = useStudy((s) => s.progress.animationMode);
  const Component = visualRegistry[id];
  return (
    <figure
      className={`visual ${paused || !motion || mode !== "on" ? "paused" : ""}`}
    >
      <svg viewBox="0 0 510 190" role="img" aria-label={captions[id]}>
        <Suspense
          fallback={
            <text x="255" y="95">
              Loading illustration…
            </text>
          }
        >
          <Component />
        </Suspense>
      </svg>
      <figcaption>{captions[id]}</figcaption>
      {motion && mode === "on" && (
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
