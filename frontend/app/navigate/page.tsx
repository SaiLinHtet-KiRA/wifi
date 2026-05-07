'use client';

import { useState, useEffect } from 'react';
import NavigateMap from "@/components/Map/NavigateMap";

type ClosestPoint = { bssid: string; lat: number; lng: number; distance_km: number };

export default function NavigatePage() {
  const userLocation = { lat: 13.6810421, lng: 100.6106281 };
  const [closestPoint, setClosestPoint] = useState<ClosestPoint | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchClosest = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/closest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bssid: '' }),
      });
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        setClosestPoint(data.results[0]);
      }
    } catch (error) {
      console.error('Error fetching closest point:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClosest();
  }, []);

  return (
    <div className="h-full w-full relative">
      <NavigateMap userLocation={userLocation} closestPoint={closestPoint} />
      <div className="absolute top-4 left-4 z-10 bg-white p-4 rounded-lg shadow">
        <h2 className="font-semibold mb-2">Find Closest WiFi</h2>
        <button
          onClick={fetchClosest}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? 'Searching...' : 'Find Closest'}
        </button>
        {closestPoint && (
          <div className="mt-2 text-sm">
            <p>BSSID: {closestPoint.bssid}</p>
            <p>Distance: {closestPoint.distance_km?.toFixed(2)} km</p>
          </div>
        )}
      </div>
    </div>
  );
}