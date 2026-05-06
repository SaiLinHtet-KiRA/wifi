export function formatAddress(address: string): string {
  if (!address) return "";
  return address
    .replace(/-/g, ",")
    .split(",")
    .map((word) => word.trim().charAt(0).toUpperCase() + word.trim().slice(1).toLowerCase())
    .join(",");
}