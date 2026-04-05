"use client";

import { useState, useEffect, useRef } from "react";
import { Map as MapGL } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import Supercluster from "supercluster";
import "maplibre-gl/dist/maplibre-gl.css";
import { WifiSample } from "@/types/WifiSample";
import PopuModel from "@/components/model/PopuModel";

type Cluster = {
  coordinates: [number, number];
  data: WifiSample[];
  address: string;
};

const supercluster = new Supercluster({ radius: 60, maxZoom: 20 });

// Cache to avoid re-fetching the same coordinates
const addressCache = new Map<string, string>();

async function fetchAddress(lat: number, lng: number): Promise<string> {
  const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  if (addressCache.has(key)) return addressCache.get(key)!;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&accept-language=en&lat=${lat}&lon=${lng}`,
    );
    const json = await res.json();
    const a = json.address ?? {};
    // Build a short readable address: road/amenity, suburb/district, city
    const parts = [
      a.road ?? a.pedestrian ?? a.amenity ?? a.building,
      a.suburb ?? a.neighbourhood ?? a.quarter,
      a.city ?? a.town ?? a.village ?? a.county,
    ].filter(Boolean);
    const addr: string =
      parts.length > 0 ? parts.join(", ") : (json.display_name ?? key);
    addressCache.set(key, addr);
    return addr;
  } catch {
    addressCache.set(key, key);
    return key;
  }
}
// Max real-world outdoor range in metres by band + standard
function getWifiRange(sample: WifiSample): number {
  const std = sample.wifi_standard?.toLowerCase() ?? "";
  const band = sample.band;

  // Wi-Fi 6E (802.11ax on 6 GHz) — shortest range
  if (band === "6 GHz") return 90;

  // 5 GHz
  if (band === "5 GHz") {
    if (std.includes("ax") || std.includes("wifi 6")) return 150;
    if (std.includes("ac") || std.includes("wifi 5")) return 100;
    if (std.includes("n") || std.includes("wifi 4")) return 120;
    return 100; // default 5 GHz
  }

  // 2.4 GHz (default)
  if (std.includes("ax") || std.includes("wifi 6")) return 300;
  if (std.includes("n") || std.includes("wifi 4")) return 250;
  if (std.includes("g")) return 150;
  if (std.includes("b")) return 100;
  return 150; // default 2.4 GHz
}

// Color by frequency band (MHz)
function getFreqColor(mhz: number): [number, number, number, number] {
  if (mhz >= 5925) return [180, 0, 255, 200]; // 6 GHz — purple
  if (mhz >= 5150) return [0, 120, 255, 200]; // 5 GHz — blue
  return [0, 200, 80, 200]; // 2.4 GHz — green
}

export default function MapComponent({ data }: { data: WifiSample[] }) {
  const mapRef = useRef<MapRef>(null);
  const overlayRef = useRef<MapboxOverlay | null>(null);
  const [viewState, setViewState] = useState({
    longitude: 100.6105,
    latitude: 13.681,
    zoom: 13,
    pitch: 0,
  });
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [selectedBssid, setSelectedBssid] = useState<string | null>(null);

  // Load WifiSample[] into supercluster whenever data changes
  useEffect(() => {
    if (data.length === 0) return;
    supercluster.load(
      data.map((p, id) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [p.gps.lng, p.gps.lat],
        },
        properties: { id },
      })),
    );
  }, [data]);
  console.log(`Zoom ${viewState.zoom.toFixed(2)}: ${clusters.length} clusters`);
  console.log(clusters);
  // Recompute clusters + fetch address for each center on pan / zoom
  useEffect(() => {
    if (data.length === 0) return;
    let cancelled = false;

    const bboxSize = Math.max(0.1, 1 / Math.pow(2, viewState.zoom - 10));
    const bbox = [
      viewState.longitude - bboxSize,
      viewState.latitude - bboxSize,
      viewState.longitude + bboxSize,
      viewState.latitude + bboxSize,
    ] as [number, number, number, number];

    const raw = supercluster.getClusters(
      bbox,
      Math.floor(viewState.zoom >= 20.5 ? 20.5 : Math.floor(viewState.zoom)),
    );

    (async () => {
      const transformed: Cluster[] = await Promise.all(
        raw.map(async (c) => {
          let clusterData: WifiSample[];
          if (c.properties.cluster) {
            const leaves = supercluster.getLeaves(
              c.properties.cluster_id,
              Infinity,
            );
            clusterData = leaves.map((leaf) => data[leaf.properties.id]);
          } else {
            clusterData = [data[c.properties.id]];
          }
          const [lng, lat] = c.geometry.coordinates;
          const address = await fetchAddress(lat, lng);
          return {
            coordinates: c.geometry.coordinates as [number, number],
            data: clusterData,
            address,
          };
        }),
      );
      if (!cancelled) setClusters(transformed);
    })();

    return () => {
      cancelled = true;
    };
  }, [viewState, data]);

  const createLayers = (clusters: Cluster[]) => [
    new ScatterplotLayer({
      id: "clusters",
      data: clusters,
      getPosition: (d) => d.coordinates,
      radiusUnits: "meters",
      radiusMinPixels: 10,
      radiusMaxPixels: 80,
      getRadius: (d: Cluster) => {
        if (d.data.length > 1) {
          // Cluster: use the max range among its members
          return Math.max(...d.data.map(getWifiRange));
        }
        return getWifiRange(d.data[0]);
      },
      getFillColor: (d: Cluster) => {
        // Find most frequent frequency_mhz among all points in this cluster
        const freq: Record<number, number> = {};
        for (const s of d.data)
          freq[s.frequency_mhz] = (freq[s.frequency_mhz] ?? 0) + 1;
        const dominant = Number(
          Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0],
        );
        return getFreqColor(dominant);
      },
      stroked: true,
      getLineColor: [255, 255, 255, 220],
      lineWidthMinPixels: 1.5,
      lineWidthMaxPixels: 2,
      pickable: true,
      onHover: (info: any) => {
        if (info.object) console.log(info.object);
      },
      onClick: (info: any) => {
        if (info.object) {
          setSelectedCluster(info.object as Cluster);
          setSelectedBssid(null);
        }
      },
    }),
    new TextLayer({
      id: "labels",
      data: clusters,
      getPosition: (d) => [d.coordinates[0], d.coordinates[1], 0],
      getText: (d: Cluster) => d.address,
      getColor: [0, 0, 0, 220],
      getSize: 11,
      getTextAnchor: "middle",
      getAlignmentBaseline: "center",
      background: true,
      getBackgroundColor: [255, 255, 255, 180],
      backgroundPadding: [3, 2, 3, 2],
    }),
  ];

  // Push updated layers to the deck.gl overlay
  useEffect(() => {
    if (!overlayRef.current) return;
    overlayRef.current.setProps({
      layers: createLayers(clusters),
    });
  }, [clusters]);

  const modalSamples = selectedCluster
    ? selectedBssid
      ? selectedCluster.data.filter((s) => s.bssid === selectedBssid)
      : selectedCluster.data
    : [];

  return (
    <div className="relative w-screen h-screen">
      <MapGL
        ref={mapRef}
        initialViewState={viewState}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        style={{ width: "100%", height: "100%" }}
        onMove={(evt) => setViewState(evt.viewState)}
        onLoad={(e) => {
          const map = e.target;
          const deckOverlay = new MapboxOverlay({
            interleaved: true,
            layers: [],
          });
          overlayRef.current = deckOverlay;
          map.addControl(deckOverlay);
        }}
      />

      {/* color legend */}
      <div className="absolute bottom-6 left-4 z-10 rounded-2xl border border-slate-200 bg-white/90 px-3 py-2.5 shadow-sm backdrop-blur-sm">
        <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-widest text-slate-400">
          Frequency band
        </p>
        <div className="space-y-1.5">
          {(
            [
              { color: "#00c850", label: "2.4 GHz" },
              { color: "#0078ff", label: "5 GHz" },
              { color: "#b400ff", label: "6 GHz" },
            ] as const
          ).map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full opacity-80"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-slate-700">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {selectedCluster && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => {
            setSelectedCluster(null);
            setSelectedBssid(null);
          }}
        >
          <div
            className="relative w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                setSelectedCluster(null);
                setSelectedBssid(null);
              }}
              className="absolute -top-3 -right-3 z-10 rounded-full bg-white p-1.5 shadow-md text-slate-500 hover:text-slate-800"
              aria-label="Close"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <PopuModel
              sample={modalSamples}
              count={data.length}
              onSelect={(bssid) => setSelectedBssid(bssid)}
              onBack={() => setSelectedBssid(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
