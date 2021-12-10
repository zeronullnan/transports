## Description

Service reads from some reader which should implement IReader interface.
Then write data to some transport which should implement ITransport interface.
Service use "fire-and-forget" principe.

## Config

`.env` file in the root directory of the project contains config variables.
This variables will be injected in `process.env`.
Also you can specify or replaced these values using environment-specific variables in the form of `NAME=VALUE`.

For example:

```dosini
USE_TRANSPORT=nats
FILES_READER_DIRS=./files
NATS_SERVERS=nats://127.0.0.1:4222
WS_PORT=3000
```

## Usage

```bash
npm i

# start service in development mode
npm start

# build project
npm run build
cp src/.env dist/
mkdir dist/files

# start built project
cd dist/
node index.js
```
