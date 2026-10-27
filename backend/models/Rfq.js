const mongoose = require('mongoose');

const TRIGGER_TYPES = ['BID_RECEIVED', 'ANY_RANK_CHANGE', 'L1_RANK_CHANGE'];

const rfqSchema = new mongoose.Schema(
  {
    referenceId: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    pickupDate: { type: Date, required: true },

    bidStartTime: { type: Date, required: true },
    // close time entered by buyer, this never changes
    bidCloseTime: { type: Date, required: true },
    // this moves forward whenever the auction gets extended
    currentCloseTime: { type: Date, required: true },
    // hard limit, auction can never go beyond this
    forcedCloseTime: { type: Date, required: true },

    // British auction config
    triggerWindowMinutes: { type: Number, required: true, min: 1 }, // X
    extensionMinutes: { type: Number, required: true, min: 1 }, // Y
    extensionTrigger: { type: String, enum: TRIGGER_TYPES, required: true },

    extensionCount: { type: Number, default: 0 },
    totalBids: { type: Number, default: 0 },
    // no default here on purpose, $min does not work if the value is null
    lowestBid: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Rfq', rfqSchema);
module.exports.TRIGGER_TYPES = TRIGGER_TYPES;
