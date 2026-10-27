// run with: npm test
const test = require('node:test');
const assert = require('node:assert');

const {
  getAuctionStatus,
  buildRanking,
  hasAnyRankChanged,
  hasL1Changed,
  getExtensionReason,
  getNewCloseTime,
} = require('../utils/auctionHelper');

// helper to make times like 17:55 on the same day
const at = (hh, mm) => new Date(2026, 0, 1, hh, mm, 0);

const makeRfq = (trigger) => ({
  bidStartTime: at(17, 0),
  bidCloseTime: at(18, 0),
  currentCloseTime: at(18, 0),
  forcedCloseTime: at(18, 20),
  triggerWindowMinutes: 10, // X
  extensionMinutes: 5, // Y
  extensionTrigger: trigger,
});

const bid = (carrierName, totalAmount, mm) => ({
  _id: carrierName + mm,
  carrierName,
  totalAmount,
  createdAt: at(17, mm),
});

test('status changes with time', () => {
  const rfq = makeRfq('BID_RECEIVED');
  assert.strictEqual(getAuctionStatus(rfq, at(16, 59)), 'Upcoming');
  assert.strictEqual(getAuctionStatus(rfq, at(17, 30)), 'Active');
  assert.strictEqual(getAuctionStatus(rfq, at(18, 1)), 'Closed');

  rfq.currentCloseTime = rfq.forcedCloseTime; // extended till the end
  assert.strictEqual(getAuctionStatus(rfq, at(18, 21)), 'Force Closed');
});

test('ranking keeps only latest bid of each supplier', () => {
  const ranking = buildRanking([
    bid('A', 1000, 1),
    bid('B', 900, 2),
    bid('A', 800, 3), // A lowered price
  ]);
  assert.deepStrictEqual(ranking.map((b) => b.carrierName), ['A', 'B']);
  assert.strictEqual(ranking[0].totalAmount, 800);
});

test('same price -> earlier bid gets better rank', () => {
  const ranking = buildRanking([bid('A', 500, 5), bid('B', 500, 2)]);
  assert.strictEqual(ranking[0].carrierName, 'B');
});

test('rank change detection', () => {
  const oldRanking = buildRanking([bid('A', 100, 1), bid('B', 200, 2)]);

  // C joins at the bottom -> nobody moved
  const joinedLast = buildRanking([bid('A', 100, 1), bid('B', 200, 2), bid('C', 300, 3)]);
  assert.strictEqual(hasAnyRankChanged(oldRanking, joinedLast), false);
  assert.strictEqual(hasL1Changed(oldRanking, joinedLast), false);

  // B goes below A -> both ranks and L1 changed
  const bTookL1 = buildRanking([bid('A', 100, 1), bid('B', 200, 2), bid('B', 90, 3)]);
  assert.strictEqual(hasAnyRankChanged(oldRanking, bTookL1), true);
  assert.strictEqual(hasL1Changed(oldRanking, bTookL1), true);

  // C comes in between A and B -> B moved to L3, but L1 is same
  const cInMiddle = buildRanking([bid('A', 100, 1), bid('B', 200, 2), bid('C', 150, 3)]);
  assert.strictEqual(hasAnyRankChanged(oldRanking, cInMiddle), true);
  assert.strictEqual(hasL1Changed(oldRanking, cInMiddle), false);
});

test('BID_RECEIVED extends only inside trigger window', () => {
  const rfq = makeRfq('BID_RECEIVED');
  assert.strictEqual(getExtensionReason(rfq, [], [bid('A', 100, 0)], at(17, 45)), null);
  assert.ok(getExtensionReason(rfq, [], [bid('A', 100, 0)], at(17, 55)));
});

test('L1_RANK_CHANGE does not extend if L1 stays same', () => {
  const rfq = makeRfq('L1_RANK_CHANGE');
  const oldRanking = buildRanking([bid('A', 100, 1), bid('B', 200, 2)]);
  const newRanking = buildRanking([bid('A', 100, 1), bid('B', 150, 2)]);
  assert.strictEqual(getExtensionReason(rfq, oldRanking, newRanking, at(17, 58)), null);
});

test('extension adds Y minutes but never crosses forced close', () => {
  const rfq = makeRfq('BID_RECEIVED');
  assert.deepStrictEqual(getNewCloseTime(rfq), at(18, 5));

  rfq.currentCloseTime = at(18, 18);
  assert.deepStrictEqual(getNewCloseTime(rfq), at(18, 20)); // capped
});
