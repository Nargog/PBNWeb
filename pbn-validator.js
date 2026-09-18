// A deal has four hands. Each suit is a string of space-separated ranks,
// for example: { spades: "A K Q", hearts: "T 9", diamonds: "", clubs: "J" }.
function validateDeal(deal) {
  const players = ["north", "east", "south", "west"];
  const suits = ["spades", "hearts", "diamonds", "clubs"];
  const validRanks = new Set("AKQJT98765432");
  const errors = [];
  const seenCards = new Set();

  if (deal === null || typeof deal !== "object" || Array.isArray(deal)) {
    return { valid: false, errors: ["The deal must contain exactly four hands"], uniqueCards: 0 };
  }

  const handNames = Object.keys(deal);
  if (handNames.length !== 4 || handNames.some(name => !players.includes(name))) {
    errors.push("The deal must contain exactly four hands: North, East, South, West");
  }

  for (const player of players) {
    const hand = deal[player];
    const playerName = player[0].toUpperCase() + player.slice(1);

    if (hand === null || typeof hand !== "object" || Array.isArray(hand)) {
      errors.push(`${playerName} must contain exactly four suits`);
      continue;
    }

    const suitNames = Object.keys(hand);
    if (suitNames.length !== 4 || suitNames.some(name => !suits.includes(name))) {
      errors.push(`${playerName} must contain exactly four suits: spades, hearts, diamonds, clubs`);
    }

    let cardCount = 0;
    for (const suit of suits) {
      if (typeof hand[suit] !== "string") {
        errors.push(`${playerName} ${suit} must be a string of ranks`);
        continue;
      }

      const ranks = hand[suit].trim() ? hand[suit].trim().split(/\s+/) : [];
      cardCount += ranks.length;

      for (const rank of ranks) {
        if (!validRanks.has(rank)) {
          errors.push(`Invalid rank ${rank} in ${playerName} ${suit}`);
          continue;
        }

        const card = suit[0].toUpperCase() + rank;
        if (seenCards.has(card)) {
          errors.push(`Card ${card} occurs more than once`);
        } else {
          seenCards.add(card);
        }
      }
    }

    if (cardCount !== 13) {
      errors.push(`${playerName} contains ${cardCount} cards`);
    }
  }

  if (seenCards.size !== 52) {
    errors.push(`A complete deal must contain 52 unique cards (found ${seenCards.size})`);
  }

  return { valid: errors.length === 0, errors, uniqueCards: seenCards.size };
}
