import { WifiSample } from "@/types/WifiSample";

function formatAddress(address: string): string {
  if (!address) return "";
  return address
    .replace(/-/g, ",")
    .split(",")
    .map((word) => word.trim().charAt(0).toUpperCase() + word.trim().slice(1).toLowerCase())
    .join(",");
}

type Props = {
  sample: WifiSample[];
  count: number;
  address?: string;
  onSelect: (bssid: string) => void;
  onBack: () => void;
};

function bandColor(band: string): string {
  if (band === "6 GHz") return "#fb2c36";
  if (band === "5 GHz") return "#efb100";
  return "#00c850";
}

export default function PopuModel({ sample, count, address, onSelect, onBack }: Props) {
  if (!sample.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm backdrop-blur-md">
        <h2 className="text-lg font-semibold text-slate-900">
          Wi-Fi sample details
        </h2>
        <p className="mt-3 text-sm text-slate-600">
          Select a point on the map or choose an item from the list to inspect
          the sample.
        </p>
        <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-medium text-slate-900">Loaded samples</p>
          <p className="mt-2 text-3xl font-semibold text-sky-700">{count}</p>
        </div>
      </div>
    );
  }

  if (sample.length > 1) {
    return (
      <div className="flex flex-col rounded-3xl border border-slate-200 bg-white/95 shadow-sm backdrop-blur-md max-h-[80vh]">
        <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3 border-b border-slate-100 shrink-0">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-sky-600">Sample list</p>
            <h2 className="text-sm font-semibold text-slate-900">All samples</h2>
          </div>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-slate-700">
            {sample.length} items
          </span>
        </div>

        <div className="overflow-y-auto px-4 pb-4 pt-3 space-y-1.5">
          {sample.map((s) => (
            <button
              key={`${s.bssid}-${s.sample_id}`}
              type="button"
              onClick={() => onSelect(s.bssid)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-left transition hover:border-sky-500"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900 truncate">{s.ssid || s.bssid}</p>
                <span className="shrink-0 flex items-center gap-1 text-[10px] uppercase tracking-widest text-slate-500">
                  <span className="h-2 w-2 rounded-full opacity-80" style={{ backgroundColor: bandColor(s.band) }} />
                  {s.band}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500 truncate">{s.bssid}</p>
              <div className="mt-1.5 flex gap-1.5 text-[10px] text-slate-500">
                <span className="rounded-full bg-slate-100 px-2 py-0.5">RSSI {s.rssi_dbm}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5">Ch {s.channel}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5">×{s.wifi_count}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const selectedSample = sample[0];

  return (
    <div className="flex flex-col rounded-3xl border border-slate-200 bg-white/95 shadow-sm backdrop-blur-md max-h-[80vh]">
      {/* sticky header */}
      <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="shrink-0 rounded-full bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-sky-600">Sample overview</p>
            <h2 className="text-sm font-semibold text-slate-900 truncate">
              {selectedSample.ssid}
            </h2>
          </div>
        </div>
        <span className="shrink-0 flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-slate-700">
          <span className="h-2 w-2 rounded-full opacity-80" style={{ backgroundColor: bandColor(selectedSample.band) }} />
          {selectedSample.band}
        </span>
      </div>

      {/* scrollable body */}
      <div className="overflow-y-auto px-4 pb-4 pt-3 space-y-3">
        {/* main fields */}
        <div className="grid grid-cols-3 gap-1.5">
          {[
            ["Freq", `${selectedSample.frequency_mhz} MHz`],
            ["Merged", String(selectedSample.merged_count)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-slate-50 px-2.5 py-2">
              <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
              <p className="mt-0.5 text-xs font-medium text-slate-900 truncate">{value}</p>
            </div>
          ))}
        </div>

        {/* wide fields */}
        <div className="space-y-1.5">
          {[
            ["Name", selectedSample.ssid],
            ["BSSID", selectedSample.bssid],
            ["Security", selectedSample.security],
            ["Address", formatAddress(selectedSample.address ?? address ?? "")],
          ].map(([label, value]) => (
            <div key={label} className="flex items-baseline gap-2 rounded-xl bg-slate-50 px-2.5 py-1.5">
              <span className="shrink-0 text-[9px] font-semibold uppercase tracking-widest text-slate-400 w-16">{label}</span>
              <span className="text-xs text-slate-800 break-all">{value}</span>
            </div>
          ))}
        </div>

        {/* GPS row */}
        <div className="grid grid-cols-3 gap-1.5">
          {[
            ["Lat", String(selectedSample.gps.lat)],
            ["Lng", String(selectedSample.gps.lng)],
            ["Acc", String(selectedSample.gps.accuracy)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-sky-50 px-2.5 py-2">
              <p className="text-[9px] font-semibold uppercase tracking-widest text-sky-400">{label}</p>
              <p className="mt-0.5 text-xs font-medium text-slate-900 truncate">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
