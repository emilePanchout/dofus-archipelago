(function (root) {
  'use strict';
  const objectives = [
    {name:'01 - Atteindre le niveau 10', title:'Atteindre le niveau 10', category:'Progression', icon:'star', description:'Fais progresser ton personnage jusqu’au niveau 10.', requires:[]},
    {name:'02 - Gagner 3 combats', title:'Remporter 3 combats', category:'Combat', icon:'swords', description:'Remporte trois combats pendant cette aventure.', requires:[], counter:'combats', target:3},
    {name:'03 - Recolter 20 ressources', title:'Récolter 20 ressources', category:'Récolte', icon:'leaf', description:'Récolte toi-même vingt unités de ressources. Les achats ne comptent pas.', requires:[], counter:'ressources', target:20},
    {name:'04 - Visiter 5 cartes differentes a pied', title:'Visiter 5 cartes différentes', category:'Exploration', icon:'compass', description:'Explore cinq cartes différentes à pied et note leurs coordonnées.', requires:[], counter:'cartes', target:5},
    {name:'05 - Fabriquer un premier objet', title:'Fabriquer ton premier objet', category:'Artisanat', icon:'hammer', description:'Utilise un atelier pour fabriquer toi-même un objet.', requires:['Permis artisanat'], counter:'recettes', target:1},
    {name:'06 - Fabriquer 3 objets de recettes differentes', title:'Fabriquer 3 recettes différentes', category:'Artisanat', icon:'hammer', description:'Fabrique trois recettes différentes, en comptant ton premier objet.', requires:['Permis artisanat'], counter:'recettes', target:3},
    {name:'07 - Terminer une quete d Astrub', title:'Terminer une quête d’Astrub', category:'Quêtes', icon:'scroll', description:'Termine une quête d’Astrub après avoir reçu le contrat.', requires:['Contrat Astrub'], counter:'quetes', target:1},
    {name:'08 - Terminer 3 quetes d Astrub', title:'Terminer 3 quêtes d’Astrub', category:'Quêtes', icon:'scroll', description:'Termine trois quêtes d’Astrub, en comptant la première.', requires:['Contrat Astrub'], counter:'quetes', target:3},
    {name:'09 - Gagner un combat avec le deuxieme element', title:'Essayer ton deuxième élément', category:'Éléments', icon:'crystal', description:'Gagne un combat en infligeant tes dégâts uniquement avec ton élément secondaire.', requires:['Deuxieme element'], counter:'element', target:1},
    {name:'10 - Gagner 5 combats avec le deuxieme element', title:'Maîtriser ton deuxième élément', category:'Éléments', icon:'crystal', description:'Gagne cinq combats avec ton élément secondaire, en comptant le premier.', requires:['Deuxieme element'], counter:'element', target:5},
    {name:'11 - Battre Kardorim', title:'Vaincre Kardorim', category:'Donjon', icon:'shield', description:'Triomphe de Kardorim dans sa crypte. Une aide en groupe est autorisée.', requires:['Permis Kardorim']},
    {name:'12 - Gagner un combat avec un equipement niveau 21 a 40', title:'Mettre ton équipement à l’épreuve', category:'Équipement', icon:'helmet', description:'Gagne un combat en portant au moins un équipement de niveau 21 à 40.', requires:['Equipement niveau 40']}
  ];
  const permits = [
    {name:'Deuxieme element', title:'Deuxième élément', icon:'crystal', description:'Autorise l’élément secondaire que tu as choisi au départ.'},
    {name:'Permis artisanat', title:'Artisanat', icon:'hammer', description:'Autorise la fabrication d’objets dans les ateliers.'},
    {name:'Contrat Astrub', title:'Quêtes d’Astrub', icon:'scroll', description:'Autorise les quêtes d’Astrub de cette aventure.'},
    {name:'Permis Kardorim', title:'Crypte de Kardorim', icon:'shield', description:'Autorise le donjon de Kardorim. Son accès normal reste nécessaire.'},
    {name:'Equipement niveau 40', title:'Équipement', icon:'helmet', description:'Relève le plafond d’équipement du niveau 20 au niveau 40.'}
  ];
  const content = {game:'Manual_Dofus_Communaute', version:'0.2.1', title:'Aventure Dofus', player:'JoueurDofus', compatibilityGame:'Manual_DofusExemple_Emile', objectives, permits};
  root.CarnetContent=content;
  if(typeof module==='object' && module.exports) module.exports=content;
})(typeof window==='undefined'?globalThis:window);
