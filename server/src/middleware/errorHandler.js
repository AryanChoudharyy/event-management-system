/**
 * Central error handler middleware.
 * Catches all errors thrown in route handlers and sends a consistent JSON response.
 */
const errorHandler = (err, req, res, _next) => {
  console.error('Error:', err.message);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: messages.join('. ') });
  }

  // Mongoose cast error (invalid ObjectId etc.)
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid ID format' });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    return res.status(409).json({ success: false, message: 'Duplicate entry' });
  }

  const status = err.statusCode || 500;
  const message = err.statusCode ? err.message : 'Internal server error';

  res.status(status).json({ success: false, message });
};

export default errorHandler;
