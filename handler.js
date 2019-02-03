const base58 = require('base58');
const { promisify } = require('util');
const dynamodb = require('./dynamodb');
// from https://stackoverflow.com/questions/50391825/cant-insert-data-into-dynamodb-using-new-nodejs-8-10
dynamodb.getPromise = promisify(dynamodb.get);
dynamodb.queryPromise = promisify(dynamodb.query);

module.exports.root = async () => ({
  statusCode: 301,
  headers: {
    Location: 'https://www.deepthoughtapp.com/',
  },
});

async function fetchShortURLFromLongURL(longurl) {
  const result = await dynamodb.queryPromise({
    TableName: process.env.TABLE_NAME,
    IndexName: process.env.TABLE_INDEX_NAME,
    KeyConditionExpression: 'longURL = :longurl',
    ExpressionAttributeValues: { ':longurl': longurl },
    Limit: 1,
  });

  if (result.Items
      && result.Items.length > 0) {
    return result.Items[0].id;
  }
  return null;
}

async function createShortURL(url) {
  // from https://martinstapel.com/how-to-autoincrement-in-dynamo-db-if-you-really-need-to/
  const counter = await dynamodb.updatePromise({
    // TODO: change to a dynamic name
    TableName: process.env.COUNTER_TABLE_NAME,
    ReturnValues: 'UPDATED_NEW',
    ExpressionAttributeValues: {
      ':a': 1,
    },
    ExpressionAttributeNames: {
      '#v': 'value',
    },
    UpdateExpression: 'SET #v = #v + :a',
    Key: {
      counterName: 'url-shortener',
    },
  });

  const uuid = base58.encode(counter.Attributes.value);

  await dynamodb.putPromise({
    TableName: process.env.TABLE_NAME,
    Item: {
      id: uuid,
      longURL: url,
      createdAt: new Date().getTime(),
    },
    ConditionExpression: 'attribute_not_exists(id)',
  });

  return uuid;
}

module.exports.create = async (event) => {
  dynamodb.putPromise = promisify(dynamodb.put);
  dynamodb.updatePromise = promisify(dynamodb.update);

  const data = JSON.parse(event.body);
  let uuid = null;

  try {
    const longurl = data.url;
    // Reuse an existing shorturl
    if (data.reuse) {
      uuid = await fetchShortURLFromLongURL(longurl);
      if (!uuid) {
        uuid = await createShortURL(longurl);
      }
    } else {
      uuid = await createShortURL(longurl);
    }
  } catch (error) {
    console.error(error);
  }

  if (!uuid) {
    return {
      statusCode: 500,
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      id: uuid,
    }),
  };
};


module.exports.redirect = async (event) => {
  const result = await dynamodb.getPromise({
    TableName: process.env.TABLE_NAME,
    Key: {
      uuid: event.pathParameters.base58id,
    },
  });

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
