import { Router } from 'express';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import { prisma } from '../server';
import { PreviewGenerator } from '../services/previewGenerator';

const router = Router();

const businessUpdateSchema = z.object({
  status: z.enum(['discovered', 'preview_generated', 'approved', 'emailed', 'responded', 'converted', 'skipped']).optional(),
  notes: z.string().optional(),
  email: z.string().email().optional()
});

const businessQuerySchema = z.object({
  status: z.string().optional(),
  hasWebsite: z.string().transform(val => val === 'true').optional(),
  county: z.string().optional(),
  websiteQuality: z.enum(['none', 'facebook_only', 'poor', 'decent']).optional(),
  limit: z.string().transform(val => parseInt(val)).optional(),
  offset: z.string().transform(val => parseInt(val)).optional()
});

// GET /api/businesses - List discovered businesses
router.get('/', async (req, res) => {
  try {
    const query = businessQuerySchema.parse(req.query);
    
    const where: any = {};
    
    if (query.status) where.status = query.status;
    if (query.hasWebsite !== undefined) where.hasWebsite = query.hasWebsite;
    if (query.county) where.county = query.county;
    if (query.websiteQuality) where.websiteQuality = query.websiteQuality;

    const businesses = await prisma.business.findMany({
      where,
      orderBy: { discoveredAt: 'desc' },
      take: query.limit || 100,
      skip: query.offset || 0,
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        county: true,
        phone: true,
        websiteUrl: true,
        rating: true,
        ratingCount: true,
        hasWebsite: true,
        websiteQuality: true,
        status: true,
        previewUrl: true,
        discoveredAt: true,
        outreachSentAt: true
      }
    });

    const total = await prisma.business.count({ where });

    res.json({
      businesses,
      pagination: {
        total,
        limit: query.limit || 100,
        offset: query.offset || 0,
        hasMore: total > (query.offset || 0) + businesses.length
      }
    });

  } catch (error) {
    console.error('List businesses error:', error);
    res.status(500).json({
      error: 'Database Error',
      message: 'Failed to retrieve businesses'
    });
  }
});

// POST /api/businesses/batch-generate-preview - Batch generate previews
router.post('/batch-generate-preview', async (req, res) => {
  try {
    const schema = z.object({
      businessIds: z.array(z.string()).min(1).max(50)
    });
    const { businessIds } = schema.parse(req.body);

    const businesses = await prisma.business.findMany({
      where: { id: { in: businessIds } }
    });

    if (businesses.length === 0) {
      return res.status(404).json({ error: 'No businesses found' });
    }

    const generator = new PreviewGenerator();
    const results: Array<{ id: string; name: string; previewUrl?: string; success: boolean; error?: string }> = [];

    for (const business of businesses) {
      try {
        const previewUrl = await generator.generatePreview(business);
        await prisma.business.update({
          where: { id: business.id },
          data: { status: 'preview_generated', previewUrl }
        });
        results.push({ id: business.id, name: business.name, previewUrl, success: true });
      } catch (error) {
        results.push({
          id: business.id,
          name: business.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    res.json({ success: true, results, count: results.filter(r => r.success).length });
  } catch (error) {
    console.error('Batch generate error:', error);
    res.status(500).json({
      error: 'Batch Generation Failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// GET /api/businesses/:id - Get single business details
router.get('/:id', async (req, res) => {
  try {
    const business = await prisma.business.findUnique({
      where: { id: req.params.id },
      include: {
        outreachEmails: {
          orderBy: { sentAt: 'desc' }
        }
      }
    });

    if (!business) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Business not found'
      });
    }

    res.json({ business });

  } catch (error) {
    console.error('Get business error:', error);
    res.status(500).json({
      error: 'Database Error',
      message: 'Failed to retrieve business'
    });
  }
});

// PATCH /api/businesses/:id - Update status, notes, email
router.patch('/:id', async (req, res) => {
  try {
    const data = businessUpdateSchema.parse(req.body);

    const business = await prisma.business.update({
      where: { id: req.params.id },
      data
    });

    res.json({ 
      success: true, 
      business: {
        id: business.id,
        name: business.name,
        status: business.status,
        notes: business.notes,
        email: business.email
      }
    });

  } catch (error) {
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Business not found'
      });
    }

    console.error('Update business error:', error);
    res.status(500).json({
      error: 'Database Error',
      message: 'Failed to update business'
    });
  }
});

// POST /api/businesses/:id/generate-preview - Generate preview site
router.post('/:id/generate-preview', async (req, res) => {
  try {
    const business = await prisma.business.findUnique({
      where: { id: req.params.id }
    });

    if (!business) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Business not found'
      });
    }

    const generator = new PreviewGenerator();
    const previewUrl = await generator.generatePreview(business);

    // Update business status and preview URL
    await prisma.business.update({
      where: { id: req.params.id },
      data: {
        status: 'preview_generated',
        previewUrl
      }
    });

    res.json({
      success: true,
      previewUrl,
      message: `Preview generated for ${business.name}`
    });

  } catch (error) {
    console.error('Generate preview error:', error);
    res.status(500).json({
      error: 'Preview Generation Failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// DELETE /api/businesses/:id/preview - Delete generated preview
router.delete('/:id/preview', async (req, res) => {
  try {
    const business = await prisma.business.findUnique({
      where: { id: req.params.id }
    });

    if (!business) {
      return res.status(404).json({ error: 'Not Found', message: 'Business not found' });
    }

    // Delete preview files from disk
    if (business.previewUrl) {
      const slug = business.previewUrl.replace('/previews/', '');
      const previewDir = path.join(process.cwd(), 'previews', slug);
      try {
        await fs.rm(previewDir, { recursive: true, force: true });
      } catch {
        // Directory may not exist, that's fine
      }
    }

    // Clear previewUrl and reset status if it was preview_generated
    const updateData: any = { previewUrl: null };
    if (business.status === 'preview_generated') {
      updateData.status = 'discovered';
    }

    await prisma.business.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json({ success: true, message: `Preview deleted for ${business.name}` });
  } catch (error) {
    console.error('Delete preview error:', error);
    res.status(500).json({ error: 'Delete Failed', message: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// POST /api/businesses/:id/approve - Mark as approved for outreach
router.post('/:id/approve', async (req, res) => {
  try {
    const business = await prisma.business.findUnique({
      where: { id: req.params.id }
    });

    if (!business) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Business not found'
      });
    }

    if (business.status !== 'preview_generated') {
      return res.status(400).json({
        error: 'Invalid Status',
        message: 'Business must have a preview generated before approval'
      });
    }

    await prisma.business.update({
      where: { id: req.params.id },
      data: {
        status: 'approved'
      }
    });

    res.json({
      success: true,
      message: `${business.name} approved for outreach`
    });

  } catch (error) {
    console.error('Approve business error:', error);
    res.status(500).json({
      error: 'Database Error',
      message: 'Failed to approve business'
    });
  }
});

export { router as businessRoutes };