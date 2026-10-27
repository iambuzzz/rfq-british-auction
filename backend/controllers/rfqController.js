const Rfq = require('../models/Rfq');
const Bid = require('../models/Bid');
const ActivityLog = require('../models/ActivityLog');
const { getAuctionStatus, buildRanking } = require('../utils/auctionHelper');

// POST /api/rfqs
const createRfq = async (req, res, next) => {
  try {
    const {
      name,
      pickupDate,
      bidStartTime,
      bidCloseTime,
      forcedCloseTime,
      triggerWindowMinutes,
      extensionMinutes,
      extensionTrigger,
    } = req.body;

    // simple reference id like RFQ-1001, RFQ-1002 ...
    const count = await Rfq.countDocuments();
    const referenceId = `RFQ-${1001 + count}`;

    const rfq = await Rfq.create({
      referenceId,
      name: name.trim(),
      pickupDate,
      bidStartTime,
      bidCloseTime,
      currentCloseTime: bidCloseTime, // at start, current close = original close
      forcedCloseTime,
      triggerWindowMinutes: Number(triggerWindowMinutes),
      extensionMinutes: Number(extensionMinutes),
      extensionTrigger,
    });

    await ActivityLog.create({
      rfq: rfq._id,
      type: 'RFQ_CREATED',
      message: `${referenceId} created by buyer`,
    });

    // tell the listing page that a new rfq is there
    req.app.get('io').emit('rfq-list-updated');

    res.status(201).json({ ...rfq.toObject(), status: getAuctionStatus(rfq) });
  } catch (error) {
    next(error);
  }
};

// GET /api/rfqs
const getAllRfqs = async (req, res, next) => {
  try {
    const rfqs = await Rfq.find().sort({ createdAt: -1 });

    const result = rfqs.map((rfq) => ({
      ...rfq.toObject(),
      status: getAuctionStatus(rfq),
    }));

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// GET /api/rfqs/:id
const getRfqById = async (req, res, next) => {
  try {
    const rfq = await Rfq.findById(req.params.id);
    if (!rfq) {
      return res.status(404).json({ message: 'RFQ not found' });
    }

    const [bids, logs] = await Promise.all([
      Bid.find({ rfq: rfq._id }).sort({ totalAmount: 1, createdAt: 1 }),
      ActivityLog.find({ rfq: rfq._id }).sort({ createdAt: -1, _id: -1 }),
    ]);

    // one row per supplier with L1, L2, L3...
    const ranking = buildRanking(bids).map((bid, index) => ({
      ...bid.toObject(),
      rank: `L${index + 1}`,
    }));

    res.json({
      rfq: { ...rfq.toObject(), status: getAuctionStatus(rfq) },
      ranking,
      bids, // full bid history sorted by price
      logs,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createRfq, getAllRfqs, getRfqById };
