# Dépannage

| Situation | Vérifications |
| --- | --- |
| Le fichier HTML affiche du code sur GitHub | Télécharge et extrais la release, puis ouvre le fichier localement. |
| Serveur inaccessible | Laisse le serveur ouvert ; vérifie l'hôte, le port et l'autorisation réseau local du navigateur. |
| `InvalidSlot` | Utilise le nom exact du YAML, avec les mêmes majuscules, et la bonne génération. |
| `InvalidGame` | Vérifie que le joueur appartient au monde chargé. Utilise le carnet du même export. |
| La campagne ne correspond pas | Recharge son JSON ou ouvre le carnet exporté avec l'APWorld utilisé pour cette génération. |
| Une case reste en « Envoi… » | Attends la confirmation, puis reconnecte si nécessaire. Le serveur conserve les checks confirmés. |
| Un objet n'ouvre rien | Un souvenir n'est pas un permis. Un objectif peut aussi contenir un objet destiné à un autre joueur. |
| Compteurs perdus | Ils sont locaux au navigateur et au fichier ; le serveur conserve uniquement les checks, objets et victoire. |
| Brouillon d'éditeur absent | Réimporte le JSON sauvegardé ; le stockage local dépend du navigateur et du contexte du fichier. |
| Pas de bouton Manual Client | Conserve ou installe l'APWorld Manual officiel pour disposer de son client. |
| Ancienne partie du premier prototype | Choisis « Ancienne partie d'exemple » et le nom du slot de sa génération. |

Changer le nom dans le formulaire ne renomme pas le joueur sur le serveur.
Pour un nouveau nom, configure le YAML avant de générer la prochaine partie.

Dans **Échanges**, `/received` liste les objets ; `/sync` demande une reprise ;
`!hint Nom du permis` demande un indice selon les règles et points du serveur.

Si tu ouvres une issue, indique la version du kit, d'Archipelago et du navigateur,
les étapes pour reproduire et le message d'erreur. Utilise un profil d'exemple
et retire les adresses privées, mots de passe et informations des autres joueurs.
