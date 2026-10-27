const { TRIGGER_TYPES } = require('../models/Rfq');

const isValidDate = (value) => value && !isNaN(new Date(value).getTime());

const validateRfq = (req, res, next) => {
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

  const errors = [];

  if (!name || !name.trim()) errors.push('RFQ name is required');
  if (!isValidDate(pickupDate)) errors.push('Pickup / service date is required');
  if (!isValidDate(bidStartTime)) errors.push('Bid start time is required');
  if (!isValidDate(bidCloseTime)) errors.push('Bid close time is required');
  if (!isValidDate(forcedCloseTime)) errors.push('Forced bid close time is required');

  // only compare dates if all of them are valid
  if (errors.length === 0) {
    const start = new Date(bidStartTime);
    const close = new Date(bidCloseTime);
    const forced = new Date(forcedCloseTime);

    if (close <= start) {
      errors.push('Bid close time must be after bid start time');
    }
    if (close <= new Date()) {
      errors.push('Bid close time must be in the future');
    }
    if (forced <= close) {
      errors.push('Forced bid close time must be later than bid close time');
    }
  }

  const X = Number(triggerWindowMinutes);
  const Y = Number(extensionMinutes);

  if (!Number.isInteger(X) || X < 1) {
    errors.push('Trigger window (X) must be at least 1 minute');
  }
  if (!Number.isInteger(Y) || Y < 1) {
    errors.push('Extension duration (Y) must be at least 1 minute');
  }
  if (!TRIGGER_TYPES.includes(extensionTrigger)) {
    errors.push('Please select a valid extension trigger');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: errors[0], errors });
  }

  next();
};

module.exports = validateRfq;
