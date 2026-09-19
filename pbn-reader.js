// Parse one PBN Deal value into hands at their compass positions.
// This file only handles syntax and position. Card rules are validated elsewhere.
function parseDealValue(dealValue) {
  if (typeof dealValue !== "string") {
    throw new Error("The Deal value must be a string");
  }

  const parts = dealValue.trim().split(/\s+/);
  const firstPart = parts[0] || "";
  const colonPosition = firstPart.indexOf(":");

  if (colonPosition === -1) {
    throw new Error("The Deal value must start with N:, E:, S:, or W:");
  }

  const firstPlayer = firstPart.slice(0, colonPosition).toUpperCase();
  const playerCodes = ["N", "E", "S", "W"];
  const playerNames = ["north", "east", "south", "west"];

  if (!playerCodes.includes(firstPlayer)) {
    throw new Error(`Ogiltig startposition: ${firstPlayer}`);
  }

  const hands = [firstPart.slice(colonPosition + 1), ...parts.slice(1)];
  if (hands.length !== 4) {
    throw new Error("The Deal value must contain exactly four hands");
  }

  const deal = {};
  const firstPlayerIndex = playerCodes.indexOf(firstPlayer);

  for (let handIndex = 0; handIndex < hands.length; handIndex += 1) {
    const playerIndex = (firstPlayerIndex + handIndex) % playerNames.length;
    const player = playerNames[playerIndex];
    const hand = hands[handIndex];

    if (hand === "-") {
      deal[player] = null;
      continue;
    }

    const suitRanks = hand.split(".");
    if (suitRanks.length !== 4) {
      throw new Error(`Hand ${handIndex + 1} must contain four suits separated by '.'`);
    }

    deal[player] = {
      spades: separateRanks(suitRanks[0]),
      hearts: separateRanks(suitRanks[1]),
      diamonds: separateRanks(suitRanks[2]),
      clubs: separateRanks(suitRanks[3])
    };
  }

  return deal;
}

function separateRanks(ranks) {
  return [...ranks].join(" ");
}
