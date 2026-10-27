// runs when no route matched
const notFound = (req, res, next) => {
  res.status(404).json({ message: `Route not found - ${req.originalUrl}` });
};

// any error passed with next(error) ends up here
const errorHandler = (err, req, res, next) => {
  console.log('Error:', err.message);

  // duplicate value in a unique field (for example same referenceId)
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Duplicate value, please try again' });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }

  res.status(err.statusCode || 500).json({
    message: err.message || 'Something went wrong on the server',
  });
};

module.exports = { notFound, errorHandler };
