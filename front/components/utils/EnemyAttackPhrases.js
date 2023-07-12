// enemyAttackPhrases.js

export const enemyAttackPhrases = [
  "{enemy} retaliated and landed a powerful blow on {player}, dealing {damage} damage.",
  "{enemy} struck back at {player} with great force, causing {damage} damage.",
  "{enemy} counter-attacked {player} precisely, inflicting {damage} damage.",
  "{enemy} unleashed a mighty hit on {player}, dealing {damage} damage.",
  "{enemy} ruthlessly fought back against {player}, inflicting {damage} damage.",
  "{enemy} launched a swift counter on {player}, dealing {damage} damage.",
  "{enemy} delivered a strong retaliation to {player}, causing {damage} damage.",
  "{enemy} landed a critical hit on {player}, dealing {damage} damage.",
  "{enemy} blasted {player} in retaliation, inflicting {damage} damage.",
  "{enemy} smashed back at {player}, dealing {damage} damage.",
  "{enemy} tore into {player} in a counterattack, inflicting {damage} damage.",
  "{enemy} launched a devastating assault on {player}, dealing {damage} damage.",
  "{enemy} landed a devastating blow on {player}, causing {damage} damage.",
  "{enemy} retaliated in a blitz against {player}, dealing {damage} damage.",
  "{enemy} brutally battered {player} in return, inflicting {damage} damage.",
  "{enemy} violently struck back at {player}, causing {damage} damage.",
  "{enemy} thrashed {player} in retaliation, dealing {damage} damage.",
  "{enemy} laid into {player}, causing {damage} damage.",
  "{enemy} dealt a heavy blow to {player} in return, inflicting {damage} damage.",
  "{enemy} ripped into {player} in retaliation, causing {damage} damage.",
];

export const getRandomEnemyAttackPhrase = (enemy, player, damage) => {
  const phraseTemplate =
    enemyAttackPhrases[Math.floor(Math.random() * enemyAttackPhrases.length)];
  return phraseTemplate
    .replace("{enemy}", enemy)
    .replace("{player}", player)
    .replace("{damage}", damage);
};
