const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    rfq: { type: mongoose.Schema.Types.ObjectId, ref: 'Rfq', required: true },
    type: {
      type: String,
      enum: ['RFQ_CREATED', 'BID_PLACED', 'TIME_EXTENDED'],
      required: true,
    },
    message: { type: String, required: true },

    // below fields are only filled for TIME_EXTENDED
    oldCloseTime: { type: Date },
    newCloseTime: { type: Date },
    reason: { type: String },
  },
  { timestamps: true }
);

activityLogSchema.index({ rfq: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
