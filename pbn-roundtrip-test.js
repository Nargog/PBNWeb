(function runRoundTripTests() {
  const report = typeof print === "function"
    ? print
    : message => console.log(message);
  const rankOrder = "AKQJT98765432";
  const suitNames = ["spades", "hearts", "diamonds", "clubs"];
  const playerNames = ["north", "east", "south", "west"];
  const playerCodes = ["N", "E", "S", "W"];

  const testBoards = [
    {
      board: "1",
      dealer: "N",
      vulnerable: "None",
      hands: {
        north: { spades: "3", hearts: "A T", diamonds: "K T 9 8 7", clubs: "A Q J 8 3" },
        east: { spades: "J T 9 4 2", hearts: "6 5 4 3", diamonds: "A J 5", clubs: "2" },
        south: { spades: "K 5", hearts: "K 9 8 7 2", diamonds: "6 3", clubs: "T 9 7 6" },
        west: { spades: "A Q 8 7 6", hearts: "Q J", diamonds: "Q 4 2", clubs: "K 5 4" }
      }
    },
    {
      board: "2",
      dealer: "E",
      vulnerable: "NS",
      hands: {
        north: { spades: "T 7 6 5 4 2", hearts: "Q 5", diamonds: "Q 8 3", clubs: "K 2" },
        east: { spades: "J 9 8 3", hearts: "A T 3", diamonds: "", clubs: "A Q J 9 7 4" },
        south: { spades: "A Q", hearts: "K 9 8 7 2", diamonds: "J T 9 7 6 4", clubs: "" },
        west: { spades: "K", hearts: "J 6 4", diamonds: "A K 5 2", clubs: "T 8 6 5 3" }
      }
    }
  ];

  function normalizedRanks(ranks) {
    return [...ranks.replace(/\s/g, "")]
      .sort((first, second) => rankOrder.indexOf(first) - rankOrder.indexOf(second))
      .join("");
  }

  function handAsPbn(hand) {
    return suitNames.map(suit => normalizedRanks(hand[suit])).join(".");
  }

  function assertEqual(actual, expected, property) {
    if (actual !== expected) {
      throw new Error(`${property} differs: expected "${expected}", got "${actual}"`);
    }
  }

  function compareHands(original, reimported) {
    for (const player of playerNames) {
      for (const suit of suitNames) {
        assertEqual(
          normalizedRanks(reimported[player][suit]),
          normalizedRanks(original[player][suit]),
          `${player}.${suit}`
        );
      }
    }
  }

  function verifyDealOrder(board, exportedDeal) {
    const [prefix, firstHand] = exportedDeal.split(/:(.*)/s);
    assertEqual(prefix, board.dealer, "Deal prefix");

    const exportedHands = firstHand.trim().split(/\s+/);
    const dealerIndex = playerCodes.indexOf(board.dealer);
    const expectedPlayers = playerNames.map(
      (_, offset) => playerNames[(dealerIndex + offset) % playerNames.length]
    );

    assertEqual(exportedHands.length, 4, "number of hands in Deal");
    for (let index = 0; index < expectedPlayers.length; index += 1) {
      const player = expectedPlayers[index];
      assertEqual(exportedHands[index], handAsPbn(board.hands[player]), `Deal hand ${index + 1} (${player})`);
    }
  }

  function testBoard(board) {
    const pbnText = createPbnText([board]);
    const importedGames = parsePbnFile(pbnText);
    assertEqual(importedGames.length, 1, "number of imported games");

    const importedGame = importedGames[0];
    const importedHands = parseDealValue(importedGame.deal);
    const validation = validateDeal(importedHands);

    assertEqual(importedGame.board, board.board, "Board");
    assertEqual(importedGame.dealer, board.dealer, "Dealer");
    assertEqual(importedGame.vulnerable, board.vulnerable, "Vulnerable");
    compareHands(board.hands, importedHands);

    assertEqual(Object.keys(importedHands).length, 4, "number of parsed hands");
    for (const player of playerNames) {
      const cardCount = suitNames.reduce((total, suit) => {
        const ranks = importedHands[player][suit].trim();
        return total + (ranks ? ranks.split(/\s+/).length : 0);
      }, 0);
      assertEqual(cardCount, 13, `${player} card count`);
    }
    assertEqual(validation.uniqueCards, 52, "unique card count");
    assertEqual(validation.valid, true, `validation: ${validation.errors.join("; ")}`);
    verifyDealOrder(board, importedGame.deal);
  }

  let passed = 0;
  for (const board of testBoards) {
    try {
      testBoard(board);
      passed += 1;
      report(`Board ${board.board}: PASS`);
    } catch (error) {
      report(`Board ${board.board}: FAIL – ${error.message}`);
    }
  }

  report(`Round-trip: ${passed}/${testBoards.length} ${passed === testBoards.length ? "PASS" : "FAIL"}`);
  if (passed !== testBoards.length) {
    throw new Error("PBN round-trip test failed");
  }
}());

(function runIso88591EncodingTest() {
  const report = typeof print === "function"
    ? print
    : message => console.log(message);
  const supportedText = "Nybörjartävling Åsa ÄÖåäö\r\n";
  const encoded = encodePbnTextAsIso88591(supportedText);
  const decoded = [...encoded].map(byte => String.fromCharCode(byte)).join("");
  const expectedSwedishBytes = [0xC5, 0xC4, 0xD6, 0xE5, 0xE4, 0xF6];
  const actualSwedishBytes = [...encodePbnTextAsIso88591("ÅÄÖåäö")];

  if (decoded !== supportedText) {
    throw new Error("ISO-8859-1 test failed: supported text changed during encoding");
  }
  if (actualSwedishBytes.some((byte, index) => byte !== expectedSwedishBytes[index])) {
    throw new Error("ISO-8859-1 test failed: Swedish characters have incorrect bytes");
  }

  let unsupportedCharacterRejected = false;
  try {
    encodePbnTextAsIso88591("Nybörjartävling Åsa – ÄÖåäö");
  } catch (error) {
    unsupportedCharacterRejected = error.message ===
      "Kan inte exportera PBN: tecknet '–' stöds inte av ISO-8859-1.";
  }

  if (!unsupportedCharacterRejected) {
    throw new Error("ISO-8859-1 test failed: en dash was not rejected correctly");
  }

  report("ISO-8859-1 encoding: PASS");
}());
