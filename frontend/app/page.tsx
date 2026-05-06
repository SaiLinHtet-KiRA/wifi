import MapComponent from "@/components/Map/Map";
import { readData } from "@/helper/read-data";

export default async function Page() {
  const data = await readData();
  
  return <MapComponent data={data} />;
}
