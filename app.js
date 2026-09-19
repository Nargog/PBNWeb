// Den riktiga given från bridgeskalis_deal.pbn.
const exampleDealValue =
  "E:J63.KT92.JT4.AQ2 A72.64.5.T986543 K94.J873.K98632. QT85.AQ5.AQ7.KJ7";

const result = document.querySelector("#validation-result");
const newCollectionButton = document.querySelector("#new-collection-button");
const openButton = document.querySelector("#open-pbn-button");
const fileInput = document.querySelector("#pbn-file-input");
const filename = document.querySelector("#selected-filename");
const addDealButton = document.querySelector("#add-deal-button");
const boardNavigation = document.querySelector("#board-navigation");
const boardSelect = document.querySelector("#board-select");
const dealCount = document.querySelector("#deal-count");
const boardLabel = document.querySelector("#current-board-label");
const boardNumber = document.querySelector("#board-number");
const manualEntry = document.querySelector("#manual-entry");
const manualEntryStatus = document.querySelector("#manual-entry-status");
const handInputs = document.querySelectorAll("[data-entry-seat]");
const fillLastHandButton = document.querySelector("#fill-last-hand-button");

let games = [];
let isNewCollection = false;
let fillableSeat = null;

const suits = [
  { key: "spades", name: "Spader", symbol: "♠" },
  { key: "hearts", name: "Hjärter", symbol: "♥", red: true },
  { key: "diamonds", name: "Ruter", symbol: "♦", red: true },
  { key: "clubs", name: "Klöver", symbol: "♣" }
];
const players = [
  { key: "north", name: "Nord" },
  { key: "east", name: "Öst" },
  { key: "south", name: "Syd" },
  { key: "west", name: "Väst" }
];
const validRanks = "AKQJT98765432";

function showDeal(dealValue) {
  clearHands();

  try {
    const deal = parseDealValue(dealValue);
    displayHands(deal);

    const validation = validateDeal(deal);
    showStatus(
      validation.valid
        ? `✓ Given är korrekt – ${validation.uniqueCards} unika kort`
        : validation.errors.join("; "),
      validation.valid
    );
  } catch (error) {
    showStatus(error.message, false);
  }
}

function loadGames(newGames) {
  games = newGames;
  boardSelect.replaceChildren();

  for (let index = 0; index < games.length; index += 1) {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = games[index].board
      ? `Giv ${games[index].board}`
      : `Post ${index + 1} – Board saknas`;
    boardSelect.append(option);
  }

  boardNavigation.hidden = games.length <= 1 && !isNewCollection;
  dealCount.textContent = games.length === 1
    ? "1 giv inläst"
    : `${games.length} givar inlästa`;
  showGame(0);
}

function showGame(index) {
  const game = games[index];
  boardSelect.value = String(index);
  boardLabel.textContent = game.board
    ? `Giv ${game.board}`
    : `Post ${index + 1} – Board saknas`;
  boardNumber.textContent = game.board || "–";

  if (game.unfinished) {
    clearHands();
    displayHands(game.hands);
    manualEntry.hidden = false;
    syncHandInputs(game.hands);
    updateManualEntry();
  } else {
    manualEntry.hidden = true;
    showDeal(game.deal);
  }
}

function createEmptyHands() {
  const emptyHand = () => ({ spades: "", hearts: "", diamonds: "", clubs: "" });
  return {
    north: emptyHand(),
    east: emptyHand(),
    south: emptyHand(),
    west: emptyHand()
  };
}

function displayHands(deal) {
  for (const [seat, cards] of Object.entries(deal)) {
    const hand = document.querySelector(`[data-seat="${seat}"]`);
    displayHand(hand, cards);
  }
}

function displayHand(hand, cards) {
  for (const suit of suits) {
    const row = document.createElement("div");
    row.className = suit.red ? "suit-row red" : "suit-row";

    const symbol = document.createElement("span");
    symbol.className = "suit-symbol";
    symbol.textContent = suit.symbol;
    symbol.setAttribute("aria-hidden", "true");

    const suitName = document.createElement("span");
    suitName.className = "sr-only";
    suitName.textContent = `${suit.name}: `;

    const ranks = document.createElement("span");
    ranks.className = "ranks";
    ranks.textContent = cards?.[suit.key] || "–";

    row.append(symbol, suitName, ranks);
    hand.append(row);
  }
}

function syncHandInputs(hands) {
  for (const input of handInputs) {
    input.value = hands[input.dataset.entrySeat][input.dataset.entrySuit].replaceAll(" ", "");
  }
}

function updateManualEntry() {
  const game = games[Number(boardSelect.value) || 0];
  if (!game?.unfinished) {
    return;
  }

  const errors = new Set();
  const handCounts = { north: 0, east: 0, south: 0, west: 0 };
  const usedCards = new Map();
  const usedRanksBySuit = {
    spades: new Set(),
    hearts: new Set(),
    diamonds: new Set(),
    clubs: new Set()
  };

  for (const input of handInputs) {
    const seatKey = input.dataset.entrySeat;
    const suitKey = input.dataset.entrySuit;
    const player = players.find(item => item.key === seatKey);
    const suit = suits.find(item => item.key === suitKey);
    const enteredRanks = input.value.toUpperCase().replace(/\s/g, "");
    input.value = enteredRanks;
    input.classList.remove("input-error");
    game.hands[seatKey][suitKey] = [...enteredRanks].join(" ");

    const validEnteredRanks = [...enteredRanks].filter(rank => validRanks.includes(rank));
    handCounts[seatKey] += validEnteredRanks.length;
    const ranksInField = new Set();

    for (const rank of enteredRanks) {
      if (!validRanks.includes(rank)) {
        errors.add(`Ogiltig valör ${rank} i ${player.name}s ${suit.name.toLowerCase()}.`);
        input.classList.add("input-error");
        continue;
      }

      if (ranksInField.has(rank)) {
        errors.add(`${suit.symbol}${rank} förekommer flera gånger hos ${player.name}.`);
        input.classList.add("input-error");
        continue;
      }
      ranksInField.add(rank);
      usedRanksBySuit[suitKey].add(rank);

      const card = suit.symbol + rank;
      if (usedCards.has(card)) {
        const owner = usedCards.get(card);
        errors.add(`${card} finns redan hos ${owner.name}.`);
        input.classList.add("input-error");
      } else {
        usedCards.set(card, player);
      }
    }
  }

  for (const player of players) {
    document.querySelector(`[data-hand-count="${player.key}"]`).textContent =
      `${handCounts[player.key]}/13`;

    if (handCounts[player.key] > 13) {
      errors.add(`${player.name} innehåller ${handCounts[player.key]} kort.`);
      for (const input of handInputs) {
        if (input.dataset.entrySeat === player.key) {
          input.classList.add("input-error");
        }
      }
    }
  }

  for (const suit of suits) {
    displayRemainingRanks(suit.key, usedRanksBySuit[suit.key]);
  }

  clearHands();
  displayHands(game.hands);

  const errorMessages = [...errors];
  manualEntryStatus.textContent = errorMessages.join(" ");
  manualEntryStatus.classList.toggle("entry-error", errorMessages.length > 0);

  const handSizes = players.map(player => handCounts[player.key]);
  const dealIsComplete = errorMessages.length === 0
    && handSizes.every(count => count === 13)
    && usedCards.size === 52;

  if (dealIsComplete) {
    const validation = validateDeal(game.hands);
    showStatus(
      validation.valid
        ? `✓ Given är korrekt – ${validation.uniqueCards} unika kort`
        : validation.errors.join("; "),
      validation.valid
    );
  } else {
    showCollectionStatus("Ny givsamling – 1 giv");
  }

  const emptyHands = players.filter(player => handCounts[player.key] === 0);
  const fullHands = players.filter(player => handCounts[player.key] === 13);
  fillableSeat = errorMessages.length === 0
    && fullHands.length === 3
    && emptyHands.length === 1
    && usedCards.size === 39
    ? emptyHands[0].key
    : null;
  fillLastHandButton.disabled = fillableSeat === null;
}

function displayRemainingRanks(suitKey, enteredCards) {
  const remainingRanks = document.querySelector(`[data-remaining-suit="${suitKey}"]`);
  remainingRanks.replaceChildren();

  for (const rank of validRanks) {
    const cell = document.createElement("span");
    cell.className = "remaining-rank";
    cell.textContent = rank;

    if (enteredCards.has(rank)) {
      cell.classList.add("used-card");
      cell.setAttribute("aria-hidden", "true");
    }

    remainingRanks.append(cell);
  }
}

function clearHands() {
  for (const hand of document.querySelectorAll(".suits")) {
    hand.replaceChildren();
  }
}

function showStatus(message, isValid) {
  result.textContent = message;
  result.classList.remove("validation-success", "validation-error");
  result.classList.add(isValid ? "validation-success" : "validation-error");
}

function showCollectionStatus(message) {
  result.textContent = message;
  result.classList.remove("validation-success", "validation-error");
}

function decodePbnFile(buffer) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch (utf8Error) {
    const text = new TextDecoder("windows-1252", { fatal: true }).decode(buffer);
    if (text.includes("\uFFFD")) {
      throw new Error("Filen kunde inte läsas som UTF-8 eller Windows-1252.");
    }
    return text;
  }
}

openButton.addEventListener("click", () => {
  fileInput.value = "";
  fileInput.click();
});

newCollectionButton.addEventListener("click", () => {
  isNewCollection = true;
  games = [];
  clearHands();
  boardSelect.replaceChildren();
  boardNavigation.hidden = true;
  filename.textContent = "";
  filename.hidden = true;
  fileInput.value = "";
  boardLabel.textContent = "Ingen giv";
  boardNumber.textContent = "–";
  dealCount.textContent = "0 givar inlästa";
  addDealButton.hidden = false;
  addDealButton.disabled = false;
  manualEntry.hidden = true;
  manualEntryStatus.textContent = "";
  fillableSeat = null;
  fillLastHandButton.disabled = true;
  showCollectionStatus("Ny givsamling – 0 givar");
});

addDealButton.addEventListener("click", () => {
  if (!isNewCollection || games.length > 0) {
    return;
  }

  loadGames([{
    board: "1",
    dealer: "N",
    vulnerable: "None",
    hands: createEmptyHands(),
    unfinished: true
  }]);
  addDealButton.disabled = true;
});

boardSelect.addEventListener("change", () => {
  showGame(Number(boardSelect.value));
});

for (const input of handInputs) {
  input.addEventListener("input", updateManualEntry);
}

fillLastHandButton.addEventListener("click", () => {
  const game = games[Number(boardSelect.value) || 0];
  if (!game?.unfinished || fillableSeat === null) {
    return;
  }

  for (const suit of suits) {
    const assignedRanks = new Set();
    for (const player of players) {
      if (player.key === fillableSeat) {
        continue;
      }
      for (const rank of game.hands[player.key][suit.key].split(/\s+/).filter(Boolean)) {
        assignedRanks.add(rank);
      }
    }
    game.hands[fillableSeat][suit.key] = [...validRanks]
      .filter(rank => !assignedRanks.has(rank))
      .join(" ");
  }

  syncHandInputs(game.hands);
  updateManualEntry();
});

fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  if (!file) {
    return;
  }

  filename.textContent = file.name;
  filename.hidden = false;
  isNewCollection = false;
  addDealButton.hidden = true;
  addDealButton.disabled = false;
  manualEntry.hidden = true;
  fillableSeat = null;

  try {
    const buffer = await file.arrayBuffer();
    const fileText = decodePbnFile(buffer);
    loadGames(parsePbnFile(fileText));
  } catch (error) {
    clearHands();
    games = [];
    boardSelect.replaceChildren();
    boardNavigation.hidden = true;
    dealCount.textContent = "0 givar inlästa";
    showStatus(error.message, false);
  }
});

loadGames([{ board: "1", dealer: "E", vulnerable: "None", deal: exampleDealValue }]);
