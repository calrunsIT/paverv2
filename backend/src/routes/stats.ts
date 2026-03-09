import { Router } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { prisma } from '../server';

const router = Router();

// GET /api/stats - Dashboard stats
router.get('/', async (req, res) => {
  try {
    // Get basic counts
    const [
      totalBusinesses,
      noWebsiteBusinesses,
      facebookOnlyBusinesses,
      previewsGenerated,
      approvedBusinesses,
      emailsSent,
      conversions
    ] = await Promise.all([
      prisma.business.count(),
      prisma.business.count({ where: { hasWebsite: false } }),
      prisma.business.count({ where: { websiteQuality: 'facebook_only' } }),
      prisma.business.count({ where: { status: { in: ['preview_generated', 'approved', 'emailed', 'responded', 'converted'] } } }),
      prisma.business.count({ where: { status: { in: ['approved', 'emailed', 'responded', 'converted'] } } }),
      prisma.business.count({ where: { status: { in: ['emailed', 'responded', 'converted'] } } }),
      prisma.business.count({ where: { status: 'converted' } })
    ]);

    // Get businesses by county
    const businessesByCounty = await prisma.business.groupBy({
      by: ['county'],
      _count: true,
      where: {
        county: { not: null }
      },
      orderBy: {
        _count: { county: 'desc' }
      }
    });

    // Get businesses by website quality
    const businessesByQuality = await prisma.business.groupBy({
      by: ['websiteQuality'],
      _count: true,
      orderBy: {
        websiteQuality: 'asc'
      }
    });

    // Get businesses by status
    const businessesByStatus = await prisma.business.groupBy({
      by: ['status'],
      _count: true,
      orderBy: {
        status: 'asc'
      }
    });

    // Get recent scans
    const recentScans = await prisma.scan.findMany({
      orderBy: { scannedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        area: true,
        businessCount: true,
        noWebsiteCount: true,
        scannedAt: true
      }
    });

    // Calculate opportunity metrics
    const potentialTargets = noWebsiteBusinesses + facebookOnlyBusinesses;
    const conversionRate = emailsSent > 0 ? (conversions / emailsSent) * 100 : 0;
    const previewConversionRate = previewsGenerated > 0 ? (conversions / previewsGenerated) * 100 : 0;

    res.json({
      overview: {
        totalBusinesses,
        potentialTargets,
        noWebsiteBusinesses,
        facebookOnlyBusinesses,
        previewsGenerated,
        approvedBusinesses,
        emailsSent,
        conversions
      },
      metrics: {
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        previewConversionRate: parseFloat(previewConversionRate.toFixed(2)),
        targetRate: potentialTargets > 0 ? parseFloat(((potentialTargets / totalBusinesses) * 100).toFixed(2)) : 0
      },
      breakdowns: {
        byCounty: businessesByCounty.map(item => ({
          county: item.county,
          count: item._count
        })),
        byQuality: businessesByQuality.map(item => ({
          quality: item.websiteQuality,
          count: item._count
        })),
        byStatus: businessesByStatus.map(item => ({
          status: item.status,
          count: item._count
        }))
      },
      recentScans,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      error: 'Database Error',
      message: 'Failed to retrieve statistics'
    });
  }
});

// POST /api/stats/reset - Wipe all data
router.post('/reset', async (req, res) => {
  try {
    // Delete in order respecting foreign keys
    const deletedEmails = await prisma.outreachEmail.deleteMany({});
    const deletedNotes = await prisma.outreachNote.deleteMany({});
    const deletedBusinesses = await prisma.business.deleteMany({});
    const deletedScans = await prisma.scan.deleteMany({});

    // Clear preview files
    const previewsDir = path.join(process.cwd(), 'previews');
    try {
      const entries = await fs.readdir(previewsDir);
      for (const entry of entries) {
        await fs.rm(path.join(previewsDir, entry), { recursive: true, force: true });
      }
    } catch {
      // previews dir may not exist
    }

    res.json({
      success: true,
      deleted: {
        businesses: deletedBusinesses.count,
        scans: deletedScans.count,
        emails: deletedEmails.count,
        notes: deletedNotes.count
      }
    });
  } catch (error) {
    console.error('Reset database error:', error);
    res.status(500).json({ error: 'Reset Failed', message: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export { router as statsRoutes };