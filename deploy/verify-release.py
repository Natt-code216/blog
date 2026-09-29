#!/usr/bin/env python3
"""Verify public HTTPS, release identity and every repository-backed CMS field."""
import json
from pathlib import Path
import sys
import urllib.request

release = Path(sys.argv[1])
base = 'https://www.blog.offerready.cn'
def fetch(path):
    with urllib.request.urlopen(base + path, timeout=20) as response:
        assert response.status == 200, path
        return response.read()

expected = json.loads((release / 'release.json').read_text())
assert json.loads(fetch('/version.json')) == expected, 'Wrong release served by Nginx'
for path in ['/', '/collection', '/mini-tools/index.html', '/cms/admin', '/sitemap.xml']:
    fetch(path)
content = json.loads((release / 'content-manifest.json').read_text())
for kind, drafts in content.items():
    actual = json.loads(fetch(f'/cms/api/{kind}?pagination[pageSize]=100'))['data']
    for draft in drafts:
        matches = [row for row in actual if row['slug'] == draft['slug']]
        assert len(matches) == 1, f'{kind}: missing or duplicate {draft["slug"]}'
        for key, value in draft.items():
            assert matches[0][key] == value, f'{kind}/{draft["slug"]}: field {key} differs'
        fetch(f'/{kind}/{draft["slug"]}')
    print(f'{kind}: verified {len(drafts)} documents with exact content')
assert json.loads(fetch('/cms/admin/init'))['data']['hasAdmin'], 'Missing administrator'
print(f'HTTPS and release verified: {expected["release"]}')
