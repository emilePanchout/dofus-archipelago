# Dofus Archipelago

**Un carnet d'aventure et un éditeur de campagnes pour jouer à Dofus dans un
multiworld Archipelago, avec validation manuelle et sans modifier Dofus.**

[English](README.en.md) · [Guide joueur](docs/guide-utilisateur.md) ·
[Créer une campagne](docs/campagnes.md) · [Contribuer](CONTRIBUTING.md)

## Ce que fait le projet

Tu accomplis des objectifs dans Dofus, puis tu les valides dans le carnet.
Archipelago distribue leurs récompenses dans les jeux du groupe. En retour,
les objets reçus t'accordent des autorisations que tu appliques dans Dofus :
artisanat, élément supplémentaire, équipement ou activité débloquée.

| Outil | Utilisation |
| --- | --- |
| **Carnet-Dofus.html** | Objectifs disponibles, compteurs, autorisations et échanges en direct. |
| **Editeur-Dofus.html** | Créer et réutiliser des campagnes, puis exporter l'APWorld, le YAML, les règles et les interfaces. |
| **Campagne d'exemple** | 12 objectifs variés et 5 autorisations pour une première partie. |

Les interfaces s'ouvrent localement dans le navigateur. Aucun compte Dofus,
mod, lecture du jeu ou détection automatique des actions n'est utilisé.

## Commencer à jouer

1. Ouvre **Releases** sur la page du dépôt et télécharge
   **Dofus-Archipelago-0.2.1.zip**. L'archive « Source code » contient les sources,
   pas les applications déjà construites.
2. Extrais toute l'archive, puis ouvre **Editeur-Dofus.html** dans Chrome ou Edge.
3. Personnalise la campagne ou conserve l'exemple, puis exporte son pack.
4. Installe son `.apworld` dans Archipelago. Rassemble son YAML et ceux des amis
   avant de générer la partie.
5. Héberge la partie générée et ouvre **Carnet-Dofus.html** du pack exporté.
6. Connecte le serveur et le **nom exact du joueur défini dans le YAML**.
   Sur le même PC que le serveur : `localhost:38281`.

Pour utiliser directement l'exemple général, l'archive contient aussi
`manual_dofus_communaute.apworld` et `JoueurDofus.yaml` : ces deux fichiers vont
ensemble avec le carnet inclus. Le [guide joueur](docs/guide-utilisateur.md)
détaille l'installation et le fonctionnement avec Manual Client.

## Une campagne pour tout le groupe

Les valeurs par défaut sont **Aventure Dofus**, **Communaute** et **JoueurDofus**.
Le créateur et le nom du joueur sont configurables. Plusieurs joueurs peuvent
partager la même campagne avec des YAML portant des noms distincts.

L'éditeur permet d'ajouter, modifier, dupliquer et réordonner les objectifs ;
de définir leurs autorisations et compteurs ; et de choisir les conditions de
victoire. Le JSON sauvegardé permet de retrouver et partager sa configuration.
Les récompenses des emplacements restent tirées au sort par Archipelago.

**Modifier le contenu d'une campagne demande une nouvelle génération.**
Les noms de joueurs d'une partie existante restent ceux de sa génération.
Le mode « Ancienne partie d'exemple » existe uniquement pour reprendre le
premier prototype ; les nouvelles campagnes utilisent des noms génériques.

## Compatibilité et limites

- Projet en version **0.2.1**, encore expérimental.
- Générations et connexion serveur vérifiées sur le moteur source Archipelago
  **0.6.9**, avec la base Manual `manual_stable_20260319`.
- L'installation Windows Archipelago **0.6.8** et le client graphique Manual
  n'ont pas été exécutés dans cet environnement de validation.
- Chrome a servi aux essais des interfaces. Le fonctionnement local avec
  Chrome/Edge est la voie prévue ; la validation mobile reste à faire.
- Les objectifs Dofus restent à accomplir et vérifier soi-même. L'éditeur
  valide la logique des permis, pas les prérequis réels du jeu.
- Le carnet peut fonctionner en parallèle de Manual Client sur le même slot.
  Les checks et objets viennent du serveur ; les compteurs partiels restent locaux.

Voir [validation](docs/validation.txt) et [dépannage](docs/depannage.md).

## Pour développer

Prérequis : **Python 3.10+** et **Node.js 24+**. Aucune dépendance npm ou pip
n'est nécessaire pour construire le kit et exécuter les tests unitaires.

```sh
python scripts/build.py
npm test
npm run check
npm run package
```

Les fichiers à ouvrir et distribuer apparaissent dans **build/**. Les sources
de l'interface sont dans **web/** ; ce dossier n'est pas un résultat de build.
Les archives générées et parties de test sont exclues de Git.

[Architecture](docs/developpement.md) · [Format de campagne](docs/format-campagne.md) ·
[Publication et releases](docs/publication-github.md)

## Licence et origine

Le carnet et l'éditeur sont distribués sous [licence MIT](LICENSE).
Le moteur Manual inclus conserve sa licence et ses attributions :
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Projet communautaire non officiel, sans affiliation à Ankama.
