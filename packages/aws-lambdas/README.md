# Install 

```sh
yarn install
```

# Local Development

```sh
sls offline start --stage dev --region ap-southeast-1
```

Access http://localhost:3000/

# Test

```sh
sls invoke local --function create -s dev -r ap-southeast-1 --data '{"url":"http://example.com"}'
```

# Deploy

```sh
SLS_DEBUG=* sls deploy -s dev -r ap-southeast-1
```
