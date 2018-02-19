var fs = require('fs')
var path = require('path')
var test = require('tape')
var mongoose = require('mongoose')
var abstractBlobTests = require('abstract-blob-store/tests')
var BlobStore = require('./')



  mongoose
  .connect('mongodb://localhost/mongoose-blob-store')
  .then(() => {

    test.onFinish(() => {
        mongoose.connection.close();
    })

    const common = {
        setup: function(t, cb) {
          const store = BlobStore({
            collection:'attachments',
            model:'Attachment',
            mongooseConnection: mongoose.connection
          });
          cb(null, store)
        },
        teardown: function(t, store, blob, cb) {
          if (blob) store.remove(blob, cb)
          else cb()
        }
      }
    abstractBlobTests(test, common);
  });

