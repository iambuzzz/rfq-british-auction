const ONE_MINUTE = 60 * 1000;

const TRIGGER_LABELS = {
  BID_RECEIVED: 'Bid received in last X minutes',
  ANY_RANK_CHANGE: 'Any supplier rank change in last X minutes',
  L1_RANK_CHANGE: 'Lowest bidder (L1) change in last X minutes',
};

// status is calculated from time, so we don't need a cron job to close auctions
const getAuctionStatus = (rfq, now = new Date()) => {
  const start = new Date(rfq.bidStartTime);
  const currentClose = new Date(rfq.currentCloseTime);
  const forcedClose = new Date(rfq.forcedCloseTime);

  if (now < start) return 'Upcoming';
  if (now < currentClose) return 'Active';

  // if the auction kept extending till the forced close time, it was force closed
  if (currentClose.getTime() >= forcedClose.getTime()) return 'Force Closed';
  return 'Closed';
};

// takes all bids of an rfq and returns one bid per supplier (their latest one),
// sorted from lowest price to highest. index 0 is L1, index 1 is L2 and so on.
const buildRanking = (bids) => {
  const sortedByTime = [...bids].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );

  const latestBidOfSupplier = {};
  for (const bid of sortedByTime) {
    // later bid overwrites the older one
    latestBidOfSupplier[bid.carrierName] = bid;
  }

  const ranking = Object.values(latestBidOfSupplier);
  ranking.sort((a, b) => {
    if (a.totalAmount !== b.totalAmount) return a.totalAmount - b.totalAmount;
    // same price -> who reached that price first stays ahead
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  return ranking;
};

// true if any supplier who already had a rank is now at a different position.
// a new supplier joining at the bottom does not change anyone's rank.
const hasAnyRankChanged = (oldRanking, newRanking) => {
  for (let i = 0; i < oldRanking.length; i++) {
    if (oldRanking[i].carrierName !== newRanking[i].carrierName) {
      return true;
    }
  }
  return false;
};

const hasL1Changed = (oldRanking, newRanking) => {
  if (oldRanking.length === 0) return false; // first bid, there was no L1 before
  return oldRanking[0].carrierName !== newRanking[0].carrierName;
};

// is this bid inside the trigger window (last X minutes before current close time)
const isInTriggerWindow = (rfq, bidTime) => {
  const closeTime = new Date(rfq.currentCloseTime).getTime();
  const windowStart = closeTime - rfq.triggerWindowMinutes * ONE_MINUTE;
  return bidTime.getTime() >= windowStart && bidTime.getTime() < closeTime;
};

// returns the reason string if the auction should be extended, otherwise null
const getExtensionReason = (rfq, oldRanking, newRanking, bidTime) => {
  if (!isInTriggerWindow(rfq, bidTime)) return null;

  const X = rfq.triggerWindowMinutes;

  if (rfq.extensionTrigger === 'BID_RECEIVED') {
    return `New bid received in last ${X} minutes`;
  }

  if (rfq.extensionTrigger === 'ANY_RANK_CHANGE' && hasAnyRankChanged(oldRanking, newRanking)) {
    return `Supplier ranking changed in last ${X} minutes`;
  }

  if (rfq.extensionTrigger === 'L1_RANK_CHANGE' && hasL1Changed(oldRanking, newRanking)) {
    return `${newRanking[0].carrierName} became the new L1 in last ${X} minutes`;
  }

  return null;
};

// current close time + Y minutes, but never more than forced close time
const getNewCloseTime = (rfq) => {
  const currentClose = new Date(rfq.currentCloseTime).getTime();
  const forcedClose = new Date(rfq.forcedCloseTime).getTime();

  const extended = currentClose + rfq.extensionMinutes * ONE_MINUTE;
  return new Date(Math.min(extended, forcedClose));
};

module.exports = {
  TRIGGER_LABELS,
  getAuctionStatus,
  buildRanking,
  hasAnyRankChanged,
  hasL1Changed,
  isInTriggerWindow,
  getExtensionReason,
  getNewCloseTime,
};
