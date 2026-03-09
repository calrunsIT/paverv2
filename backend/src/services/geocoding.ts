import axios from 'axios';

export interface GeocodingResult {
  lat: number;
  lng: number;
  formattedAddress: string;
}

export class GeocodingService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('Google Places API key not found in environment variables');
    }
  }

  async geocode(query: string): Promise<GeocodingResult> {
    // Use Places API (New) Text Search instead of Geocoding API
    const response = await axios.post(
      'https://places.googleapis.com/v1/places:searchText',
      { textQuery: query, maxResultCount: 1 },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': 'places.location,places.formattedAddress'
        },
        timeout: 10000
      }
    );

    if (!response.data.places?.length) {
      throw new Error(`Could not find location: "${query}". Try a more specific name like "Adairsville, GA".`);
    }

    const place = response.data.places[0];
    return {
      lat: place.location.latitude,
      lng: place.location.longitude,
      formattedAddress: place.formattedAddress
    };
  }
}
