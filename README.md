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
- Reserve shortest URLs
  - Since using incremental ids, we can start from an offset
- Authentication using AWS IAM

Cannot use Go lang because you cannot invoke functions locally, though I didn't really use that for this.

## Warnings, Disclaimer, Gotchas

- I am new to all this serverless infrastructure. Keeping notes at:
  - https://www.aizatto.com/notes/serverless/
  - https://www.aizatto.com/notes/aws/
  - https://www.aizatto.com/notes/aws/dynamodb/
- This code isn't perfect. It's been cobbled from many different examples and sources you can find in the "Resources" section below.
- Not familiar with the best optimizations
- Serverless (as in the tool) will drop your tables if you change the name of the tables. You haev been warned.
- I don't fully understand the limitations of DynamoDB
  - Costs
  - Performance limitations
  - Scaling
  - Backup
  - [Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- Possible scaling problems
  - We are using a singular key to keep track of the counter

## TODOs, Bugs, Improvements, Features

- Fix naming
- Bugs
  1. Fix naming
  2. Prevent overwriting in DynamoDB
    - This will allow me to reserve words
- Features
  1. Implement custom domain support
  2. Consider authentication using Cognito
    - Cons: More infra to manage and understand
  3. Batch operation. Support submitting multiple urls
- Speed Improvement
  1. Hash URL to speed up`fetch or create`. I haven't tested lookup speeds using just URL. But I assume if I use a checksum of the URL I could get a minor speed improvement.
- Learn more about what I am doing
  - I really have no clue; but it works!

## Stack

- Serverless
- Node.js
- AWS IAM
- AWS Lambda
- AWS DynamoDB

# Requirements

Java

On Mac:

```sh
brew cask install java
```

# Install

Optional: Configure `secrets.json` (copy from `secrets.example.json`.

```sh
yarn install
sls dynamodb install --stage dev
```

# Start Offline

First run:

```sh
sls offline start --migrate --seed --stage dev --region ap-southeast-1
```

Subsequent runs:

```sh
sls offline start --stage dev --region ap-southeast-1
```

Sometimes it fails to start, what helps is reinstalling `dynamodb`:

```sh
rm .dynamodb/shared-local-instance.db
sls dynamodb remove
sls dynamodb install --stage dev
```

# Testing

```sh
curl -v http://localhost:3000/
```

## Create Short URL (Without Authentication)

`serverless-offline` doesn't support `aws_iam` authentication, so feel free to ignore if testing offline.

To disable authentication, disable/delete the `authorizer: aws_iam` line in `serverless.yml`

To test, call:


```sh
curl -v -H "Content-Type:application/json" http://localhost:3000/ --data "{ \"url\": \"http://example.com/$RANDOM\" }"
```

## Create Short URL (With Authentication)

Enable/Add the `authorizer: aws_iam` line in `serverless.yml`.

Because we need to authenticate in order to create a short url see (test.js is not yet implemented):

```sh
./test.js --region ap-southeast-1 http://localhost:3000/ http://example.com/$RANDOM
```

# Deploy

```sh
SLS_DEBUG=* sls deploy --stage dev --region ap-southeast-1
```

## With Custom Domain Name

```sh
SLS_DEPLOY=* sls create_domain --stage dev --region ap-southeast-1 --custom-domain-enabled true
SLS_DEPLOY=* sls deploy --stage dev --region ap-southeast-1 --custom-domain-enabled true
```

# Create IAM User

In order to use authentication you have to create a new user with the correct policy.

Visit https://console.aws.amazon.com/iam/home?#/users and create a user, I call it `url-shortener`.

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "execute-api:Invoke",
                "execute-api:InvalidateCache"
            ],
            "Resource": [
                "arn:aws:execute-api:*:*:$DOMAIN/$STAGE/POST"
            ]
        }
    ]
}
```

Replace $DOMAIN and $STAGE.

Use the `Access Key ID` and `Secret Access Key` to make requests to your endpoint.

https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-iam-policy-examples-for-api-execution.html

# Custom Domain

I couldn't use Namecheap because, AWS Custom Domain requires the `A Record` to support an `Alias Target`. So I pointed my Nameservers to AWS Route 53.

AWS Route 53 doesn't support `.app` domains, so I couldn't transfer the domain over.

- Create Route 53 Hosted Zone
- Get nameserver records
- Point nameservers in Namecheap to new custom records
- [Create ACM Certificate](https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-custom-domains-prerequisites.html)
- [Create Edge-Optimized Custom Domain Name](https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-edge-optimized-custom-domain-name.html)
  - If you do not want to use a subdomain, you can leave the `Name` field blank in `Create Record Set`

Command line to check NS:

```sh
host -t ns example.com
```

- https://serverless.com/blog/serverless-api-gateway-domain/

In `parameters.yml`

```sh
custom:
  customDomain:
    domainName: <registered_domain_name>
    basePath: ''
    stage: ${opt:stage}
    createRoute53Record: true
```

# Manual Setup

- DynamoDB
  - https://console.aws.amazon.com/dynamodb/
  - Backup
    - On-Demand Backup
    - Point-in-Time Recovery
      - Enable "Point-in-time Recovery"
      - Maximum 35 days
      - https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/PointInTimeRecovery_Howitworks.html
    - AWS Data Pipeline
      - https://docs.aws.amazon.com/datapipeline/latest/DeveloperGuide/dp-importexport-ddb-part2.html
  - Global Tables

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
        name: "url-shortener",
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
- https://console.aws.amazon.com/apigateway/home?region=ap-southeast-1#
- https://console.aws.amazon.com/cloudformation/home?region=ap-southeast-1
- https://console.aws.amazon.com/dynamodb/home?region=ap-southeast-1
- https://console.aws.amazon.com/lambda/home?region=ap-southeast-1#/functions
- https://console.aws.amazon.com/route53/home?region=ap-southeast-1
- https://console.aws.amazon.com/acm/home?region=us-east-1#/firstrun/

# Resources

- https://www.aizatto.com/code/aws/dynamodb
- https://www.aizatto.com/code/serverless
- https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB.html
- https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_AttributeDefinition.html
- https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-cognito-userpool.html#cfn-cognito-userpool-poolname
- https://github.com/serverless/examples/blob/master/aws-node-rest-api-with-dynamodb-and-offline/
- https://martinstapel.com/how-to-autoincrement-in-dynamo-db-if-you-really-need-to/
- https://serverless.com/framework/docs/providers/aws/guide/resources/#configuration
- https://stackoverflow.com/questions/50391825/cant-insert-data-into-dynamodb-using-new-nodejs-8-10
- https://serverless-stack.com/
- https://serverless.com/framework/docs/providers/aws/events/cognito-user-pool/

# Serverless Plugins

- https://www.npmjs.com/package/serverless-dynamodb-local
- https://www.npmjs.com/package/serverless-offline


# Base58 Decode

- https://en.wikipedia.org/wiki/Base58
- Using initial offset of `asa` or `31793`
- Using `asa` so I start with using the left side of the keyboard
- I want to start with an offset to reserve shorter urls

# Developer Notes

Why JavaScript?

- I originally wanted to use Go Lang because:
  - I like the language
  - Typesafe
  - Reusable skills for building other backend/frontend systems
  - No Promises, or indent hell
  - `gofmt` for consistency
- Unfortunately "serverless-offline" doesn't support Go Lang
- I was already familiar with JavaScript

Naming conventions:

- `${stage}` as a prefix
  - API Gateway uses it as the basepath, so I figure we should just use it in the beginning
  - Visually groups the same stage together

Should the default be to reuse a shorturl or create a new one?

- Currently opting to create a new one

Why did you not use Cognito?

- I didn't want to manage yet another service
- I didn't want to learn more
- I didn't want to increase complexity
- Focusing on MVP
