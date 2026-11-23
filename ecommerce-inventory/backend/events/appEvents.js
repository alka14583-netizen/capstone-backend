const EventEmitter = require("events");

// ONE shared EventEmitter for the whole server. Services emit events, listeners react.
// Events used: "order:placed", "order:status", "stock:low"
module.exports = new EventEmitter();
