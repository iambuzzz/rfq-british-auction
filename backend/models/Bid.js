const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema(
  {
    rfq: { type: mongoose.Schema.Types.ObjectId, ref: 'Rfq', required: true },
    carrierName: { type: String, required: true, trim: true },

    freightCharges: { type: Number, required: true, min: 0 },
    originCharges: { type: Number, required: true, min: 0 },
    destinationCharges: { type: Number, required: true, min: 0 },
    // freight + origin + destination, ranking is done on this
    totalAmount: { type: Number, required: true },

    transitTimeDays: { type: Number, required: true, min: 1 },
    quoteValidity: { type: Date, required: true },
  },
  { timestamps: true }
);

// most queries are "all bids of this rfq"
bidSchema.index({ rfq: 1, createdAt: 1 });

module.exports = mongoose.model('Bid', bidSchema);
