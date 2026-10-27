// fills the database with some demo auctions
// run with: npm run seed  (this deletes old data!)
require('dotenv').config();
const mongoose = require('mongoose');

const Rfq = require('./models/Rfq');
const Bid = require('./models/Bid');
const ActivityLog = require('./models/ActivityLog');

const minutesFromNow = (m) => new Date(Date.now() + m * 60 * 1000);
const daysFromNow = (d) => new Date(Date.now() + d * 24 * 60 * 60 * 1000);

const rfqs = [
  {
    referenceId: 'RFQ-1001',
    name: 'Mumbai to Delhi - 20ft Container',
    pickupDate: daysFromNow(3),
    bidStartTime: minutesFromNow(-50),
    bidCloseTime: minutesFromNow(8),
    forcedCloseTime: minutesFromNow(25),
    triggerWindowMinutes: 10,
    extensionMinutes: 5,
    extensionTrigger: 'BID_RECEIVED',
    bids: [
      ['BlueDart Logistics', 42000, 3000, 2500, 4, -40],
      ['Gati Transport', 40000, 2800, 2600, 5, -30],
      ['Delhivery Freight', 39500, 3000, 2000, 4, -20],
    ],
  },
  {
    referenceId: 'RFQ-1002',
    name: 'Chennai to Bangalore - FTL 32ft',
    pickupDate: daysFromNow(5),
    bidStartTime: minutesFromNow(-20),
    bidCloseTime: minutesFromNow(45),
    forcedCloseTime: minutesFromNow(75),
    triggerWindowMinutes: 10,
    extensionMinutes: 5,
    extensionTrigger: 'L1_RANK_CHANGE',
    bids: [
      ['VRL Logistics', 18000, 1200, 1000, 2, -15],
      ['TCI Freight', 17500, 1500, 1100, 2, -10],
    ],
  },
  {
    referenceId: 'RFQ-1003',
    name: 'Pune to Hyderabad - LTL',
    pickupDate: daysFromNow(7),
    bidStartTime: minutesFromNow(30),
    bidCloseTime: minutesFromNow(120),
    forcedCloseTime: minutesFromNow(150),
    triggerWindowMinutes: 15,
    extensionMinutes: 10,
    extensionTrigger: 'ANY_RANK_CHANGE',
    bids: [],
  },
  {
    referenceId: 'RFQ-1004',
    name: 'Kolkata to Guwahati - 10 Ton Truck',
    pickupDate: daysFromNow(1),
    bidStartTime: minutesFromNow(-180),
    bidCloseTime: minutesFromNow(-60),
    forcedCloseTime: minutesFromNow(-30),
    triggerWindowMinutes: 10,
    extensionMinutes: 5,
    extensionTrigger: 'BID_RECEIVED',
    bids: [
      ['Safexpress', 25000, 2000, 1500, 3, -150],
      ['Rivigo', 24000, 1800, 1500, 3, -120],
    ],
  },
];

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected, clearing old data...');

  await Promise.all([Rfq.deleteMany(), Bid.deleteMany(), ActivityLog.deleteMany()]);

  for (const item of rfqs) {
    const { bids, ...rfqData } = item;

    const createdAt = new Date(rfqData.bidStartTime.getTime() - 10 * 60 * 1000);
    const bidDocs = bids.map(([carrierName, freight, origin, destination, transit, minutesAgo]) => ({
      carrierName,
      freightCharges: freight,
      originCharges: origin,
      destinationCharges: destination,
      totalAmount: freight + origin + destination,
      transitTimeDays: transit,
      quoteValidity: daysFromNow(15),
      createdAt: minutesFromNow(minutesAgo),
      updatedAt: minutesFromNow(minutesAgo),
    }));

    const rfq = await Rfq.create({
      ...rfqData,
      currentCloseTime: rfqData.bidCloseTime,
      totalBids: bidDocs.length,
      ...(bidDocs.length > 0 && { lowestBid: Math.min(...bidDocs.map((b) => b.totalAmount)) }),
    });

    // timestamps: false so that our old createdAt values are kept
    await Bid.insertMany(
      bidDocs.map((b) => ({ ...b, rfq: rfq._id })),
      { timestamps: false }
    );

    const logs = [
      { type: 'RFQ_CREATED', message: `${rfq.referenceId} created by buyer`, createdAt },
      ...bidDocs.map((b) => ({
        type: 'BID_PLACED',
        message: `${b.carrierName} placed a bid of ${b.totalAmount}`,
        createdAt: b.createdAt,
      })),
    ];

    await ActivityLog.insertMany(
      logs.map((l) => ({ ...l, rfq: rfq._id, updatedAt: l.createdAt })),
      { timestamps: false }
    );

    console.log(`Added ${rfq.referenceId} with ${bidDocs.length} bids`);
  }

  console.log('Seeding done');
  await mongoose.disconnect();
};

seed().catch((error) => {
  console.log('Seeding failed:', error.message);
  process.exit(1);
});
