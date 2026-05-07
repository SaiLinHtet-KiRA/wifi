'use client';

import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

type WifiData = {
  bssid: string;
  ssid: string;
  rssi_dbm: string;
  band: string;
  gps: { lat: number | null; lng: number | null };
  captured_at: string;
};

type Props = {
  data: WifiData[];
};

export default function DashboardCharts({ data }: Props) {
  const wifiCountRef = useRef<HTMLCanvasElement>(null);
  const rssiDistRef = useRef<HTMLCanvasElement>(null);
  const bandDistRef = useRef<HTMLCanvasElement>(null);
  const hourlyDistRef = useRef<HTMLCanvasElement>(null);
  const chartsRef = useRef<Chart[]>([]);

  useEffect(() => {
    chartsRef.current.forEach((chart) => chart.destroy());
    chartsRef.current = [];

    const uniqueBSSIDs = new Set(data.map((d) => d.bssid)).size;
    const uniqueSSIDs = new Set(data.filter((d) => d.ssid !== '<hidden>').map((d) => d.ssid)).size;
    const bandCounts = data.reduce((acc, d) => {
      const band = d.band || 'Unknown';
      acc[band] = (acc[band] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    if (wifiCountRef.current) {
      const chart = new Chart(wifiCountRef.current, {
        type: 'bar',
        data: {
          labels: ['Unique BSSID', 'Unique SSID', 'Total Records'],
          datasets: [
            {
              label: 'WiFi Counts',
              data: [uniqueBSSIDs, uniqueSSIDs, data.length],
              backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
            },
          ],
        },
        options: { 
          responsive: true, 
          maintainAspectRatio: false,
          plugins: { title: { display: true, color: '#333' } }
        },
      });
      chartsRef.current.push(chart);
    }

    if (bandDistRef.current) {
      const chart = new Chart(bandDistRef.current, {
        type: 'doughnut',
        data: {
          labels: Object.keys(bandCounts),
          datasets: [
            {
              data: Object.values(bandCounts),
              backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
            },
          ],
        },
        options: { 
          responsive: true, 
          maintainAspectRatio: false,
          plugins: { title: { display: true, color: '#333' } }
        },
      });
      chartsRef.current.push(chart);
    }

    const rssiRanges = {
      'Excellent (-30 to -50)': data.filter((d) => {
        const rssi = parseInt(d.rssi_dbm || '0');
        return rssi >= -50 && rssi <= -30;
      }).length,
      'Good (-50 to -60)': data.filter((d) => {
        const rssi = parseInt(d.rssi_dbm || '0');
        return rssi > -60 && rssi <= -50;
      }).length,
      'Fair (-60 to -70)': data.filter((d) => {
        const rssi = parseInt(d.rssi_dbm || '0');
        return rssi > -70 && rssi <= -60;
      }).length,
      'Weak (< -70)': data.filter((d) => {
        const rssi = parseInt(d.rssi_dbm || '0');
        return rssi < -70;
      }).length,
    };

    if (rssiDistRef.current) {
      const chart = new Chart(rssiDistRef.current, {
        type: 'bar',
        data: {
          labels: Object.keys(rssiRanges),
          datasets: [
            {
              label: 'RSSI Distribution',
              data: Object.values(rssiRanges),
              backgroundColor: '#8b5cf6',
            },
          ],
        },
        options: { 
          responsive: true, 
          maintainAspectRatio: false,
          plugins: { title: { display: true, color: '#333' } }
        },
      });
      chartsRef.current.push(chart);
    }

    const hourlyData = data.reduce((acc, d) => {
      const hour = new Date(d.captured_at).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    if (hourlyDistRef.current) {
      const chart = new Chart(hourlyDistRef.current, {
        type: 'line',
        data: {
          labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
          datasets: [
            {
              label: 'WiFi by Hour',
              data: Array.from({ length: 24 }, (_, i) => hourlyData[i] || 0),
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              fill: true,
            },
          ],
        },
        options: { 
          responsive: true, 
          maintainAspectRatio: false,
          plugins: { title: { display: true, color: '#333' } }
        },
      });
      chartsRef.current.push(chart);
    }

    return () => {
      chartsRef.current.forEach((chart) => chart.destroy());
      chartsRef.current = [];
    };
  }, [data]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">WiFi Counts</h3>
        <div className="h-64">
          <canvas ref={wifiCountRef}></canvas>
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Band Distribution</h3>
        <div className="h-64">
          <canvas ref={bandDistRef}></canvas>
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">RSSI Distribution</h3>
        <div className="h-64">
          <canvas ref={rssiDistRef}></canvas>
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">WiFi by Hour</h3>
        <div className="h-64">
          <canvas ref={hourlyDistRef}></canvas>
        </div>
      </div>
    </div>
  );
}