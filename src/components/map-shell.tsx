"use client";

import dynamic from "next/dynamic";
import type { DistrictPulse } from "@/lib/demo-data";

const PowerMap = dynamic(() => import("@/components/power-map").then((module) => module.PowerMap), {
  ssr: false,
  loading: () => <div className="map-loading"><span className="pulse-dot" />Loading live power map…</div>,
});

export function MapShell({ districts }: { districts: DistrictPulse[] }) {
  return <PowerMap districts={districts} />;
}
