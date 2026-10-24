import { lazy } from "react";
import type { visualIds } from "../content/schema";
export const visualRegistry = {
  "network-packet-hop": lazy(() => import("./Network")),
  "memory-board": lazy(() => import("./Board")),
  "connector-sheet": lazy(() => import("./Connectors")),
  "virtual-layers": lazy(() => import("./Layers")),
  "raid-mirror": lazy(() => import("./Raid")),
  "support-cycle": lazy(() => import("./Cycle")),
} satisfies Record<(typeof visualIds)[number], React.ComponentType>;
