const Rfq = require('../models/Rfq');
const Bid = require('../models/Bid');
const ActivityLog = require('../models/ActivityLog');
const {
  getAuctionStatus,
  buildRanking,
  getExtensionReason,
  getNewCloseTime,
} = require('../utils/auctionHelper');

// POST /api/rfqs/:id/bids
const placeBid = async (req, res, next) => {
  try {
    const bidTime = new Date();

    const rfq = await Rfq.findById(req.params.id);
    if (!rfq) {
      return res.status(404).json({ message: 'RFQ not found' });
    }

    // 1. auction must be running
    const status = getAuctionStatus(rfq, bidTime);
    if (status === 'Upcoming') {
      return res.status(400).json({ message: 'Auction has not started yet' });
    }
    if (status !== 'Active') {
      return res.status(400).json({ message: 'Auction is closed, bids are not accepted anymore' });
    }

    const carrierName = req.body.carrierName.trim();
    const freightCharges = Number(req.body.freightCharges);
    const originCharges = Number(req.body.originCharges);
    const destinationCharges = Number(req.body.destinationCharges);
    const totalAmount = freightCharges + originCharges + destinationCharges;

    // 2. ranking before this bid (needed to check rank change later)
    const oldBids = await Bid.find({ rfq: rfq._id });
    const oldRanking = buildRanking(oldBids);

    // 3. in british auction a supplier can only lower their own price
    const myPreviousBid = oldRanking.find((b) => b.carrierName === carrierName);
    if (myPreviousBid && totalAmount >= myPreviousBid.totalAmount) {
      return res.status(400).json({
        message: `Your new bid must be lower than your previous bid of ${myPreviousBid.totalAmount}`,
      });
    }

    // 4. save the bid
    const bid = await Bid.create({
      rfq: rfq._id,
      carrierName,
      freightCharges,
      originCharges,
      destinationCharges,
      totalAmount,
      transitTimeDays: Number(req.body.transitTimeDays),
      quoteValidity: req.body.quoteValidity,
    });

    const newRanking = buildRanking([...oldBids, bid]);
    const myRank = newRanking.findIndex((b) => b._id.equals(bid._id)) + 1;

    // $min only updates lowestBid if this bid is lower, so it is safe even if 2 bids come together
    await Rfq.updateOne(
      { _id: rfq._id },
      { $min: { lowestBid: totalAmount }, $inc: { totalBids: 1 } }
    );

    await ActivityLog.create({
      rfq: rfq._id,
      type: 'BID_PLACED',
      message: `${carrierName} placed a bid of ${totalAmount} (rank L${myRank})`,
    });

    // 5. check if this bid should extend the auction
    let extension = null;
    const reason = getExtensionReason(rfq, oldRanking, newRanking, bidTime);

    if (reason && rfq.currentCloseTime < rfq.forcedCloseTime) {
      const oldCloseTime = rfq.currentCloseTime;
      const newCloseTime = getNewCloseTime(rfq);

      // only update if close time is still the same one we read above.
      // if another bid already extended it at the same moment, this will not match
      // and we skip, so the auction is not extended twice for the same close time.
      const updated = await Rfq.findOneAndUpdate(
        { _id: rfq._id, currentCloseTime: oldCloseTime },
        { $set: { currentCloseTime: newCloseTime }, $inc: { extensionCount: 1 } },
        { returnDocument: 'after' }
      );

      if (updated) {
        const hitForcedClose = newCloseTime.getTime() === rfq.forcedCloseTime.getTime();
        const finalReason = hitForcedClose ? `${reason} (capped at forced close time)` : reason;
        const addedMinutes = Math.round((newCloseTime - oldCloseTime) / 60000);

        await ActivityLog.create({
          rfq: rfq._id,
          type: 'TIME_EXTENDED',
          message: `Auction extended by ${addedMinutes} min`,
          oldCloseTime,
          newCloseTime,
          reason: finalReason,
        });

        extension = { oldCloseTime, newCloseTime, reason: finalReason };
      }
    }

    // 6. let everyone watching this auction know
    const io = req.app.get('io');
    io.to(rfq._id.toString()).emit('auction-updated', {
      rfqId: rfq._id,
      carrierName,
      extension,
    });
    io.emit('rfq-list-updated');

    res.status(201).json({
      message: 'Bid placed successfully',
      bid,
      rank: `L${myRank}`,
      extension,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { placeBid };
