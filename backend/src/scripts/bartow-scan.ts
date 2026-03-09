#!/usr/bin/env tsx

import dotenv from 'dotenv';
import { GooglePlacesService } from '../services/googlePlaces';
import { WebsiteQualityService } from '../services/websiteQuality';
import { PreviewGenerator } from '../services/previewGenerator';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

interface BartowCity {
  name: string;
  lat: number;
  lng: number;
}

// Major cities and towns in Bartow County, GA
const bartowCities: BartowCity[] = [
  { name: 'Cartersville', lat: 34.1651, lng: -84.7999 },
  { name: 'Adairsville', lat: 34.3687, lng: -84.9333 },
  { name: 'White', lat: 34.2659, lng: -84.7441 },
  { name: 'Kingston', lat: 34.2456, lng: -84.9619 },
  { name: 'Emerson', lat: 34.1264, lng: -84.7527 },
  { name: 'Euharlee', lat: 34.1448, lng: -84.9391 },
  { name: 'Taylorsville', lat: 34.0731, lng: -85.3425 }
];

async function runBartowCountyScan() {
  console.log('🍑 Starting Bartow County Business Scan');
  
  const placesService = new GooglePlacesService();
  const qualityService = new WebsiteQualityService();
  
  let totalBusinesses = 0;
  let noWebsiteCount = 0;
  let facebookOnlyCount = 0;
  let poorWebsiteCount = 0;
  let decentWebsiteCount = 0;

  // Scan each city with a smaller radius to get better coverage
  for (const city of bartowCities) {
    console.log(`\n📍 Scanning ${city.name}...`);
    
    try {
      // Use 5km radius for each city center
      const businesses = await placesService.scanArea(city.lat, city.lng, 5000);
      
      console.log(`  Found ${businesses.length} businesses in ${city.name}`);
      
      for (const businessData of businesses) {
        try {
          // Check if business already exists
          const existing = await prisma.business.findUnique({
            where: { placeId: businessData.placeId }
          });

          if (existing) {
            console.log(`  ⏭️ Skipping existing: ${businessData.name}`);
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
              city: businessData.city || city.name,
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

        } catch (error) {
          console.error(`  ❌ Error processing ${businessData.name}:`, error);
        }
      }

      // Rate limiting between cities
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error(`❌ Error scanning ${city.name}:`, error);
    }
  }

  // Create scan record
  await prisma.scan.create({
    data: {
      area: 'Bartow County, GA',
      centerLat: 34.25,
      centerLng: -84.84,
      radiusMeters: 35000, // Approximate county coverage
      businessCount: totalBusinesses,
      noWebsiteCount: noWebsiteCount + facebookOnlyCount + poorWebsiteCount
    }
  });

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
      rating: { gte: 4.0 },
      ratingCount: { gte: 5 }
    },
    orderBy: [
      { rating: 'desc' },
      { ratingCount: 'desc' }
    ],
    take: 10
  });

  console.log(`\n🎯 Found ${candidates.length} good candidates for preview generation`);
  console.log('Top candidates:');
  candidates.forEach((candidate, i) => {
    console.log(`  ${i + 1}. ${candidate.name} (${candidate.rating}⭐, ${candidate.ratingCount} reviews) - ${candidate.websiteQuality}`);
  });

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
    const { totalBusinesses, candidates } = await runBartowCountyScan();
    
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