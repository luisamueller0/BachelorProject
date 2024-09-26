"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return e; }; var t, e = {}, r = Object.prototype, n = r.hasOwnProperty, o = Object.defineProperty || function (t, e, r) { t[e] = r.value; }, i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag"; function define(t, e, r) { return Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }), t[e]; } try { define({}, ""); } catch (t) { define = function define(t, e, r) { return t[e] = r; }; } function wrap(t, e, r, n) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype), c = new Context(n || []); return o(a, "_invoke", { value: makeInvokeMethod(t, r, c) }), a; } function tryCatch(t, e, r) { try { return { type: "normal", arg: t.call(e, r) }; } catch (t) { return { type: "throw", arg: t }; } } e.wrap = wrap; var h = "suspendedStart", l = "suspendedYield", f = "executing", s = "completed", y = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var p = {}; define(p, a, function () { return this; }); var d = Object.getPrototypeOf, v = d && d(d(values([]))); v && v !== r && n.call(v, a) && (p = v); var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p); function defineIteratorMethods(t) { ["next", "throw", "return"].forEach(function (e) { define(t, e, function (t) { return this._invoke(e, t); }); }); } function AsyncIterator(t, e) { function invoke(r, o, i, a) { var c = tryCatch(t[r], t, o); if ("throw" !== c.type) { var u = c.arg, h = u.value; return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) { invoke("next", t, i, a); }, function (t) { invoke("throw", t, i, a); }) : e.resolve(h).then(function (t) { u.value = t, i(u); }, function (t) { return invoke("throw", t, i, a); }); } a(c.arg); } var r; o(this, "_invoke", { value: function value(t, n) { function callInvokeWithMethodAndArg() { return new e(function (e, r) { invoke(t, n, e, r); }); } return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(e, r, n) { var o = h; return function (i, a) { if (o === f) throw Error("Generator is already running"); if (o === s) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var c = n.delegate; if (c) { var u = maybeInvokeDelegate(c, n); if (u) { if (u === y) continue; return u; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (o === h) throw o = s, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = f; var p = tryCatch(e, r, n); if ("normal" === p.type) { if (o = n.done ? s : l, p.arg === y) continue; return { value: p.arg, done: n.done }; } "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg); } }; } function maybeInvokeDelegate(e, r) { var n = r.method, o = e.iterator[n]; if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y; var i = tryCatch(o, e.iterator, r.arg); if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y; var a = i.arg; return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y); } function pushTryEntry(t) { var e = { tryLoc: t[0] }; 1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e); } function resetTryEntry(t) { var e = t.completion || {}; e.type = "normal", delete e.arg, t.completion = e; } function Context(t) { this.tryEntries = [{ tryLoc: "root" }], t.forEach(pushTryEntry, this), this.reset(!0); } function values(e) { if (e || "" === e) { var r = e[a]; if (r) return r.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) { var o = -1, i = function next() { for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next; return next.value = t, next.done = !0, next; }; return i.next = i; } } throw new TypeError(_typeof(e) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), o(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) { var e = "function" == typeof t && t.constructor; return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name)); }, e.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t; }, e.awrap = function (t) { return { __await: t }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () { return this; }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(wrap(t, r, n, o), i); return e.isGeneratorFunction(r) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () { return this; }), define(g, "toString", function () { return "[object Generator]"; }), e.keys = function (t) { var e = Object(t), r = []; for (var n in e) r.push(n); return r.reverse(), function next() { for (; r.length;) { var t = r.pop(); if (t in e) return next.value = t, next.done = !1, next; } return next.done = !0, next; }; }, e.values = values, Context.prototype = { constructor: Context, reset: function reset(e) { if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0].completion; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(e) { if (this.done) throw e; var r = this; function handle(n, o) { return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o; } for (var o = this.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i.completion; if ("root" === i.tryLoc) return handle("end"); if (i.tryLoc <= this.prev) { var c = n.call(i, "catchLoc"), u = n.call(i, "finallyLoc"); if (c && u) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } else if (c) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); } else { if (!u) throw Error("try statement without catch or finally"); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } } } }, abrupt: function abrupt(t, e) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var o = this.tryEntries[r]; if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) { var i = o; break; } } i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null); var a = i ? i.completion : {}; return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a); }, complete: function complete(t, e) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y; }, finish: function finish(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y; } }, "catch": function _catch(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.tryLoc === t) { var n = r.completion; if ("throw" === n.type) { var o = n.arg; resetTryEntry(r); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(e, r, n) { return this.delegate = { iterator: values(e), resultName: r, nextLoc: n }, "next" === this.method && (this.arg = t), y; } }, e; }
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
var dbSemaphore = require('../semaphoreHandler');
var math = require('mathjs');
var latestArtists = [];
var latestRelationships = [];
var latestMinLimit = -1;
var latestMaxLimit = -1;
var latestValue = '';
var Artist = /*#__PURE__*/_createClass(function Artist(data) {
  _classCallCheck(this, Artist);
  this.id = Number(data.id);
  this.firstname = data.firstname;
  this.lastname = data.lastname;
  this.birthyear = data.birthyear;
  this.birthplace = data.birthplace;
  this.deathyear = data.deathyear;
  this.deathplace = data.deathplace;
  this.nationality = data.country;
  this.sex = data.sex;
  this.title = data.title;
  this.techniques = data.artForms;
  this.amount_techniques = data.distinctArtForms.length;
  this.distinct_techniques = data.distinctArtForms;
  this.europeanRegionNationality = data.europeanRegionNationality;
  this.most_exhibited_in = data.mostExhibitedInCountry;
  this.europeanRegionMostExhibited = data.europeanRegionMostExhibitedInCountry;
  this.most_exhibited_in_amount = data.mostExhibitedInCountryAmount;
  this.total_exhibited_artworks = data.TotalExhibitedArtworks;
  this.deathcountry = data.deathCountry;
  this.europeanRegionDeath = data.europeanRegionDeathCountry;
  this.birthcountry = data.birthCountry;
  this.europeanRegionBirth = data.europeanRegionBirthCountry;
  this.total_exhibitions = data.TotalExhibitions;
  this.techniques_freq = data.artFormsFreq;
  this.cluster = -1; // Default value
  this.overall_avg_date = formatDateString(data.overall_avg_date);
  this.avg_start_date = data.avg_start_date;
  this.avg_end_date = data.avg_end_date;
  this.avg_duration = data.avg_duration;
  this.participated_in_exhibition = data.participated_in_exhibition;
  this.oldBirthCountry = data.oldBirthCountry;
  this.oldDeathCountry = data.oldDeathCountry;
  this.mostExhibitedInOldCountry = data.mostExhibitedInOldCountry;
  this.europeanRegionOldBirth = data.europeanRegionOldBirthCountry;
  this.europeanRegionOldDeath = data.europeanRegionOldDeathCountry;
  this.europeanRegionMostExhibitedInOldCountry = data.europeanRegionOldMostExhibitedInCountry;
});
function formatDateString(dateString) {
  var date = new Date(dateString);
  var dateOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  var formattedDate = date.toLocaleDateString('en-US', dateOptions);
  var formattedTime = '00:00:00'; // Fixed time value
  return "".concat(formattedDate, " ").concat(formattedTime);
}

// Define European regions based on country codes
/*   const europeanRegions = {
    "North Europe": ["DK", "EE", "FI", "IS", "IE", "LV", "LT", "NO", "SE"],
    "Eastern Europe": ["AZ", "BY", "BG", "CZ", "HU", "MD", "PL", "RO", "RU", "SK", "UA"],
    "Southern Europe": ["BA", "HR", "GI", "GR", "IT", "ME", "PT", "RS", "SI", "ES"],
    "Western Europe": ["AT", "BE", "FR", "DE", "LU", "MC", "NL", "CH", "GB"],
    "Others": [
        "US", "AU", "GE", "MX", "AM", "IL", "CL", "AR", "CA", "DO", "PE", "JP", "TR",
        "BR", "ZA", "NZ", "VE", "GT", "UY", "SV", "PY", "IN", "PF", "KZ", "UZ", "VN", 
        "NA", "JO", "IR", "KH", "JM", "SA", "DZ", "CN", "EG", "VI", "ID", "CU", "TN", 
        "MQ", "MU", "LK", "EC", "SG", "BL", "TH", "BO"
      ]
    }; */

/*   const allCountries = [
    "GB", "ID", "UA", "CH", "RU", "NL", "DE", "BY", "IT", "LT", "US", "HU", "FR", "AU", "BE", "CZ", "AT", "NO", 
    "GR", "SE", "PL", "LV", "FI", "ES", "MD", "CA", "BG", "GE", "DZ", "MX", "AZ", "RO", "EE", "DK", "AR", "UY", 
    "CU", "PT", "HR", "SI", "TN", "EG", "SK", "TR", "VI", "RS", "IE", "DO", "JP", "MQ", "IN", "MU", "ME", "CL", 
    "ZA", "NZ", "KH", "LU", "GI", "VE", "GT", "SV", "PY", "LK", "BA", "EC", "BR", "SG", "BL", "PE", "TH", "PF", 
    "AM", "IL", "MC", "CN", "UZ", "KZ", "MA", "BO", "VN", "NA", "JO", "IR", "JM", "SA"
  ]
  // Create a set of all countries in europeanRegions
const categorizedCountries = new Set();
Object.values(europeanRegions).forEach(regionCountries => {
  regionCountries.forEach(country => {
    categorizedCountries.add(country);
  });
});

// Find countries in allCountries that are not in categorizedCountries
const uncategorizedCountries = allCountries.filter(country => !categorizedCountries.has(country));

console.log(uncategorizedCountries);
   */
var exhibited_with = /*#__PURE__*/_createClass(function exhibited_with(startData, endData, relationshipData) {
  _classCallCheck(this, exhibited_with);
  this.startId = Math.min(startData.id, endData.id);
  this.endId = Math.max(startData.id, endData.id);
  this.sharedExhibitions = relationshipData.sharedExhibitions;
  this.sharedExhibitionMinArtworks = relationshipData.sharedExhibitionMinArtworks;
});
var findAllNationalityTechnique = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2() {
    var _require, session;
    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          _require = require('../db'), session = _require.session;
          _context2.next = 3;
          return dbSemaphore.runExclusive( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
            var result;
            return _regeneratorRuntime().wrap(function _callee$(_context) {
              while (1) switch (_context.prev = _context.next) {
                case 0:
                  console.log('Semaphore acquired by normal');
                  _context.next = 3;
                  return session.run( // Collect 25 distinct artists based on some criteria
                  "MATCH (a:Artist)\n    WHERE a.artForms <> [] AND a.country <> '\\N'\n    WITH a\n    LIMIT 25\n    WITH collect(a) AS selectedArtists\n\n    // For each artist in the selected group, find all exhibited relationships within this group\n    UNWIND selectedArtists AS a\n    MATCH p=(a)-[r:EXHIBITED_WITH]-(b)\n    WHERE b IN selectedArtists\n    RETURN p\n    ");
                case 3:
                  result = _context.sent;
                  _context.next = 6;
                  return processResult(result);
                case 6:
                  return _context.abrupt("return", _context.sent);
                case 7:
                case "end":
                  return _context.stop();
              }
            }, _callee);
          })));
        case 3:
          return _context2.abrupt("return", _context2.sent);
        case 4:
        case "end":
          return _context2.stop();
      }
    }, _callee2);
  }));
  return function findAllNationalityTechnique() {
    return _ref.apply(this, arguments);
  };
}();

/* const findAllNationalityTechniqueAmount = async (minLimit, maxLimit) => {
    const { session } = require('../db');
    return await dbSemaphore.runExclusive(async () => {
        console.log('Semaphore acquired by amount')
    const result = await session.run(
   // Collect artists where total
    `MATCH (a:Artist)
    WHERE a.artForms <> [] AND a.country <> '\\N' AND a.TotalExhibitedArtworks >= $minLimit AND a.TotalExhibitedArtworks <= $maxLimit
    WITH a
    WITH collect(a) AS selectedArtists

    // For each artist in the selected group, find all exhibited relationships within this group
    UNWIND selectedArtists AS a
    MATCH p=(a)-[r:EXHIBITED_WITH]-(b)
    WHERE b IN selectedArtists
    RETURN p
    `
    ,{ minLimit: parseInt(minLimit), maxLimit: parseInt(maxLimit) } );// Ensure these are correctly passed as integers);
    

    return await processResult(result);
});
}; */

var findAllBirthcountryTechnique = /*#__PURE__*/function () {
  var _ref3 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee4() {
    var _require2, session;
    return _regeneratorRuntime().wrap(function _callee4$(_context4) {
      while (1) switch (_context4.prev = _context4.next) {
        case 0:
          _require2 = require('../db'), session = _require2.session;
          _context4.next = 3;
          return dbSemaphore.runExclusive( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3() {
            var result;
            return _regeneratorRuntime().wrap(function _callee3$(_context3) {
              while (1) switch (_context3.prev = _context3.next) {
                case 0:
                  _context3.next = 2;
                  return session.run( // Collect 25 distinct artists based on some criteria
                  "MATCH (a:Artist)\n    WHERE a.artForms <> [] AND a.birthCountry <> '\\N'\n    WITH a\n    LIMIT 25\n    WITH collect(a) AS selectedArtists\n\n    // For each artist in the selected group, find all exhibited relationships within this group\n    UNWIND selectedArtists AS a\n    MATCH p=(a)-[r:EXHIBITED_WITH]-(b)\n    WHERE b IN selectedArtists\n    RETURN p\n    ");
                case 2:
                  result = _context3.sent;
                  _context3.next = 5;
                  return processResult(result);
                case 5:
                  return _context3.abrupt("return", _context3.sent);
                case 6:
                case "end":
                  return _context3.stop();
              }
            }, _callee3);
          })));
        case 3:
          return _context4.abrupt("return", _context4.sent);
        case 4:
        case "end":
          return _context4.stop();
      }
    }, _callee4);
  }));
  return function findAllBirthcountryTechnique() {
    return _ref3.apply(this, arguments);
  };
}();

/* const findAllBirthcountryTechniqueAmount = async (minLimit,maxLimit) => {
    const { session } = require('../db');
    return await dbSemaphore.runExclusive(async () => {
    const result = await session.run(
   // Collect 25 distinct artists based on some criteria
    `MATCH (a:Artist) 
    WHERE a.artForms <> [] AND a.birthCountry <> '\\N' AND a.TotalExhibitedArtworks >= $minLimit AND a.TotalExhibitedArtworks <= $maxLimit
    WITH a
    WITH collect(a) AS selectedArtists

    // For each artist in the selected group, find all exhibited relationships within this group
    UNWIND selectedArtists AS a
    MATCH p=(a)-[r:EXHIBITED_WITH]-(b)
    WHERE b IN selectedArtists
    RETURN p
    `
    ,{ minLimit: parseInt(minLimit), maxLimit: parseInt(maxLimit) } );// Ensure these are correctly passed as integers);
    

    return await processResult(result);
});
}; */

var findAllDeathcountryTechnique = /*#__PURE__*/function () {
  var _ref5 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee6() {
    var _require3, session;
    return _regeneratorRuntime().wrap(function _callee6$(_context6) {
      while (1) switch (_context6.prev = _context6.next) {
        case 0:
          _require3 = require('../db'), session = _require3.session;
          _context6.next = 3;
          return dbSemaphore.runExclusive( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee5() {
            var result;
            return _regeneratorRuntime().wrap(function _callee5$(_context5) {
              while (1) switch (_context5.prev = _context5.next) {
                case 0:
                  _context5.next = 2;
                  return session.run( // Collect 25 distinct artists based on some criteria
                  "MATCH (a:Artist)\n    WHERE a.artForms <> [] AND a.deathCountry <> '\\N'\n    WITH a\n    LIMIT 25\n    WITH collect(a) AS selectedArtists\n\n    // For each artist in the selected group, find all exhibited relationships within this group\n    UNWIND selectedArtists AS a\n    MATCH p=(a)-[r:EXHIBITED_WITH]-(b)\n    WHERE b IN selectedArtists\n    RETURN p\n    ");
                case 2:
                  result = _context5.sent;
                  _context5.next = 5;
                  return processResult(result);
                case 5:
                  return _context5.abrupt("return", _context5.sent);
                case 6:
                case "end":
                  return _context5.stop();
              }
            }, _callee5);
          })));
        case 3:
          return _context6.abrupt("return", _context6.sent);
        case 4:
        case "end":
          return _context6.stop();
      }
    }, _callee6);
  }));
  return function findAllDeathcountryTechnique() {
    return _ref5.apply(this, arguments);
  };
}();
/* 
const findAllDeathcountryTechniqueAmount = async (minLimit,maxLimit) => {
    const { session } = require('../db');
    return await dbSemaphore.runExclusive(async () => {
    const result = await session.run(
   // Collect 25 distinct artists based on some criteria
    `MATCH (a:Artist)
    WHERE a.artForms <> [] AND a.deathCountry <> '\\N'  AND a.TotalExhibitedArtworks >= $minLimit AND a.TotalExhibitedArtworks <= $maxLimit
    WITH a
    WITH collect(a) AS selectedArtists

    // For each artist in the selected group, find all exhibited relationships within this group
    UNWIND selectedArtists AS a
    MATCH p=(a)-[r:EXHIBITED_WITH]-(b)
    WHERE b IN selectedArtists
    RETURN p
    `
    ,{ minLimit: parseInt(minLimit), maxLimit: parseInt(maxLimit) } );// Ensure these are correctly passed as integers);
    

    return await processResult(result);

});
}; */

var findAllMostExhibitedInTechnique = /*#__PURE__*/function () {
  var _ref7 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee8() {
    var _require4, session;
    return _regeneratorRuntime().wrap(function _callee8$(_context8) {
      while (1) switch (_context8.prev = _context8.next) {
        case 0:
          _require4 = require('../db'), session = _require4.session;
          _context8.next = 3;
          return dbSemaphore.runExclusive( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee7() {
            var result;
            return _regeneratorRuntime().wrap(function _callee7$(_context7) {
              while (1) switch (_context7.prev = _context7.next) {
                case 0:
                  _context7.next = 2;
                  return session.run( // Collect 25 distinct artists based on some criteria
                  "MATCH (a:Artist)\n    WHERE a.artForms <> [] AND a.mostExhibitedInCountry <> '\\N' AND a.unclearMostExhibitedInCountry = FALSE \n    WITH a\n    LIMIT 25\n    WITH collect(a) AS selectedArtists\n\n    // For each artist in the selected group, find all exhibited relationships within this group\n    UNWIND selectedArtists AS a\n    MATCH p=(a)-[r:EXHIBITED_WITH]-(b)\n    WHERE b IN selectedArtists\n    RETURN p\n    ");
                case 2:
                  result = _context7.sent;
                  _context7.next = 5;
                  return processResult(result);
                case 5:
                  return _context7.abrupt("return", _context7.sent);
                case 6:
                case "end":
                  return _context7.stop();
              }
            }, _callee7);
          })));
        case 3:
          return _context8.abrupt("return", _context8.sent);
        case 4:
        case "end":
          return _context8.stop();
      }
    }, _callee8);
  }));
  return function findAllMostExhibitedInTechnique() {
    return _ref7.apply(this, arguments);
  };
}();

/* const findAllMostExhibitedInTechniqueAmount = async (minLimit,maxLimit) => {
    const { session } = require('../db');
    return await dbSemaphore.runExclusive(async () => {
    const result = await session.run(
   // Collect 25 distinct artists based on some criteria
    `MATCH (a:Artist)
    WHERE a.artForms <> [] AND a.mostExhibitedInCountry <> '\\N' AND a.unclearMostExhibitedInCountry = FALSE  AND a.TotalExhibitedArtworks >= $minLimit AND a.TotalExhibitedArtworks <= $maxLimit
    WITH a
    WITH collect(a) AS selectedArtists

    // For each artist in the selected group, find all exhibited relationships within this group
    UNWIND selectedArtists AS a
    MATCH p=(a)-[r:EXHIBITED_WITH]-(b)
    WHERE b IN selectedArtists
    RETURN p
    `
    ,{ minLimit: parseInt(minLimit), maxLimit: parseInt(maxLimit) } );// Ensure these are correctly passed as integers);
    

    return await processResult(result);

});
}; */

var findAllTechniques = /*#__PURE__*/function () {
  var _ref9 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee10() {
    var _require5, session;
    return _regeneratorRuntime().wrap(function _callee10$(_context10) {
      while (1) switch (_context10.prev = _context10.next) {
        case 0:
          _require5 = require('../db'), session = _require5.session;
          _context10.next = 3;
          return dbSemaphore.runExclusive( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee9() {
            var result;
            return _regeneratorRuntime().wrap(function _callee9$(_context9) {
              while (1) switch (_context9.prev = _context9.next) {
                case 0:
                  _context9.next = 2;
                  return session.run( // Collect 25 distinct artists based on some criteria
                  "MATCH (a:Artist)\n    WHERE a.artForms <> [] AND a.artFormsFreq <> '{}'\n    WITH a\n    LIMIT 25\n    WITH collect(a) AS selectedArtists\n\n    // For each artist in the selected group, find all exhibited relationships within this group\n    UNWIND selectedArtists AS a\n    MATCH p=(a)-[r:EXHIBITED_WITH]-(b)\n    WHERE b IN selectedArtists\n    RETURN p\n    ");
                case 2:
                  result = _context9.sent;
                  _context9.next = 5;
                  return processResult(result);
                case 5:
                  return _context9.abrupt("return", _context9.sent);
                case 6:
                case "end":
                  return _context9.stop();
              }
            }, _callee9);
          })));
        case 3:
          return _context10.abrupt("return", _context10.sent);
        case 4:
        case "end":
          return _context10.stop();
      }
    }, _callee10);
  }));
  return function findAllTechniques() {
    return _ref9.apply(this, arguments);
  };
}();

// Assuming 'artists' is an array of artist nodes and 'relationships' is an array of edges with weights
var normalizeLogarithmically = function normalizeLogarithmically(values) {
  var logMaxValue = Math.log1p(Math.max.apply(Math, _toConsumableArray(values.values())));
  var logMinValue = Math.log1p(Math.min.apply(Math, _toConsumableArray(values.values())));
  var range = logMaxValue - logMinValue;
  var normalized = new Map();
  values.forEach(function (value, id) {
    normalized.set(id, (Math.log1p(value) - logMinValue) / range); // Normalize by dividing by the max degree
  });
  return normalized;
};
function countArtistsByRegion(clusteredArtists) {
  var regionOrder = ["North Europe", "Eastern Europe", "Southern Europe", "Western Europe", "Others", "\\N"];
  return clusteredArtists.map(function (cluster) {
    var regionCounts = cluster.reduce(function (counts, artist) {
      var region = artist.europeanRegionNationality || "\\N";
      counts[region] = (counts[region] || 0) + 1;
      return counts;
    }, {});
    var totalArtists = cluster.length;
    var regionProportions = regionOrder.reduce(function (proportions, region) {
      proportions[region] = (regionCounts[region] || 0) / totalArtists;
      return proportions;
    }, {});
    return {
      cluster: cluster,
      regionProportions: regionProportions
    };
  });
}
function sortClustersByRegionProportions(clusteredArtists) {
  var countedClusters = countArtistsByRegion(clusteredArtists);

  // Sort clusters based on the highest region proportion and then by region proportions
  countedClusters.sort(function (a, b) {
    var maxProportionA = Math.max.apply(Math, _toConsumableArray(Object.values(a.regionProportions)));
    var maxProportionB = Math.max.apply(Math, _toConsumableArray(Object.values(b.regionProportions)));

    // Sort by the highest proportion region
    if (maxProportionA !== maxProportionB) {
      return maxProportionB - maxProportionA;
    }

    // Sort within the highest proportion region by the proportion values
    var sortedRegionsA = Object.entries(a.regionProportions).sort(function (_ref11, _ref12) {
      var _ref13 = _slicedToArray(_ref11, 2),
        propA = _ref13[1];
      var _ref14 = _slicedToArray(_ref12, 2),
        propB = _ref14[1];
      return propB - propA;
    });
    var sortedRegionsB = Object.entries(b.regionProportions).sort(function (_ref15, _ref16) {
      var _ref17 = _slicedToArray(_ref15, 2),
        propA = _ref17[1];
      var _ref18 = _slicedToArray(_ref16, 2),
        propB = _ref18[1];
      return propB - propA;
    });
    for (var i = 0; i < sortedRegionsA.length; i++) {
      if (sortedRegionsA[i][1] !== sortedRegionsB[i][1]) {
        return sortedRegionsB[i][1] - sortedRegionsA[i][1];
      }
    }
    return 0;
  });
  return countedClusters.map(function (clusterData) {
    return clusterData.cluster;
  });
}
function spectralClustering(_x, _x2, _x3) {
  return _spectralClustering.apply(this, arguments);
}
function _spectralClustering() {
  _spectralClustering = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee20(artists, relationships, k) {
    var sharedExhibitionValues, normalizedSharedExhibitionValues, size, adjacencyMatrix, degreeMatrix, laplacianMatrix, eigensystem, firstThreeEigenvectors, featureMatrixU, i, vector, featureMatrixUTransposed, clusters, minSize, maxSize, clusterArray, clusterAssignments, clusteredArtists, clusterMap, intraClusterRelationships, singleInterClusterRelationships, interClusterRelationshipsMap, interClusterRelationships;
    return _regeneratorRuntime().wrap(function _callee20$(_context20) {
      while (1) switch (_context20.prev = _context20.next) {
        case 0:
          console.log('cluster');
          // Step 0: Extract sharedExhibitionMinArtworks values for normalization
          sharedExhibitionValues = new Map();
          relationships.forEach(function (relationship) {
            var id = relationship.startId;
            var value = relationship.sharedExhibitionMinArtworks;
            sharedExhibitionValues.set(id, value);
          });

          // Step 0.1: Normalize sharedExhibitionMinArtworks values
          normalizedSharedExhibitionValues = normalizeLogarithmically(sharedExhibitionValues); // Step 1: Construct the adjacency matrix
          size = artists.length;
          adjacencyMatrix = math.zeros(size, size);
          relationships.forEach(function (relationship) {
            var i = artists.findIndex(function (artist) {
              return artist.id === relationship.startId;
            });
            var j = artists.findIndex(function (artist) {
              return artist.id === relationship.endId;
            });
            var weight = normalizedSharedExhibitionValues.get(relationship.startId);
            adjacencyMatrix.set([i, j], Number(weight));
            adjacencyMatrix.set([j, i], Number(weight)); // since it's an undirected graph
          });

          // Step 2: Construct the degree matrix
          degreeMatrix = adjacencyMatrix.map(function (value, index, matrix) {
            return index[0] === index[1] ? Number(math.sum(matrix._data[index[0]])) : 0;
          }); // Step 3: Construct the Laplacian matrix
          laplacianMatrix = math.subtract(degreeMatrix, adjacencyMatrix); // Step 4: Compute the eigenvalues and eigenvectors
          eigensystem = math.eigs(laplacianMatrix); // Check if the eigenvalues and eigenvectors are defined and not empty
          if (!(!eigensystem || eigensystem.values.length === 0)) {
            _context20.next = 12;
            break;
          }
          throw new Error("Eigenvectors are undefined or missing data.");
        case 12:
          // Extract the first three eigenvectors
          firstThreeEigenvectors = eigensystem.eigenvectors.slice(0, k); // Initialize the feature matrix
          featureMatrixU = []; // Loop over the eigenvectors
          for (i = 0; i < firstThreeEigenvectors.length; i++) {
            vector = firstThreeEigenvectors[i].vector.toArray(); // Convert DenseMatrix to array
            featureMatrixU.push(vector); // Push the vector as a column in the feature matrix
          }

          // Transpose the feature matrix to have columns as data points
          featureMatrixUTransposed = math.transpose(featureMatrixU); // Perform initial kMeans Clustering
          clusters = kMeansClustering(featureMatrixUTransposed, k, 1); // Assume minClusterSize = 1 for basic example
          minSize = Math.floor(size / k);
          maxSize = Math.ceil(size / k); // Redistribute clusters here
          clusters = redistributeClusters(featureMatrixUTransposed, clusters, k, minSize, maxSize); // Example sizes

          // Assuming kMeansClustering and other related functions are d

          // Associate artists with their clusters
          clusterArray = artists.map(function (artist, index) {
            return _objectSpread(_objectSpread({}, artist), {}, {
              cluster: clusters[index]
            });
          }); // Associate artists with their clusters
          clusterAssignments = artists.map(function (artist, index) {
            artist.cluster = clusters[index]; // Assign the cluster to the artist
          }); // Initialize an array of k empty arrays for the clusters
          clusteredArtists = Array.from({
            length: k
          }, function () {
            return [];
          }); // Populate the cluster arrays with artists
          artists.forEach(function (artist, index) {
            var clusterIndex = clusters[index]; // Retrieve the cluster index assigned to the artist
            clusteredArtists[clusterIndex].push(artist); // Add the artist to the corresponding cluster
          });
          clusteredArtists = sortClustersByRegionProportions(clusteredArtists);

          // Update clusterMap with the new cluster indices after sorting
          clusterMap = new Map();
          clusteredArtists.forEach(function (cluster, sortedClusterIndex) {
            cluster.forEach(function (artist) {
              clusterMap.set(artist.id, sortedClusterIndex); // Correctly associate artist ID with new cluster index
            });
          });

          // Update the cluster property of each artist to reflect the sorted cluster index
          artists.forEach(function (artist) {
            artist.cluster = clusterMap.get(artist.id);
          });
          intraClusterRelationships = Array.from({
            length: k
          }, function () {
            return [];
          });
          singleInterClusterRelationships = Array.from({
            length: k
          }, function () {
            return [];
          });
          interClusterRelationshipsMap = new Map();
          relationships.forEach(function (relationship) {
            var clusterA = clusterMap.get(relationship.startId);
            var clusterB = clusterMap.get(relationship.endId);
            if (clusterA === clusterB) {
              intraClusterRelationships[clusterA].push(relationship);
            } else {
              singleInterClusterRelationships[clusterA].push(relationship);
              singleInterClusterRelationships[clusterB].push(relationship);
              var key = "".concat(Math.min(clusterA, clusterB), "-").concat(Math.max(clusterA, clusterB));
              if (!interClusterRelationshipsMap.has(key)) {
                interClusterRelationshipsMap.set(key, {
                  startId: Math.min(clusterA, clusterB),
                  endId: Math.max(clusterA, clusterB),
                  sharedExhibitions: 0,
                  sharedExhibitionMinArtworks: 0
                });
              }
              var aggregatedRelationship = interClusterRelationshipsMap.get(key);
              aggregatedRelationship.sharedExhibitions += relationship.sharedExhibitions;
              aggregatedRelationship.sharedExhibitionMinArtworks += relationship.sharedExhibitionMinArtworks;
            }
          });
          interClusterRelationships = Array.from(interClusterRelationshipsMap.values()).map(function (rel) {
            return new exhibited_with({
              id: rel.startId
            }, {
              id: rel.endId
            }, {
              sharedExhibitions: rel.sharedExhibitions,
              sharedExhibitionMinArtworks: rel.sharedExhibitionMinArtworks
            });
          }); // Sorting by source.id, then target.id
          interClusterRelationships.sort(function (a, b) {
            if (a.startId !== b.startId) {
              return a.startId - b.startId;
            }
            return a.endId - b.endId;
          });
          console.log('cluster finished');
          return _context20.abrupt("return", [clusteredArtists, intraClusterRelationships, interClusterRelationships,
          // You might want to further organize this by cluster pairs if needed
          singleInterClusterRelationships]);
        case 36:
        case "end":
          return _context20.stop();
      }
    }, _callee20);
  }));
  return _spectralClustering.apply(this, arguments);
}
function redistributeClusters(data, clusters, k, minClusterSize, maxClusterSize) {
  var centroids = calculateCentroids(data, clusters, k);
  var clusterSizes = new Array(k).fill(0);
  clusters.forEach(function (cluster) {
    return clusterSizes[cluster]++;
  });
  var needsHelp = clusterSizes.map(function (size, index) {
    return {
      index: index,
      size: size,
      type: size < minClusterSize ? 'undersized' : size > maxClusterSize ? 'oversized' : 'ok'
    };
  }).filter(function (stat) {
    return stat.type !== 'ok';
  });
  needsHelp.forEach(function (need) {
    if (need.type === 'oversized') {
      data.forEach(function (point, idx) {
        if (clusters[idx] === need.index) {
          var currentClusterIndex = need.index;
          var closest = {
            index: -1,
            distance: Infinity
          };
          centroids.forEach(function (centroid, index) {
            if (index !== currentClusterIndex && clusterSizes[index] < maxClusterSize) {
              var distance = euclideanDistance(point, centroid);
              if (distance < closest.distance) {
                closest = {
                  index: index,
                  distance: distance
                };
              }
            }
          });
          if (closest.index !== -1) {
            clusters[idx] = closest.index;
            clusterSizes[currentClusterIndex]--;
            clusterSizes[closest.index]++;
          }
        }
      });
    }
  });
  return clusters;
}
function calculateCentroids(data, clusters, k) {
  var centroids = Array(k).fill(null).map(function () {
    return [];
  });
  data.forEach(function (point, index) {
    centroids[clusters[index]].push(point);
  });
  return centroids.map(function (cluster) {
    return cluster.reduce(function (mean, point) {
      return mean.map(function (m, idx) {
        return m + point[idx] / cluster.length;
      });
    }, new Array(data[0].length).fill(0));
  });
}
function kMeansClustering(data, k) {
  var maxIterations = 500;
  var bestCentroids = [];
  var bestClusterAssignments = [];
  var minTotalDistance = Infinity;
  for (var initialization = 0; initialization < 10; initialization++) {
    // Try multiple random initializations
    var centroids = initializeCentroidsPlusPlus(data, k);
    var clusterAssignments = [];
    for (var iteration = 0; iteration < maxIterations; iteration++) {
      var newClusterAssignments = assignPointsToCentroids(data, centroids);
      var newCentroids = updateCentroids(data, newClusterAssignments, k);
      if (centroidsEqual(newCentroids, centroids)) {
        clusterAssignments = newClusterAssignments;
        break;
      }
      centroids = newCentroids;
    }
    var totalDistance = calculateTotalDistance(data, centroids, clusterAssignments);
    if (totalDistance < minTotalDistance) {
      bestCentroids = centroids;
      bestClusterAssignments = clusterAssignments;
      minTotalDistance = totalDistance;
    }
  }
  return bestClusterAssignments;
}
function initializeCentroidsPlusPlus(data, k) {
  var centroids = [data[Math.floor(Math.random() * data.length)]];
  var _loop = function _loop() {
    var distances = data.map(function (point) {
      return Math.min.apply(Math, _toConsumableArray(centroids.map(function (centroid) {
        return euclideanDistance(point, centroid);
      })));
    });
    var totalDistance = distances.reduce(function (a, b) {
      return a + b;
    }, 0);
    var probabilities = distances.map(function (distance) {
      return distance / totalDistance;
    });
    var cumulativeProbabilities = probabilities.reduce(function (acc, prob, index) {
      if (index === 0) acc.push(prob);else acc.push(acc[index - 1] + prob);
      return acc;
    }, []);
    var rand = Math.random();
    var nextCentroidIndex = cumulativeProbabilities.findIndex(function (cumProb) {
      return cumProb >= rand;
    });
    centroids.push(data[nextCentroidIndex]);
  };
  for (var i = 1; i < k; i++) {
    _loop();
  }
  return centroids;
}
function assignPointsToCentroids(data, centroids) {
  var clusterAssignments = [];
  var _iterator = _createForOfIteratorHelper(data),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var point = _step.value;
      var minDistance = Infinity;
      var closestCentroidIndex = -1;
      for (var i = 0; i < centroids.length; i++) {
        var distance = euclideanDistance(point, centroids[i]);
        if (distance < minDistance) {
          minDistance = distance;
          closestCentroidIndex = i;
        }
      }
      clusterAssignments.push(closestCentroidIndex);
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  return clusterAssignments;
}
function updateCentroids(data, clusterAssignments, k) {
  var newCentroids = new Array(k).fill(0).map(function () {
    return new Array(data[0].length).fill(0);
  });
  var clusterCounts = new Array(k).fill(0);
  for (var i = 0; i < data.length; i++) {
    var clusterIndex = clusterAssignments[i];
    for (var j = 0; j < data[i].length; j++) {
      newCentroids[clusterIndex][j] += data[i][j];
    }
    clusterCounts[clusterIndex]++;
  }
  for (var _i = 0; _i < k; _i++) {
    if (clusterCounts[_i] !== 0) {
      for (var _j = 0; _j < newCentroids[_i].length; _j++) {
        newCentroids[_i][_j] /= clusterCounts[_i];
      }
    } else {
      // If no points were assigned to this cluster, keep the centroid unchanged
    }
  }
  return newCentroids;
}
function centroidsEqual(centroids1, centroids2) {
  for (var i = 0; i < centroids1.length; i++) {
    for (var j = 0; j < centroids1[i].length; j++) {
      if (centroids1[i][j] !== centroids2[i][j]) {
        return false;
      }
    }
  }
  return true;
}
function euclideanDistance(point1, point2) {
  var sum = 0;
  for (var i = 0; i < point1.length; i++) {
    sum += Math.pow(point1[i] - point2[i], 2);
  }
  return Math.sqrt(sum);
}
function calculateTotalDistance(data, centroids, clusterAssignments) {
  var totalDistance = 0;
  for (var i = 0; i < data.length; i++) {
    totalDistance += euclideanDistance(data[i], centroids[clusterAssignments[i]]);
  }
  return totalDistance;
}
var processResult = function processResult(result) {
  var artistsId = new Set();
  var relationships = [];
  var artists = [];
  result.records.forEach(function (record) {
    var relationship = record.get('p');
    var startData = relationship.start.properties;
    var endData = relationship.end.properties;
    var relationshipData = relationship.segments[0].relationship.properties;
    var relation = new exhibited_with(startData, endData, relationshipData);
    relationships.push(relation);

    // Check if the artist with the same ID hasn't been created yet
    var artistId = startData.id;
    if (!artistsId.has(artistId)) {
      var artist = new Artist(startData);
      artistsId.add(artistId);
      artists.push(artist);
      // Store the artist object as needed
    }
    var otherArtistId = endData.id;
    if (!artistsId.has(otherArtistId)) {
      var otherArtist = new Artist(endData);
      artistsId.add(otherArtistId);
      artists.push(otherArtist);
    }
  });
  return [artists, relationships];
};
function removeEmptyClusters(clusteredArtists) {
  // Remove empty clusters and reassign IDs
  var nonEmptyClusters = clusteredArtists.filter(function (cluster) {
    return cluster.length > 0;
  });
  var newClusterMap = new Map();
  nonEmptyClusters.forEach(function (cluster, newIndex) {
    cluster.forEach(function (artist) {
      newClusterMap.set(artist.id, newIndex);
    });
  });
  var newClusteredArtists = Array.from({
    length: nonEmptyClusters.length
  }, function () {
    return [];
  });
  clusteredArtists.forEach(function (cluster) {
    cluster.forEach(function (artist) {
      var newClusterId = newClusterMap.get(artist.id);
      newClusteredArtists[newClusterId].push(artist);
      artist.cluster = newClusterId; // Update the artist's cluster ID
    });
  });
  return newClusteredArtists;
}
var findAllNationalityTechniqueAmount = /*#__PURE__*/function () {
  var _ref19 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee11(minLimit, maxLimit) {
    var query;
    return _regeneratorRuntime().wrap(function _callee11$(_context11) {
      while (1) switch (_context11.prev = _context11.next) {
        case 0:
          query = "\n        MATCH (a:Artist)\n        WHERE a.artForms <> [] AND a.country <> '\\N' AND a.TotalExhibitedArtworks >= $minLimit AND a.TotalExhibitedArtworks <= $maxLimit\n        WITH a\n        WITH collect(a) AS selectedArtists\n\n        UNWIND selectedArtists AS a\n        MATCH p=(a)-[r:EXHIBITED_WITH]-(b)\n        WHERE b IN selectedArtists\n        RETURN p\n    ";
          return _context11.abrupt("return", streamQuery(query, {
            minLimit: parseInt(minLimit),
            maxLimit: parseInt(maxLimit)
          }));
        case 2:
        case "end":
          return _context11.stop();
      }
    }, _callee11);
  }));
  return function findAllNationalityTechniqueAmount(_x4, _x5) {
    return _ref19.apply(this, arguments);
  };
}();
var findAllBirthcountryTechniqueAmount = /*#__PURE__*/function () {
  var _ref20 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee12(minLimit, maxLimit) {
    var query;
    return _regeneratorRuntime().wrap(function _callee12$(_context12) {
      while (1) switch (_context12.prev = _context12.next) {
        case 0:
          query = "\n        MATCH (a:Artist)\n        WHERE a.artForms <> [] AND a.birthCountry <> '\\N' AND a.TotalExhibitedArtworks >= $minLimit AND a.TotalExhibitedArtworks <= $maxLimit\n        WITH a\n        WITH collect(a) AS selectedArtists\n\n        UNWIND selectedArtists AS a\n        MATCH p=(a)-[r:EXHIBITED_WITH]-(b)\n        WHERE b IN selectedArtists\n        RETURN p\n    ";
          return _context12.abrupt("return", streamQuery(query, {
            minLimit: parseInt(minLimit),
            maxLimit: parseInt(maxLimit)
          }));
        case 2:
        case "end":
          return _context12.stop();
      }
    }, _callee12);
  }));
  return function findAllBirthcountryTechniqueAmount(_x6, _x7) {
    return _ref20.apply(this, arguments);
  };
}();
var findAllDeathcountryTechniqueAmount = /*#__PURE__*/function () {
  var _ref21 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee13(minLimit, maxLimit) {
    var query;
    return _regeneratorRuntime().wrap(function _callee13$(_context13) {
      while (1) switch (_context13.prev = _context13.next) {
        case 0:
          query = "\n        MATCH (a:Artist)\n        WHERE a.artForms <> [] AND a.deathCountry <> '\\N' AND a.TotalExhibitedArtworks >= $minLimit AND a.TotalExhibitedArtworks <= $maxLimit\n        WITH a\n        WITH collect(a) AS selectedArtists\n\n        UNWIND selectedArtists AS a\n        MATCH p=(a)-[r:EXHIBITED_WITH]-(b)\n        WHERE b IN selectedArtists\n        RETURN p\n    ";
          return _context13.abrupt("return", streamQuery(query, {
            minLimit: parseInt(minLimit),
            maxLimit: parseInt(maxLimit)
          }));
        case 2:
        case "end":
          return _context13.stop();
      }
    }, _callee13);
  }));
  return function findAllDeathcountryTechniqueAmount(_x8, _x9) {
    return _ref21.apply(this, arguments);
  };
}();
var findAllMostExhibitedInTechniqueAmount = /*#__PURE__*/function () {
  var _ref22 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee14(minLimit, maxLimit) {
    var query;
    return _regeneratorRuntime().wrap(function _callee14$(_context14) {
      while (1) switch (_context14.prev = _context14.next) {
        case 0:
          query = "\n        MATCH (a:Artist)\n        WHERE a.artForms <> [] AND a.mostExhibitedInCountry <> '\\N' AND a.unclearMostExhibitedInCountry = FALSE AND a.TotalExhibitedArtworks >= $minLimit AND a.TotalExhibitedArtworks <= $maxLimit\n        WITH a\n        WITH collect(a) AS selectedArtists\n\n        UNWIND selectedArtists AS a\n        MATCH p=(a)-[r:EXHIBITED_WITH]-(b)\n        WHERE b IN selectedArtists\n        RETURN p\n    ";
          return _context14.abrupt("return", streamQuery(query, {
            minLimit: parseInt(minLimit),
            maxLimit: parseInt(maxLimit)
          }));
        case 2:
        case "end":
          return _context14.stop();
      }
    }, _callee14);
  }));
  return function findAllMostExhibitedInTechniqueAmount(_x10, _x11) {
    return _ref22.apply(this, arguments);
  };
}();
var findAllArtists = /*#__PURE__*/function () {
  var _ref23 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee16() {
    var _require6, session, query;
    return _regeneratorRuntime().wrap(function _callee16$(_context16) {
      while (1) switch (_context16.prev = _context16.next) {
        case 0:
          _require6 = require('../db'), session = _require6.session;
          query = "MATCH (n:Artist) RETURN n.id as id, n.firstname as firstname, n.lastname as lastname, n.TotalExhibitedArtworks  as artworks";
          _context16.next = 4;
          return dbSemaphore.runExclusive( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee15() {
            var result;
            return _regeneratorRuntime().wrap(function _callee15$(_context15) {
              while (1) switch (_context15.prev = _context15.next) {
                case 0:
                  _context15.next = 2;
                  return session.run(query);
                case 2:
                  result = _context15.sent;
                  _context15.next = 5;
                  return processArtists(result);
                case 5:
                  return _context15.abrupt("return", _context15.sent);
                case 6:
                case "end":
                  return _context15.stop();
              }
            }, _callee15);
          })));
        case 4:
          return _context16.abrupt("return", _context16.sent);
        case 5:
        case "end":
          return _context16.stop();
      }
    }, _callee16);
  }));
  return function findAllArtists() {
    return _ref23.apply(this, arguments);
  };
}();
var processArtists = function processArtists(result) {
  var artists = [];
  result.records.forEach(function (record) {
    var id = record.get('id');
    var firstname = record.get('firstname');
    var lastname = record.get('lastname');
    var artworks = record.get('artworks');
    artists.push({
      id: id,
      firstname: firstname,
      lastname: lastname,
      artworks: artworks
    });
  });
  return artists;
};
var streamQuery = /*#__PURE__*/function () {
  var _ref25 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee18(query, params) {
    var _require7, session;
    return _regeneratorRuntime().wrap(function _callee18$(_context18) {
      while (1) switch (_context18.prev = _context18.next) {
        case 0:
          _require7 = require('../db'), session = _require7.session;
          _context18.next = 3;
          return dbSemaphore.runExclusive( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee17() {
            var result, artistsId, relationships, artists;
            return _regeneratorRuntime().wrap(function _callee17$(_context17) {
              while (1) switch (_context17.prev = _context17.next) {
                case 0:
                  result = session.run(query, params);
                  artistsId = new Set();
                  relationships = [];
                  artists = [];
                  _context17.next = 6;
                  return new Promise(function (resolve, reject) {
                    result.subscribe({
                      onNext: function onNext(record) {
                        var relationship = record.get('p');
                        var startData = relationship.start.properties;
                        var endData = relationship.end.properties;
                        var relationshipData = relationship.segments[0].relationship.properties;
                        var relation = new exhibited_with(startData, endData, relationshipData);
                        relationships.push(relation);
                        var artistId = startData.id;
                        if (!artistsId.has(artistId)) {
                          var artist = new Artist(startData);
                          artistsId.add(artistId);
                          artists.push(artist);
                        }
                        var otherArtistId = endData.id;
                        if (!artistsId.has(otherArtistId)) {
                          var otherArtist = new Artist(endData);
                          artistsId.add(otherArtistId);
                          artists.push(otherArtist);
                        }
                      },
                      onCompleted: function onCompleted() {
                        resolve([artists, relationships]);
                      },
                      onError: function onError(error) {
                        reject(error);
                      }
                    });
                  });
                case 6:
                  return _context17.abrupt("return", [artists, relationships]);
                case 7:
                case "end":
                  return _context17.stop();
              }
            }, _callee17);
          })));
        case 3:
          return _context18.abrupt("return", _context18.sent);
        case 4:
        case "end":
          return _context18.stop();
      }
    }, _callee18);
  }));
  return function streamQuery(_x12, _x13) {
    return _ref25.apply(this, arguments);
  };
}();
var findAllRange = /*#__PURE__*/function () {
  var _ref27 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee19(minLimit, maxLimit) {
    var query;
    return _regeneratorRuntime().wrap(function _callee19$(_context19) {
      while (1) switch (_context19.prev = _context19.next) {
        case 0:
          query = "\n        MATCH (a:Artist)\n        WHERE a.TotalExhibitedArtworks >= $minLimit AND a.TotalExhibitedArtworks <= $maxLimit\n        WITH a\n        WITH collect(a) AS selectedArtists\n\n        UNWIND selectedArtists AS a\n        MATCH p=(a)-[r:EXHIBITED_WITH]-(b)\n        WHERE b IN selectedArtists\n        RETURN p\n    ";
          return _context19.abrupt("return", streamQuery(query, {
            minLimit: parseInt(minLimit),
            maxLimit: parseInt(maxLimit)
          }));
        case 2:
        case "end":
          return _context19.stop();
      }
    }, _callee19);
  }));
  return function findAllRange(_x14, _x15) {
    return _ref27.apply(this, arguments);
  };
}();
function spectralClusteringNationality(_x16, _x17, _x18) {
  return _spectralClusteringNationality.apply(this, arguments);
}
function _spectralClusteringNationality() {
  _spectralClusteringNationality = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee21(min, max, k) {
    var _yield$findAllNationa, _yield$findAllNationa2, artists, relationships, artistsWithClusters;
    return _regeneratorRuntime().wrap(function _callee21$(_context21) {
      while (1) switch (_context21.prev = _context21.next) {
        case 0:
          _context21.prev = 0;
          if (!(latestMinLimit != min || latestMaxLimit != max || latestValue !== 'nationality')) {
            _context21.next = 14;
            break;
          }
          _context21.next = 4;
          return findAllNationalityTechniqueAmount(min, max);
        case 4:
          _yield$findAllNationa = _context21.sent;
          _yield$findAllNationa2 = _slicedToArray(_yield$findAllNationa, 2);
          artists = _yield$findAllNationa2[0];
          relationships = _yield$findAllNationa2[1];
          latestArtists = artists;
          latestRelationships = relationships;
          latestMinLimit = min;
          latestMaxLimit = max;
          latestValue = 'nationality';
          console.log(latestMinLimit, latestMaxLimit);
        case 14:
          _context21.next = 16;
          return spectralClustering(latestArtists, latestRelationships, k);
        case 16:
          artistsWithClusters = _context21.sent;
          return _context21.abrupt("return", artistsWithClusters);
        case 20:
          _context21.prev = 20;
          _context21.t0 = _context21["catch"](0);
          console.error(_context21.t0);
        case 23:
        case "end":
          return _context21.stop();
      }
    }, _callee21, null, [[0, 20]]);
  }));
  return _spectralClusteringNationality.apply(this, arguments);
}
function spectralClusteringBirthcountry(_x19, _x20, _x21) {
  return _spectralClusteringBirthcountry.apply(this, arguments);
}
function _spectralClusteringBirthcountry() {
  _spectralClusteringBirthcountry = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee22(min, max, k) {
    var _yield$findAllBirthco, _yield$findAllBirthco2, artists, relationships, artistsWithClusters;
    return _regeneratorRuntime().wrap(function _callee22$(_context22) {
      while (1) switch (_context22.prev = _context22.next) {
        case 0:
          _context22.prev = 0;
          if (!(latestMinLimit != min || latestMaxLimit != max || latestValue !== 'birthcountry')) {
            _context22.next = 13;
            break;
          }
          _context22.next = 4;
          return findAllBirthcountryTechniqueAmount(min, max);
        case 4:
          _yield$findAllBirthco = _context22.sent;
          _yield$findAllBirthco2 = _slicedToArray(_yield$findAllBirthco, 2);
          artists = _yield$findAllBirthco2[0];
          relationships = _yield$findAllBirthco2[1];
          latestArtists = artists;
          latestRelationships = relationships;
          latestMinLimit = min;
          latestMaxLimit = max;
          latestValue = 'birthcountry';
        case 13:
          _context22.next = 15;
          return spectralClustering(latestArtists, latestRelationships, k);
        case 15:
          artistsWithClusters = _context22.sent;
          return _context22.abrupt("return", artistsWithClusters);
        case 19:
          _context22.prev = 19;
          _context22.t0 = _context22["catch"](0);
          console.error(_context22.t0);
        case 22:
        case "end":
          return _context22.stop();
      }
    }, _callee22, null, [[0, 19]]);
  }));
  return _spectralClusteringBirthcountry.apply(this, arguments);
}
function spectralClusteringDeathcountry(_x22, _x23, _x24) {
  return _spectralClusteringDeathcountry.apply(this, arguments);
}
function _spectralClusteringDeathcountry() {
  _spectralClusteringDeathcountry = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee23(min, max, k) {
    var _yield$findAllDeathco, _yield$findAllDeathco2, artists, relationships, artistsWithClusters;
    return _regeneratorRuntime().wrap(function _callee23$(_context23) {
      while (1) switch (_context23.prev = _context23.next) {
        case 0:
          _context23.prev = 0;
          if (!(latestMinLimit != min || latestMaxLimit != max || latestValue !== 'deathcountry')) {
            _context23.next = 13;
            break;
          }
          _context23.next = 4;
          return findAllDeathcountryTechniqueAmount(min, max);
        case 4:
          _yield$findAllDeathco = _context23.sent;
          _yield$findAllDeathco2 = _slicedToArray(_yield$findAllDeathco, 2);
          artists = _yield$findAllDeathco2[0];
          relationships = _yield$findAllDeathco2[1];
          latestArtists = artists;
          latestRelationships = relationships;
          latestMinLimit = min;
          latestMaxLimit = max;
          latestValue = 'deathcountry';
        case 13:
          _context23.next = 15;
          return spectralClustering(latestArtists, latestRelationships, k);
        case 15:
          artistsWithClusters = _context23.sent;
          return _context23.abrupt("return", artistsWithClusters);
        case 19:
          _context23.prev = 19;
          _context23.t0 = _context23["catch"](0);
          console.error(_context23.t0);
        case 22:
        case "end":
          return _context23.stop();
      }
    }, _callee23, null, [[0, 19]]);
  }));
  return _spectralClusteringDeathcountry.apply(this, arguments);
}
function spectralClusteringMostExhibited(_x25, _x26, _x27) {
  return _spectralClusteringMostExhibited.apply(this, arguments);
}
function _spectralClusteringMostExhibited() {
  _spectralClusteringMostExhibited = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee24(min, max, k) {
    var _yield$findAllMostExh, _yield$findAllMostExh2, artists, relationships, artistsWithClusters;
    return _regeneratorRuntime().wrap(function _callee24$(_context24) {
      while (1) switch (_context24.prev = _context24.next) {
        case 0:
          _context24.prev = 0;
          if (!(latestMinLimit != min || latestMaxLimit != max || latestValue !== 'mostexhibited')) {
            _context24.next = 13;
            break;
          }
          _context24.next = 4;
          return findAllMostExhibitedInTechniqueAmount(min, max);
        case 4:
          _yield$findAllMostExh = _context24.sent;
          _yield$findAllMostExh2 = _slicedToArray(_yield$findAllMostExh, 2);
          artists = _yield$findAllMostExh2[0];
          relationships = _yield$findAllMostExh2[1];
          latestArtists = artists;
          latestRelationships = relationships;
          latestMinLimit = min;
          latestMaxLimit = max;
          latestValue = 'mostexhibited';
        case 13:
          _context24.next = 15;
          return spectralClustering(latestArtists, latestRelationships, k);
        case 15:
          artistsWithClusters = _context24.sent;
          return _context24.abrupt("return", artistsWithClusters);
        case 19:
          _context24.prev = 19;
          _context24.t0 = _context24["catch"](0);
          console.error(_context24.t0);
        case 22:
        case "end":
          return _context24.stop();
      }
    }, _callee24, null, [[0, 19]]);
  }));
  return _spectralClusteringMostExhibited.apply(this, arguments);
}
function spectralClusteringRange(_x28, _x29, _x30) {
  return _spectralClusteringRange.apply(this, arguments);
}
function _spectralClusteringRange() {
  _spectralClusteringRange = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee25(min, max, k) {
    var _yield$findAllRange, _yield$findAllRange2, artists, relationships, artistsWithClusters;
    return _regeneratorRuntime().wrap(function _callee25$(_context25) {
      while (1) switch (_context25.prev = _context25.next) {
        case 0:
          _context25.prev = 0;
          if (!(latestMinLimit != min || latestMaxLimit != max)) {
            _context25.next = 14;
            break;
          }
          _context25.next = 4;
          return findAllRange(min, max);
        case 4:
          _yield$findAllRange = _context25.sent;
          _yield$findAllRange2 = _slicedToArray(_yield$findAllRange, 2);
          artists = _yield$findAllRange2[0];
          relationships = _yield$findAllRange2[1];
          latestArtists = artists;
          latestRelationships = relationships;
          latestMinLimit = min;
          latestMaxLimit = max;
          latestValue = 'nationality';
          console.log(latestMinLimit, latestMaxLimit);
        case 14:
          _context25.next = 16;
          return spectralClustering(latestArtists, latestRelationships, k);
        case 16:
          artistsWithClusters = _context25.sent;
          return _context25.abrupt("return", artistsWithClusters);
        case 20:
          _context25.prev = 20;
          _context25.t0 = _context25["catch"](0);
          console.error(_context25.t0);
        case 23:
        case "end":
          return _context25.stop();
      }
    }, _callee25, null, [[0, 20]]);
  }));
  return _spectralClusteringRange.apply(this, arguments);
}
module.exports = {
  findAllNationalityTechnique: findAllNationalityTechnique,
  findAllBirthcountryTechnique: findAllBirthcountryTechnique,
  findAllDeathcountryTechnique: findAllDeathcountryTechnique,
  findAllMostExhibitedInTechnique: findAllMostExhibitedInTechnique,
  findAllTechniques: findAllTechniques,
  findAllNationalityTechniqueAmount: findAllNationalityTechniqueAmount,
  findAllBirthcountryTechniqueAmount: findAllBirthcountryTechniqueAmount,
  findAllDeathcountryTechniqueAmount: findAllDeathcountryTechniqueAmount,
  findAllMostExhibitedInTechniqueAmount: findAllMostExhibitedInTechniqueAmount,
  spectralClusteringNationality: spectralClusteringNationality,
  spectralClusteringBirthcountry: spectralClusteringBirthcountry,
  spectralClusteringDeathcountry: spectralClusteringDeathcountry,
  spectralClusteringMostExhibited: spectralClusteringMostExhibited,
  findAllRange: findAllRange,
  spectralClusteringRange: spectralClusteringRange,
  findAllArtists: findAllArtists
};