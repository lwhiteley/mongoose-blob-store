var test = require('tape');
var mongoose = require('mongoose');
var abstractBlobTests = require('abstract-blob-store/tests');
var BlobStore = require('./');

mongoose
  .connect('mongodb://localhost/mongoose-blob-store', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    test.onFinish(() => {
      mongoose.connection.close();
    });

    const common = {
      setup: function (t, cb) {
        const store = BlobStore({
          collection: 'attachments',
          modelName: 'Attachment',
          mongooseConnection: mongoose.connection,
        });
        cb(null, store);
      },
      teardown: function (t, store, blob, cb) {
        if (blob) {
          return store.remove(blob, cb);
        }
        return cb();
      },
    };
    abstractBlobTests(test, common);
  });
