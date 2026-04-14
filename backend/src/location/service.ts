import axios from "axios";
import { APIError, ValidationError } from "../util/error/errors";

export interface ReverseGeocodeResult {
  address: string;
  city: string;
  country: string;
  formattedAddress: string;
}

interface NominatimResponse {
  error?: string;
  display_name: string;
  address: {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    country?: string;
  };
}

class LocationService {
  private instance = axios.create({
    baseURL: "https://nominatim.openstreetmap.org",
    headers: {
      "User-Agent": "wifi-detection/1.0 (sailinhtet.d@gmail.com)",
    },
    timeout: 5000,
  });

  async coordinatesToAddress(
    lat: number,
    lng: number,
  ): Promise<ReverseGeocodeResult> {
    try {
      const response = await this.instance.get<NominatimResponse>("/reverse", {
        params: {
          lat,
          lon: lng,
          format: "json",
          "accept-language": "en",
        },
      });

      const data = response.data;

      // Nominatim returns error inside data sometimes
      if (!data || data.error) {
        throw new ValidationError("No address found for the given coordinates");
      }

      const addr = data.address;

      const streetNumber = addr?.house_number ?? "";
      const road = addr?.road ?? "";
      const city =
        addr?.city ?? addr?.town ?? addr?.village ?? addr?.county ?? "";
      const country = addr?.country ?? "";

      const address = [streetNumber, road].filter(Boolean).join(" ");

      return {
        address,
        city,
        country,
        formattedAddress: data.display_name,
      };
    } catch (error: any) {
      console.error("Nominatim error:", error.message);
      throw new APIError("Failed to reach Nominatim API");
    }
  }
}

export default new LocationService();
