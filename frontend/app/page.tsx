import MapComponent from "@/components/Map/Map";
import { readSet1Csv } from "@/helper/read-data";

export default async function Page() {
  const data = await readSet1Csv();
  return <MapComponent data={data} />;
}
