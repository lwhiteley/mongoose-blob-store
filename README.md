mongoose-blob-store
==================

store blobs using mongoose gridfs

[![npm version](https://badge.fury.io/js/mongoose-blob-store.svg)](https://badge.fury.io/js/mongoose-blob-store)

eg. Usage

```js
    const store = require('mongoose-blob-store');
    const mongooseConnection = require('mongoose').connection;
    const blobStorage = store({
        mongooseConnection,
        collection: 'attachments',
        model: 'Attachment',
    });

    //write
    blobStorage.createWriteStream(opts, cb);

    //read
    const stream = blobStorage.createReadStream(opts);

    //remove
    blobStorage.remove(opts, cb);
```

pull requests are welcome


