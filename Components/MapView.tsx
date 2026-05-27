"use client";

import { Circle, MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import type { RegionStatus, RiskLevel } from "@/lib/data";

type MapViewProps = {
  regions: RegionStatus[];
  selectedId: string;
  onSelect: (id: string) => void;
};

const markerClass: Record<RiskLevel, string> = {
  high: "risk-high",
  medium: "risk-medium",
  low: "risk-low"
};

const circleColor: Record<RiskLevel, string> = {
  high: "#ef4444",
  medium: "#f97316",
  low: "#16a34a"
};

function makeIcon(region: RegionStatus) {
  return L.divIcon({
    className: "",
    html: `<div class="water-marker ${markerClass[region.risk]}">${region.waterLevelCm}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18]
  });
}

export default function MapView({ regions, selectedId, onSelect }: MapViewProps) {
  return (
    <MapContainer center={[-3.5, 113.5]} zoom={5} minZoom={4} scrollWheelZoom className="z-0">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {regions.map((region) => (
        <Circle
          key={`${region.id}-zone`}
          center={[region.lat, region.lng]}
          pathOptions={{
            color: circleColor[region.risk],
            fillColor: circleColor[region.risk],
            fillOpacity: selectedId === region.id ? 0.2 : 0.1,
            weight: selectedId === region.id ? 3 : 1
          }}
          radius={region.risk === "high" ? 42000 : region.risk === "medium" ? 32000 : 22000}
          eventHandlers={{ click: () => onSelect(region.id) }}
        />
      ))}
      {regions.map((region) => (
        <Marker
          key={region.id}
          position={[region.lat, region.lng]}
          icon={makeIcon(region)}
          eventHandlers={{ click: () => onSelect(region.id) }}
        >
          <Popup>
            <div className="w-52">
              <p className="text-sm font-bold text-ink">{region.name}</p>
              <p className="mt-1 text-xs text-slate-500">{region.summary}</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <span>
                  <b className="block text-ink">{region.waterLevelCm} cm</b>
                  Air
                </span>
                <span>
                  <b className="block text-ink">{region.rainfallMm} mm</b>
                  Hujan
                </span>
                <span>
                  <b className="block text-ink">{region.reports}</b>
                  Laporan
                </span>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
