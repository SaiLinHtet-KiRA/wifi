import MapComponent from "@/components/Map/Map";
import { readData } from "@/helper/read-data";

export default async function MapPage() {
  const data = await readData();
  
  return <div className="h-full w-full"><MapComponent data={data} /></div>;
}