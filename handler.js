const base58 = require('base58');
const { promisify } = require('util');
const dynamodb = require('./dynamodb');

module.exports.root = async () => ({
  statusCode: 301,
  headers: {
    Location: 'https://www.deepthoughtapp.com/',
  },
});

module.exports.create = async (event) => {
  // from https://stackoverflow.com/questions/50391825/cant-insert-data-into-dynamodb-using-new-nodejs-8-10
  dynamodb.putPromise = promisify(dynamodb.put);
  dynamodb.updatePromise = promisify(dynamodb.update);

  const data = JSON.parse(event.body);

  // from https://martinstapel.com/how-to-autoincrement-in-dynamo-db-if-you-really-need-to/
  const counter = await dynamodb.updatePromise({
    TableName: 'counters-dev',
    ReturnValues: 'UPDATED_NEW',
    ExpressionAttributeValues: {
      ':a': 1,
    },
    ExpressionAttributeNames: {
      '#v': 'value',
    },
    UpdateExpression: 'SET #v = #v + :a',
    Key: {
      name: 'url-shortener',
    },
  });

  const uuid = base58.encode(counter.Attributes.value);

  await dynamodb.putPromise({
    TableName: process.env.DYNAMODB_TABLE,
    Item: {
      uuid,
      url: data.url,
      createdAt: new Date().getTime(),
    },
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      uuid,
    }),
  };
};

module.exports.redirect = async (event) => {
  dynamodb.getPromise = promisify(dynamodb.get);

  const result = await dynamodb.getPromise({
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      uuid: event.pathParameters.base58id,
    },
  });

  // This doesn't throw an exception if it doesn't find something
  if (!result.Item) {
    // Technically if the item doesn't exist it should be a 404
    // But that isn't a really user friendly.
    // We should ideally hand them over to a page
    return {
      statusCode: 404,
    };
  }

  return {
    statusCode: 301,
    headers: {
      Location: result.Item.url,
    },
  };
};
