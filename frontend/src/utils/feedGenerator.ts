/**
 * Feed generation utilities for RSS and Atom
 */

import type { WikiPage } from '../types';

export function generateRSS(pages: WikiPage[], baseUrl: string): string {
    const sortedPages = [...pages].sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    ).slice(0, 20);

    const items = sortedPages.map(page => `
    <item>
      <title>${escapeXml(page.title)}</title>
      <link>${baseUrl}/page/${page.id}</link>
      <guid>${baseUrl}/page/${page.id}</guid>
      <pubDate>${new Date(page.createdAt).toUTCString()}</pubDate>
      <description>${escapeXml(page.content.substring(0, 200))}...</description>
      ${page.tags?.map(tag => `<category>${escapeXml(tag)}</category>`).join('\n      ') || ''}
    </item>`).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>gWiki3 - Recent Updates</title>
    <link>${baseUrl}</link>
    <description>最近更新されたWikiページ</description>
    <language>ja</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/api/feed/rss" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;
}

export function generateAtom(pages: WikiPage[], baseUrl: string): string {
    const sortedPages = [...pages].sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    ).slice(0, 20);

    const entries = sortedPages.map(page => `
  <entry>
    <title>${escapeXml(page.title)}</title>
    <link href="${baseUrl}/page/${page.id}"/>
    <id>${baseUrl}/page/${page.id}</id>
    <updated>${new Date(page.updatedAt).toISOString()}</updated>
    <published>${new Date(page.createdAt).toISOString()}</published>
    <summary>${escapeXml(page.content.substring(0, 200))}...</summary>
    ${page.tags?.map(tag => `<category term="${escapeXml(tag)}"/>`).join('\n    ') || ''}
  </entry>`).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>gWiki3 - Recent Updates</title>
  <link href="${baseUrl}"/>
  <link href="${baseUrl}/api/feed/atom" rel="self"/>
  <id>${baseUrl}</id>
  <updated>${new Date().toISOString()}</updated>
${entries}
</feed>`;
}

function escapeXml(unsafe: string): string {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
