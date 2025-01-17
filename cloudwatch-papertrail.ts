import * as AwsLambda from 'aws-lambda'
import * as zlib from 'zlib'
import * as winston from 'winston'
import 'winston-papertrail'

function unarchiveLogData(payload: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    zlib.gunzip(payload, function (err, result) {
      if (err) {
        return reject(err);
      } else {
        return resolve(result)
      }
    })
  }).then(rawData => {
    return JSON.parse(rawData.toString('utf8'));
  })
}

interface CloudwatchLogGroupsEvent {
  awslogs: {
    data: string
  }
}

interface LogMessage {
  id: string
  timestamp: number
  message: string
}

interface LogData {
  owner: string
  logGroup: string
  logStream: string
  subscriptionFilters: string[],
  messageType: string
  logEvents: LogMessage[]
}

function getEnvVarOrFail(varName: string): string {
  const value = process.env[varName];
  if (!value) {
    throw new Error(`Required environment variable ${varName} is undefined`)
  }
  return value
}

const logLevelRegex = new RegExp(getEnvVarOrFail('LOG_LEVEL_REGEX'));

export function parseLogLevel(tsvMessage: string): string | null {
  const match = logLevelRegex.exec(tsvMessage);

  return match && match[0].toLowerCase();
}

export const handler: AwsLambda.Handler = (event: CloudwatchLogGroupsEvent, context, callback) => {
  const host = getEnvVarOrFail('PAPERTRAIL_HOST');
  const port = getEnvVarOrFail('PAPERTRAIL_PORT');
  const shouldParseLogLevels = getEnvVarOrFail('PARSE_LOG_LEVELS') === "true";
  const payload = new Buffer(event.awslogs.data, 'base64');

  unarchiveLogData(payload)
    .then((logData: LogData) => {
      console.log("Got log data");
      console.log(logData);

      const papertrailTransport = new winston.transports.Papertrail({
        host,
        port,
        program: logData.logStream,
        hostname: logData.logGroup,
        flushOnClose: true,
        colorize: true,
        level: 'debug'
      });

      const logger = new (winston.Logger)({
        transports: [papertrailTransport],
      });

      logData.logEvents.forEach(function (event) {
        const logLevel = shouldParseLogLevels
          ? parseLogLevel(event.message) || 'info'
          : 'info';

        logger.log(logLevel, event.message);
      });

      logger.close();
      return callback!(null);
    })
    .catch(callback!)
};