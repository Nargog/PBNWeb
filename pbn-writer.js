// Create a basic PBN document from complete bridge deals.
function createPbnText(games, collectionMetadata = {}) {
  const firstGame = games[0] || {};
  const event = collectionMetadata.event ?? firstGame.event ?? "PBNWeb";
  const site = collectionMetadata.site ?? firstGame.site ?? "";
  const date = formatPbnDate(collectionMetadata.date ?? firstGame.date ?? "");
  const blocks = games.map(game => {
    const dealValue = createGameDealValue(game);
    const tags = [
      `[Event "${escapePbnTagValue(event)}"]`,
      `[Site "${escapePbnTagValue(site)}"]`,
      `[Date "${escapePbnTagValue(date)}"]`
    ];

    if (game.board) {
      tags.push(`[Board "${escapePbnTagValue(game.board)}"]`);
    }

    tags.push(
      `[Dealer "${escapePbnTagValue(game.dealer)}"]`,
      `[Vulnerable "${escapePbnTagValue(game.vulnerable)}"]`,
      `[Deal "${dealValue}"]`
    );
    return tags.join("\r\n");
  });

  return blocks.join("\r\n\r\n") + "\r\n";
}

function formatPbnDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date.replaceAll("-", ".") : date;
}

function encodePbnTextAsIso88591(pbnText) {
  const bytes = [];

  for (const character of pbnText) {
    const characterCode = character.codePointAt(0);
    if (characterCode > 0xFF) {
      throw new Error(
        `Kan inte exportera PBN: tecknet '${character}' stöds inte av ISO-8859-1.`
      );
    }
    bytes.push(characterCode);
  }

  return new Uint8Array(bytes);
}

// Imported games store a Deal string. Manually created games store parsed hands.
function createGameDealValue(game) {
  if (game.hands) {
    return createDealValue(game.dealPrefix || game.dealer, game.hands);
  }

  if (typeof game.deal === "string") {
    const dealValue = game.deal.trim();
    const prefix = dealValue.slice(0, dealValue.indexOf(":")).toUpperCase();
    return createDealValue(prefix, parseDealValue(dealValue));
  }

  throw new Error("Given saknar kortdata");
}

function createDealValue(dealer, hands) {
  const playerCodes = ["N", "E", "S", "W"];
  const playerNames = ["north", "east", "south", "west"];
  const suitNames = ["spades", "hearts", "diamonds", "clubs"];
  const rankOrder = "AKQJT98765432";
  const dealerCode = dealer.toUpperCase();
  const dealerIndex = playerCodes.indexOf(dealerCode);

  if (dealerIndex === -1) {
    throw new Error(`Ogiltig givare: ${dealer}`);
  }

  const pbnHands = [];
  for (let offset = 0; offset < playerNames.length; offset += 1) {
    const player = playerNames[(dealerIndex + offset) % playerNames.length];
    if (hands[player] === null) {
      pbnHands.push("-");
      continue;
    }
    const suits = suitNames.map(suit => sortPbnRanks(hands[player][suit], rankOrder));
    pbnHands.push(suits.join("."));
  }

  return `${dealerCode}:${pbnHands.join(" ")}`;
}

function sortPbnRanks(ranks, rankOrder) {
  return [...ranks.replace(/\s/g, "")]
    .sort((first, second) => rankOrder.indexOf(first) - rankOrder.indexOf(second))
    .join("");
}

function escapePbnTagValue(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
