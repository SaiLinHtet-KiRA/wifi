import { readData } from "@/helper/read-data";
import DashboardCharts from "./components/DashboardCharts";

export default async function DashboardPage() {
  const data = await readData();

  const stats = {
    totalRecords: data.length,
    uniqueBSSID: new Set(data.map((d: any) => d.bssid)).size,
    uniqueSSID: new Set(data.filter((d: any) => d.ssid !== '<hidden>').map((d: any) => d.ssid)).size,
  };

  return (
    <div className="p-6 h-full overflow-auto">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-500 text-white p-4 rounded-lg">
          <div className="text-sm">Total Records</div>
          <div className="text-2xl font-bold">{stats.totalRecords}</div>
        </div>
        <div className="bg-green-500 text-white p-4 rounded-lg">
          <div className="text-sm">Unique BSSID</div>
          <div className="text-2xl font-bold">{stats.uniqueBSSID}</div>
        </div>
        <div className="bg-purple-500 text-white p-4 rounded-lg">
          <div className="text-sm">Unique SSID</div>
          <div className="text-2xl font-bold">{stats.uniqueSSID}</div>
        </div>
      </div>
      <DashboardCharts data={data} />
    </div>
  );
}
