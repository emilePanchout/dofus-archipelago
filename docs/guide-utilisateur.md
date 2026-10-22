# Carnet et atelier — Dofus × Archipelago v0.2.1

## Ouvrir le kit sur Windows

Extrais tout le ZIP dans un dossier, puis ouvre avec Chrome ou Edge :

- **Carnet-Dofus.html** pour jouer : campagne générale `Manual_Dofus_Communaute`, joueur par défaut **JoueurDofus**. Le nom de joueur est modifiable dans le formulaire et conservé pour cette campagne. Pour commencer une nouvelle partie avec l’exemple, installe `manual_dofus_communaute.apworld` et utilise `JoueurDofus.yaml` avec les YAML des amis.
- Pour reprendre la première partie déjà générée, choisis **Connexion → Campagne du serveur → Ancienne partie d’exemple**, puis renseigne le nom exact de son joueur. Le serveur conserve le nom de son YAML d’origine ; il n’est pas renommé par le carnet.
- **Editeur-Dofus.html** pour préparer une nouvelle campagne. Il ne se connecte à aucun serveur.

Aucun Python, Node.js, CDN ou serveur web n’est nécessaire pour ouvrir ces deux fichiers. L’APWorld exporté utilise ton installation Archipelago et la base Manual incluse.

## Créer une campagne réutilisable

1. **Campagne** : donne un titre, un identifiant simple sans accents, le nom de créateur et le nom du joueur. Les valeurs par défaut sont `Dofus`, `Communaute` et `JoueurDofus` : chacun peut les personnaliser avant la génération. Le joueur correspond à une place dans la partie (slot) ; plusieurs personnes utilisent donc des noms distincts. Décris les règles de départ : classe imposée ou libre, éléments, équipement, activités libres, aide autorisée, etc.
2. **Objectifs** : ajoute, modifie, duplique, supprime et réordonne les actions. Un objectif est un emplacement qui envoie un objet Archipelago. Saisis sa description, sa catégorie et les autorisations nécessaires. Tous les permis cochés sont exigés.
3. **Autorisations** : crée les objets qui accordent des droits. Le type (Classe, Élément, Équipement, Zone, Métier, Activité, Général) sert au classement. L’effet réel est celui décrit dans la règle. Une autorisation est placée une fois, dans ton monde ou celui d’un ami. Elle ne modifie pas Dofus automatiquement.
4. **Victoire** : exige tous les objectifs ou une sélection précise. Les permis de ces objectifs sont automatiquement requis ; tu peux en ajouter d’autres. Les objectifs facultatifs continuent de contenir des objets pour le groupe.
5. **Aperçu et export** : simule les permis reçus et vérifie les objectifs accessibles. Corrige les erreurs signalées, puis télécharge le pack de campagne.

Les objectifs peuvent décrire de la récolte, de l’exploration, des quêtes, des combats, de l’artisanat et des défis de classe ou d’élément. Les vérifications Dofus restent manuelles.

### Compteurs partagés

Active « Compter plusieurs actions » et choisis une cible entière. Deux objectifs ayant la même clé de compteur partagent leur progression. Exemple : « Fabriquer un objet », cible 1, et « Fabriquer trois recettes différentes », cible 3, avec la clé `recettes`. Précise dans la description ce qui compte comme une nouvelle recette.

### Sauvegarder et réutiliser

Le brouillon est enregistré automatiquement dans ce navigateur quand il autorise le stockage local. Ce stockage n’est pas une sauvegarde de fichier : clique sur **Sauvegarder JSON** pour conserver ou partager ton travail. **Importer JSON** recharge ce fichier. Le bouton **Annuler** conserve les dernières modifications de la session.

Le format reconnu est le fichier `campagne.json` de cet éditeur. Les anciens JSON internes de Manual (`locations.json`, `items.json`, etc.) ne sont pas importés directement.

La campagne d’exemple est fournie dans `Campagne-Exemple.json`. Supprimer un permis le retire aussi des objectifs et de la victoire ; une confirmation indique les objectifs concernés. Renommer son identifiant met à jour ses références.

## Utiliser une campagne exportée avec les amis

Le pack contient :

- l’**APWorld** prêt à installer ;
- le **YAML** de ton joueur ;
- le **carnet HTML** configuré pour cette campagne ;
- l’**éditeur HTML** autonome pour poursuivre les modifications ;
- **campagne.json**, **REGLES.md** et **INSTALLATION.md**.

Installe l’APWorld (Install APWorld ou dossier `custom_worlds`), puis place son YAML et ceux de tes amis, dont HuniePop, dans le dossier `Players`. Génère une **nouvelle partie**, héberge son fichier généré, puis connecte le carnet exporté. Les YAML de la génération doivent avoir des noms de joueurs uniques.

Avec Manual Client, utilise le fichier `.apmanual` produit pour ce joueur par cette nouvelle génération. Pour disposer du bouton Manual Client, conserve l’APWorld Manual officiel installé si nécessaire.

Chaque configuration de campagne possède une identité de monde distincte. Le nom du joueur est indépendant : plusieurs joueurs peuvent utiliser le même APWorld avec des YAML portant des noms différents. Ne remplace pas le contenu d’une campagne en cours par un autre export. Dans le carnet, **Campagne → Importer** permet de charger le JSON correspondant au serveur ; le carnet se déconnecte d’abord et ouvre un aperçu. Il refuse les validations si le monde, les emplacements ou l’empreinte de campagne ne correspondent pas.

## Utiliser Manual et le carnet ensemble

Ils peuvent être connectés au même serveur avec le même nom de joueur. Le serveur partage les checks confirmés et les objets reçus ; cocher un objectif déjà validé n’envoie pas une deuxième récompense. Les compteurs partiels et notes du carnet restent locaux au navigateur.

Le carnet attend une confirmation avant de marquer un objectif terminé. Ne valide que les actions réellement réalisées. Une validation envoyée au serveur est définitive pour cette partie.

## Fin de run et limites de logique

Le carnet exige les objectifs et autorisations configurés avant d’envoyer la victoire. Avec **Manual Client**, il faut respecter manuellement la liste de victoire avant de cocher son emplacement : la logique Manual calcule l’accès par les permis, elle ne constate pas les actions réelles.

L’éditeur vérifie les noms uniques, les références, les compteurs, la présence d’au moins un objectif libre et le nombre d’autorisations à placer. Il ne simule pas le gameplay Dofus : vérifie que les classes, sorts, accès et autres contraintes rendent les actions possibles. Les types d’autorisations ne créent pas de prérequis cachés.

Une campagne sans autorisation est possible : tous ses objectifs sont libres et les emplacements contiennent des souvenirs sans effet. Il faut au moins autant d’objectifs que d’autorisations. Aucun nombre fixe d’objectifs n’est imposé par le concept ; cet éditeur accepte 1 à 500 objectifs et jusqu’à 200 autorisations.

Les règles actuelles gèrent des autorisations uniques et des prérequis « toutes ces autorisations ». Les permissions progressives à plusieurs copies, les alternatives « A ou B » et les prérequis sur des objectifs déjà cochés ne sont pas proposés dans cette version.

## Sources et vérifications

Le dépôt GitHub fournit les sources dans `web/`, les instructions de
construction dans `docs/developpement.md` et les tests automatisés. Les fichiers
HTML de cette archive sont déjà construits : il suffit de les ouvrir localement.

Voir VALIDATION.txt pour les contrôles réellement effectués. Ce compagnon est
non officiel, sans affiliation à Ankama ni modification du jeu Dofus.
