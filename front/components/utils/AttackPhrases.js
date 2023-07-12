// attackPhrases.js

export const attackPhrases = [
  "{player} landed a powerful blow on {enemy}, dealing {damage} damage.",
  "{player} struck {enemy} with great force, causing {damage} damage.",
  "{player} made a precise attack on {enemy}, inflicting {damage} damage.",
  "{player} unleashed a mighty hit on {enemy}, dealing {damage} damage.",
  "{player} ruthlessly assaulted {enemy}, inflicting {damage} damage.",
  "{player} launched a swift attack on {enemy}, dealing {damage} damage.",
  "{player} delivered a strong blow to {enemy}, causing {damage} damage.",
  "{player} inflicted a critical hit on {enemy}, dealing {damage} damage.",
  "{player} blasted {enemy}, inflicting {damage} damage.",
  "{player} smashed {enemy}, dealing {damage} damage.",
  "{player} tore into {enemy}, inflicting {damage} damage.",
  "{player} launched a devastating assault on {enemy}, dealing {damage} damage.",
  "{player} landed a devastating blow on {enemy}, causing {damage} damage.",
  "{player} blitzed {enemy}, dealing {damage} damage.",
  "{player} brutally battered {enemy}, inflicting {damage} damage.",
  "{player} violently struck {enemy}, causing {damage} damage.",
  "{player} thrashed {enemy}, dealing {damage} damage.",
  "{player} laid into {enemy}, causing {damage} damage.",
  "{player} dealt a heavy blow to {enemy}, inflicting {damage} damage.",
  "{player} ripped into {enemy}, causing {damage} damage.",
  "{player} unleashed a fierce attack on {enemy}, dealing {damage} damage.",
  "{player} flailed at {enemy}, causing {damage} damage.",
  "{player} brutally assaulted {enemy}, inflicting {damage} damage.",
  "{player} struck a crushing blow on {enemy}, dealing {damage} damage.",
  "{player} pummeled {enemy}, causing {damage} damage.",
  "{player} hammered {enemy}, inflicting {damage} damage.",
  "{player} mauled {enemy}, causing {damage} damage.",
  "{player} thrusted at {enemy}, inflicting {damage} damage.",
  "{player} lashed out at {enemy}, causing {damage} damage.",
  "{player} made a vicious attack on {enemy}, inflicting {damage} damage.",
  "{player} wreaked havoc on {enemy}, inflicting {damage} damage.",
  "{player} smote {enemy}, causing {damage} damage.",
  "{player} strafed {enemy}, causing {damage} damage.",
  "{player} struck down {enemy}, inflicting {damage} damage.",
  "{player} battered {enemy}, causing {damage} damage.",
  "{player} bashed {enemy}, inflicting {damage} damage.",
  "{player} bludgeoned {enemy}, inflicting {damage} damage.",
  "{player} slugged {enemy}, causing {damage} damage.",
  "{player} walloped {enemy}, inflicting {damage} damage.",
  "{player} clobbered {enemy}, inflicting {damage} damage.",
  "{player} hurtled towards {enemy}, causing {damage} damage.",
  "{player} launched at {enemy}, dealing {damage} damage.",
  "{player} let loose a powerful attack on {enemy}, inflicting {damage} damage.",
  "{player} made a lightning strike at {enemy}, inflicting {damage} damage.",
  "{player} struck with all might at {enemy}, causing {damage} damage.",
  "{player} made a merciless assault on {enemy}, dealing {damage} damage.",
  "{player} made a brutal hit on {enemy}, inflicting {damage} damage.",
  "{player} pounded relentlessly at {enemy}, causing {damage} damage.",
  "{player} thundered a blow at {enemy}, causing {damage} damage.",
  "{player} unleashed fury on {enemy}, inflicting {damage} damage.",
  "{player} landed a savage strike on {enemy}, inflicting {damage} damage.",
];

export const getRandomAttackPhrase = (player, enemy, damage) => {
  const phraseTemplate =
    attackPhrases[Math.floor(Math.random() * attackPhrases.length)];
  return phraseTemplate
    .replace("{player}", player)
    .replace("{enemy}", enemy)
    .replace("{damage}", damage);
};
