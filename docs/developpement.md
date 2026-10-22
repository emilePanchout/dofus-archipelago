# Développement

## Organisation

| Chemin | Contenu |
| --- | --- |
| `web/` | Sources HTML/CSS/JavaScript du carnet et de l'éditeur. |
| `web/campaign.js` | Format, validation, identité et compilation d'une campagne. |
| `web/engine.js` | Client WebSocket Archipelago, checks, objets, compteurs et victoire. |
| `web/export.js` | Création ZIP et export des campagnes dans le navigateur. |
| `vendor/manual/` | Base Manual figée, sans ses données d'exemple. |
| `examples/` | Campagne publique générique. |
| `scripts/` | Build, contrôles et archive de release. |
| `tests/` | Tests Node et intégration Archipelago optionnelle. |
| `build/` | Sorties générées, ignorées par Git. |

## Construire

Python 3.10+ suffit pour construire les interfaces autonomes et l'APWorld :

```sh
python scripts/build.py
```

Le build crée aussi `web/export-assets.js`, un fichier généré qui embarque le
modèle Manual et les interfaces utilisées lors d'un export dans l'éditeur.
Il reste ignoré par Git. Les applications finales de `build/` n'ont pas de
dépendance à un serveur web ou à une bibliothèque distante.

Les sources lisibles de `web/` peuvent être servies localement après le build,
mais le parcours utilisateur prévu reste l'ouverture des fichiers autonomes.

## Tester

Node.js 24+ est utilisé pour les tests :

```sh
npm test
npm run check
npm run package
```

Les tests unitaires n'ont besoin ni de Dofus, ni d'Archipelago, ni d'Internet.
Ils couvrent les règles, le protocole avec socket simulé, les exports et la
reprise. Les contrôles Python inspectent les archives, licences et liens locaux.

### Intégration facultative

Avec un checkout source d'Archipelago et ses dépendances déjà installées :

```sh
ARCHIPELAGO_SOURCE=/chemin/Archipelago ARCHIPELAGO_DEPS=/chemin/dependances python tests/validate_export_runtime.py
```

Cette commande suit `npm test`, qui produit la fixture exportée sous
`tests/generated/`. Elle installe l'APWorld de test dans le checkout fourni,
effectue trois remplissages et une génération complète. Utilise un checkout
réservé aux tests. Ces dépendances ne font pas partie de l'installation du kit.

`tests/live.test.cjs` attend un serveur éphémère de test sur le port **38289**,
avec le joueur de la fixture. La variable `CARNET_CONTENT` peut pointer vers
son `compiled.json`. Ne pointe pas ce test vers une partie réelle : il valide
les objectifs et déclare la victoire. Il ne fait pas partie de `npm test`.

## Protocole et stockage

Les IDs sont résolus dans le DataPackage du serveur. Le carnet attend la
confirmation d'un check et refuse une campagne incompatible. Les exports
ajoutent une empreinte aux données du slot pour distinguer les configurations.

Les checks, objets et état de victoire viennent du serveur. Les compteurs
partiels et notes sont dans le stockage local du navigateur, séparés par
partie/joueur. Le mot de passe n'est pas conservé. Aucune télémétrie n'est ajoutée.

Le nom du joueur est exclu de l'identité de campagne. Les mêmes règles peuvent
donc servir à plusieurs slots. Les changements de règles ou contenu doivent
passer par un nouvel export et une nouvelle génération.
