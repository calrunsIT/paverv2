import { promises as fs } from 'fs';
import path from 'path';
import slugify from 'slugify';
import type { Business } from '@prisma/client';

interface BrandingConfig {
  companyName: string;
  companyPhone: string;
  companyPhoneRaw: string;
  companyEmail: string;
  companyWebsite: string;
  companyWebsiteDisplay: string;
  companyBookingUrl: string;
  sitePrice: string;
  siteDescription: string;
}

function loadBranding(): BrandingConfig {
  const phone = process.env.COMPANY_PHONE || '(555) 000-0000';
  const phoneRaw = phone.replace(/\D/g, '');
  const website = process.env.COMPANY_WEBSITE || '';
  return {
    companyName: process.env.COMPANY_NAME || 'Paver',
    companyPhone: phone,
    companyPhoneRaw: phoneRaw,
    companyEmail: process.env.COMPANY_EMAIL || 'hello@example.com',
    companyWebsite: website.startsWith('http') ? website : `https://${website}`,
    companyWebsiteDisplay: website.replace(/^https?:\/\//, ''),
    companyBookingUrl: process.env.COMPANY_BOOKING_URL || '',
    sitePrice: process.env.SITE_PRICE || '$499',
    siteDescription: process.env.SITE_DESCRIPTION || 'One-time setup \u2022 Includes 1 year of hosting \u2022 Custom design',
  };
}

export class PreviewGenerator {
  private previewsDir = path.join(process.cwd(), 'previews');
  private branding: BrandingConfig;

  constructor() {
    this.branding = loadBranding();
    this.ensurePreviewsDirectory();
  }

  generatePreviewHTML(business: Business): string {
    const templateType = this.determineTemplateType(business.types as unknown as string[] || []);
    return this.generateHTML(business, templateType);
  }

  async generatePreview(business: Business): Promise<string> {
    const slug = this.generateSlug(business.name);
    const businessDir = path.join(this.previewsDir, slug);
    
    await fs.mkdir(businessDir, { recursive: true });

    const templateType = this.determineTemplateType(business.types as unknown as string[] || []);
    const html = this.generateHTML(business, templateType);
    
    const htmlPath = path.join(businessDir, 'index.html');
    await fs.writeFile(htmlPath, html, 'utf-8');

    const previewUrl = `/previews/${slug}`;
    console.log(`✅ Generated preview for ${business.name}: ${previewUrl}`);
    return previewUrl;
  }

  private async ensurePreviewsDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.previewsDir, { recursive: true });
    } catch (error) {
      console.error('Error creating previews directory:', error);
    }
  }

  private generateSlug(name: string): string {
    return slugify(name, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g
    });
  }

  private determineTemplateType(types: string[] | string): string {
    const typesArray = Array.isArray(types) ? types :
      (typeof types === 'string' ? JSON.parse(types || '[]') : []);
    const typeSet = new Set(typesArray.map((t: string) => t.toLowerCase()));

    const match = (keywords: string[]) => keywords.some(k => typeSet.has(k));

    if (match(['restaurant', 'cafe', 'bar', 'bakery', 'meal_takeaway', 'meal_delivery', 'food'])) return 'restaurant';
    if (match(['general_contractor', 'electrician', 'plumber', 'roofing_contractor', 'painter', 'carpenter', 'landscaper', 'home_improvement', 'locksmith', 'moving_company'])) return 'contractor';
    if (match(['hair_care', 'beauty_salon', 'spa', 'nail_salon'])) return 'beauty';
    if (match(['dentist', 'doctor', 'hospital', 'physiotherapist', 'pharmacy', 'medical_lab', 'health'])) return 'healthcare';
    if (match(['car_dealer', 'car_repair', 'car_wash', 'gas_station', 'auto_parts_store'])) return 'automotive';
    if (match(['store', 'clothing_store', 'hardware_store', 'furniture_store', 'jewelry_store', 'shoe_store', 'electronics_store', 'book_store', 'bicycle_store', 'convenience_store', 'shopping_mall', 'department_store', 'supermarket'])) return 'retail';
    if (match(['accounting', 'lawyer', 'insurance_agency', 'real_estate_agency', 'finance', 'travel_agency', 'consultant'])) return 'professional';
    if (match(['gym', 'stadium', 'sports_club'])) return 'fitness';
    if (match(['church', 'mosque', 'synagogue', 'hindu_temple', 'place_of_worship'])) return 'church';
    if (match(['veterinary_care', 'pet_store'])) return 'pets';
    if (match(['lodging', 'hotel', 'motel', 'campground', 'rv_park', 'resort'])) return 'lodging';
    if (match(['school', 'university', 'library', 'museum', 'art_gallery'])) return 'education';
    if (match(['florist', 'funeral_home', 'cemetery'])) return 'events';
    if (match(['laundry', 'dry_cleaning', 'tailor'])) return 'cleaning';
    return 'generic';
  }

  private generateHTML(business: Business, templateType: string): string {
    const baseTemplate = this.getBaseTemplate();
    const businessData = this.prepareBusinessData(business);
    
    let html = baseTemplate
      .replace(/{{BUSINESS_NAME}}/g, businessData.name)
      .replace(/{{BUSINESS_ADDRESS}}/g, businessData.address)
      .replace(/{{BUSINESS_PHONE}}/g, businessData.phone)
      .replace(/{{BUSINESS_PHONE_RAW}}/g, businessData.phoneRaw)
      .replace(/{{BUSINESS_HOURS}}/g, businessData.hours)
      .replace(/{{BUSINESS_RATING}}/g, businessData.rating)
      .replace(/{{BUSINESS_RATING_NUM}}/g, businessData.ratingNum)
      .replace(/{{BUSINESS_RATING_COUNT}}/g, businessData.ratingCount)
      .replace(/{{BUSINESS_STARS}}/g, businessData.stars)
      .replace(/{{BUSINESS_REVIEWS}}/g, businessData.reviews)
      .replace(/{{GOOGLE_MAPS_EMBED}}/g, businessData.mapEmbed)
      .replace(/{{TEMPLATE_CLASS}}/g, templateType)
      .replace(/{{BUSINESS_DESCRIPTION}}/g, this.getBusinessDescription(business, templateType))
      .replace(/{{SERVICES_SECTION}}/g, this.getServicesSection(business, templateType))
      .replace(/{{BUSINESS_TYPES_BADGES}}/g, this.getTypeBadges(business))
      .replace(/{{THEME_COLORS}}/g, this.getThemeColors(templateType))
      .replace(/{{ADDRESS_ENCODED}}/g, encodeURIComponent(businessData.address))
      .replace(/{{COMPANY_NAME}}/g, this.branding.companyName)
      .replace(/{{COMPANY_PHONE}}/g, this.branding.companyPhone)
      .replace(/{{COMPANY_PHONE_RAW}}/g, this.branding.companyPhoneRaw)
      .replace(/{{COMPANY_EMAIL}}/g, this.branding.companyEmail)
      .replace(/{{COMPANY_WEBSITE}}/g, this.branding.companyWebsite)
      .replace(/{{COMPANY_WEBSITE_DISPLAY}}/g, this.branding.companyWebsiteDisplay)
      .replace(/{{SITE_PRICE}}/g, this.branding.sitePrice)
      .replace(/{{SITE_DESCRIPTION}}/g, this.branding.siteDescription)
      .replace(/{{COMPANY_BOOKING_URL_SECTION}}/g, this.branding.companyBookingUrl
        ? `<a href="${this.branding.companyBookingUrl}" target="_blank" class="inline-flex items-center justify-center gap-2 text-white/80 hover:text-white underline underline-offset-4 font-medium transition-colors">Book a Free Consultation</a>`
        : '');

    return html;
  }

  private prepareBusinessData(business: Business) {
    const phone = business.phone ? this.formatPhone(business.phone) : 'Contact us';
    const phoneRaw = business.phone ? business.phone.replace(/\D/g, '') : '';
    const ratingNum = business.rating ? String(business.rating) : '0';
    const ratingCount = String(business.ratingCount || 0);
    const rating = business.rating ? 
      `${business.rating} (${business.ratingCount || 0} reviews)` : 
      'New Business';
    const stars = this.generateStarsSVG(business.rating || 0);
    
    const hoursData = typeof business.hours === 'string' ? JSON.parse(business.hours || '{}') : business.hours;
    const reviewsData = typeof business.reviews === 'string' ? JSON.parse(business.reviews || '[]') : business.reviews;
    const hours = this.formatHours(hoursData);
    const reviews = this.formatReviews(reviewsData);
    const mapEmbed = this.generateMapEmbed(business.address, business.googleMapsUrl || '');

    return {
      name: business.name,
      address: business.address,
      phone,
      phoneRaw,
      hours,
      rating,
      ratingNum,
      ratingCount,
      stars,
      reviews,
      mapEmbed
    };
  }

  private generateStarsSVG(rating: number): string {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(rating)) {
        stars += '<svg class="w-5 h-5 text-yellow-400 inline-block" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>';
      } else if (i - 0.5 <= rating) {
        stars += '<svg class="w-5 h-5 text-yellow-400 inline-block" fill="currentColor" viewBox="0 0 20 20"><defs><linearGradient id="half"><stop offset="50%" stop-color="currentColor"/><stop offset="50%" stop-color="#D1D5DB"/></linearGradient></defs><path fill="url(#half)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>';
      } else {
        stars += '<svg class="w-5 h-5 text-gray-300 inline-block" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>';
      }
    }
    return stars;
  }

  private getThemeColors(templateType: string): string {
    const themes: Record<string, string> = {
      restaurant: `
          --hero-from: #92400e; --hero-via: #dc2626; --hero-to: #f59e0b;
          --accent: #f59e0b; --accent-hover: #d97706; --accent-light: #fef3c7; --accent-text: #92400e;
          --section-from: #fffbeb; --section-to: #fef2f2; --pattern-color: rgba(251, 191, 36, 0.1);`,
      contractor: `
          --hero-from: #0f172a; --hero-via: #1e40af; --hero-to: #475569;
          --accent: #3b82f6; --accent-hover: #2563eb; --accent-light: #dbeafe; --accent-text: #1e3a5f;
          --section-from: #f8fafc; --section-to: #eff6ff; --pattern-color: rgba(59, 130, 246, 0.08);`,
      beauty: `
          --hero-from: #831843; --hero-via: #db2777; --hero-to: #f472b6;
          --accent: #ec4899; --accent-hover: #db2777; --accent-light: #fce7f3; --accent-text: #831843;
          --section-from: #fdf2f8; --section-to: #fff1f2; --pattern-color: rgba(236, 72, 153, 0.08);`,
      healthcare: `
          --hero-from: #064e3b; --hero-via: #059669; --hero-to: #34d399;
          --accent: #10b981; --accent-hover: #059669; --accent-light: #d1fae5; --accent-text: #064e3b;
          --section-from: #ecfdf5; --section-to: #f0fdf4; --pattern-color: rgba(16, 185, 129, 0.08);`,
      automotive: `
          --hero-from: #1c1917; --hero-via: #78350f; --hero-to: #b45309;
          --accent: #f59e0b; --accent-hover: #d97706; --accent-light: #fef3c7; --accent-text: #78350f;
          --section-from: #fffbeb; --section-to: #fafaf9; --pattern-color: rgba(245, 158, 11, 0.08);`,
      retail: `
          --hero-from: #4c1d95; --hero-via: #7c3aed; --hero-to: #a78bfa;
          --accent: #8b5cf6; --accent-hover: #7c3aed; --accent-light: #ede9fe; --accent-text: #4c1d95;
          --section-from: #faf5ff; --section-to: #f5f3ff; --pattern-color: rgba(139, 92, 246, 0.08);`,
      professional: `
          --hero-from: #0c4a6e; --hero-via: #0369a1; --hero-to: #0ea5e9;
          --accent: #0284c7; --accent-hover: #0369a1; --accent-light: #e0f2fe; --accent-text: #0c4a6e;
          --section-from: #f0f9ff; --section-to: #f8fafc; --pattern-color: rgba(2, 132, 199, 0.08);`,
      fitness: `
          --hero-from: #1a1a2e; --hero-via: #e94560; --hero-to: #f97316;
          --accent: #ef4444; --accent-hover: #dc2626; --accent-light: #fee2e2; --accent-text: #991b1b;
          --section-from: #fef2f2; --section-to: #fff7ed; --pattern-color: rgba(239, 68, 68, 0.08);`,
      church: `
          --hero-from: #1e1b4b; --hero-via: #3730a3; --hero-to: #818cf8;
          --accent: #6366f1; --accent-hover: #4f46e5; --accent-light: #e0e7ff; --accent-text: #3730a3;
          --section-from: #eef2ff; --section-to: #f5f3ff; --pattern-color: rgba(99, 102, 241, 0.08);`,
      pets: `
          --hero-from: #365314; --hero-via: #65a30d; --hero-to: #a3e635;
          --accent: #84cc16; --accent-hover: #65a30d; --accent-light: #ecfccb; --accent-text: #365314;
          --section-from: #f7fee7; --section-to: #ecfdf5; --pattern-color: rgba(132, 204, 22, 0.08);`,
      lodging: `
          --hero-from: #1e3a5f; --hero-via: #0e7490; --hero-to: #06b6d4;
          --accent: #0891b2; --accent-hover: #0e7490; --accent-light: #cffafe; --accent-text: #155e75;
          --section-from: #ecfeff; --section-to: #f0f9ff; --pattern-color: rgba(8, 145, 178, 0.08);`,
      education: `
          --hero-from: #1e3a5f; --hero-via: #1d4ed8; --hero-to: #60a5fa;
          --accent: #3b82f6; --accent-hover: #2563eb; --accent-light: #dbeafe; --accent-text: #1e3a5f;
          --section-from: #eff6ff; --section-to: #f8fafc; --pattern-color: rgba(59, 130, 246, 0.08);`,
      events: `
          --hero-from: #4a044e; --hero-via: #a21caf; --hero-to: #e879f9;
          --accent: #d946ef; --accent-hover: #c026d3; --accent-light: #fae8ff; --accent-text: #701a75;
          --section-from: #fdf4ff; --section-to: #faf5ff; --pattern-color: rgba(217, 70, 239, 0.08);`,
      cleaning: `
          --hero-from: #0c4a6e; --hero-via: #0284c7; --hero-to: #38bdf8;
          --accent: #0ea5e9; --accent-hover: #0284c7; --accent-light: #e0f2fe; --accent-text: #0c4a6e;
          --section-from: #f0f9ff; --section-to: #ecfeff; --pattern-color: rgba(14, 165, 233, 0.08);`,
    };
    return themes[templateType] || `
          --hero-from: #312e81; --hero-via: #7c3aed; --hero-to: #6366f1;
          --accent: #7c3aed; --accent-hover: #6d28d9; --accent-light: #ede9fe; --accent-text: #4c1d95;
          --section-from: #faf5ff; --section-to: #eef2ff; --pattern-color: rgba(124, 58, 237, 0.08);`;
  }

  private getTypeBadges(business: Business): string {
    const typesData = typeof business.types === 'string' ? JSON.parse(business.types || '[]') : business.types || [];
    if (!typesData.length) return '';
    return typesData.slice(0, 4).map((t: string) => 
      `<span class="inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-[var(--accent-light)] text-[var(--accent-text)] border border-[var(--accent)]/20">${t.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</span>`
    ).join(' ');
  }

  private formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned[0] === '1') {
      const number = cleaned.slice(1);
      return `(${number.slice(0,3)}) ${number.slice(3,6)}-${number.slice(6)}`;
    } else if (cleaned.length === 10) {
      return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
    }
    return phone;
  }

  private formatHours(hoursData: any): string {
    if (!hoursData || !hoursData.weekdayDescriptions) {
      return '<tr><td colspan="2" class="py-3 text-gray-500 italic">Hours available by phone</td></tr>';
    }

    return hoursData.weekdayDescriptions
      .map((day: string, i: number) => {
        const parts = day.split(': ');
        const dayName = parts[0];
        const hours = parts[1] || 'Closed';
        return `<tr class="hours-row border-b border-gray-100 last:border-0" data-day="${i}">
          <td class="py-3 pr-8 font-medium text-gray-700">${dayName}</td>
          <td class="py-3 text-gray-600 text-right">${hours}</td>
        </tr>`;
      })
      .join('');
  }

  private formatReviews(reviewsData: any[]): string {
    if (!reviewsData || reviewsData.length === 0) {
      return `<div class="text-center py-12">
        <p class="text-gray-500 text-lg italic">Be the first to leave a review!</p>
      </div>`;
    }

    const colors = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#ec4899'];
    
    return `<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">` +
      reviewsData.slice(0, 3).map((review, idx) => {
        const name = review.authorAttribution?.displayName || 'Anonymous';
        const initial = name.charAt(0).toUpperCase();
        const color = colors[idx % colors.length];
        const reviewStars = this.generateStarsSVG(review.rating || 5);
        const text = (review.text?.text || review.originalText?.text || '').substring(0, 200);
        const ellipsis = (review.text?.text || '').length > 200 ? '...' : '';
        const time = review.relativePublishTimeDescription || '';
        const rotation = idx === 0 ? '-rotate-1' : idx === 1 ? 'rotate-1' : '-rotate-0.5';
        
        return `<div class="reveal bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 ${rotation} hover:rotate-0">
          <div class="text-4xl text-gray-200 font-serif leading-none mb-3">"</div>
          <p class="text-gray-700 leading-relaxed mb-4">${text}${ellipsis}</p>
          <div class="flex items-center gap-3 mt-auto">
            <div class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0" style="background:${color}">${initial}</div>
            <div>
              <p class="font-semibold text-gray-900 text-sm">${name}</p>
              <div class="flex items-center gap-2">
                <div class="flex">${reviewStars}</div>
                ${time ? `<span class="text-xs text-gray-400">${time}</span>` : ''}
              </div>
            </div>
          </div>
        </div>`;
      }).join('') + `</div>`;
  }

  private generateMapEmbed(address: string, googleMapsUrl: string): string {
    const encoded = encodeURIComponent(address);
    return `<iframe 
      src="https://www.google.com/maps?q=${encoded}&output=embed" 
      width="100%" height="400" style="border:0; border-radius: 1rem;" 
      allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade">
    </iframe>`;
  }

  private getBusinessDescription(business: Business, templateType: string): string {
    const typesData = typeof business.types === 'string' ? JSON.parse(business.types || '[]') : business.types || [];
    const bt = (typesData[0] || 'business').replace(/_/g, ' ');
    const n = business.name;

    const descriptions: Record<string, string> = {
      restaurant: `Welcome to ${n}! We're a local ${bt} serving the community with delicious food and great service. Come visit us for a memorable dining experience.`,
      contractor: `${n} provides professional ${bt} services to the local community. We're committed to quality workmanship and customer satisfaction on every project.`,
      beauty: `Welcome to ${n}, your destination for premium beauty and self-care. Our talented team of professionals is here to help you look and feel your absolute best.`,
      healthcare: `${n} is committed to providing compassionate, high-quality healthcare to our community. Your health and well-being are our top priority.`,
      automotive: `${n} is your trusted local ${bt}. From routine maintenance to complex repairs, our certified technicians keep your vehicle running at its best.`,
      retail: `Welcome to ${n}! We curate the best selection of products and deliver a shopping experience that keeps our customers coming back.`,
      professional: `${n} delivers expert ${bt} services with a personal touch. We build lasting relationships with our clients through trust, integrity, and results.`,
      fitness: `Push your limits at ${n}. Whether you're just starting out or training for competition, our facility and coaches are here to help you reach your goals.`,
      church: `Welcome to ${n}. We are a welcoming community of faith, open to all who seek fellowship, spiritual growth, and a place to belong.`,
      pets: `${n} loves your pets as much as you do. We provide top-quality care, products, and services to keep your furry family members happy and healthy.`,
      lodging: `Welcome to ${n}. Whether you're here for business or leisure, we offer comfortable accommodations and friendly hospitality to make your stay memorable.`,
      education: `${n} is dedicated to learning, growth, and community enrichment. We provide quality educational resources and programs for all ages.`,
      events: `${n} helps you honor life's most important moments with care, compassion, and beautiful arrangements. Let us help make your occasion meaningful.`,
      cleaning: `${n} delivers spotless results you can count on. We take pride in attention to detail and making your space look and feel brand new.`,
    };
    return descriptions[templateType] || `${n} is your trusted local ${bt}. We're dedicated to providing excellent service and building lasting relationships with our customers.`;
  }

  private getServicesSection(business: Business, templateType: string): string {
    const cards = (items: {icon: string, title: string, desc: string}[]) => {
      return items.map(item => `
        <div class="reveal group bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
          <div class="w-14 h-14 rounded-xl bg-[var(--accent-light)] flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300">${item.icon}</div>
          <h4 class="font-bold text-lg text-gray-900 mb-2">${item.title}</h4>
          <p class="text-gray-600 text-sm leading-relaxed">${item.desc}</p>
        </div>
      `).join('');
    };

    type Card = {icon: string, title: string, desc: string};
    const templates: Record<string, Card[]> = {
      restaurant: [
        { icon: '🍽️', title: 'Dine-In', desc: 'Enjoy a comfortable dining experience with our full menu and attentive service.' },
        { icon: '📦', title: 'Takeout', desc: 'Order ahead and pick up your favorites, fresh and ready to go.' },
        { icon: '🎉', title: 'Catering', desc: 'Let us make your next event unforgettable with custom catering packages.' },
        { icon: '🌿', title: 'Fresh & Local', desc: 'We source the freshest ingredients from local farms and suppliers.' },
        { icon: '👨‍👩‍👧‍👦', title: 'Family Friendly', desc: 'A welcoming atmosphere for the whole family with options for everyone.' },
        { icon: '⭐', title: 'Daily Specials', desc: 'Check out our rotating daily specials and seasonal menu items.' },
      ],
      contractor: [
        { icon: '🔧', title: 'Expert Repairs', desc: 'Professional repairs done right the first time with quality materials.' },
        { icon: '📋', title: 'Free Estimates', desc: 'Get a detailed, no-obligation estimate for your project.' },
        { icon: '🛡️', title: 'Licensed & Insured', desc: 'Fully licensed and insured for your complete peace of mind.' },
        { icon: '⏰', title: 'On-Time Service', desc: 'We respect your schedule and show up when we say we will.' },
        { icon: '💎', title: 'Quality Materials', desc: 'We only use top-grade materials built to last.' },
        { icon: '🤝', title: 'Satisfaction Guaranteed', desc: 'Your satisfaction is our top priority on every single job.' },
      ],
      beauty: [
        { icon: '💇', title: 'Hair Services', desc: 'Cuts, color, styling, and treatments from our expert stylists.' },
        { icon: '💅', title: 'Nail Care', desc: 'Manicures, pedicures, and nail art to keep your hands and feet looking fabulous.' },
        { icon: '🧖', title: 'Spa Treatments', desc: 'Relax and rejuvenate with our facials, massages, and body treatments.' },
        { icon: '💄', title: 'Makeup & Waxing', desc: 'Professional makeup application and precision waxing services.' },
        { icon: '🎀', title: 'Bridal & Events', desc: 'Look your best on your special day with our bridal and event packages.' },
        { icon: '🛍️', title: 'Premium Products', desc: 'We carry professional-grade products to maintain your look at home.' },
      ],
      healthcare: [
        { icon: '🩺', title: 'Comprehensive Care', desc: 'Thorough examinations and personalized treatment plans for every patient.' },
        { icon: '👨‍⚕️', title: 'Experienced Providers', desc: 'Our qualified professionals bring years of clinical experience.' },
        { icon: '🏥', title: 'Modern Facility', desc: 'State-of-the-art equipment and a comfortable, clean environment.' },
        { icon: '📋', title: 'Preventive Care', desc: 'Regular check-ups and screenings to keep you healthy long-term.' },
        { icon: '💊', title: 'Treatment Options', desc: 'A full range of treatments tailored to your individual health needs.' },
        { icon: '🤝', title: 'Patient-First Approach', desc: 'We listen, we care, and we put your well-being above everything.' },
      ],
      automotive: [
        { icon: '🔧', title: 'Full-Service Repair', desc: 'From oil changes to engine overhauls, we handle it all.' },
        { icon: '🔍', title: 'Diagnostics', desc: 'Advanced computer diagnostics to pinpoint issues quickly and accurately.' },
        { icon: '🛞', title: 'Tires & Brakes', desc: 'Tire rotations, alignments, brake pads, and rotor replacements.' },
        { icon: '❄️', title: 'A/C & Heating', desc: 'Keep your cabin comfortable year-round with our climate system service.' },
        { icon: '🛡️', title: 'Certified Technicians', desc: 'Our ASE-certified mechanics deliver reliable, professional service.' },
        { icon: '💰', title: 'Honest Pricing', desc: 'Upfront quotes with no hidden fees — we earn your trust every visit.' },
      ],
      retail: [
        { icon: '🛍️', title: 'Curated Selection', desc: 'We hand-pick our inventory to bring you the best products available.' },
        { icon: '💎', title: 'Quality Brands', desc: 'Trusted brands and products you can feel confident purchasing.' },
        { icon: '🎁', title: 'Gift Options', desc: 'Find the perfect gift for any occasion with our wide selection.' },
        { icon: '🤝', title: 'Personal Service', desc: 'Our knowledgeable staff is here to help you find exactly what you need.' },
        { icon: '🔄', title: 'Easy Returns', desc: 'Hassle-free return policy because your satisfaction matters most.' },
        { icon: '📍', title: 'Shop Local', desc: 'Support your community by shopping with a locally owned business.' },
      ],
      professional: [
        { icon: '📊', title: 'Expert Guidance', desc: 'Strategic advice backed by years of professional experience.' },
        { icon: '🤝', title: 'Personal Attention', desc: 'We take the time to understand your unique situation and goals.' },
        { icon: '📋', title: 'Thorough Process', desc: 'Detailed analysis and clear communication at every step.' },
        { icon: '🔒', title: 'Confidential', desc: 'Your information is handled with the utmost privacy and discretion.' },
        { icon: '⚡', title: 'Responsive Service', desc: 'Quick turnarounds and prompt communication when you need answers.' },
        { icon: '🏆', title: 'Proven Results', desc: 'A track record of success and satisfied clients speaks for itself.' },
      ],
      fitness: [
        { icon: '🏋️', title: 'Modern Equipment', desc: 'Top-of-the-line machines and free weights for every fitness level.' },
        { icon: '👟', title: 'Group Classes', desc: 'High-energy classes from yoga to HIIT, led by certified instructors.' },
        { icon: '📈', title: 'Personal Training', desc: 'One-on-one coaching to set goals, track progress, and get results.' },
        { icon: '🧘', title: 'Recovery & Wellness', desc: 'Stretching areas, saunas, and recovery tools to keep you performing.' },
        { icon: '👥', title: 'Supportive Community', desc: 'A motivating environment where everyone supports each other.' },
        { icon: '⏰', title: 'Flexible Hours', desc: 'Extended hours so you can work out on your schedule, not ours.' },
      ],
      church: [
        { icon: '🙏', title: 'Worship Services', desc: 'Inspiring weekly services with uplifting music and meaningful messages.' },
        { icon: '📖', title: 'Bible Study', desc: 'Dive deeper into scripture with our small group and study programs.' },
        { icon: '👨‍👩‍👧‍👦', title: 'Family Ministry', desc: 'Programs for children, youth, and families to grow together in faith.' },
        { icon: '🤝', title: 'Community Outreach', desc: 'Serving our neighbors through volunteer work and community programs.' },
        { icon: '🎵', title: 'Music & Arts', desc: 'Choir, band, and creative arts ministries for all ages and skill levels.' },
        { icon: '💛', title: 'Pastoral Care', desc: 'Caring support through counseling, prayer, and life\'s toughest moments.' },
      ],
      pets: [
        { icon: '🐕', title: 'Pet Care', desc: 'Comprehensive health and wellness services to keep your pets thriving.' },
        { icon: '🛁', title: 'Grooming', desc: 'Professional grooming to keep your furry friends clean, healthy, and happy.' },
        { icon: '🦴', title: 'Premium Food & Treats', desc: 'High-quality nutrition and natural treats for dogs, cats, and more.' },
        { icon: '🎾', title: 'Toys & Accessories', desc: 'A fun selection of toys, beds, collars, and everything pets love.' },
        { icon: '💊', title: 'Health & Wellness', desc: 'Supplements, flea prevention, and health products your pets need.' },
        { icon: '❤️', title: 'We Love Pets', desc: 'Our passionate team treats every animal like they\'re our own.' },
      ],
      lodging: [
        { icon: '🛏️', title: 'Comfortable Rooms', desc: 'Clean, well-appointed rooms designed for a restful stay.' },
        { icon: '📶', title: 'Modern Amenities', desc: 'Free Wi-Fi, flat-screen TVs, and everything you need to feel at home.' },
        { icon: '🍳', title: 'Breakfast', desc: 'Start your morning right with our complimentary breakfast options.' },
        { icon: '🅿️', title: 'Free Parking', desc: 'Convenient on-site parking at no additional charge.' },
        { icon: '🧳', title: 'Business Friendly', desc: 'Meeting spaces and business center for the traveling professional.' },
        { icon: '⭐', title: 'Exceptional Service', desc: 'Friendly staff dedicated to making your visit comfortable and enjoyable.' },
      ],
      education: [
        { icon: '📚', title: 'Quality Programs', desc: 'Thoughtfully designed curricula and programs for all levels.' },
        { icon: '👩‍🏫', title: 'Expert Instructors', desc: 'Passionate educators who inspire curiosity and a love of learning.' },
        { icon: '🏫', title: 'Great Facilities', desc: 'Modern classrooms and resources that create an optimal learning environment.' },
        { icon: '🎨', title: 'Arts & Enrichment', desc: 'Creative programs that develop the whole person beyond academics.' },
        { icon: '🤝', title: 'Community Focus', desc: 'Building connections and fostering a sense of belonging for everyone.' },
        { icon: '🌟', title: 'Student Success', desc: 'Dedicated to helping every student reach their full potential.' },
      ],
      events: [
        { icon: '💐', title: 'Custom Arrangements', desc: 'Beautiful, personalized designs for every occasion and sentiment.' },
        { icon: '🎀', title: 'Event Decorations', desc: 'Transform your venue with stunning floral and decorative installations.' },
        { icon: '🚚', title: 'Delivery', desc: 'Reliable delivery to homes, offices, churches, and event venues.' },
        { icon: '🌹', title: 'Fresh Daily', desc: 'We source the freshest flowers to ensure lasting beauty.' },
        { icon: '💝', title: 'Sympathy & Memorial', desc: 'Thoughtful arrangements to honor loved ones with dignity and grace.' },
        { icon: '📞', title: 'Personal Consultation', desc: 'Work directly with our designers to create exactly what you envision.' },
      ],
      cleaning: [
        { icon: '✨', title: 'Deep Cleaning', desc: 'Thorough cleaning that reaches every corner and surface.' },
        { icon: '👔', title: 'Professional Care', desc: 'Expert handling of delicate fabrics, specialty items, and garments.' },
        { icon: '⏱️', title: 'Quick Turnaround', desc: 'Fast service without compromising on quality or attention to detail.' },
        { icon: '🌿', title: 'Eco-Friendly', desc: 'Environmentally responsible cleaning solutions that are safe and effective.' },
        { icon: '🚚', title: 'Pickup & Delivery', desc: 'Convenient pickup and delivery service to save you time.' },
        { icon: '💯', title: 'Satisfaction Guaranteed', desc: 'Not happy with the results? We\'ll redo it at no extra charge.' },
      ],
    };

    const items = templates[templateType] || [
      { icon: '🏆', title: 'Quality Service', desc: 'We deliver exceptional service that keeps customers coming back.' },
      { icon: '💰', title: 'Fair Pricing', desc: 'Competitive prices without sacrificing quality or service.' },
      { icon: '📍', title: 'Locally Owned', desc: 'Proudly serving our community with a personal touch.' },
      { icon: '🕐', title: 'Reliable', desc: 'Count on us to be there when you need us, every time.' },
      { icon: '👥', title: 'Experienced Team', desc: 'Our skilled team brings years of expertise to every job.' },
      { icon: '⭐', title: 'Highly Rated', desc: 'Don\'t just take our word for it — see what our customers say.' },
    ];

    return `<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">${cards(items)}</div>`;
  }

  private getBaseTemplate(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{BUSINESS_NAME}} - Professional Website</title>
    <meta name="description" content="{{BUSINESS_NAME}} — {{BUSINESS_ADDRESS}}. {{COMPANY_NAME}}">
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
      :root { {{THEME_COLORS}} }
      * { font-family: 'Inter', system-ui, sans-serif; }
      html { scroll-behavior: smooth; }

      .hero-gradient {
        background: linear-gradient(135deg, var(--hero-from) 0%, var(--hero-via) 50%, var(--hero-to) 100%);
      }
      .hero-pattern {
        background-image:
          linear-gradient(30deg, var(--pattern-color) 12%, transparent 12.5%, transparent 87%, var(--pattern-color) 87.5%, var(--pattern-color)),
          linear-gradient(150deg, var(--pattern-color) 12%, transparent 12.5%, transparent 87%, var(--pattern-color) 87.5%, var(--pattern-color)),
          linear-gradient(30deg, var(--pattern-color) 12%, transparent 12.5%, transparent 87%, var(--pattern-color) 87.5%, var(--pattern-color)),
          linear-gradient(150deg, var(--pattern-color) 12%, transparent 12.5%, transparent 87%, var(--pattern-color) 87.5%, var(--pattern-color)),
          linear-gradient(60deg, rgba(255,255,255,0.05) 25%, transparent 25.5%, transparent 75%, rgba(255,255,255,0.05) 75%, rgba(255,255,255,0.05)),
          linear-gradient(60deg, rgba(255,255,255,0.05) 25%, transparent 25.5%, transparent 75%, rgba(255,255,255,0.05) 75%, rgba(255,255,255,0.05));
        background-size: 80px 140px;
        background-position: 0 0, 0 0, 40px 70px, 40px 70px, 0 0, 40px 70px;
      }

      .reveal { opacity: 0; transform: translateY(30px); transition: opacity 0.6s ease-out, transform 0.6s ease-out; }
      .reveal.visible { opacity: 1; transform: translateY(0); }

      @keyframes pulse-glow {
        0%, 100% { box-shadow: 0 0 20px rgba(255,255,255,0.3); }
        50% { box-shadow: 0 0 40px rgba(255,255,255,0.6), 0 0 60px rgba(255,255,255,0.2); }
      }
      .cta-btn { animation: pulse-glow 2s ease-in-out infinite; }

      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-6px); }
      }
      .float-anim { animation: float 3s ease-in-out infinite; }

      .today-highlight { background: var(--accent-light); border-radius: 0.5rem; }
      .today-highlight td { font-weight: 700; color: var(--accent-text); }
    </style>
</head>
<body class="bg-gray-50 {{TEMPLATE_CLASS}} antialiased">

    <!-- Hero -->
    <header class="hero-gradient hero-pattern relative overflow-hidden">
      <div class="absolute inset-0 bg-black/20"></div>
      <div class="relative max-w-5xl mx-auto px-6 py-20 md:py-28 text-center text-white">
        <h1 class="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-4 drop-shadow-lg">{{BUSINESS_NAME}}</h1>
        <p class="text-lg md:text-xl text-white/80 mb-6 font-medium">{{BUSINESS_ADDRESS}}</p>
        <div class="flex items-center justify-center gap-2 mb-6">
          <div class="flex items-center gap-1">{{BUSINESS_STARS}}</div>
          <span class="text-white/90 font-semibold text-lg">{{BUSINESS_RATING_NUM}}</span>
          <span class="text-white/60 text-sm">({{BUSINESS_RATING_COUNT}} reviews)</span>
        </div>
        <a href="tel:{{BUSINESS_PHONE_RAW}}" class="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white px-8 py-3.5 rounded-full font-bold text-lg hover:bg-white/30 transition-all duration-300 float-anim">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
          {{BUSINESS_PHONE}}
        </a>
      </div>
    </header>

    <main class="max-w-5xl mx-auto px-6">

      <!-- About -->
      <section class="reveal py-16 md:py-20">
        <h2 class="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6">About Us</h2>
        <p class="text-lg md:text-xl text-gray-600 leading-relaxed max-w-3xl">{{BUSINESS_DESCRIPTION}}</p>
        <div class="flex flex-wrap gap-3 mt-6">{{BUSINESS_TYPES_BADGES}}</div>
      </section>

      <!-- Services -->
      <section class="reveal pb-16 md:pb-20">
        <h2 class="text-3xl md:text-4xl font-extrabold text-gray-900 mb-10 text-center">What We Offer</h2>
        {{SERVICES_SECTION}}
      </section>

      <!-- Reviews -->
      <section class="reveal pb-16 md:pb-20">
        <h2 class="text-3xl md:text-4xl font-extrabold text-gray-900 mb-10 text-center">What People Are Saying</h2>
        {{BUSINESS_REVIEWS}}
      </section>

      <!-- Hours & Map -->
      <section class="reveal pb-16 md:pb-20">
        <div class="grid md:grid-cols-2 gap-8">
          <div class="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <h3 class="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <svg class="w-6 h-6 text-[var(--accent)]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Hours
            </h3>
            <table class="w-full" id="hours-table">
              {{BUSINESS_HOURS}}
            </table>
          </div>
          <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <h3 class="text-2xl font-bold text-gray-900 p-8 pb-4 flex items-center gap-2">
              <svg class="w-6 h-6 text-[var(--accent)]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              Location
            </h3>
            <div class="px-8 pb-4">
              <p class="text-gray-600">{{BUSINESS_ADDRESS}}</p>
            </div>
            {{GOOGLE_MAPS_EMBED}}
          </div>
        </div>
      </section>

    </main>

    <!-- CTA -->
    <section class="relative overflow-hidden">
      <div class="absolute inset-0 hero-gradient hero-pattern"></div>
      <div class="absolute inset-0 bg-black/30"></div>
      <div class="relative max-w-4xl mx-auto px-6 py-20 md:py-28 text-center text-white">
        <p class="text-sm md:text-base uppercase tracking-widest text-white/70 font-semibold mb-4">Your business deserves this</p>
        <h2 class="text-3xl md:text-5xl lg:text-6xl font-black mb-4">Want a Site Like This?</h2>
        <p class="text-5xl md:text-7xl font-black mb-2">{{SITE_PRICE}}</p>
        <p class="text-white/70 text-lg mb-10">{{SITE_DESCRIPTION}}</p>
        <div class="flex flex-col sm:flex-row justify-center gap-4 mb-8">
          <a href="tel:{{COMPANY_PHONE_RAW}}" class="cta-btn inline-flex items-center justify-center gap-2 bg-white text-gray-900 px-10 py-4 rounded-full font-extrabold text-lg hover:scale-105 transition-transform duration-200">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
            {{COMPANY_PHONE}}
          </a>
          <a href="mailto:{{COMPANY_EMAIL}}" class="inline-flex items-center justify-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-white/30 transition-all duration-200">
            {{COMPANY_EMAIL}}
          </a>
        </div>
        {{COMPANY_BOOKING_URL_SECTION}}
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-gray-900 text-white py-12">
      <div class="max-w-5xl mx-auto px-6 text-center">
        <p class="text-2xl font-bold text-orange-400 mb-2">{{COMPANY_NAME}}</p>
        <p class="text-gray-400 mb-6">Professional websites for local businesses</p>
        <div class="flex flex-wrap justify-center gap-6 text-sm">
          <a href="{{COMPANY_WEBSITE}}" class="text-orange-400 hover:text-orange-300 transition-colors">{{COMPANY_WEBSITE_DISPLAY}}</a>
          <a href="tel:{{COMPANY_PHONE_RAW}}" class="text-gray-400 hover:text-white transition-colors">{{COMPANY_PHONE}}</a>
          <a href="mailto:{{COMPANY_EMAIL}}" class="text-gray-400 hover:text-white transition-colors">{{COMPANY_EMAIL}}</a>
        </div>
        <p class="text-gray-600 text-xs mt-8">&copy; ${new Date().getFullYear()} {{COMPANY_NAME}}. All rights reserved.</p>
      </div>
    </footer>

    <script>
      // Scroll reveal
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }});
      }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
      document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

      // Highlight today's hours
      const dayMap = [6, 0, 1, 2, 3, 4, 5]; // JS Sunday=0 → table Monday=0
      const today = dayMap[new Date().getDay()];
      const rows = document.querySelectorAll('.hours-row');
      if (rows[today]) rows[today].classList.add('today-highlight');
    </script>
</body>
</html>`;
  }
}