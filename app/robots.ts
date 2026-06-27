import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/api/',
        '/auth/',
        '/login',
        '/register',
        '/booking',
        '/appointments',
        '/profile',
        '/loyalty',
        '/rewards',
        '/invite',
      ],
    },
    sitemap: 'https://www.k19hairstudio.com/sitemap.xml',
  }
}
