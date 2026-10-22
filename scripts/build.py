"""Build both standalone HTML files without third-party dependencies."""
from pathlib import Path
import json
import re
import zipfile

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'web'
OUT = ROOT / 'build'

def zip_text(archive, name, value):
    info = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
    info.compress_type = zipfile.ZIP_DEFLATED
    info.external_attr = 0o100644 << 16
    archive.writestr(info, value.encode('utf-8'))

def standalone(name, placeholders=None):
    placeholders = placeholders or {}
    html = (DIST / name).read_text(encoding='utf-8')
    for stylesheet in re.findall(r'<link rel="stylesheet" href="([^"]+)">', html):
        html = html.replace(f'<link rel="stylesheet" href="{stylesheet}">', '<style>' + (DIST / stylesheet).read_text(encoding='utf-8') + '</style>')
    scripts = []
    for src in re.findall(r'<script defer src="([^"]+)"></script>', html):
        html = html.replace(f'<script defer src="{src}"></script>', '')
        source = placeholders.get(src, (DIST / src).read_text(encoding='utf-8') if (DIST / src).exists() else '')
        slot = {'content.js': 'content', 'export-assets.js': 'assets'}.get(src) if src in placeholders else None
        attribute = f' data-carnet-slot="{slot}"' if slot else ''
        scripts.append('<script' + attribute + '>' + source.replace('</script', '<\\/script') + '</script>')
    html = html.replace('</body>', '\n'.join(scripts) + '\n</body>')
    license_text = (ROOT / 'LICENSE').read_text(encoding='utf-8')
    html = html.replace('<!doctype html>', '<!doctype html>\n<!--\n' + license_text + '-->')
    return html.replace('href="editor.html"', 'href="Editeur-Dofus.html"').replace('href="index.html"', 'href="Carnet-Dofus.html"')

def safe_json(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c')

def build_default_world(manual):
    profile = json.loads((ROOT / 'examples/campagne-exemple.json').read_text(encoding='utf-8'))
    game = 'Manual_' + profile['slug'] + '_' + profile['creator']
    assert f"game:'{game}'" in (DIST / 'content.js').read_text(encoding='utf-8'), 'Default profile and carnet use different game names.'
    folder = game.lower()
    requires = lambda names: ' and '.join('|' + n + '|' for n in names)
    locations = [{'name': o['name'], 'category': [o['category']], **({'requires': requires(o['requires'])} if o['requires'] else {})} for o in profile['objectives']]
    locations.append({'name': 'Victoire - Les objectifs sont termines', 'victory': True, 'requires': requires(profile['victory']['permits'])})
    data = {
        'game': {'game': profile['slug'], 'creator': profile['creator'], 'filler_item_name': 'Souvenir sans effet', 'death_link': False},
        'items': [{'name': p['name'], 'progression': True, 'count': 1, 'category': ['Autorisations']} for p in profile['permits']],
        'locations': locations, 'events': [], 'regions': {}, 'categories': {}, 'options': {},
        'meta': {'docs': {'apworld_description': 'Aventure Dofus — campagne de depart commune. Personnalisable dans l editeur.'}}
    }
    with zipfile.ZipFile(OUT / (folder + '.apworld'), 'w', zipfile.ZIP_DEFLATED) as z:
        for name, value in manual.items():
            zip_text(z, folder + '/' + name, value)
        for name, value in data.items():
            zip_text(z, folder + '/data/' + name + '.json', json.dumps(value, ensure_ascii=False, indent=2))
        zip_text(z, folder + '/archipelago.json', json.dumps({'game': game, 'world_version': json.loads((ROOT / 'package.json').read_text(encoding='utf-8'))['version'], 'minimum_ap_version': '0.6.3', 'compatible_version': 7, 'version': 7}))
    (OUT / (profile['player'] + '.yaml')).write_text('name: ' + json.dumps(profile['player']) + '\ngame: ' + game + '\n' + game + ':\n  progression_balancing: 50\n  accessibility: full\n', encoding='utf-8')

def main():
    OUT.mkdir(exist_ok=True)
    template = ROOT / 'vendor/manual'
    if not template.exists():
        raise SystemExit('vendor/manual absent : conserve les sources Manual fournies avec le projet.')
    manual = {p.relative_to(template).as_posix(): p.read_text(encoding='utf-8') for p in sorted(template.rglob('*')) if p.is_file() and '__pycache__' not in p.parts}
    carnet = standalone('index.html', {'content.js': '/*__CAMPAIGN_CONTENT__*/'})
    editor = standalone('editor.html', {'content.js': '/*__CAMPAIGN_CONTENT__*/', 'export-assets.js': '/*__EXPORT_ASSETS__*/'})
    assets = {'manual': manual, 'carnet': carnet, 'editor': editor, 'clientLicense': (ROOT / 'LICENSE').read_text(encoding='utf-8'), 'thirdPartyNotices': (ROOT / 'THIRD_PARTY_NOTICES.md').read_text(encoding='utf-8')}
    (DIST / 'export-assets.js').write_text('window.CarnetExportAssets=' + safe_json(assets) + ';\n', encoding='utf-8')
    (OUT / 'Carnet-Dofus.html').write_text(standalone('index.html'), encoding='utf-8')
    (OUT / 'Editeur-Dofus.html').write_text(standalone('editor.html'), encoding='utf-8')
    build_default_world(manual)
    (OUT / 'Campagne-Exemple.json').write_bytes((ROOT / 'examples/campagne-exemple.json').read_bytes())
    print('Built Carnet-Dofus.html and Editeur-Dofus.html; embedded Manual template:', len(manual), 'files.')

if __name__ == '__main__':
    main()
