# URL Shortener

Goal of this project:

- Create a URL Shortener
- Keep the cost of running it cheap
- Experiment with AWS Lambda and DynamoDB for my own learning
- Create an example that other people can learn from
- Really short URLs
  - Achieving this via using base58 on incremental ids
  - Incremental IDs
  - I think this is OK because I am not planning to have that many urls

Cannot use Go lang because you cannot invoke functions locally, though I didn't really use that for this.

# TODO / Bugs

- Authentication
  - At the moment anyone can create a short url
- Implement custom domain support
- Fix dynamodb local seeding
- Learn more about what I am doing
  - I really have no clue; but it works!

# Stack

- Serverless
- Node.js
- AWS Lambda
- AWS DynamoDB

# Requirements

Java

On Mac:

```sh
brew cask install java
```

# Install

```sh
yarn install
sls dynamodb install
```

# Start

```sh
sls offline start --stage dev --region ap-southeast-1
```

# Deploy

```sh
SLS_DEBUG=* sls deploy --stage dev --region ap-southeast-1
```

## You need to seed the counter

# Testing

## Default

```sh
curl -v http://localhost:3000/
```

```sh
curl -v -H "Content-Type:application/json" http://localhost:3000/ --data "{ \"url\": \"http://example.com/$RANDOM\" }"
```

```sh
curl -v http://localhost:3000/2
```

# DynamoDB Shell

http://localhost:8000/shell/

List Tables:

```js
var params = {
    Limit: 5, // optional (to further limit the number of table names returned per page)
};
dynamodb.listTables(params, function(err, data) {
    if (err) ppJson(err); // an error occurred
    else ppJson(data); // successful response
});
```

Scan Tables:

```js
var params = {
    TableName: 'counters-dev'
}
dynamodb.scan(params, function(err, data) {
    if (err) ppJson(err); // an error occurred
    else ppJson(data); // successful response
});
```

Put Item:

```js
var params = {
    TableName: 'counters-dev',
    Item: {
        name: "url-shortener"
        value: -1,
    },
    ReturnValues: "ALL_OLD",
}
docClient.put(params, function(err, data) {
    if (err) ppJson(err); // an error occurred
    else ppJson(data); // successful response
});
```

Get Item:

```js
var params = {
    TableName: 'url-shortener-dev',
    Key: { // a map of attribute name to AttributeValue
        uuid: "1",
    },
};
docClient.get(params, function(err, data) {
    if (err) ppJson(err); // an error occurred
    else ppJson(data); // successful response
});
```

# AWS Console Links

- https://console.aws.amazon.com/iam/home
- https://ap-southeast-1.console.aws.amazon.com/cloudformation/home?region=ap-southeast-1
- https://ap-southeast-1.console.aws.amazon.com/dynamodb/home?region=ap-southeast-1
- https://ap-southeast-1.console.aws.amazon.com/lambda/home?region=ap-southeast-1#/functions

# Resources

- https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB.html
- https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_AttributeDefinition.html
- https://github.com/serverless/examples/blob/master/aws-node-rest-api-with-dynamodb-and-offline/
- https://martinstapel.com/how-to-autoincrement-in-dynamo-db-if-you-really-need-to/
- https://serverless.com/framework/docs/providers/aws/guide/resources/#configuration
- https://stackoverflow.com/questions/50391825/cant-insert-data-into-dynamodb-using-new-nodejs-8-10

# Serverless Plugins

- https://www.npmjs.com/package/serverless-dynamodb-local
- https://www.npmjs.com/package/serverless-offline


# Base58 Decode

- https://en.wikipedia.org/wiki/Base58
- Using initial offset of `asa` or `31793`
- Using `asa` so I start with using the left side of the keyboard
- I want to start with an offset to reserve shorter urls
