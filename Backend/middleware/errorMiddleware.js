// Not Found Middleware
const notFound = (req, res, next) => {
    const error = new Error(`Route Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

// Global Error Handling Middleware
const errorHandler = (err, req, res, next) => {
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    // Handle invalid MongoDB ObjectId
    if (err.name === "CastError") {
        statusCode = 400;
        err.message = "Invalid ID format";
    }

    // Handle duplicate MongoDB values
    if (err.code === 11000) {
        statusCode = 409;
        err.message = "This value already exists";
    }

    // Handle Mongoose validation errors
    if (err.name === "ValidationError") {
        statusCode = 400;
        err.message = Object.values(err.errors)
            .map((error) => error.message)
            .join(", ");
    }

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