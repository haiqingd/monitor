const query_api = require("../monitor/getdata").query_api
const prometheusAddr = require("../../../config/config.js").prometheus
const request = require('request');
const verToken = require('../../middlewares/passport');
const startProm = require("../../../config/config").wherePrometheus
const util = require('util');
const backend = require("../../../config/config")
const fs = require("fs");

class alertController{
}

module.exports = new alertController()