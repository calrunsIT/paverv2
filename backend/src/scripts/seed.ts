#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding Paver database...');

  try {
    // Check if we already have data
    const existingBusinesses = await prisma.business.count();
    
    if (existingBusinesses > 0) {
      console.log(`📊 Database already has ${existingBusinesses} businesses. Skipping seed.`);
      return;
    }

    // Create a sample scan record (optional)
    const sampleScan = await prisma.scan.create({
      data: {
        area: 'Sample Area',
        centerLat: 34.25,
        centerLng: -84.84,
        radiusMeters: 5000,
        businessCount: 0,
        noWebsiteCount: 0
      }
    });

    console.log(`✅ Created sample scan record: ${sampleScan.id}`);

    console.log('🎉 Database seeded successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Start the server: npm run dev');
    console.log('2. Run your first scan: POST /api/scan');
    console.log('3. Check the dashboard: GET /api/stats');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run seed if called directly
if (require.main === module) {
  seed()
    .catch((error) => {
      console.error('Seed failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { seed };