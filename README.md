# mongoose-blob-store

store blobs using mongoose gridfs

[![npm version](https://badge.fury.io/js/mongoose-blob-store.svg)](https://badge.fury.io/js/mongoose-blob-store)
[![Build Status](https://travis-ci.org/lwhiteley/mongoose-blob-store.svg?branch=master)](https://travis-ci.org/lwhiteley/mongoose-blob-store)

[![blob-store-compatible](https://raw.githubusercontent.com/maxogden/abstract-blob-store/master/badge.png)](https://github.com/maxogden/abstract-blob-store)

compatible with the [abstract-blob-store](https://github.com/maxogden/abstract-blob-store) API and passes its test suite

eg. Usage

> Please note that the configuration has a breaking change since v0.\*

```js
const store = require('mongoose-blob-store');
// connect mongoose to mongo db then use the connection
const mongooseConnection = require('mongoose').connection;
const blobStorage = store({
  mongooseConnection,
  collection: 'attachments',
  modelName: 'Attachment',
});

//write
blobStorage.createWriteStream(opts, cb);

//read
const stream = blobStorage.createReadStream(opts);

//remove
blobStorage.remove(opts, cb);

//check if file exists
blobStorage.exists(opts, cb);
```

pull requests are welcome
