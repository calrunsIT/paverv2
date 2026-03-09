#!/usr/bin/env tsx

import dotenv from 'dotenv';
import axios from 'axios';
import { WebsiteQualityService } from '../services/websiteQuality';
import { PreviewGenerator } from '../services/previewGenerator';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

// More targeted search for local small businesses
const localBusinessQueries = [
  // Food & Dining
  'restaurants in Cartersville GA',
  'pizza in Cartersville GA',
  'mexican restaurant Cartersville GA',
  'barbecue Cartersville GA',
  'coffee shop Cartersville GA',
  
  // Services
  'hair salon Cartersville GA',
  'barber shop Cartersville GA',
  'auto repair Cartersville GA',
  'plumber Cartersville GA',
  'electrician Cartersville GA',
  'landscaping Cartersville GA',
  'lawn care Cartersville GA',
  
  // Retail
  'clothing store Cartersville GA',
  'gift shop Cartersville GA',
  'florist Cartersville GA',
  'hardware store Cartersville GA',
  
  // Health & Beauty
  'nail salon Cartersville GA',
  'dentist Cartersville GA',
  'chiropractor Cartersville GA',
  'massage therapy Cartersville GA',
  
  // Professional
  'accounting Cartersville GA',
  'insurance agency Cartersville GA',
  'real estate agent Cartersville GA',
  'lawyer Cartersville GA'
];

class EnhancedGooglePlacesService {
  private apiKey: string;
  private baseUrl = 'https://places.googleapis.com/v1/places:searchText';

  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('Google Places API key not found in environment variables');
    }
  }

  async searchByText(query: string): Promise<any[]> {
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
      textQuery: query,
      maxResultCount: 20,
      locationBias: {
        circle: {
          center: {
            latitude: 34.1651,
            longitude: -84.7999
          },
          radius: 25000 // 25km radius around Cartersville
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
        console.error(`Google Places API error for "${query}":`, error.response?.data || error.message);
      }
      throw error;
    }
  }

  transformPlaceToBusinessData(place: any) {
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

    // Extract place ID from the id field
    const placeId = place.id || 'unknown';

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
      photos: place.photos?.slice(0, 5) || [],
      reviews: place.reviews?.slice(0, 3) || []
    };
  }
}

async function runEnhancedBartowScan() {
  console.log('🔍 Enhanced Bartow County Business Scan - Text Search Mode');
  
  const placesService = new EnhancedGooglePlacesService();
  const qualityService = new WebsiteQualityService();
  
  let totalBusinesses = 0;
  let noWebsiteCount = 0;
  let facebookOnlyCount = 0;
  let poorWebsiteCount = 0;
  let decentWebsiteCount = 0;
  const allPlaceIds = new Set();

  // Search using text queries
  for (const query of localBusinessQueries) {
    console.log(`\n🔍 Searching: "${query}"`);
    
    try {
      const places = await placesService.searchByText(query);
      console.log(`  Found ${places.length} results`);
      
      for (const place of places) {
        try {
          const businessData = placesService.transformPlaceToBusinessData(place);
          
          // Skip if we've already processed this place
          if (allPlaceIds.has(businessData.placeId)) {
            continue;
          }
          allPlaceIds.add(businessData.placeId);

          // Check if business already exists in database
          const existing = await prisma.business.findUnique({
            where: { placeId: businessData.placeId }
          });

          if (existing) {
            console.log(`  ⏭️ Skipping existing: ${businessData.name}`);
            continue;
          }

          // Filter out chain businesses (focus on local)
          const chainKeywords = [
            'walmart', 'mcdonalds', 'burger king', 'subway', 'dominos', 'pizza hut',
            'kfc', 'taco bell', 'wendys', 'starbucks', 'dunkin', 'cvs', 'walgreens',
            'autozone', 'advance auto', 'lowes', 'home depot', 'dollar general'
          ];
          
          const isChain = chainKeywords.some(chain => 
            businessData.name.toLowerCase().includes(chain)
          );
          
          if (isChain) {
            console.log(`  ⏭️ Skipping chain: ${businessData.name}`);
            continue;
          }

          // Check website quality
          const { hasWebsite, websiteQuality, reason } = await qualityService.checkWebsiteQuality(
            businessData.websiteUrl
          );

          // Count by quality
          if (!hasWebsite || websiteQuality === 'none') {
            noWebsiteCount++;
          } else if (websiteQuality === 'facebook_only') {
            facebookOnlyCount++;
          } else if (websiteQuality === 'poor') {
            poorWebsiteCount++;
          } else if (websiteQuality === 'decent') {
            decentWebsiteCount++;
          }

          // Create business record
          await prisma.business.create({
            data: {
              placeId: businessData.placeId,
              name: businessData.name,
              address: businessData.address,
              city: businessData.city || 'Cartersville',
              county: 'Bartow County',
              state: businessData.state || 'GA',
              zip: businessData.zip,
              phone: businessData.phone,
              websiteUrl: businessData.websiteUrl,
              googleMapsUrl: businessData.googleMapsUrl,
              rating: businessData.rating,
              ratingCount: businessData.ratingCount,
              types: JSON.stringify(businessData.types),
              hours: businessData.hours ? JSON.stringify(businessData.hours) : null,
              photos: JSON.stringify(businessData.photos),
              reviews: JSON.stringify(businessData.reviews),
              hasWebsite,
              websiteQuality,
              status: 'discovered'
            }
          });

          totalBusinesses++;
          console.log(`  ✅ ${businessData.name} (${websiteQuality}${reason ? ' - ' + reason : ''})`);

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
          console.error(`  ❌ Error processing business:`, error);
        }
      }

      // Rate limiting between queries
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`❌ Error searching "${query}":`, error);
    }
  }

  console.log('\n📊 SCAN COMPLETE');
  console.log(`Total businesses discovered: ${totalBusinesses}`);
  console.log(`No website: ${noWebsiteCount}`);
  console.log(`Facebook only: ${facebookOnlyCount}`);
  console.log(`Poor website: ${poorWebsiteCount}`);
  console.log(`Decent website: ${decentWebsiteCount}`);

  // Find best candidates for preview generation
  const candidates = await prisma.business.findMany({
    where: {
      county: 'Bartow County',
      OR: [
        { websiteQuality: 'none' },
        { websiteQuality: 'facebook_only' },
        { websiteQuality: 'poor' }
      ],
      rating: { gte: 3.5 },
      ratingCount: { gte: 3 }
    },
    orderBy: [
      { rating: 'desc' },
      { ratingCount: 'desc' }
    ],
    take: 10
  });

  console.log(`\n🎯 Found ${candidates.length} good candidates for preview generation`);
  if (candidates.length > 0) {
    console.log('Top candidates:');
    candidates.forEach((candidate, i) => {
      console.log(`  ${i + 1}. ${candidate.name} (${candidate.rating}⭐, ${candidate.ratingCount} reviews) - ${candidate.websiteQuality}`);
    });
  }

  return { totalBusinesses, candidates };
}

async function generatePreviews(candidates: any[]) {
  console.log('\n🎨 Generating preview websites for top 3 candidates...');
  
  const generator = new PreviewGenerator();
  const generatedPreviews = [];

  for (let i = 0; i < Math.min(3, candidates.length); i++) {
    const candidate = candidates[i];
    
    try {
      console.log(`\n${i + 1}. Generating preview for ${candidate.name}...`);
      
      const previewUrl = await generator.generatePreview(candidate);
      
      // Update business status
      await prisma.business.update({
        where: { id: candidate.id },
        data: {
          status: 'preview_generated',
          previewUrl
        }
      });

      generatedPreviews.push({
        name: candidate.name,
        previewUrl,
        rating: candidate.rating,
        ratingCount: candidate.ratingCount,
        websiteQuality: candidate.websiteQuality,
        phone: candidate.phone,
        address: candidate.address
      });

      console.log(`✅ Preview generated: ${previewUrl}`);

    } catch (error) {
      console.error(`❌ Error generating preview for ${candidate.name}:`, error);
    }
  }

  return generatedPreviews;
}

// Main execution
async function main() {
  try {
    const { totalBusinesses, candidates } = await runEnhancedBartowScan();
    
    if (candidates.length > 0) {
      const previews = await generatePreviews(candidates);
      
      console.log('\n🎉 MISSION COMPLETE!');
      console.log(`✅ Discovered ${totalBusinesses} businesses`);
      console.log(`✅ Generated ${previews.length} preview websites`);
      
      if (previews.length > 0) {
        console.log('\n📁 Generated preview files:');
        previews.forEach((preview, i) => {
          const slug = preview.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
          console.log(`${i + 1}. ${preview.name}`);
          console.log(`   File: ./previews/${slug}/index.html`);
          console.log(`   Rating: ${preview.rating}⭐ (${preview.ratingCount} reviews)`);
          console.log(`   Quality: ${preview.websiteQuality}`);
          console.log(`   Contact: ${preview.phone || 'N/A'}`);
          console.log(`   Address: ${preview.address}`);
        });
      }
    } else {
      console.log('\n⚠️  No suitable candidates found for preview generation.');
      console.log('All discovered businesses either have decent websites or insufficient ratings.');
    }

  } catch (error) {
    console.error('❌ Scan failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}