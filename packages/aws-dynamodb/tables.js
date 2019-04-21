module.exports = (serverless) => {
  const tables = {
    COUNTERS_TABLE: 'counters',
    URLS_TABLE: 'urls',
    LONGURL_INDEX: 'longurl',
  };

  if (serverless.pluginManager.cliCommands[0] !== 'deploy') {
    return tables;
  }

  const stage = serverless.pluginManager.cliOptions['stage'];

  // need to test if I don't use the provider stage
  const PREFIX = `url-shortener-${stage}`;

  const deployed_tables = {};
  for (const key in tables) {
    const table = tables[key];
    deployed_tables[key] = `${PREFIX}-${table}`
  }

  return deployed_tables;
}
