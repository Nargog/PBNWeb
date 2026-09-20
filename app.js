// Den riktiga given från bridgeskalis_deal.pbn.
const exampleDealValue =
  "E:J63.KT92.JT4.AQ2 A72.64.5.T986543 K94.J873.K98632. QT85.AQ5.AQ7.KJ7";

const result = document.querySelector("#validation-result");
const newCollectionButton = document.querySelector("#new-collection-button");
const openButton = document.querySelector("#open-pbn-button");
const pasteDealButton = document.querySelector("#paste-deal-button");
const exportButton = document.querySelector("#export-pbn-button");
const fileInput = document.querySelector("#pbn-file-input");
const filename = document.querySelector("#selected-filename");
const collectionInfo = document.querySelector("#collection-info");
const collectionEventInput = document.querySelector("#collection-event");
const collectionSiteInput = document.querySelector("#collection-site");
const collectionDateInput = document.querySelector("#collection-date");
const addDealButton = document.querySelector("#add-deal-button");
const deleteDealButton = document.querySelector("#delete-deal-button");
const pasteDealPanel = document.querySelector("#paste-deal-panel");
const pasteDealValue = document.querySelector("#paste-deal-value");
const usePastedDealButton = document.querySelector("#use-pasted-deal-button");
const pasteDealChoice = document.querySelector("#paste-deal-choice");
const replaceCurrentDealButton = document.querySelector("#replace-current-deal-button");
const addPastedAsNewButton = document.querySelector("#add-pasted-as-new-button");
const deleteDealPanel = document.querySelector("#delete-deal-panel");
const deleteAndRenumberButton = document.querySelector("#delete-and-renumber-button");
const leaveEmptyButton = document.querySelector("#leave-empty-button");
const cancelDeleteButton = document.querySelector("#cancel-delete-button");
const boardNavigation = document.querySelector("#board-navigation");
const boardSelect = document.querySelector("#board-select");
const dealCount = document.querySelector("#deal-count");
const boardLabel = document.querySelector("#current-board-label");
const boardNumber = document.querySelector("#board-number");
const metadataBoard = document.querySelector("#metadata-board");
const metadataDealer = document.querySelector("#metadata-dealer");
const metadataVulnerability = document.querySelector("#metadata-vulnerability");
const manualEntry = document.querySelector("#manual-entry");
const manualEntryStatus = document.querySelector("#manual-entry-status");
const handInputs = document.querySelectorAll("[data-entry-seat]");
const fillLastHandButton = document.querySelector("#fill-last-hand-button");

let games = [];
let isNewCollection = false;
let fillableSeat = null;
let collectionMetadata = { event: "", site: "", date: "" };
let pendingPastedHands = null;

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

function normalizeSuitRanks(value) {
  const characters = [...value.toUpperCase().replace(/\s/g, "")];
  const sortedRanks = characters
    .filter(character => validRanks.includes(character))
    .sort((first, second) => validRanks.indexOf(first) - validRanks.indexOf(second));
  const invalidCharacters = characters.filter(character => !validRanks.includes(character));
  return [...sortedRanks, ...invalidCharacters].join("");
}

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

function loadGames(newGames, selectedIndex = 0) {
  games = newGames;
  boardSelect.replaceChildren();

  for (let index = 0; index < games.length; index += 1) {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = getBoardOptionText(games[index], index);
    boardSelect.append(option);
  }

  boardNavigation.hidden = false;
  dealCount.textContent = games.length === 1
    ? "1 giv inläst"
    : `${games.length} givar inlästa`;
  deleteDealButton.disabled = games.length === 0;
  if (games.length > 0) {
    showGame(Math.min(selectedIndex, games.length - 1));
  } else {
    showNoGame();
  }
  updateExportButton();
}

function showNoGame() {
  clearHands();
  boardLabel.textContent = "Ingen giv";
  boardNumber.textContent = "–";
  metadataBoard.textContent = "–";
  metadataDealer.textContent = "–";
  metadataVulnerability.textContent = "–";
  manualEntry.hidden = true;
  fillableSeat = null;
  fillLastHandButton.disabled = true;
}

function getBoardOptionText(game, index) {
  const label = game.board
    ? `Giv ${game.board}`
    : `Post ${index + 1} – Board saknas`;
  if (game.unfinished && !gameHasAnyCards(game)) {
    return `${label} – tom`;
  }
  return game.validationState?.valid ? `${label}  ✓` : label;
}

function refreshBoardOption(index) {
  const option = boardSelect.options[index];
  if (option) {
    option.textContent = getBoardOptionText(games[index], index);
  }
}

function showGame(index) {
  const game = games[index];
  boardSelect.value = String(index);
  boardLabel.textContent = game.board
    ? `Giv ${game.board}`
    : `Post ${index + 1} – Board saknas`;
  boardNumber.textContent = game.board || "–";
  metadataBoard.textContent = game.board || "–";
  metadataDealer.textContent = formatDealer(game.dealer);
  metadataVulnerability.textContent = formatVulnerability(game.vulnerable);

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

function formatDealer(dealer) {
  return { N: "Nord", E: "Öst", S: "Syd", W: "Väst" }[dealer] || dealer || "–";
}

function formatVulnerability(vulnerability) {
  return {
    None: "Ingen",
    NS: "NS",
    EW: "ÖV",
    All: "Alla",
    "-": "–"
  }[vulnerability] || vulnerability || "–";
}

function getBoardMetadata(boardNumberValue) {
  const dealerCycle = ["N", "E", "S", "W"];
  const vulnerabilityCycle = [
    "None", "NS", "EW", "All",
    "NS", "EW", "All", "None",
    "EW", "All", "None", "NS",
    "All", "None", "NS", "EW"
  ];
  const cycleIndex = (boardNumberValue - 1) % 16;
  return {
    dealer: dealerCycle[(boardNumberValue - 1) % 4],
    vulnerable: vulnerabilityCycle[cycleIndex]
  };
}

function getNextBoardNumber() {
  const existingBoardNumbers = games
    .map(game => Number(game.board))
    .filter(board => Number.isInteger(board) && board > 0);
  return existingBoardNumbers.length > 0
    ? Math.max(...existingBoardNumbers) + 1
    : 1;
}

function sortGamesNumerically(gamesToSort) {
  return [...gamesToSort].sort((first, second) => {
    const firstBoard = Number(first.board);
    const secondBoard = Number(second.board);
    const firstIsNumber = Number.isInteger(firstBoard) && firstBoard > 0;
    const secondIsNumber = Number.isInteger(secondBoard) && secondBoard > 0;

    if (firstIsNumber && secondIsNumber) {
      return firstBoard - secondBoard;
    }
    if (firstIsNumber) {
      return -1;
    }
    if (secondIsNumber) {
      return 1;
    }
    return 0;
  });
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

function normalizeHands(hands) {
  const normalizedHands = {};

  for (const player of players) {
    const hand = hands[player.key];
    if (hand === null) {
      normalizedHands[player.key] = null;
      continue;
    }
    normalizedHands[player.key] = {};
    for (const suit of suits) {
      normalizedHands[player.key][suit.key] = [...normalizeSuitRanks(hand[suit.key])].join(" ");
    }
  }

  return normalizedHands;
}

function gameHasAnyCards(game) {
  if (!game) {
    return false;
  }

  try {
    const hands = game.hands || parseDealValue(game.deal);
    return players.some(player => {
      const hand = hands[player.key];
      return hand !== null && suits.some(suit => hand[suit.key].replace(/\s/g, "") !== "");
    });
  } catch (error) {
    return true;
  }
}

function createGameFromPastedHands(hands) {
  const nextBoardNumber = getNextBoardNumber();
  const metadata = getBoardMetadata(nextBoardNumber);
  return {
    board: String(nextBoardNumber),
    dealer: metadata.dealer,
    vulnerable: metadata.vulnerable,
    hands,
    unfinished: true,
    validationState: { complete: true, valid: true, errors: [] }
  };
}

function replaceCurrentGameHands(hands) {
  const selectedIndex = Number(boardSelect.value) || 0;
  const updatedGame = {
    ...games[selectedIndex],
    hands,
    unfinished: true,
    validationState: { complete: true, valid: true, errors: [] }
  };
  games[selectedIndex] = updatedGame;
  const sortedGames = sortGamesNumerically(games);
  finishPasting();
  loadGames(sortedGames, sortedGames.indexOf(updatedGame));
}

function addPastedHandsAsNewGame(hands) {
  const newGame = createGameFromPastedHands(hands);
  const sortedGames = sortGamesNumerically([...games, newGame]);
  finishPasting();
  loadGames(sortedGames, sortedGames.indexOf(newGame));
}

function finishPasting() {
  pendingPastedHands = null;
  pasteDealValue.value = "";
  pasteDealChoice.hidden = true;
  pasteDealPanel.hidden = true;
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

function updateManualEntry(inputToNormalize = null) {
  const selectedIndex = Number(boardSelect.value) || 0;
  const game = games[selectedIndex];
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
    const enteredRanks = input === inputToNormalize
      ? normalizeSuitRanks(input.value)
      : input.value.toUpperCase().replace(/\s/g, "");
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
  const allHandsHave13Cards = handSizes.every(count => count === 13);
  const dealIsComplete = errorMessages.length === 0
    && allHandsHave13Cards
    && usedCards.size === 52;

  if (dealIsComplete) {
    const validation = validateDeal(game.hands);
    game.validationState = {
      complete: true,
      valid: validation.valid,
      errors: validation.errors
    };
    showStatus(
      validation.valid
        ? `✓ Given är korrekt – ${validation.uniqueCards} unika kort`
        : validation.errors.join("; "),
      validation.valid
    );
  } else {
    game.validationState = {
      complete: allHandsHave13Cards,
      valid: false,
      errors: errorMessages
    };
    showCollectionStatus(getCollectionStatus());
  }
  refreshBoardOption(selectedIndex);
  updateExportButton();

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

function getCollectionStatus() {
  if (!isNewCollection) {
    return games.length === 1 ? "1 giv inläst" : `${games.length} givar inlästa`;
  }
  return games.length === 1
    ? "Ny givsamling – 1 giv"
    : `Ny givsamling – ${games.length} givar`;
}

function showCollectionMetadata(metadata) {
  collectionMetadata = metadata;
  collectionEventInput.value = metadata.event;
  collectionSiteInput.value = metadata.site;
  collectionDateInput.value = metadata.date;
  collectionInfo.hidden = false;
}

function pbnDateToHtml(date) {
  return /^\d{4}\.\d{2}\.\d{2}$/.test(date) ? date.replaceAll(".", "-") : "";
}

function updateExportButton() {
  const hasValidManualDeal = games.some(game => game.validationState?.valid);
  exportButton.disabled = games.length === 0
    || (isNewCollection && !hasValidManualDeal);
}

function formatBoardNames(boardNames) {
  if (boardNames.length === 1) {
    return boardNames[0];
  }
  return `${boardNames.slice(0, -1).join(", ")} och ${boardNames.at(-1)}`;
}

function prepareGamesForExport() {
  const exportGames = [];
  const problemGames = [];

  for (let index = 0; index < games.length; index += 1) {
    const game = games[index];

    try {
      const hands = game.hands || parseDealValue(game.deal);
      const validation = validateDeal(hands);
      if (!validation.valid) {
        problemGames.push(game.board ? `Giv ${game.board}` : `Post ${index + 1}`);
        continue;
      }

      exportGames.push(game);
    } catch (error) {
      problemGames.push(game.board ? `Giv ${game.board}` : `Post ${index + 1}`);
    }
  }

  return { exportGames, problemGames };
}

function downloadPbnFile(pbnText) {
  const pbnBytes = encodePbnTextAsIso88591(pbnText);
  const file = new Blob([pbnBytes], { type: "text/plain;charset=iso-8859-1" });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = "givsamling.pbn";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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

pasteDealButton.addEventListener("click", () => {
  deleteDealPanel.hidden = true;
  pasteDealPanel.hidden = !pasteDealPanel.hidden;
  pendingPastedHands = null;
  pasteDealChoice.hidden = true;
  if (!pasteDealPanel.hidden) {
    pasteDealValue.focus();
  }
});

usePastedDealButton.addEventListener("click", () => {
  try {
    const hands = normalizeHands(parseDealValue(pasteDealValue.value));
    const validation = validateDeal(hands);
    if (!validation.valid) {
      showStatus(validation.errors.join("; "), false);
      return;
    }

    const currentGame = games[Number(boardSelect.value) || 0];
    if (!currentGame) {
      addPastedHandsAsNewGame(hands);
    } else if (!gameHasAnyCards(currentGame)) {
      replaceCurrentGameHands(hands);
    } else {
      pendingPastedHands = hands;
      pasteDealChoice.hidden = false;
    }
  } catch (error) {
    showStatus(error.message, false);
  }
});

replaceCurrentDealButton.addEventListener("click", () => {
  if (pendingPastedHands) {
    replaceCurrentGameHands(pendingPastedHands);
  }
});

addPastedAsNewButton.addEventListener("click", () => {
  if (pendingPastedHands) {
    addPastedHandsAsNewGame(pendingPastedHands);
  }
});

exportButton.addEventListener("click", () => {
  const { exportGames, problemGames } = prepareGamesForExport();
  if (problemGames.length > 0) {
    showStatus(
      `Kan inte exportera. ${formatBoardNames(problemGames)} måste kompletteras eller rättas.`,
      false
    );
    return;
  }

  try {
    downloadPbnFile(createPbnText(exportGames, collectionMetadata));
  } catch (error) {
    showStatus(error.message, false);
  }
});

newCollectionButton.addEventListener("click", () => {
  isNewCollection = true;
  games = [];
  clearHands();
  boardSelect.replaceChildren();
  boardNavigation.hidden = false;
  filename.textContent = "";
  filename.hidden = true;
  fileInput.value = "";
  boardLabel.textContent = "Ingen giv";
  boardNumber.textContent = "–";
  metadataBoard.textContent = "–";
  metadataDealer.textContent = "–";
  metadataVulnerability.textContent = "–";
  dealCount.textContent = "0 givar inlästa";
  deleteDealButton.disabled = true;
  manualEntry.hidden = true;
  manualEntryStatus.textContent = "";
  fillableSeat = null;
  fillLastHandButton.disabled = true;
  pasteDealPanel.hidden = true;
  pasteDealValue.value = "";
  pasteDealChoice.hidden = true;
  deleteDealPanel.hidden = true;
  pendingPastedHands = null;
  showCollectionMetadata({ event: "", site: "", date: "" });
  updateExportButton();
  showCollectionStatus("Ny givsamling – 0 givar");
});

addDealButton.addEventListener("click", () => {
  const nextBoardNumber = getNextBoardNumber();
  const metadata = getBoardMetadata(nextBoardNumber);
  const newGame = {
    board: String(nextBoardNumber),
    dealer: metadata.dealer,
    vulnerable: metadata.vulnerable,
    hands: createEmptyHands(),
    unfinished: true,
    validationState: { complete: false, valid: false, errors: [] }
  };

  const sortedGames = sortGamesNumerically([...games, newGame]);
  deleteDealPanel.hidden = true;
  loadGames(sortedGames, sortedGames.indexOf(newGame));
});

deleteDealButton.addEventListener("click", () => {
  if (games.length === 0) {
    return;
  }
  finishPasting();
  deleteDealPanel.hidden = false;
});

deleteAndRenumberButton.addEventListener("click", () => {
  const selectedGame = games[Number(boardSelect.value) || 0];
  if (!selectedGame) {
    return;
  }

  const sortedGames = sortGamesNumerically(games);
  const selectedIndex = sortedGames.indexOf(selectedGame);
  const deletedBoardNumber = Number(selectedGame.board);
  const remainingGames = sortedGames.filter(game => game !== selectedGame);

  if (Number.isInteger(deletedBoardNumber) && deletedBoardNumber > 0) {
    for (const game of remainingGames) {
      const board = Number(game.board);
      if (Number.isInteger(board) && board > deletedBoardNumber) {
        const newBoard = board - 1;
        const metadata = getBoardMetadata(newBoard);
        game.board = String(newBoard);
        game.dealer = metadata.dealer;
        game.vulnerable = metadata.vulnerable;
      }
    }
  }

  deleteDealPanel.hidden = true;
  const updatedGames = sortGamesNumerically(remainingGames);
  loadGames(updatedGames, Math.max(0, selectedIndex - 1));
  if (updatedGames.length === 0) {
    showCollectionStatus(isNewCollection ? "Ny givsamling – 0 givar" : "0 givar inlästa");
  }
});

leaveEmptyButton.addEventListener("click", () => {
  const selectedIndex = Number(boardSelect.value) || 0;
  const game = games[selectedIndex];
  if (!game) {
    return;
  }

  const board = Number(game.board);
  const metadata = Number.isInteger(board) && board > 0
    ? getBoardMetadata(board)
    : { dealer: game.dealer, vulnerable: game.vulnerable };
  const emptyGame = {
    ...game,
    dealer: metadata.dealer,
    vulnerable: metadata.vulnerable,
    hands: createEmptyHands(),
    unfinished: true,
    validationState: { complete: false, valid: false, errors: [] }
  };
  games[selectedIndex] = emptyGame;

  deleteDealPanel.hidden = true;
  const sortedGames = sortGamesNumerically(games);
  loadGames(sortedGames, sortedGames.indexOf(emptyGame));
});

cancelDeleteButton.addEventListener("click", () => {
  deleteDealPanel.hidden = true;
});

boardSelect.addEventListener("change", () => {
  deleteDealPanel.hidden = true;
  showGame(Number(boardSelect.value));
});

for (const input of handInputs) {
  input.addEventListener("input", () => updateManualEntry());
  input.addEventListener("blur", () => updateManualEntry(input));
}

collectionEventInput.addEventListener("input", () => {
  collectionMetadata.event = collectionEventInput.value;
});

collectionSiteInput.addEventListener("input", () => {
  collectionMetadata.site = collectionSiteInput.value;
});

collectionDateInput.addEventListener("input", () => {
  collectionMetadata.date = collectionDateInput.value;
});

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
  manualEntry.hidden = true;
  pasteDealPanel.hidden = true;
  pasteDealValue.value = "";
  pasteDealChoice.hidden = true;
  deleteDealPanel.hidden = true;
  pendingPastedHands = null;
  fillableSeat = null;
  updateExportButton();

  try {
    const buffer = await file.arrayBuffer();
    const fileText = decodePbnFile(buffer);
    const loadedGames = parsePbnFile(fileText);
    const firstGame = loadedGames[0];
    showCollectionMetadata({
      event: firstGame.event || "",
      site: firstGame.site || "",
      date: pbnDateToHtml(firstGame.date || "")
    });
    loadGames(loadedGames);
  } catch (error) {
    clearHands();
    games = [];
    boardSelect.replaceChildren();
    boardNavigation.hidden = true;
    dealCount.textContent = "0 givar inlästa";
    updateExportButton();
    showStatus(error.message, false);
  }
});

loadGames([{ board: "1", dealer: "E", vulnerable: "None", deal: exampleDealValue }]);
