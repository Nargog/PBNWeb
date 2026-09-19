// Den riktiga given från bridgeskalis_deal.pbn.
const exampleDealValue =
  "E:J63.KT92.JT4.AQ2 A72.64.5.T986543 K94.J873.K98632. QT85.AQ5.AQ7.KJ7";

const result = document.querySelector("#validation-result");
const openButton = document.querySelector("#open-pbn-button");
const fileInput = document.querySelector("#pbn-file-input");
const filename = document.querySelector("#selected-filename");
const boardNavigation = document.querySelector("#board-navigation");
const boardSelect = document.querySelector("#board-select");
const dealCount = document.querySelector("#deal-count");
const boardLabel = document.querySelector("#current-board-label");
const boardNumber = document.querySelector("#board-number");

let games = [];

const suits = [
  { key: "spades", name: "Spader", symbol: "♠" },
  { key: "hearts", name: "Hjärter", symbol: "♥", red: true },
  { key: "diamonds", name: "Ruter", symbol: "♦", red: true },
  { key: "clubs", name: "Klöver", symbol: "♣" }
];

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

  boardNavigation.hidden = games.length <= 1;
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
  showDeal(game.deal);
}

function displayHands(deal) {
  for (const [seat, cards] of Object.entries(deal)) {
    const hand = document.querySelector(`[data-seat="${seat}"]`);

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

boardSelect.addEventListener("change", () => {
  showGame(Number(boardSelect.value));
});

fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  if (!file) {
    return;
  }

  filename.textContent = file.name;
  filename.hidden = false;

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
