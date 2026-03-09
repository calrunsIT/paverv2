import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../server';
import { GooglePlacesService } from '../services/googlePlaces';
import { WebsiteQualityService } from '../services/websiteQuality';
import { GeocodingService } from '../services/geocoding';

const router = Router();

const scanRequestSchema = z.object({
  area: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  radius: z.number().min(1000).max(50000).optional(),
  county: z.string().optional()
});

// POST /api/scan - Trigger a scan of an area
router.post('/', async (req, res) => {
  try {
    const data = scanRequestSchema.parse(req.body);
    
    let centerLat: number;
    let centerLng: number;
    let area: string;
    const radiusMeters = data.radius || 5000;

    // Handle different input types
    if (data.lat && data.lng) {
      centerLat = data.lat;
      centerLng = data.lng;
      area = data.area || `${centerLat}, ${centerLng}`;
    } else if (data.county || data.area) {
      const geocoder = new GeocodingService();
      const result = await geocoder.geocode((data.county || data.area)!);
      centerLat = result.lat;
      centerLng = result.lng;
      area = result.formattedAddress;
    } else {
      return res.status(400).json({
        error: 'Invalid Parameters',
        message: 'Provide lat/lng coordinates, a county name, or an area name'
      });
    }

    const placesService = new GooglePlacesService();
    const qualityService = new WebsiteQualityService();

    // Create scan record
    const scan = await prisma.scan.create({
      data: {
        area,
        centerLat,
        centerLng,
        radiusMeters
      }
    });

    console.log(`🔍 Starting scan of ${area} (radius: ${radiusMeters}m)`);

    // Perform the actual scanning
    const businesses = await placesService.scanArea(centerLat, centerLng, radiusMeters);
    
    console.log(`📍 Found ${businesses.length} businesses`);

    let noWebsiteCount = 0;
    let processedCount = 0;

    // Process each business
    for (const businessData of businesses) {
      try {
        // Check if business already exists
        const existing = await prisma.business.findUnique({
          where: { placeId: businessData.placeId }
        });

        if (existing) {
          console.log(`⏭️  Skipping existing business: ${businessData.name}`);
          continue;
        }

        // Determine website quality + extract socials/email
        const { hasWebsite, websiteQuality, email, facebook, instagram } = await qualityService.checkWebsiteQuality(
          businessData.websiteUrl
        );

        if (!hasWebsite || websiteQuality === 'facebook_only') {
          noWebsiteCount++;
        }

        // Create business record
        await prisma.business.create({
          data: {
            placeId: businessData.placeId,
            name: businessData.name,
            address: businessData.address,
            city: businessData.city,
            county: area.includes('County') ? area.split(' County')[0] + ' County' : undefined,
            state: businessData.state,
            zip: businessData.zip,
            phone: businessData.phone,
            email: email || null,
            facebook: facebook || null,
            instagram: instagram || null,
            websiteUrl: businessData.websiteUrl,
            googleMapsUrl: businessData.googleMapsUrl,
            rating: businessData.rating,
            ratingCount: businessData.ratingCount,
            types: JSON.stringify(businessData.types),
            hours: businessData.hours ? JSON.stringify(businessData.hours) : null,
            photos: JSON.stringify(businessData.photos),
            reviews: JSON.stringify(businessData.reviews),
            hasWebsite,
            websiteQuality
          }
        });

        processedCount++;
        const contacts = [email && 'email', facebook && 'FB', instagram && 'IG'].filter(Boolean).join(', ');
        console.log(`✅ Processed: ${businessData.name} (${websiteQuality})${contacts ? ` [${contacts}]` : ''}`);

      } catch (error) {
        console.error(`❌ Error processing business ${businessData.name}:`, error);
      }
    }

    // Update scan record
    await prisma.scan.update({
      where: { id: scan.id },
      data: {
        businessCount: processedCount,
        noWebsiteCount
      }
    });

    res.json({
      success: true,
      scanId: scan.id,
      area,
      businessesFound: businesses.length,
      businessesProcessed: processedCount,
      noWebsiteCount,
      message: `Scan completed for ${area}`
    });

  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({
      error: 'Scan Failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// GET /api/scans - List past scans
router.get('/', async (req, res) => {
  try {
    const scans = await prisma.scan.findMany({
      orderBy: { scannedAt: 'desc' },
      take: 50
    });

    res.json({ scans });
  } catch (error) {
    console.error('List scans error:', error);
    res.status(500).json({
      error: 'Database Error',
      message: 'Failed to retrieve scans'
    });
  }
});

export { router as scanRoutes };