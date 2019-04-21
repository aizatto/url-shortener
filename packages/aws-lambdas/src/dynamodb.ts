import { promisify } from 'util';

const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

let options = {};

// connect to local DB if running offline
if (process.env.IS_LOCAL ||
    process.env.IS_OFFLINE) {
  options = {
    region: 'localhost',
    endpoint: 'http://localhost:8000',
  };
}

export const client = new AWS.DynamoDB.DocumentClient(options);
client.getPromise = promisify(client.get);
client.queryPromise = promisify(client.query);
client.putPromise = promisify(client.put);
client.updatePromise = promisify(client.update);
