"""Dependency-free checks for source, local docs, built HTML and APWorld files."""
from pathlib import Path
import ast
import json
import re
import subprocess
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]


def check(condition, message):
    if not condition:
        raise AssertionError(message)


def main():
    for folder in ['scripts', 'tests', 'vendor/manual']:
        for path in (ROOT / folder).rglob('*.py'):
            if 'generated' not in '/'.join(path.parts):
                ast.parse(path.read_text(encoding='utf-8'), filename=str(path))
    for path in sorted((ROOT / 'web').glob('*.js')):
        subprocess.run(['node', '--check', str(path)], check=True, capture_output=True)
    for path in [ROOT / 'package.json', ROOT / 'examples/campagne-exemple.json']:
        json.loads(path.read_text(encoding='utf-8'))

    docs = list(ROOT.glob('*.md')) + list((ROOT / 'docs').rglob('*.md'))
    for path in docs:
        text = path.read_text(encoding='utf-8')
        for href in re.findall(r'\[[^\]]*\]\(([^)]+)\)', text):
            href = href.split('#')[0].strip('<>')
            if not href or '://' in href or href.startswith('mailto:'):
                continue
            check((path.parent / href).exists(), f'Broken local link in {path.relative_to(ROOT)}: {href}')

    for name in ['Carnet-Dofus.html', 'Editeur-Dofus.html']:
        path = ROOT / 'build' / name
        text = path.read_text(encoding='utf-8')
        check('MIT License' in text, f'Missing embedded client license: {name}')
        check(not re.search(r'<script[^>]+src=', text), f'External script in {name}')
        check(not re.search(r'<link[^>]+rel="stylesheet"', text), f'External stylesheet in {name}')
    world = ROOT / 'build/manual_dofus_communaute.apworld'
    with zipfile.ZipFile(world) as archive:
        check(archive.testzip() is None, 'APWorld CRC failure')
        check('manual_dofus_communaute/LICENSE' in archive.namelist(), 'Missing Manual license')
        for name in archive.namelist():
            data = archive.read(name).decode('utf-8')
            if name.endswith('.json'):
                json.loads(data)
            elif name.endswith('.py'):
                ast.parse(data, filename=name)
        metadata = json.loads(archive.read('manual_dofus_communaute/archipelago.json'))
        version = json.loads((ROOT / 'package.json').read_text(encoding='utf-8'))['version']
        check(metadata['world_version'] == version, 'APWorld version differs from package.json')
    print('PASS: source syntax, local documentation links, standalone HTML, licenses and APWorld integrity.')


if __name__ == '__main__':
    try:
        main()
    except (AssertionError, OSError, subprocess.CalledProcessError) as error:
        print(error, file=sys.stderr)
        raise SystemExit(1)
