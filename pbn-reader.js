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

// Parse all games in a complete PBN document or one deal-only file.
function parsePbnFile(pbnText) {
  const text = pbnText.trim();
  if (!text) {
    throw new Error("Filen är tom.");
  }

  const tagPattern = /^\s*\[([A-Za-z][A-Za-z0-9_]*)\s+"((?:\\.|[^"])*)"\]\s*$/gm;
  const games = [];
  let game = {};
  let containsTags = false;
  let match;

  while ((match = tagPattern.exec(text)) !== null) {
    containsTags = true;
    const tagName = match[1].toLowerCase();
    const tagValue = match[2];

    if (tagName === "event") {
      game.event = unescapeTagValue(tagValue);
    } else if (tagName === "site") {
      game.site = unescapeTagValue(tagValue);
    } else if (tagName === "date") {
      game.date = unescapeTagValue(tagValue);
    } else if (tagName === "board") {
      game.board = unescapeTagValue(tagValue);
    } else if (tagName === "dealer") {
      game.dealer = unescapeTagValue(tagValue);
    } else if (tagName === "vulnerable") {
      game.vulnerable = unescapeTagValue(tagValue);
    } else if (tagName === "deal") {
      game.deal = tagValue;
      games.push({
        event: game.event || "",
        site: game.site || "",
        date: game.date || "",
        board: game.board || "",
        dealer: game.dealer || "",
        vulnerable: game.vulnerable || "",
        deal: game.deal
      });
      game = {};
    }
  }

  if (games.length > 0) {
    return games;
  }

  if (containsTags || text.startsWith("[")) {
    throw new Error("Filen innehåller ingen Deal-tagg.");
  }

  return [{ event: "", site: "", date: "", board: "", dealer: "", vulnerable: "", deal: text }];
}

function unescapeTagValue(value) {
  return value.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
}

// Kept for callers that only need the first Deal value.
function findDealValue(pbnText) {
  return parsePbnFile(pbnText)[0].deal;
}
