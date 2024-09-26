"use strict";

var _require = require('async-mutex'),
  Semaphore = _require.Semaphore;

// Create a semaphore with a count of 1 to act like a mutex
var dbSemaphore = new Semaphore(1);
module.exports = dbSemaphore;