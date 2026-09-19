// Den riktiga given från bridgeskalis_deal.pbn.
const exampleDealValue =
  "E:J63.KT92.JT4.AQ2 A72.64.5.T986543 K94.J873.K98632. QT85.AQ5.AQ7.KJ7";
const result = document.querySelector("#validation-result");

const suits = [
  { key: "spades", name: "Spader", symbol: "♠" },
  { key: "hearts", name: "Hjärter", symbol: "♥", red: true },
  { key: "diamonds", name: "Ruter", symbol: "♦", red: true },
  { key: "clubs", name: "Klöver", symbol: "♣" }
];

try {
  const exampleDeal = parseDealValue(exampleDealValue);

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
      ranks.textContent = cards?.[suit.key] || "–";

      row.append(symbol, suitName, ranks);
      hand.append(row);
    }
  }

  const validation = validateDeal(exampleDeal);
  result.textContent = validation.valid
    ? `✓ Given är korrekt – ${validation.uniqueCards} unika kort`
    : validation.errors.join("; ");
  result.classList.add(validation.valid ? "validation-success" : "validation-error");
} catch (error) {
  result.textContent = error.message;
  result.classList.add("validation-error");
}
