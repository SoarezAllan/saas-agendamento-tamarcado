import { MetadataRoute } from 'next';
import db from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://tamarcado-agendamento.com';

  // Static public routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/cliente/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/cliente/cadastro`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  try {
    // Dynamic public business booking pages in Brazil
    const businesses = await db.business.findMany({
      where: { isDemo: false },
      select: { slug: true, updatedAt: true },
      take: 1000,
    });

    for (const b of businesses) {
      routes.push({
        url: `${baseUrl}/b/${b.slug}`,
        lastModified: b.updatedAt || new Date(),
        changeFrequency: 'daily',
        priority: 0.85,
      });
    }
  } catch (err) {
    console.error('Error generating sitemap businesses:', err);
  }

  return routes;
}

