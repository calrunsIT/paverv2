import axios from 'axios';

export interface WebsiteQualityResult {
  hasWebsite: boolean;
  websiteQuality: 'none' | 'facebook_only' | 'poor' | 'decent';
  reason?: string;
  email?: string;
  facebook?: string;
  instagram?: string;
}

export class WebsiteQualityService {
  private timeout = 10000; // 10 second timeout

  async checkWebsiteQuality(websiteUrl?: string): Promise<WebsiteQualityResult> {
    if (!websiteUrl) {
      return {
        hasWebsite: false,
        websiteQuality: 'none',
        reason: 'No website URL provided'
      };
    }

    // Check if it's just a Facebook page
    if (this.isFacebookUrl(websiteUrl)) {
      return {
        hasWebsite: true,
        websiteQuality: 'facebook_only',
        reason: 'Only has Facebook page',
        facebook: websiteUrl
      };
    }

    // Check if it's another social media platform (Instagram, Twitter, etc.)
    if (this.isSocialMediaUrl(websiteUrl)) {
      const socials = this.classifySocialUrl(websiteUrl);
      return {
        hasWebsite: true,
        websiteQuality: 'facebook_only', // Treating all social media as equivalent
        reason: 'Only has social media presence',
        ...socials
      };
    }

    // Try to fetch the actual website
    try {
      const quality = await this.analyzeWebsiteQuality(websiteUrl);
      return {
        hasWebsite: true,
        websiteQuality: quality.quality,
        reason: quality.reason,
        email: quality.email,
        facebook: quality.facebook,
        instagram: quality.instagram
      };
    } catch (error) {
      console.error(`Failed to analyze website ${websiteUrl}:`, error);
      return {
        hasWebsite: true,
        websiteQuality: 'poor',
        reason: 'Website unreachable or broken'
      };
    }
  }

  private isFacebookUrl(url: string): boolean {
    const facebookDomains = [
      'facebook.com',
      'fb.com',
      'fb.me',
      'm.facebook.com'
    ];

    const urlLower = url.toLowerCase();
    return facebookDomains.some(domain => urlLower.includes(domain));
  }

  private isSocialMediaUrl(url: string): boolean {
    const socialDomains = [
      'instagram.com',
      'twitter.com',
      'x.com',
      'linkedin.com',
      'youtube.com',
      'tiktok.com',
      'snapchat.com',
      'pinterest.com'
    ];

    const urlLower = url.toLowerCase();
    return socialDomains.some(domain => urlLower.includes(domain));
  }

  private classifySocialUrl(url: string): { facebook?: string; instagram?: string } {
    const urlLower = url.toLowerCase();
    if (urlLower.includes('instagram.com')) return { instagram: url };
    if (urlLower.includes('facebook.com') || urlLower.includes('fb.com') || urlLower.includes('fb.me')) return { facebook: url };
    return {};
  }

  private async analyzeWebsiteQuality(url: string): Promise<{
    quality: 'poor' | 'decent';
    reason: string;
    email?: string;
    facebook?: string;
    instagram?: string;
  }> {
    try {
      // Ensure URL has protocol
      let fullUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        fullUrl = 'https://' + url;
      }

      const response = await axios.get(fullUrl, {
        timeout: this.timeout,
        maxRedirects: 5,
        validateStatus: (status) => status < 500, // Accept 4xx but not 5xx
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const html = typeof response.data === 'string' ? response.data : '';
      const content = html.toLowerCase();

      // Extract social links and email from the fetched HTML
      const enrichment = this.extractSocialsFromHtml(html);

      // Check for common "poor quality" indicators
      const poorQualityIndicators = [
        'coming soon',
        'under construction',
        'parked domain',
        'domain for sale',
        'this domain may be for sale',
        'buy this domain',
        'godaddy.com',
        'namecheap.com',
        'domain.com'
      ];

      const hasPoorIndicator = poorQualityIndicators.some(indicator =>
        content.includes(indicator)
      );

      if (hasPoorIndicator) {
        return {
          quality: 'poor',
          reason: 'Appears to be parked or under construction',
          ...enrichment
        };
      }

      // Check if it's a very basic/template site
      const templateIndicators = [
        'wix.com',
        'weebly.com',
        'squarespace.com',
        'wordpress.com',
        'blogspot.com',
        'default web site page'
      ];

      const isTemplate = templateIndicators.some(indicator =>
        content.includes(indicator)
      );

      // Check for actual business content
      const hasBusinessContent = this.hasBusinessContent(content);

      if (!hasBusinessContent) {
        return {
          quality: 'poor',
          reason: 'No relevant business content found',
          ...enrichment
        };
      }

      // Check SSL (HTTPS)
      if (!fullUrl.startsWith('https://')) {
        return {
          quality: 'poor',
          reason: 'No SSL certificate (not HTTPS)',
          ...enrichment
        };
      }

      // If we get here, it seems like a decent website
      return {
        quality: 'decent',
        reason: isTemplate ? 'Template site but has content' : 'Professional website',
        ...enrichment
      };

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          return { quality: 'poor', reason: 'Website unreachable' };
        }
        if (error.response?.status === 404) {
          return { quality: 'poor', reason: 'Website returns 404 not found' };
        }
        if (error.response?.status && error.response.status >= 500) {
          return { quality: 'poor', reason: 'Website server error' };
        }
      }
      throw error;
    }
  }

  private extractSocialsFromHtml(html: string): { email?: string; facebook?: string; instagram?: string } {
    const result: { email?: string; facebook?: string; instagram?: string } = {};

    // Extract Facebook URL from href attributes
    const fbRegex = /href=["'](https?:\/\/(www\.)?facebook\.com\/[^"'\s>]+)/gi;
    const fbExclude = /share|sharer|dialog|plugins|login|help/i;
    let fbMatch;
    while ((fbMatch = fbRegex.exec(html)) !== null) {
      if (!fbExclude.test(fbMatch[1])) {
        result.facebook = fbMatch[1];
        break;
      }
    }

    // Extract Instagram URL from href attributes
    const igRegex = /href=["'](https?:\/\/(www\.)?instagram\.com\/[^"'\s>]+)/gi;
    const igExclude = /share|embed/i;
    let igMatch;
    while ((igMatch = igRegex.exec(html)) !== null) {
      if (!igExclude.test(igMatch[1])) {
        result.instagram = igMatch[1];
        break;
      }
    }

    // Extract email from mailto: links first (most reliable)
    const mailtoRegex = /mailto:([^\s"'?&]+)/gi;
    const mailtoMatch = mailtoRegex.exec(html);
    if (mailtoMatch) {
      const email = mailtoMatch[1].toLowerCase();
      if (!this.isFalsePositiveEmail(email)) {
        result.email = email;
      }
    }

    // Fallback: regex for email patterns in visible text
    if (!result.email) {
      const emailRegex = /\b([A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,})\b/g;
      let emailMatch;
      while ((emailMatch = emailRegex.exec(html)) !== null) {
        const email = emailMatch[1].toLowerCase();
        if (!this.isFalsePositiveEmail(email)) {
          result.email = email;
          break;
        }
      }
    }

    return result;
  }

  private isFalsePositiveEmail(email: string): boolean {
    const falsePositiveDomains = [
      'example.com', 'sentry.io', 'wix.com', 'squarespace.com',
      'wordpress.com', 'weebly.com', 'godaddy.com', 'w3.org',
      'schema.org', 'google.com', 'facebook.com', 'twitter.com',
      'yourdomain.com', 'email.com', 'domain.com'
    ];
    const falsePositivePrefixes = [
      'noreply', 'no-reply', 'donotreply', 'mailer-daemon',
      'postmaster', 'webmaster'
    ];

    const domain = email.split('@')[1];
    if (!domain) return true;
    if (falsePositiveDomains.some(d => domain === d)) return true;
    if (falsePositivePrefixes.some(p => email.startsWith(p))) return true;
    return false;
  }

  private hasBusinessContent(content: string): boolean {
    const businessKeywords = [
      'about us',
      'services',
      'contact',
      'phone',
      'address',
      'hours',
      'menu',
      'products',
      'gallery',
      'testimonials',
      'reviews',
      'appointment',
      'book now',
      'call now',
      'location'
    ];

    const keywordCount = businessKeywords.filter(keyword =>
      content.includes(keyword)
    ).length;

    // Needs at least 3 business-related keywords
    return keywordCount >= 3;
  }
}
