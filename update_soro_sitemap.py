"""Generate a separate sitemap of published Soro articles; run from site root."""
import json
import re
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

EMBED = 'https://app.trysoro.com/api/embed/09431eeb-179b-4674-b040-9e369e19a223'
BASE = 'https://www.trackreporter.com/blog/'
OUTPUT = Path('sitemap-soro.xml')
NS = 'http://www.sitemaps.org/schemas/sitemap/0.9'


def build(script):
    match = re.search(r'\bvar\s+SORO_ARTICLES\s*=\s*', script)
    if not match:
        raise ValueError('SORO_ARTICLES not found; existing sitemap preserved')
    articles, _ = json.JSONDecoder().raw_decode(script[match.end():])
    if not isinstance(articles, list) or not articles:
        raise ValueError('No published articles returned; existing sitemap preserved')
    slugs = set()
    for article in articles:
        slug = article.get('slug') if isinstance(article, dict) else None
        if not isinstance(slug, str) or not slug.strip():
            raise ValueError('Invalid article slug; existing sitemap preserved')
        slugs.add(slug)
    ET.register_namespace('', NS)
    root = ET.Element(f'{{{NS}}}urlset')
    for slug in sorted(slugs):
        url = ET.SubElement(root, f'{{{NS}}}url')
        ET.SubElement(url, f'{{{NS}}}loc').text = BASE + '?' + urlencode({'post': slug})
    ET.indent(root)
    return ET.tostring(root, encoding='utf-8', xml_declaration=True) + b'\n'


def main():
    request = Request(EMBED, headers={'User-Agent': 'TrackReporter-Sitemap/1.0', 'Referer': BASE})
    with urlopen(request, timeout=30) as response:
        script = response.read().decode('utf-8')
    xml = build(script)
    temp = OUTPUT.with_suffix('.xml.tmp')
    temp.write_bytes(xml)
    temp.replace(OUTPUT)
    print(f'Updated {OUTPUT}')


if __name__ == '__main__':
    main()
