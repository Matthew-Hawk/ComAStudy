import { Link } from "react-router-dom";
import {
  Smartphone,
  Network,
  Cpu,
  Layers3,
  Wrench,
  Monitor,
  ShieldCheck,
  BookOpen,
} from "lucide-react";
import { domains } from "../content/load";
import type { DomainIndex as Domain } from "../content/index-types";
const icons = [
  Smartphone,
  Network,
  Cpu,
  Layers3,
  Wrench,
  Monitor,
  ShieldCheck,
  Wrench,
  BookOpen,
];
export function DomainIcon({
  domain,
  size = 23,
}: {
  domain: Domain;
  size?: number;
}) {
  const Icon = icons[domains.indexOf(domain)] ?? BookOpen;
  return <Icon size={size} strokeWidth={1.6} />;
}
export function WorkspaceSketch() {
  return (
    <svg
      className="workspace-sketch"
      viewBox="0 0 370 220"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20 43H350M20 87H350M20 131H350M20 175H350M53 15V205M97 15V205M141 15V205M185 15V205M229 15V205M273 15V205M317 15V205"
        stroke="currentColor"
        opacity=".09"
      />
      <path
        d="M85 158V65a9 9 0 0 1 9-9h170a9 9 0 0 1 9 9v93"
        fill="var(--hero)"
        stroke="currentColor"
        strokeWidth="2"
      />
      <rect
        x="97"
        y="68"
        width="164"
        height="82"
        rx="3"
        stroke="currentColor"
        opacity=".5"
      />
      <path
        d="M65 159h229l-13 15H80l-15-15Z"
        fill="var(--hero)"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M143 174h72" stroke="currentColor" strokeWidth="3" />
      <rect
        x="140"
        y="89"
        width="37"
        height="37"
        rx="6"
        stroke="currentColor"
      />
      <path
        d="m149 107 6 6 14-15M190 96h48M190 107h35M190 118h40"
        stroke="currentColor"
        strokeWidth="2"
      />
      <rect
        x="282"
        y="29"
        width="52"
        height="55"
        rx="8"
        fill="var(--surface)"
        stroke="currentColor"
      />
      <path
        d="M295 46h25M295 54h25M295 62h14M307 84v26h-34M50 106h24M50 106v33"
        stroke="currentColor"
        strokeDasharray="3 4"
      />
      <circle
        cx="50"
        cy="147"
        r="9"
        fill="var(--surface)"
        stroke="currentColor"
      />
      <path d="m46 147 3 3 5-6" stroke="currentColor" />
    </svg>
  );
}
