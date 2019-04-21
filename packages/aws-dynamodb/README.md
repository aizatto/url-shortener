# Install 

```sh
yarn install
sls dynamodb install --stage dev
```

# Start local DynamoDB

```sh
sls dynamodb start --migrate --seed --stage dev --region ap-southeast-1
```

# Deploy

```sh
SLS_DEBUG=* sls deploy -s dev -r ap-southeast-1
```

# Init Counter

- Using initial offset of
  - `aaa` for `30807`
  - `asa` for `31793`

Local:

```sh
sls invoke local --function init -s dev -r ap-southeast-1
```

AWS (dev):

```sh
aws lambda invoke --function-name url-shortener-dev-dynamodb-init /dev/stdout
```

AWS (prod):

```sh
aws lambda invoke --function-name url-shortener-prod-dynamodb-init /dev/stdout
```

