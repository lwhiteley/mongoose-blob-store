const mime = require('mime-types')
const through2 = require('through2')
const duplexify = require('duplexify');
const debug = require('debug')('mongoose-blob-store');

module.exports = function (opts) {
    let self = {};
    let instance;
    const options = Object.assign({}, opts);
    const mongooseNotConnectedErr = new Error('Mongoose not connected!');

    if (!options.mongooseConnection) {
        throw new Error('options.mongooseConnection is required!');
    }

    const setup = function () {
        debug(`mongoose connected, readyState(${options.mongooseConnection.readyState})`);
        var gridfs = require('mongoose-gridfs')(options);
        instance = gridfs;
        debug('mongoose blob store ready');
    };

    debug(`mongoose readyState(${options.mongooseConnection.readyState})`);
    if (options.mongooseConnection.readyState == 1) {
        debug('mongoose already connected, setup blob store');
        setup();
    } else {
        debug('waiting on mongoose connection to setup blob store');
        options.mongooseConnection.on('connected', setup);
    }

    self.resource = () => {
        return self.storage().model;
    }

    self.storage = () => {
        if (instance) return instance;
        throw mongooseNotConnectedErr;
    }

    const sanitizeOpts = (opts) => {
        if(!opts) return opts;

        if (typeof opts === 'string'){
            opts = {
                key: opts,
            };
        }

        opts.filename = opts.filename || opts.key || opts.name;
        opts.key = opts.key || opts.filename || opts.name;
        return opts;
    }

    self.createWriteStream = function (opts, cb) {
        const proxy = through2();
        opts = sanitizeOpts(opts);
        var filename = opts.filename;
        var contentType;
        if (filename) {
            contentType = mime.lookup(filename);
        }
        const blob = {
            _id: opts.key,
            filename,
            contentType,
            metadata: opts,
        };

        self.resource().gridfs.write(
            blob,
            proxy,
            function (error, createdFile) {
                if (error) debug('error creating file', error);

                if (createdFile) {
                    createdFile.key = createdFile._id;
                }
                cb(error, createdFile);
            });

        return proxy;
    };

    self.createReadStream = function (opts) {
        var proxy = duplexify();
        opts = sanitizeOpts(opts);
        
        var stream = self.resource().readById(opts.key);
        proxy.on('error', (err) => {
            err.notFound = true;
            return proxy.destroy(err);
        });
        proxy.setReadable(stream);
        
        return proxy;
    };

    self.exists = function (opts, done) {
        var proxy = duplexify();
        opts = sanitizeOpts(opts);
        var stream = self.resource().readById(opts.key, (err, file) => {
            if (err && err.message && err.message.indexOf('not opened for writing') != -1) {
                debug('expected error when file is missing');
                err = null;
            }

            if (err) debug('error finding file', err);
            
            done(err, !!file);
        });
        return proxy;
    };

    self.remove = function (opts, cb) {
        const prop = '_id';
        opts = sanitizeOpts(opts);
        debug('calling remove file', opts);
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

