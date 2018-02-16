const mime = require('mime-types')
const through2 = require('through2')
const duplexify = require('duplexify');
var debug = require('debug')('mongoose-blob-store');

module.exports = function (opts) {
    let self = {};
    let instance;
    const options = Object.assign({}, opts);

    options.mongooseConnection.on('connected', function () {
        var gridfs = require('mongoose-gridfs')(options);
        instance = gridfs;
        debug('mongoose connected');
    });


    self.resource = () => {
        if (instance) return instance.model;
        throw new Error('Mongoose was never connected!');
    }

    self.storage = () => {
        if (instance) return instance;
        throw new Error('Mongoose was never connected!');
    }

    self.createWriteStream = function (opts, cb) {
        const proxy = through2();
        var filename = opts.filename || opts.key;
        var contentType;
        if (filename) {
            contentType = mime.lookup(filename);
        }

        self.resource().gridfs.write({
            _id: opts.key,
            filename,
            contentType,
            metadata: opts,
        },
        proxy,
        function (error, createdFile) {
            if (error) debug('error creating file', error);
            cb(error, createdFile);
        });

        return proxy;
    };

    self.createReadStream = function (opts) {
        var proxy = duplexify();
        var stream = self.resource().readById(opts.key);
        proxy.setReadable(stream);
        return proxy;
    };

    self.remove = function (opts, cb) {
        const prop = '_id';
        self.storage().unlink({ [prop]: opts.key }, function (error) {
            let result;
            if (!error) {
                result = { id: opts.key };
            } else {
                debug('error removing file', error);
            }
            cb(error, result);
        });
    };

    return self;

};

