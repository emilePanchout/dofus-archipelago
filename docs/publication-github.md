# Publier le projet sur GitHub

Nom proposé : **dofus-archipelago**. Description proposée :
« Carnet local et éditeur de campagnes Dofus pour Archipelago Manual, sans mod. »

Le dépôt ne doit contenir que les sources, exemples, licences et documents.
Les fichiers `build/` seront distribués dans une release, pas committés.

## Préparer le premier dépôt

Ouvre un terminal dans le dossier contenant `README.md` et `package.json`.
Installe [Git](https://git-scm.com/) et [GitHub CLI](https://cli.github.com/) si
tu utilises la méthode ci-dessous. Aucun jeton ne doit être copié dans les fichiers.

```sh
git init -b main
git add .
git commit -m "Initial release: local Dofus journal and campaign editor"
gh auth login
gh repo create dofus-archipelago --public --source=. --remote=origin --push
```

Git peut demander un nom et un e-mail d'auteur avant le commit. Utilise ceux
que tu souhaites rendre publics ; GitHub fournit aussi une adresse noreply
dans ses paramètres d'e-mail. Si le dépôt local existe déjà, ne refais pas
`git init` et crée seulement le commit nécessaire.

Si un dépôt porte déjà ce nom, choisis un autre nom ou renseigne explicitement
un propriétaire. N'écrase pas un dépôt existant sans en avoir vérifié le contenu.

### Variante sans ligne de commande

Avec [GitHub Desktop](https://desktop.github.com/), crée un dépôt local depuis
le dossier des sources, vérifie les fichiers du premier commit, puis utilise
**Publish repository**. Pour un projet public, désactive **Keep this code private**.

Le README, la licence et `.gitignore` sont déjà fournis. Lors de la création
sur le site GitHub, ne demande pas d'ajouter d'autres versions de ces fichiers.

## Vérifier la première publication

Dans GitHub :

1. **Code** : le README est à la racine et les dossiers `web`, `vendor`, `docs`,
   `examples`, `scripts`, `tests` et `.github` sont présents.
2. **Actions** : le workflow CI doit réussir sur Ubuntu et Windows.
3. **About** : ajoute la description et, si souhaité, les thèmes `archipelago`,
   `dofus`, `manual`, `randomizer`, `javascript`.

## Publier la version 0.2.1

Vérifie d'abord que `package.json`, le changelog et les versions dans les sources
correspondent. Teste et construis l'archive :

```sh
npm test
npm run check
npm run package
git tag -a v0.2.1 -m "Dofus Archipelago 0.2.1"
git push origin v0.2.1
```

Le workflow **Release** vérifie le tag, lance les tests et construit le kit.
Il crée ensuite une release publique avec le ZIP des joueurs, l'APWorld,
le YAML d'exemple et les sommes SHA-256. Le tag doit correspondre exactement
à la version de `package.json`. Aucun secret personnel n'est nécessaire :
le workflow utilise le jeton temporaire du dépôt avec `contents: write`.

Si les règles du dépôt empêchent les releases, le workflow échoue sans publier.
Tu peux utiliser les fichiers de `build/` pour une release créée manuellement :

```sh
gh release create v0.2.1 build/Dofus-Archipelago-0.2.1.zip build/manual_dofus_communaute.apworld build/JoueurDofus.yaml build/SHA256SUMS.txt --verify-tag --title "Dofus Archipelago 0.2.1" --notes-file docs/releases/v0.2.1.md
```

Ne relance pas la création d'une release déjà publiée pour écraser ses fichiers.
Pour corriger une version distribuée, prépare une nouvelle version.

## À partager avec les joueurs

Partage l'URL de la release ou de la page du dépôt. Le README indique aux
joueurs de télécharger le ZIP de la release et non l'archive des sources.
Les interfaces sont prévues pour une ouverture locale ; aucun hébergement
GitHub Pages n'est nécessaire.

Références : [création d'un dépôt](https://docs.github.com/en/repositories/creating-and-managing-repositories/quickstart-for-repositories),
[gh repo create](https://cli.github.com/manual/gh_repo_create),
[gh release create](https://cli.github.com/manual/gh_release_create).
