'use client';

import { useState, useRef, useEffect } from "react";
import { Map as MapGL } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { ScatterplotLayer } from "@deck.gl/layers";
import "maplibre-gl/dist/maplibre-gl.css";

type UserLocation = { lat: number; lng: number };
type ClosestPoint = { bssid: string; lat: number; lng: number; distance_km: number };

type Props = {
  userLocation: UserLocation;
  closestPoint: ClosestPoint | null;
};

export default function NavigateMap({ userLocation, closestPoint }: Props) {
  const mapRef = useRef<MapRef>(null);
  const overlayRef = useRef<MapboxOverlay | null>(null);
  const [viewState, setViewState] = useState({
    longitude: userLocation.lng,
    latitude: userLocation.lat,
    zoom: 15,
    pitch: 0,
  });

  const createLayers = () => {
    const layers = [
      new ScatterplotLayer({
        id: "user-location",
        data: [{ position: [userLocation.lng, userLocation.lat] }],
        getPosition: (d) => d.position,
        getRadius: 15,
        getFillColor: [255, 0, 0, 180],
        stroked: true,
        getLineColor: [255, 255, 255, 255],
        lineWidthMinPixels: 2,
      }),
    ];

    if (closestPoint) {
      layers.push(
        new ScatterplotLayer({
          id: "closest-point",
          data: [{ position: [closestPoint.lng, closestPoint.lat] }],
          getPosition: (d) => d.position,
          getRadius: 15,
          getFillColor: [0, 255, 0, 180],
          stroked: true,
          getLineColor: [255, 255, 255, 255],
          lineWidthMinPixels: 2,
        }),
      );
    }

    return layers;
  };

  useEffect(() => {
    if (overlayRef.current) {
      overlayRef.current.setProps({ layers: createLayers() });
    }
  }, [closestPoint, userLocation]);

  return (
    <div className="relative w-full h-full">
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
          deckOverlay.setProps({ layers: createLayers() });
        }}
      />
    </div>
  );
}