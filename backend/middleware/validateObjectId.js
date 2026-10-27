const mongoose = require('mongoose');

// stops requests like /api/rfqs/abc before they reach mongoose and throw a CastError
const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid RFQ id' });
  }
  next();
};

module.exports = validateObjectId;
