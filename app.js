// En exempelgiv. Varje spelare har 13 kort.
const exampleDeal = {
  north: {
    spades: "A K Q J",
    hearts: "3 2",
    diamonds: "9 8 7",
    clubs: "6 5 4 2"
  },
  east: {
    spades: "10 9 8",
    hearts: "A K Q J",
    diamonds: "6 5 4",
    clubs: "9 8 7"
  },
  south: {
    spades: "7 6 5",
    hearts: "10 9 8 7",
    diamonds: "A K Q",
    clubs: "A K Q"
  },
  west: {
    spades: "4 3 2",
    hearts: "6 5 4",
    diamonds: "J 10 3 2",
    clubs: "J 10 3"
  }
};

const suits = [
  { key: "spades", name: "Spader", symbol: "♠" },
  { key: "hearts", name: "Hjärter", symbol: "♥", red: true },
  { key: "diamonds", name: "Ruter", symbol: "♦", red: true },
  { key: "clubs", name: "Klöver", symbol: "♣" }
];

for (const [seat, cards] of Object.entries(exampleDeal)) {
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
    ranks.textContent = cards[suit.key];

    row.append(symbol, suitName, ranks);
    hand.append(row);
  }
}
