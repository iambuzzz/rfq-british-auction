const isNonNegativeNumber = (value) =>
  value !== '' && value !== null && value !== undefined && !isNaN(value) && Number(value) >= 0;

const validateBid = (req, res, next) => {
  const {
    carrierName,
    freightCharges,
    originCharges,
    destinationCharges,
    transitTimeDays,
    quoteValidity,
  } = req.body;

  const errors = [];

  if (!carrierName || !carrierName.trim()) errors.push('Carrier name is required');

  if (!isNonNegativeNumber(freightCharges)) errors.push('Freight charges must be 0 or more');
  if (!isNonNegativeNumber(originCharges)) errors.push('Origin charges must be 0 or more');
  if (!isNonNegativeNumber(destinationCharges)) errors.push('Destination charges must be 0 or more');

  const total = Number(freightCharges) + Number(originCharges) + Number(destinationCharges);
  if (errors.length === 0 && total <= 0) errors.push('Total bid amount must be more than 0');

  if (!Number.isInteger(Number(transitTimeDays)) || Number(transitTimeDays) < 1) {
    errors.push('Transit time must be at least 1 day');
  }

  if (!quoteValidity || isNaN(new Date(quoteValidity).getTime())) {
    errors.push('Quote validity date is required');
  } else {
    // quote should be valid at least till today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(quoteValidity) < today) errors.push('Quote validity cannot be in the past');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: errors[0], errors });
  }

  next();
};

module.exports = validateBid;
