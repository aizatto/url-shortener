import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as base58 from 'base58';
import 'source-map-support/register';

const { client: dynamodb } = require('./dynamodb');

export const root = async () => ({
  statusCode: 301,
  headers: {
    Location: 'https://www.deepthoughtapp.com/',
  },
});

async function fetchShortURLFromLongURL(longurl: string): Promise<string | null> {
  const result = await dynamodb.queryPromise({
    TableName: process.env.URLS_TABLE,
    IndexName: process.env.LONGURL_INDEX,
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

async function createShortURL(url: string, name?: string): Promise<string> {
  let id = null;
  if (name) {
    // limitations to the name;
    // - needs to be url friendly
    // - no spaces
    // - only ascii
    //
    // Can test at regexr.com/47rmm
    const invalidCharacters = name.match(/[^a-zA-Z0-9-_]/g);
    if (invalidCharacters) {
      throw new Error(`Invalid characters in name: ${invalidCharacters.join(', ')}`);
    }
    id = name;
  } else {
    // from https://martinstapel.com/how-to-autoincrement-in-dynamo-db-if-you-really-need-to/
    const counter = await dynamodb.updatePromise({
      // TODO: change to a dynamic name
      TableName: process.env.COUNTERS_TABLE,
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

    id = base58.encode(counter.Attributes.value);
  }

  await dynamodb.putPromise({
    TableName: process.env.URLS_TABLE,
    Item: {
      id,
      longURL: url,
      createdAt: new Date().toISOString(),
    },
    ConditionExpression: 'attribute_not_exists(id)',
  });

  return id;
}

export const create = async (
  {url, name, reuse}: { url: string, name?: string, reuse?: boolean }
): Promise<APIGatewayProxyResult> => {
  let uuid = null;

  try {
    const longurl = url;
    // Reuse an existing shorturl
    if (reuse) {
      uuid = await fetchShortURLFromLongURL(longurl);
      if (!uuid) {
        uuid = await createShortURL(longurl, name);
      }
    } else {
      uuid = await createShortURL(longurl, name);
    }
  } catch (error) {
    console.error(error);
  }

  if (!uuid) {
    return {
      statusCode: 500,
      body: null,
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      id: uuid,
      url: `${process.env.ENDPOINT}${uuid}`,
    }),
  };
};

export const redirect = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const id = event.pathParameters.id;
  const result = await dynamodb.getPromise({
    TableName: process.env.URLS_TABLE,
    Key: {
      id,
    },
  });

  if (!result.Item) {
    // Technically if the item doesn't exist it should be a 404
    // But that isn't a really user friendly.
    // We should ideally hand them over to a page
    return {
      statusCode: 301,
      headers: {
        Location: `https://www.deepthoughtapp.com/search/?q=${id}`,
      },
      body: null,
    };
  }

  return {
    statusCode: 301,
    headers: {
      Location: result.Item.longURL,
    },
    body: null,
  };
};
