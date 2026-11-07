
const notFound = (req, res, next) => {
  const error = new Error(`Route Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? (err.statusCode || err.status || 500) : res.statusCode;

  if (err.name === "CastError") {
    statusCode = 400;
  }

  if (err.code === 11000) {
    statusCode = 409;
  }

  if (err.name === "ValidationError") {
    statusCode = 400;
  }

  // Print the actual error in the backend terminal
  console.error("API ERROR:", err);

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack
    })
  });
};

module.exports = {
  notFound,
  errorHandler
};
