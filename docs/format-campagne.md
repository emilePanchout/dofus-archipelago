# Format de campagne v1

Un fichier UTF-8 JSON avec `schema: "dofus-campaign/v1"` décrit une campagne.
L'éditeur est le moyen recommandé pour le modifier. Voir le fichier complet
[campagne-exemple.json](../examples/campagne-exemple.json).

## Champs racine

| Champ | Rôle |
| --- | --- |
| `schema` | Version du format : `dofus-campaign/v1`. |
| `title` | Titre lisible, jusqu'à 100 caractères. |
| `slug` | Identifiant, 1 à 40 lettres/chiffres sans accents, lettre au début. |
| `creator` | Créateur dans le nom du monde, même alphabet, 30 caractères maximum. |
| `player` | Nom du slot dans le YAML, 1 à 16 caractères. |
| `rules` | Texte des règles de départ et des contraintes réelles. |
| `objectives` | Liste ordonnée de 1 à 500 objectifs. |
| `permits` | Liste de 0 à 200 autorisations. |
| `victory` | Objectifs et permis exigés pour terminer. |

## Objectif

```json
{
  "id": "objectif_recolte",
  "name": "Recolter 20 ressources",
  "title": "Récolter 20 ressources",
  "category": "Récolte",
  "icon": "leaf",
  "description": "Récolte toi-même vingt unités ; les achats ne comptent pas.",
  "requires": [],
  "counter": "ressources",
  "target": 20
}
```

`id` est l'identifiant interne utilisé dans la sélection de victoire.
`name` est le nom Archipelago. `title` est le texte présenté dans le carnet.
`requires` contient les **name** des permis, tous requis. `counter` et `target`
sont facultatifs et vont ensemble. Une même clé partage un compteur cumulatif.
La cible est un entier de 1 à 1 000 000 ; une clé utilise lettres/chiffres, `_` ou `-`.

Les icônes possibles sont `star`, `swords`, `leaf`, `compass`, `hammer`,
`scroll`, `crystal`, `shield`, `helmet`, `gift`, `trophy` et `book`.

## Autorisation

```json
{
  "id": "permis_artisanat",
  "name": "Permis artisanat",
  "title": "Artisanat",
  "description": "Autorise la fabrication d'objets dans les ateliers.",
  "icon": "hammer",
  "kind": "Métier"
}
```

`kind` vaut `Général`, `Classe`, `Élément`, `Équipement`, `Zone`, `Métier` ou
`Activité`. Chaque permis est exporté comme un objet de progression en un exemplaire.

Les identifiants `id` et les noms `name` doivent être uniques. Les noms
Archipelago ne contiennent pas `| : { } @` ni de retour à la ligne, et ne peuvent
pas utiliser les noms réservés `__Victory__` ou `Souvenir sans effet`.

## Victoire

```json
{
  "mode": "selected",
  "objectives": ["objectif_recolte"],
  "permits": []
}
```

`mode` vaut `all` ou `selected`. Dans le second cas, `objectives` contient les
**id** des objectifs exigés. `permits` contient les **name** des autorisations
supplémentaires. Les permis des objectifs exigés s'ajoutent automatiquement.

## Identité et migration

L'identité exportée combine le slug, le créateur et une empreinte de la
définition. Le nom du joueur est exclu de cette empreinte. Elle sert à détecter
les erreurs de configuration ; ce n'est pas un mécanisme de sécurité cryptographique.

Le nom du monde général livré avec le kit est fixe : `Manual_Dofus_Communaute`.
Les exports personnalisés utilisent leur propre identité. Ne modifie pas les
fichiers d'une génération en cours pour essayer d'en changer le contenu.

L'import direct des JSON internes Manual (`items.json`, `locations.json`)
n'est pas pris en charge. Conserve le fichier campagne et les sorties de chaque
génération avant d'entreprendre une migration de format.
