"use strict";

var _express = _interopRequireDefault(require("express"));
var _cors = _interopRequireDefault(require("cors"));
var _artist = _interopRequireDefault(require("./routes/artist"));
var _exhibition = _interopRequireDefault(require("./routes/exhibition"));
var _generativeAI = _interopRequireDefault(require("./routes/generativeAI"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
require('dotenv').config();
var app = (0, _express["default"])();
// List of allowed origins
var allowedOrigins = ['http://localhost:4200', 'https://artvis-cluster.web.app'];

// CORS middleware configuration
app.use((0, _cors["default"])({
  origin: function origin(_origin, callback) {
    // Allow requests with no origin (e.g., mobile apps, curl requests)
    if (!_origin) return callback(null, true);
    if (allowedOrigins.includes(_origin)) {
      // If the origin is in the allowed list, allow the request
      console.log('Origin allowed:', _origin);
      callback(null, true);
    } else {
      // If the origin is not in the allowed list, block the request
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(_express["default"].json());
app.use(_express["default"].urlencoded({
  extended: true
}));
app.use('/artist/', _artist["default"]);
app.use('/exhibition/', _exhibition["default"]);
app.use('/ai/', _generativeAI["default"]);
app.listen(process.env.PORT, function () {
  return console.log("Server running on port ".concat(process.env.PORT, " \n Press CTRL-C to stop\n"));
});