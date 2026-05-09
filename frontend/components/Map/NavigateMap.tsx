'use client';

import { useState, useRef, useEffect } from "react";
import { Map as MapGL } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { ScatterplotLayer, LineLayer } from "@deck.gl/layers";
import "maplibre-gl/dist/maplibre-gl.css";
import { WifiSample } from "@/types/WifiSample";

type UserLocation = { lat: number; lng: number };
type NearestNeighbor = {
  rank: number;
  bssid: string;
  lat: number;
  lng: number;
  distance: number;
  direction: string;
};

type Props = {
  userLocation: UserLocation;
  nearestNeighbors: NearestNeighbor[];
  matchedPoints: WifiSample[];
  onPointClick: (bssid: string) => void;
  focusedPoint: { lng: number; lat: number } | null;
  showLines?: boolean;
  showRangeCircle?: boolean;
  radius?: number;
  initialZoom?: number;
};

const getBandColor = (band: string): number[] => {
  if (band === '2.4 GHz') return [0, 200, 80, 255];
  if (band === '5 GHz') return [239, 177, 0, 255];
  if (band === '6 GHz') return [251, 44, 54, 255];
  return [0, 200, 80, 255];
};

export default function NavigateMap({ userLocation, nearestNeighbors, matchedPoints, onPointClick, focusedPoint, showLines = true, showRangeCircle = false, radius = 50, initialZoom = 15 }: Props) {
  const mapRef = useRef<MapRef>(null);
  const overlayRef = useRef<MapboxOverlay | null>(null);
  const [viewState, setViewState] = useState({
    longitude: userLocation.lng,
    latitude: userLocation.lat,
    zoom: initialZoom,
    pitch: 0,
  });

  useEffect(() => {
    if (focusedPoint && mapRef.current) {
      mapRef.current.flyTo({
        center: [focusedPoint.lng, focusedPoint.lat],
        zoom: initialZoom,
        duration: 1000,
      });
    }
  }, [focusedPoint]);

  const createLayers = (): any[] => {
    const layers: any[] = [
      new ScatterplotLayer({
        id: "user-location",
        data: [{ position: [userLocation.lng, userLocation.lat] }],
        getPosition: (d: any) => d.position,
        getRadius: 1,
        getFillColor: [255, 0, 0, 255],
      }),
      ...(showRangeCircle ? [
        new ScatterplotLayer({
          id: "range-circle",
          data: [{ position: [userLocation.lng, userLocation.lat] }],
          getPosition: (d: any) => d.position,
          getRadius: radius,
          getFillColor: [0, 120, 255, 30],
          stroked: true,
          getLineColor: [0, 120, 255, 150],
          lineWidthMinPixels: 2,
          radiusUnits: 'meters',
        })
      ] : []),
    ];

nearestNeighbors.forEach((nn) => {
      const matchedPoint = matchedPoints.find(p => p.bssid === nn.bssid);
      const color: [number, number, number, number] = matchedPoint ? getBandColor(matchedPoint.band) as [number, number, number, number] : [0, 255, 0, 255];
      
      layers.push(
        new ScatterplotLayer({
          id: `wifi-point-${nn.bssid}`,
          data: [{ position: [nn.lng, nn.lat], bssid: nn.bssid, rank: nn.rank }],
          getPosition: (d: any) => d.position,
          getRadius: 2,
          getFillColor: color,
        })
      );

      if (showLines) {
        layers.push(
          new LineLayer({
            id: `line-${nn.bssid}`,
            data: [{ 
              sourcePosition: [userLocation.lng, userLocation.lat], 
              targetPosition: [nn.lng, nn.lat] 
            }],
            getSourcePosition: (d: any) => d.sourcePosition,
            getTargetPosition: (d: any) => d.targetPosition,
            getColor: [...color.slice(0, 3), 100] as [number, number, number, number],
            getWidth: 2,
          })
        );
      }
    });

    return layers;
  };

  useEffect(() => {
    if (overlayRef.current) {
      overlayRef.current.setProps({ layers: createLayers() });
    }
  }, [nearestNeighbors, userLocation, matchedPoints]);

  return (
    <div className="relative w-full h-full">
      <MapGL
        ref={mapRef}
        initialViewState={viewState}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        style={{ width: "100%", height: "100%" }}
        onMove={(evt) => setViewState(evt.viewState)}
        onClick={(info: any) => {
          if (info.layerId && info.layerId.startsWith('wifi-point-')) {
            const bssid = info.object?.bssid;
            if (bssid) {
              onPointClick(bssid);
            }
          }
        }}
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