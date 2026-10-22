"""Produce a portable player kit with deterministic ZIP entries and checksums."""
from pathlib import Path
import hashlib
import json
import zipfile
import build

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'build'


def main():
    build.main()
    version = json.loads((ROOT / 'package.json').read_text(encoding='utf-8'))['version']
    filename = f'Dofus-Archipelago-{version}.zip'
    paths = {
        name: OUT / name for name in [
            'Carnet-Dofus.html', 'Editeur-Dofus.html', 'Campagne-Exemple.json',
            'manual_dofus_communaute.apworld', 'JoueurDofus.yaml'
        ]
    }
    paths.update({
        'LIRE-MOI.md': ROOT / 'docs/guide-utilisateur.md',
        'LICENSE': ROOT / 'LICENSE',
        'THIRD_PARTY_NOTICES.md': ROOT / 'THIRD_PARTY_NOTICES.md',
        'vendor/manual/LICENSE': ROOT / 'vendor/manual/LICENSE',
        'VALIDATION.txt': ROOT / 'docs/validation.txt'
    })
    with zipfile.ZipFile(OUT / filename, 'w', zipfile.ZIP_DEFLATED) as archive:
        for name, source in sorted(paths.items()):
            info = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, source.read_bytes())
    assets = [filename, 'manual_dofus_communaute.apworld', 'JoueurDofus.yaml']
    sums = ''.join(hashlib.sha256((OUT / name).read_bytes()).hexdigest() + '  ' + name + '\n' for name in assets)
    (OUT / 'SHA256SUMS.txt').write_text(sums, encoding='utf-8', newline='\n')
    print('Player kit:', OUT / filename)


if __name__ == '__main__':
    main()
