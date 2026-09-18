// Given från bridgeskalis_deal.pbn (E: öst, syd, väst, nord).
// Korten skrivs med T för tio. En tom sträng betyder renons.
const exampleDeal = {
  north: {
    spades: "Q T 8 5",
    hearts: "A Q 5",
    diamonds: "A Q 7",
    clubs: "K J 7"
  },
  east: {
    spades: "J 6 3",
    hearts: "K T 9 2",
    diamonds: "J T 4",
    clubs: "A Q 2"
  },
  south: {
    spades: "A 7 2",
    hearts: "6 4",
    diamonds: "5",
    clubs: "T 9 8 6 5 4 3"
  },
  west: {
    spades: "K 9 4",
    hearts: "J 8 7 3",
    diamonds: "K 9 8 6 3 2",
    clubs: ""
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
    ranks.textContent = cards[suit.key] || "–";

    row.append(symbol, suitName, ranks);
    hand.append(row);
  }
}

const validation = validateDeal(exampleDeal);
const result = document.querySelector("#validation-result");
result.textContent = validation.valid
  ? `✓ Given är korrekt – ${validation.uniqueCards} unika kort`
  : validation.errors.join("; ");
