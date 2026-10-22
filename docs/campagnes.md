# Créer et partager une campagne

Ouvre **Editeur-Dofus.html** du kit téléchargé. L'éditeur ne se connecte pas
au serveur : il prépare les fichiers de la prochaine génération.

## 1. Fixer les règles

Dans **Campagne**, choisis le titre, l'identifiant, le créateur et le joueur.
L'identifiant et le créateur utilisent des lettres/chiffres sans accents,
avec une lettre au début. Le nom du joueur accepte jusqu'à 16 caractères.

Décris les contraintes initiales : classe libre ou imposée, élément de départ,
limite d'équipement, aide autorisée, échanges, déplacements et activités libres.
Vérifie que la classe et ses sorts permettent de réaliser les objectifs.

Le nom du joueur est indépendant de la logique. Pour plusieurs joueurs Dofus,
exporte le même profil avec des noms différents, ou duplique son YAML en ne
changeant que `name`. Chaque joueur utilise un nom unique dans la génération.

## 2. Définir les autorisations

Une autorisation est un objet de progression présent **une fois** dans le pool.
Décris exactement son effet : un élément devient utilisable, une famille
d'activités devient autorisée, un plafond d'équipement augmente, etc.

Les types Classe, Élément, Équipement, Zone, Métier et Activité servent au
classement. Ils n'ajoutent pas de logique cachée et ne changent pas Dofus.

## 3. Ajouter des objectifs variés

Un objectif correspond à un emplacement de récompense. Il peut décrire une
quête, une récolte, une fabrication, une exploration ou un combat à contrainte.
Le champ de description doit permettre à quelqu'un d'autre de savoir quand
valider. Évite les termes imprécis comme « quelques combats ».

Chaque autorisation cochée est obligatoire (**A et B**, sans alternative).
Au moins un objectif doit être accessible sans permis. Il faut au moins autant
d'objectifs que d'autorisations à placer. Les emplacements restants reçoivent
des souvenirs sans effet.

Pour un palier cumulatif, active le compteur : deux objectifs avec la même clé
partagent leur progression. Par exemple, clé `recettes`, cibles 1 puis 3.
Deux clés différentes créent deux compteurs indépendants.

## 4. Choisir la victoire

Choisis tous les objectifs ou une sélection. Les permis nécessaires aux
objectifs retenus sont automatiquement requis ; tu peux en ajouter d'autres.
Finir avant les objectifs facultatifs peut laisser des objets utiles aux amis
dans ton monde : accordez-vous sur ce point avant de jouer.

Le carnet exige les checks confirmés. Dans Manual Client, la condition « avoir
accompli les objectifs » reste à respecter manuellement avant de cocher la victoire.
Le moteur calcule les accès par les autorisations, pas par les actions réelles Dofus.

## 5. Tester et exporter

Dans **Aperçu et export**, simule les permis reçus. Les objectifs disponibles
changent à l'écran, sans aucun envoi. La validation signale les noms dupliqués,
références absentes, compteurs invalides et départ entièrement verrouillé.

Sauvegarde le JSON : le brouillon du navigateur seul ne remplace pas ce fichier.
L'export produit l'APWorld, le YAML, les deux interfaces, le JSON et les règles.
Génère ensuite une **nouvelle partie** avec les YAML du groupe.

Les changements de contenu changent l'identité du monde exporté. Conserve
ensemble les fichiers du même export et les sorties de génération.

## Limites actuelles

L'éditeur accepte 1 à 500 objectifs et jusqu'à 200 autorisations. Il ne propose
pas les objets progressifs à plusieurs copies, les conditions « A ou B » ni
les prérequis portant sur des objectifs déjà cochés. Il ne simule pas les
prérequis de quêtes, sorts, objets, clefs ou déplacements du jeu réel.
