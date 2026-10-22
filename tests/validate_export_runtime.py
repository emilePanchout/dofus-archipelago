"""Optional integration check against an Archipelago source checkout.

Set ARCHIPELAGO_SOURCE and, if needed, ARCHIPELAGO_DEPS. Run campaign.test.cjs first.
"""
import os
import sys
import json
import shutil
import unittest
from pathlib import Path

kit = Path(__file__).resolve().parents[1]
fixture = Path(os.environ.get('CARNET_FIXTURE', str(kit / 'tests/generated'))).resolve()
compiled = json.loads((fixture / 'compiled.json').read_text(encoding='utf-8'))
source = Path(os.environ['ARCHIPELAGO_SOURCE']).resolve()
deps = os.environ.get('ARCHIPELAGO_DEPS')
sys.path[:0] = ([deps] if deps else []) + [str(source)]
os.environ['SKIP_REQUIREMENTS_UPDATE'] = '1'
os.environ['AP_TEST_WORLDS'] = compiled['folder']
os.chdir(source)
(source / 'custom_worlds').mkdir(exist_ok=True)
shutil.copy2(fixture / (compiled['folder'] + '.apworld'), source / 'custom_worlds')
from worlds import failed_world_loads
assert not failed_world_loads, failed_world_loads
from worlds.AutoWorld import AutoWorldRegister
from test.general import setup_solo_multiworld
from Fill import distribute_items_restrictive
from BaseClasses import CollectionState

world_type = AutoWorldRegister.world_types[compiled['game']]
count = len(compiled['content']['objectives'])
for seed in [21, 42, 20261022]:
    mw = setup_solo_multiworld(world_type, seed=seed)
    assert len(mw.itempool) == count
    if compiled.get('hash'):
        assert mw.worlds[1].fill_slot_data()['carnet_campaign'] == compiled['hash']
    distribute_items_restrictive(mw)
    assert not mw.get_unfilled_locations()
    state = CollectionState(mw)
    checked = set()
    while True:
        available = [loc for loc in mw.get_locations() if loc not in checked and loc.can_reach(state)]
        if not available:
            break
        for loc in available:
            checked.add(loc)
            if loc.item:
                state.collect(loc.item, True)
    assert len(checked) == count + 1
    assert mw.completion_condition[1](state)
    print(f'Seed {seed}: {count} checks filled and reachable; victory reachable.' + (' Campaign fingerprint present.' if compiled.get('hash') else ''))

from Generate import main as roll, mystery_argparse
from Main import main as generate
players = fixture / 'players'
players.mkdir(exist_ok=True)
for yaml in fixture.glob('*.yaml'):
    shutil.copy2(yaml, players)
args, seed = roll(mystery_argparse(['--player_files_path', str(players), '--seed', '20261022', '--outputpath', str(fixture / 'output'), '--spoiler', '1']))
generate(args, seed)
assert list((fixture / 'output').glob('*.zip'))
print('PASS: exported YAML generated a complete game archive on Archipelago', __import__('Utils').__version__)
