import fs from 'fs';
import path from 'path';
import { ApiRecord } from './types';

export function parseRepoToApis(repoDir: string): ApiRecord[] {
  const results: ApiRecord[] = [];

  const readmePath = path.join(repoDir, 'README.md');
  if (!fs.existsSync(readmePath)) {
    console.warn('README.md not found at', readmePath);
    return results;
  }

  const readme = fs.readFileSync(readmePath, 'utf8');
  results.push(...extractApisFromMarkdown(readme, 'README.md'));

  // Walk root-level markdown files for any per-category files
  const entries = fs.readdirSync(repoDir, { withFileTypes: true });
  for (const entry of entries) {
    if (
      entry.isFile() &&
      entry.name.endsWith('.md') &&
      entry.name !== 'README.md' &&
      entry.name !== 'FOLLOW_CREATOR.md'
    ) {
      const content = fs.readFileSync(path.join(repoDir, entry.name), 'utf8');
      results.push(...extractApisFromMarkdown(content, entry.name));
    }
  }

  // Deduplicate by slug
  const deduped = new Map<string, ApiRecord>();
  for (const api of results) {
    deduped.set(api.slug, api);
  }

  return Array.from(deduped.values());
}

function extractApisFromMarkdown(markdown: string, sourcePath: string): ApiRecord[] {
  const apis: ApiRecord[] = [];
  const lines = markdown.split('\n');
  let currentCategory = '';

  for (const line of lines) {
    const trimmed = line.trim();

    // Update category from headings
    const headingMatch = trimmed.match(/^#{1,3}\s+(.+)$/);
    if (headingMatch) {
      currentCategory = headingMatch[1].replace(/[*_`]/g, '').trim();
      continue;
    }

    // Bullet list: `- [Name](url)` or `- [Name](url) - description`
    const listMatch = trimmed.match(/^[-*]\s+\[([^\]]+)\]\(([^)]+)\)(?:\s*[-–]\s*(.+))?$/);
    if (listMatch) {
      const [, name, url, description] = listMatch;
      const cleanName = name.trim();
      if (cleanName) {
        apis.push({
          name: cleanName,
          slug: slugify(cleanName),
          category: currentCategory || undefined,
          description: description?.trim() || undefined,
          homepage_url: url.trim(),
          source_repo_path: sourcePath,
        });
      }
      continue;
    }

    // Markdown table row: `| Name | URL | Description | Auth |`
    if (trimmed.startsWith('|') && !trimmed.match(/^[\s|:-]+$/)) {
      const cells = trimmed
        .split('|')
        .map((c) => c.trim())
        .filter(Boolean);

      if (cells.length < 2) continue;

      const cellLinkMatch = cells[0].match(/\[([^\]]+)\]\(([^)]+)\)/);
      const name = cellLinkMatch ? cellLinkMatch[1] : cells[0];
      if (!name || name === 'API' || name === 'Name' || name === 'Service') continue;

      const homepage_url = cellLinkMatch
        ? cellLinkMatch[2]
        : cells[1]?.match(/https?:\/\/\S+/)?.[0];

      const cleanName = name.trim();
      apis.push({
        name: cleanName,
        slug: slugify(cleanName),
        category: currentCategory || undefined,
        description: cells[2]?.trim() || undefined,
        homepage_url: homepage_url?.trim() || undefined,
        auth_type: cells[3]?.trim() || undefined,
        source_repo_path: sourcePath,
      });
    }
  }

  return apis;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
