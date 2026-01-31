const errorHandler = {
    /**
     * Handle database errors
     */
    dbError(res, error, message = "Database operation failed") {
        console.error(`DB Error: ${message}`, error);
        return res.status(500).json({
            error: "DATABASE_ERROR",
            message: message,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    },

    /**
     * Handle validation errors
     */
    validationError(res, message) {
        return res.status(400).json({
            error: "VALIDATION_ERROR",
            message: message
        });
    },

    /**
     * Handle not found errors
     */
    notFound(res, resource = "Resource") {
        return res.status(404).json({
            error: "NOT_FOUND",
            message: `${resource} not found`
        });
    },

    /**
     * Handle duplicate entry errors
     */
    duplicate(res, message) {
        return res.status(409).json({
            error: "DUPLICATE_ENTRY",
            message: message
        });
    },

    /**
     * Handle unauthorized errors
     */
    unauthorized(res, message = "Unauthorized access") {
        return res.status(401).json({
            error: "UNAUTHORIZED",
            message: message
        });
    },

    /**
     * Handle forbidden errors
     */
    forbidden(res, message = "Forbidden") {
        return res.status(403).json({
            error: "FORBIDDEN",
            message: message
        });
    },

    /**
     * Generic success response
     */
    success(res, data = {}, message = "Success") {
        return res.status(200).json({
            success: true,
            message: message,
            data: data
        });
    }
};

module.exports = errorHandler;
