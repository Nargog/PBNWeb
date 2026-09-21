// Open pbn-import-test.html in a browser to exercise the actual application UI.
(async function () {
  const report = parent.document.querySelector('#test-results');
  const messages = [];
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const snapshot = () => JSON.stringify({ games, collectionMetadata, selected: boardSelect.value });
  const current = () => games[Number(boardSelect.value)];
  const waitFor = async predicate => {
    for (let i = 0; i < 100; i++) {
      if (predicate()) return;
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    throw new Error('Timed out waiting for file import');
  };
  const upload = async (input, text, done) => {
    const transfer = new DataTransfer();
    transfer.items.add(new File([text], 'test.pbn', { type: 'text/plain' }));
    input.files = transfer.files;
    input.dispatchEvent(new Event('change'));
    await waitFor(done);
  };
  let confirmations = [];
  let accept = false;
  window.confirm = message => { confirmations.push(message); return accept; };
  const source = `[Event "Source event"]\n[Site "Source site"]\n[Date "2020.01.02"]\n[Board "99"]\n[Dealer "W"]\n[Vulnerable "All"]\n[Deal "${exampleDealValue}"]`;
  const checkHands = () => assert(
    JSON.stringify(current().hands) === JSON.stringify(normalizeHands(parseDealValue(exampleDealValue))),
    'All four compass hands must match the source'
  );
  try {
    assert(openButton.textContent === 'Öppna givsamling', 'Collection button label');
    assert(pasteDealButton.nextElementSibling === importDealButton, 'Import button placement');
    newCollectionButton.click();
    showCollectionMetadata({ event: 'Destination', site: 'Home', date: '2026-09-21' });
    const metadata = JSON.stringify(collectionMetadata);
    await upload(dealFileInput, exampleDealValue, () => current().validationState.valid);
    assert(current().board === '1' && current().dealer === 'N' && current().vulnerable === 'None', 'Board 1 identity');
    checkHands();
    assert(confirmations.length === 0, 'Empty board should not require confirmation');
    assert(document.querySelector('[data-seat="east"] .ranks').textContent === 'J 6 3', 'Graphical table refreshed');
    assert(document.querySelector('[data-entry-seat="east"][data-entry-suit="spades"]').value === 'J63', 'Hand editor refreshed');
    assert(document.querySelectorAll('.used-card').length === 52, 'Remaining bank refreshed');
    assert(result.classList.contains('validation-success'), 'Validation refreshed');
    assert(collectionProgress.classList.contains('collection-ready'), 'Collection progress refreshed');
    messages.push('A/C: Board 1, E: hand mapping and all UI updates PASS');

    addDealButton.click();
    await upload(dealFileInput, source, () => current().validationState.valid);
    assert(current().board === '2' && current().dealer === 'E' && current().vulnerable === 'NS', 'Board 2 identity');
    assert(boardSelect.value === '1' && games.length === 2, 'Selection and collection retained');
    assert(JSON.stringify(collectionMetadata) === metadata, 'Source metadata ignored');
    checkHands();
    messages.push('B: Board 2 and destination metadata PASS');

    const before = snapshot();
    await upload(dealFileInput, exampleDealValue, () => confirmations.length === 1);
    assert(snapshot() === before, 'Cancel must preserve board');
    assert(confirmations[0] === 'Giv 2 innehåller redan kort. Vill du ersätta korten med den importerade given?', 'Confirmation wording');
    accept = true;
    const oldGame = current();
    await upload(dealFileInput, exampleDealValue, () => current() !== oldGame);
    assert(confirmations.length === 2, 'Replacement requires confirmation');
    checkHands();
    messages.push('D: Cancel and confirm replacement PASS');

    for (const [text, error] of [
      [exampleDealValue.replace('J63', 'J66'), 'occurs more than once'],
      [exampleDealValue.replace('J63', 'X63'), 'Invalid rank'],
      ['N:...', 'exactly four hands'],
      ['', 'Filen är tom'],
      [source + '\n' + source, 'flera givar']
    ]) {
      const unchanged = snapshot();
      result.textContent = '';
      await upload(dealFileInput, text, () => result.textContent.includes(error));
      assert(snapshot() === unchanged, 'Invalid input must preserve board: ' + error);
    }
    assert(confirmations.length === 2, 'Invalid files must not prompt for replacement');
    messages.push('Invalid, empty and multiple-deal files leave board unchanged PASS');

    newCollectionButton.click();
    pasteDealValue.value = exampleDealValue;
    usePastedDealButton.click();
    assert(current().board === '1' && current().dealer === 'N' && current().vulnerable === 'None', 'Paste preserves identity');
    checkHands();
    messages.push('Paste preserves destination identity PASS');

    await upload(fileInput, source + '\n' + source.replace('[Board "99"]', '[Board "100"]'), () => games[0].board === '99');
    assert(games.length === 2 && current().dealer === 'W' && current().vulnerable === 'All', 'Collection opening preserves identity');
    assert(collectionMetadata.event === 'Source event' && collectionMetadata.site === 'Source site' && collectionMetadata.date === '2020-01-02', 'Collection opening preserves metadata');
    messages.push('E: Complete collection opening PASS');

    addDealButton.click();
    await upload(dealFileInput, exampleDealValue, () => current().validationState.valid);
    const { exportGames, problemGames } = prepareGamesForExport();
    assert(problemGames.length === 0 && exportGames.length === 3, 'Mixed collection export ready');
    const exported = parsePbnFile(createPbnText(exportGames, collectionMetadata));
    exported.forEach((game, index) => {
      assert(validateDeal(parseDealValue(game.deal)).valid, 'Exported deal validates');
      for (const key of ['board', 'dealer', 'vulnerable']) assert(game[key] === games[index][key], 'Export preserves ' + key);
    });
    messages.push('F: Mixed collection export and validation PASS');
    report.textContent = messages.join('\n') + '\nALL PASS';
  } catch (error) {
    report.textContent = messages.join('\n') + '\nFAIL: ' + error.stack;
  }
}());
