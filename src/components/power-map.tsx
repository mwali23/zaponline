"use client";

import { useEffect, useMemo, useState } from "react";
import { GeoJSON, MapContainer, Popup, TileLayer } from "react-leaflet";
import type { Feature, GeoJsonObject, Geometry } from "geojson";
import type { Path, PathOptions } from "leaflet";
import { districts, type PowerStatus } from "@/lib/demo-data";

type DistrictProperties = { NAME_2?: string; Status?: string; PopEst?: number };

const colors: Record<PowerStatus, string> = {
  powered: "#2b8a58",
  outage: "#e05245",
  unstable: "#e39a29",
  unknown: "#77827d",
};

export function PowerMap() {
  const [data, setData] = useState<GeoJsonObject | null>(null);
  useEffect(() => {
    fetch("/copperbelt.geojson").then((response) => response.json()).then(setData).catch(() => setData(null));
  }, []);
  const districtByName = useMemo(() => new Map(districts.map((item) => [item.name, item])), []);

  const style = (feature?: Feature<Geometry, DistrictProperties>): PathOptions => {
    const name = feature?.properties?.NAME_2 ?? "";
    const status = districtByName.get(name)?.status ?? (feature?.properties?.Status as PowerStatus) ?? "unknown";
    return { color: "#fff", weight: 1.5, fillColor: colors[status] ?? colors.unknown, fillOpacity: 0.78 };
  };

  return (
    <div className="map-wrap">
      <MapContainer center={[-13.02, 28.35]} zoom={8} scrollWheelZoom={false} className="power-map">
        <TileLayer attribution="&copy; OpenStreetMap contributors · Boundaries: GADM" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {data && <GeoJSON data={data} style={style} onEachFeature={(feature, layer) => {
          const name = (feature.properties as DistrictProperties).NAME_2 ?? "District";
          const item = districtByName.get(name);
          layer.bindTooltip(name, { sticky: true });
          const pathLayer = layer as Path;
          layer.on({ mouseover: () => pathLayer.setStyle({ weight: 3, fillOpacity: .92 }), mouseout: () => pathLayer.setStyle(style(feature as Feature<Geometry, DistrictProperties>)) });
          if (item) layer.bindPopup(`<strong>${name}</strong><br/>${item.schedule}<br/>${item.reports} community reports · ${item.confidence} confidence`);
        }} />}
        <Popup position={[-12.81, 28.21]}><strong>Copperbelt live view</strong><br />Select a district for details.</Popup>
      </MapContainer>
      <div className="map-legend" aria-label="Power status legend">
        {Object.entries(colors).map(([status, color]) => <span key={status}><i style={{ background: color }} />{status}</span>)}
      </div>
    </div>
  );
}
