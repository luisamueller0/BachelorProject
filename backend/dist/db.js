"use strict";

var neo4j = require('neo4j-driver');
require('dotenv').config();
var _process$env = process.env,
  url = _process$env.url,
  db_username = _process$env.db_username,
  db_password = _process$env.db_password,
  database = _process$env.database;

// @ts-ignore
var driver = neo4j.driver(url, neo4j.auth.basic(db_username, db_password), {
  disableLosslessIntegers: true
});
//disable so that Integers are not received with low and high but just the number
var session = driver.session({
  database: database
});
module.exports = {
  driver: driver,
  session: session
};