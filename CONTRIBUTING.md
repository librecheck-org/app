# Contributing to LibreCheck

## Development

### Restore dependencies

```bash
npm i
```

### Update API clients

When API definition changes, the client code should be updated with following command:

> TODO: Download the API definition from (.env --> API_BASE_URL) and copy it to openapi.json
> before running the OpenAPI CLI generator!

```bash
npm run generate-api-clients
```

## Maintenance

### Check OpenAPI client generator version

OpenAPI client generator should be kept updated.
Following command lists all available versions:

```bash
npm run list-openapi-generator-versions 
```

An updated version should be set into `openapitools.json`:

```json
{
  "$schema": "./node_modules/@openapitools/openapi-generator-cli/config.schema.json",
  "spaces": 4,
  "generator-cli": {
    "version": "7.0.1",
  }
}
```

After a new version has been set, API clients should be updated with the dedicated command.
