'use client';

import { useState, useEffect } from 'react';
import NavigateMap from "@/components/Map/NavigateMap";
import PopuModel from "@/components/model/PopuModel";
import { WifiSample } from "@/types/WifiSample";

type CsvRow = Record<string, any>;

type WifiPoint = {
  bssid: string;
  lat: number;
  lng: number;
  distance_m: number;
  direction: string;
};

export default function RangeNavigatePage() {
  const userLocation = { lat: 13.681453879054700, lng: 100.61025550930052 };
  const [wifiPoints, setWifiPoints] = useState<WifiPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [csvData, setCsvData] = useState<CsvRow[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<WifiSample[] | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [focusedPoint, setFocusedPoint] = useState<{ lng: number; lat: number } | null>(null);
  const [radius, setRadius] = useState(50);

  useEffect(() => {
    fetch('/api/wifi-data')
      .then((res) => res.json())
      .then((data) => setCsvData(data))
      .catch((err) => console.error('Error loading CSV data:', err));
  }, []);

  const fetchRange = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/range?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=${radius}`
      );
      const data = await response.json();
      if (data.wifi_points) {
        setWifiPoints(data.wifi_points);
      }
    } catch (error) {
      console.error('Error fetching wifi points:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRange();
  }, [radius]);

  const matchedPoints: WifiSample[] = wifiPoints
    .map((wp) => {
      const match = csvData.find((row) => row.bssid === wp.bssid);
      if (match) {
        return {
          bssid: match.bssid,
          ssid: match.ssid || match.bssid,
          rssi_dbm: parseInt(match.rssi_dbm) || 0,
          frequency_mhz: parseInt(match.frequency_mhz) || 0,
          channel: parseInt(match.channel) || 0,
          band: match.band || '',
          security: match.security || '',
          address: match.address || '',
          gps: match.gps,
          sample_id: match.sample_id || '',
          wifi_count: parseInt(match.wifi_count) || 0,
          captured_at: match.captured_at || '',
          collection_id: match.collection_id || '',
          username: match.username || '',
          wifi_standard: match.wifi_standard || '',
          merged_count: match.merged_count || 0,
        };
      }
      return null;
    })
    .filter((p): p is WifiSample => p !== null);

  const handlePointClick = (bssid: string, lat?: number, lng?: number) => {
    const samples = matchedPoints.filter((p) => p.bssid === bssid);
    if (samples.length > 0) {
      setSelectedPoint(samples);
      setSelectedAddress(samples[0].address || '');
      if (lat !== undefined && lng !== undefined) {
        setFocusedPoint({ lng, lat });
      }
    }
  };

  const nearestNeighbors = wifiPoints.map((wp, i) => ({
    rank: i + 1,
    bssid: wp.bssid,
    lat: wp.lat,
    lng: wp.lng,
    distance: wp.distance_m / 1000,
    direction: wp.direction,
  }));

  return (
    <div className="h-full w-full relative">
      <NavigateMap 
        userLocation={userLocation} 
        nearestNeighbors={nearestNeighbors}
        matchedPoints={matchedPoints}
        onPointClick={(bssid) => {
          const point = wifiPoints.find(p => p.bssid === bssid);
          handlePointClick(bssid, point?.lat, point?.lng);
        }}
        focusedPoint={focusedPoint}
        showLines={false}
        showRangeCircle={true}
        radius={radius}
        initialZoom={18}
      />
      <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-lg border border-slate-200 max-w-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-900">WiFi in Range</h2>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-16 text-xs border border-slate-200 rounded px-2 py-1"
              min={10}
              max={500}
            />
            <span className="text-xs text-slate-500">m</span>
            <button
              onClick={fetchRange}
              disabled={loading}
              className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded-full hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
            >
              {loading ? '...' : '↻'}
            </button>
          </div>
        </div>
        {wifiPoints.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {wifiPoints.map((point, idx) => {
              const mp = matchedPoints.find(p => p.bssid === point.bssid);
              const bandColor = mp?.band === '2.4 GHz' ? 'bg-green-500' : mp?.band === '5 GHz' ? 'bg-yellow-500' : 'bg-red-500';
              return (
                <button
                  key={idx}
                  onClick={() => handlePointClick(point.bssid, point.lat, point.lng)}
                  className="w-full text-left p-3 rounded-xl hover:bg-slate-50 border border-slate-100 transition-all hover:border-slate-300"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${bandColor}`} />
                    <span className="text-sm font-medium text-slate-900 truncate">#{idx + 1} {mp?.ssid || point.bssid}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate font-mono">{point.bssid}</p>
                  <div className="flex gap-3 mt-1.5 text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <span className="text-slate-400">dist:</span> {point.distance_m}m
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="text-slate-400">dir:</span> {point.direction}
                    </span>
                    {mp && <span className="flex items-center gap-1"><span className="text-slate-400">ch:</span> {mp.channel}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
        <div className="mt-2 text-xs text-slate-500 text-center">
          Found {wifiPoints.length} WiFi points
        </div>
      </div>
      {selectedPoint && selectedPoint.length > 0 && (
        <div className="absolute top-4 right-4 z-10 w-80">
          <PopuModel
            sample={selectedPoint}
            count={selectedPoint.length}
            address={selectedAddress}
            onSelect={() => {}}
            onBack={() => setSelectedPoint(null)}
          />
        </div>
      )}
    </div>
  );
}