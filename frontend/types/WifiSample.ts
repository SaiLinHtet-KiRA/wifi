export type GPS = {
  accuracy: number; // 4.9
  lat: number;
  lng: number;
};

export type WifiSample = {
  band: "2.4 GHz" | "5 GHz" | "6 GHz" | string;
  bssid: string;
  captured_at: string; // or Date
  channel: number;
  collection_id: string;
  frequency_mhz: number;
  gps: GPS;
  merged_count: number;
  rssi_dbm: number;
  sample_id: string;
  security: string;
  ssid: string;
  username: string;
  wifi_count: number;
  wifi_standard: string;
};
