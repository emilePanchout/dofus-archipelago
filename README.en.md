# Dofus Archipelago

A local adventure journal and campaign editor for playing Dofus in an
Archipelago multiworld through **Manual**, without modifying the game.

[Français](README.md)

Complete an objective in Dofus, then check it in the journal. Archipelago sends
the randomized item to its recipient in the group. Received permissions unlock
activities you agree to allow in Dofus. There is no gameplay detection or account access.

## Getting started

1. Download **Dofus-Archipelago-0.2.1.zip** from this repository's **Releases**.
   GitHub's source archives require a local build first.
2. Extract the archive and open **Editeur-Dofus.html** in Chrome or Edge.
3. Configure your campaign and export its pack.
4. Install the exported APWorld and generate a new multiworld using all players' YAML files.
5. Host the generated game and open the exported **Carnet-Dofus.html**.
6. Connect with the exact slot name from the YAML and your server address
   (`localhost:38281` when the server runs on the same computer).

The interfaces and detailed guides are currently in French. A sample campaign
has 12 objectives and 5 permissions. Player names are configurable. A single
campaign world can be used by multiple players with different slot names.

## Local development

Requires Python 3.10+ and Node.js 24+. No npm or pip dependencies are needed
for the build and unit tests.

```sh
python scripts/build.py
npm test
npm run check
npm run package
```

Generated standalone applications and the player release ZIP are written to
`build/`. Interface sources are in `web/`; the pinned MIT-licensed Manual
runtime is in `vendor/manual/`.

## Status

Experimental 0.2.1. Generation and server interactions were tested with the
Archipelago 0.6.9 source runtime. Windows Archipelago 0.6.8, the graphical
Manual client and mobile browsers remain unverified here. Dofus progress is
always checked by the player. Editing campaign content requires a new seed.

The journal and Manual Client can share a slot; partial counters are local
to the journal. Use locally opened HTML files for the intended experience.

## License

MIT. See [LICENSE](LICENSE) and [third-party notices](THIRD_PARTY_NOTICES.md).
This is an unofficial community companion, not affiliated with Ankama.
