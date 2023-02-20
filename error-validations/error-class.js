class AppError extends Error {
  constructor(name, status, message) {
    super();
    this.name = name;
    this.status = status;
    this.message = message;
  }
}

export { AppError };
