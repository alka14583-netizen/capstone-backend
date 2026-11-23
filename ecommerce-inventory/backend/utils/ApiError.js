// An error with an HTTP status code. Thrown by controllers, caught by errorHandler.
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}
module.exports = ApiError;
