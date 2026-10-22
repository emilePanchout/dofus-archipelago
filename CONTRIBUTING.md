# Contribuer

Les améliorations du carnet, corrections et exemples de campagnes sont bienvenus.
Commence par une issue pour un changement important de logique ou de format.

## Installer les sources

1. Clone le dépôt ou télécharge ses sources.
2. Installe Python 3.10+ et Node.js 24+.
3. Depuis la racine, exécute `python scripts/build.py`.
4. Ouvre les fichiers de `build/` pour essayer le résultat.

Aucune installation de dépendances npm/pip n'est requise. `npm test` construit
d'abord les applications, puis lance les tests. `npm run check` vérifie aussi
les liens locaux de documentation et les archives produites.

## Avant une pull request

```sh
npm test
npm run check
npm run package
git diff --check
```

Décris le problème, le comportement attendu et les vérifications réellement
effectuées. Ajoute un test pour une modification du protocole, de la logique
ou du format. Une retouche purement visuelle ne demande pas de test artificiel.

Les fichiers générés dans `build/` et `web/export-assets.js` ne sont pas
committés. Ne joins pas de sauvegarde de serveur, mot de passe ou partie réelle
à une issue ou une pull request.

## Conventions

- HTML/CSS/JavaScript sans dépendance de navigateur distante.
- Sources et documentation en UTF-8, fins de ligne LF.
- Noms génériques pour les exemples et noms de joueurs configurables.
- Conserver le format `dofus-campaign/v1` compatible ou documenter une migration.
- Ne pas changer silencieusement les identifiants d'un monde déjà distribué.
- Documenter toute modification de `vendor/manual/` dans les notices ; la base
  actuelle est une sélection de fichiers amont non modifiés.

Les tests d'intégration nécessitant le moteur Archipelago sont facultatifs
pour les petites contributions ; voir [développement](docs/developpement.md).
