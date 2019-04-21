const { promisify } = require('util');
const AWS = require('aws-sdk');

let options = {};

// connect to local DB if running offline
if (process.env.IS_LOCAL ||
    process.env.IS_OFFLINE) {
  options = {
    region: 'localhost',
    endpoint: 'http://localhost:8000',
  };
}

const dynamodb = new AWS.DynamoDB.DocumentClient(options);
dynamodb.putPromise = promisify(dynamodb.put);

exports.init = async () => {
  const item = await dynamodb.putPromise({
    TableName: process.env.COUNTERS_TABLE,
    Item: {
      counterName: 'url-shortener',
      value: 30807, // require('base58').decode('aaa')
    },
    ConditionExpression: 'attribute_not_exists(counterName)',
  });
  return item;
};
