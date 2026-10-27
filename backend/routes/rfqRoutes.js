const express = require('express');
const router = express.Router();

const { createRfq, getAllRfqs, getRfqById } = require('../controllers/rfqController');
const { placeBid } = require('../controllers/bidController');
const validateRfq = require('../middleware/validateRfq');
const validateBid = require('../middleware/validateBid');
const validateObjectId = require('../middleware/validateObjectId');

router.get('/', getAllRfqs);
router.post('/', validateRfq, createRfq);
router.get('/:id', validateObjectId, getRfqById);
router.post('/:id/bids', validateObjectId, validateBid, placeBid);

module.exports = router;
