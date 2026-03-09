import axios from 'axios';

interface PlacePhoto {
  name: string;
  widthPx: number;
  heightPx: number;
}

interface PlaceReview {
  name: string;
  relativePublishTimeDescription: string;
  rating: number;
  text: { text: string; languageCode: string };
  originalText: { text: string; languageCode: string };
  authorAttribution: {
    displayName: string;
    uri: string;
    photoUri: string;
  };
  publishTime: string;
}

interface PlaceOpeningHours {
  openNow: boolean;
  periods: Array<{
    open: { day: number; hour: number; minute: number };
    close?: { day: number; hour: number; minute: number };
  }>;
  weekdayDescriptions: string[];
}

interface GooglePlace {
  name: string;
  id: string;
  displayName: { text: string; languageCode: string };
  formattedAddress: string;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  regularOpeningHours?: PlaceOpeningHours;
  businessStatus: string;
  types: string[];
  googleMapsUri: string;
  photos?: PlacePhoto[];
  reviews?: PlaceReview[];
  rating?: number;
  userRatingCount?: number;
}

export interface BusinessData {
  placeId: string;
  name: string;
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  websiteUrl?: string;
  googleMapsUrl: string;
  rating?: number;
  ratingCount?: number;
  types: string[];
  hours?: any;
  photos?: any[];
  reviews?: any[];
}

export class GooglePlacesService {
  private apiKey: string;
  private baseUrl = 'https://places.googleapis.com/v1/places:searchNearby';
  
  // Business categories to search for (using valid Google Places API types)
  // Groups are batched per request — each group is one API call
  private businessTypes = [
    // Food & Drink
    ['restaurant', 'cafe', 'bar', 'bakery'],
    ['meal_delivery', 'meal_takeaway', 'liquor_store'],
    // Beauty & Personal Care
    ['hair_care', 'beauty_salon', 'spa'],
    // Home Services & Contractors
    ['electrician', 'plumber', 'roofing_contractor', 'painter'],
    ['locksmith', 'moving_company', 'storage'],
    // Automotive
    ['car_dealer', 'car_repair', 'car_wash', 'gas_station'],
    // Healthcare & Wellness
    ['dentist', 'doctor', 'veterinary_care', 'pharmacy'],
    ['physiotherapist', 'hospital'],
    // Retail & Shopping
    ['store', 'clothing_store', 'hardware_store', 'furniture_store'],
    ['pet_store', 'book_store', 'jewelry_store', 'shoe_store'],
    ['electronics_store', 'bicycle_store', 'convenience_store'],
    // Professional Services
    ['accounting', 'lawyer', 'insurance_agency', 'real_estate_agency'],
    ['travel_agency', 'finance'],
    // Fitness & Recreation
    ['gym'],
    // Community & Education
    ['church', 'mosque', 'synagogue', 'hindu_temple'],
    ['school', 'library', 'museum'],
    // Lodging & Events
    ['lodging', 'campground', 'rv_park'],
    // Pets
    ['pet_store', 'veterinary_care'],
    // Other Services
    ['laundry', 'funeral_home', 'cemetery'],
    ['florist', 'bank', 'post_office'],
  ];

  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('Google Places API key not found in environment variables');
    }
  }

  async scanArea(centerLat: number, centerLng: number, radiusMeters: number): Promise<BusinessData[]> {
    const allBusinesses: BusinessData[] = [];
    const seenPlaceIds = new Set<string>();

    console.log(`🔍 Scanning area: ${centerLat}, ${centerLng} (radius: ${radiusMeters}m)`);

    // Search for each business category
    for (const typeGroup of this.businessTypes) {
      try {
        console.log(`🏪 Searching for: ${typeGroup.join(', ')}`);
        
        const places = await this.searchNearby(centerLat, centerLng, radiusMeters, typeGroup);
        
        for (const place of places) {
          if (seenPlaceIds.has(place.id)) {
            continue; // Skip duplicates
          }

          seenPlaceIds.add(place.id);
          const businessData = this.transformPlaceToBusinessData(place);
          allBusinesses.push(businessData);
          
          console.log(`  ✅ ${businessData.name} (${businessData.websiteUrl ? 'has website' : 'no website'})`);
        }

        // Rate limiting - wait between requests
        await this.delay(200);

      } catch (error) {
        console.error(`❌ Error searching for ${typeGroup.join(', ')}:`, error);
      }
    }

    console.log(`📊 Total businesses found: ${allBusinesses.length}`);
    return allBusinesses;
  }

  private async searchNearby(
    lat: number, 
    lng: number, 
    radiusMeters: number, 
    includedTypes: string[]
  ): Promise<GooglePlace[]> {
    
    const fieldMask = [
      'places.id',
      'places.displayName',
      'places.formattedAddress',
      'places.websiteUri',
      'places.nationalPhoneNumber',
      'places.regularOpeningHours',
      'places.businessStatus',
      'places.types',
      'places.googleMapsUri',
      'places.photos',
      'places.reviews',
      'places.rating',
      'places.userRatingCount'
    ].join(',');

    const requestBody = {
      includedTypes,
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: {
            latitude: lat,
            longitude: lng
          },
          radius: radiusMeters
        }
      }
    };

    try {
      const response = await axios.post(this.baseUrl, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': fieldMask
        },
        timeout: 10000
      });

      return response.data.places || [];

    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Google Places API error:', error.response?.data || error.message);
      }
      throw error;
    }
  }

  private transformPlaceToBusinessData(place: GooglePlace): BusinessData {
    // Parse address components
    const addressParts = place.formattedAddress.split(', ');
    let city, state, zip;
    
    if (addressParts.length >= 3) {
      // Assuming format: "Street Address, City, State Zip, Country"
      const lastParts = addressParts[addressParts.length - 2]?.split(' ') || [];
      if (lastParts.length >= 2) {
        state = lastParts[0];
        zip = lastParts[1];
      }
      city = addressParts[addressParts.length - 3];
    }

    // Extract place ID from the name field (format: places/ChIJ...)
    const placeId = place.name?.replace('places/', '') || place.id || 'unknown';

    return {
      placeId,
      name: place.displayName?.text || 'Unknown Business',
      address: place.formattedAddress,
      city,
      state,
      zip,
      phone: place.nationalPhoneNumber,
      websiteUrl: place.websiteUri,
      googleMapsUrl: place.googleMapsUri,
      rating: place.rating,
      ratingCount: place.userRatingCount,
      types: place.types || [],
      hours: place.regularOpeningHours || null,
      photos: place.photos?.slice(0, 5) || [], // Limit to 5 photos
      reviews: place.reviews?.slice(0, 3) || [] // Limit to 3 reviews
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}