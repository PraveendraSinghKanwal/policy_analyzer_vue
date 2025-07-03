const logger = {
  error(message, error) {
    // Log to console
    console.error(message, error);
    // Optionally, send to server or save to /logs
  },
  info(message, data) {
    console.info(message, data);
  },
};

export default logger; 