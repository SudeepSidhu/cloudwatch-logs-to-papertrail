"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zlib = require("zlib");
const winston = require("winston");
require("winston-papertrail");
function unarchiveLogData(payload) {
    return new Promise((resolve, reject) => {
        zlib.gunzip(payload, function (err, result) {
            if (err) {
                return reject(err);
            }
            else {
                return resolve(result);
            }
        });
    }).then(rawData => {
        return JSON.parse(rawData.toString('utf8'));
    });
}
function getEnvVarOrFail(varName) {
    const value = process.env[varName];
    if (!value) {
        throw new Error(`Required environment variable ${varName} is undefined`);
    }
    return value;
}
exports.handler = (event, context, callback) => {
    const host = getEnvVarOrFail('PAPERTRAIL_HOST');
    const port = getEnvVarOrFail('PAPERTRAIL_PORT');
    const payload = new Buffer(event.awslogs.data, 'base64');
    unarchiveLogData(payload)
        .then((logData) => {
        console.log("Got log data");
        console.log(logData);
        const papertrailTransport = new winston.transports.Papertrail({
            host,
            port,
            program: logData.logGroup,
            hostname: logData.logStream,
            flushOnClose: true,
        });
        const logger = new (winston.Logger)({
            transports: [papertrailTransport]
        });
        logData.logEvents.forEach(function (line) {
            logger.info(line.message);
        });
        logger.close();
        return callback(null);
    })
        .catch(callback);
};