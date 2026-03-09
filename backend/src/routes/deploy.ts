import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../server';
import { PreviewGenerator } from '../services/previewGenerator';
import { CloudflarePagesService } from '../services/cloudflarePages';
import slugify from 'slugify';

const router = Router();

const deployRequestSchema = z.object({
  businessIds: z.array(z.string()).min(1).max(50)
});

// POST /api/deploy - Deploy selected businesses to CF Pages
router.post('/', async (req, res) => {
  try {
    const { businessIds } = deployRequestSchema.parse(req.body);

    const businesses = await prisma.business.findMany({
      where: { id: { in: businessIds } }
    });

    if (businesses.length === 0) {
      return res.status(404).json({ error: 'No businesses found' });
    }

    const generator = new PreviewGenerator();
    const cfService = new CloudflarePagesService();

    // Generate HTML for each business
    const files = new Map<string, string>();
    const slugMap = new Map<string, string>();

    for (const business of businesses) {
      const slug = slugify(business.name, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });
      const html = generator.generatePreviewHTML(business);
      files.set(`${slug}/index.html`, html);
      slugMap.set(business.id, slug);
    }

    // Deploy all files at once to CF Pages
    const deploymentUrl = await cfService.deploy(files);
    const projectUrl = cfService.getProjectUrl();

    // Update each business with its live URL
    const results: Array<{ id: string; name: string; liveUrl: string }> = [];

    for (const business of businesses) {
      const slug = slugMap.get(business.id)!;
      const liveUrl = `${projectUrl}/${slug}`;

      await prisma.business.update({
        where: { id: business.id },
        data: {
          liveUrl,
          previewUrl: `/previews/${slug}`,
          status: business.status === 'discovered' ? 'preview_generated' : business.status
        }
      });

      results.push({ id: business.id, name: business.name, liveUrl });
    }

    res.json({
      success: true,
      deploymentUrl,
      projectUrl,
      deployed: results,
      count: results.length
    });

  } catch (error) {
    console.error('Deploy error:', error);
    res.status(500).json({
      error: 'Deployment Failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as deployRoutes };
