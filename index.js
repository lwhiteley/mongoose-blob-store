const mime = require('mime-types');
const itypeof = require('itypeof');
const through2 = require('through2');
const duplexify = require('duplexify');
const debug = require('debug')('mongoose-blob-store');
const { createModel } = require('mongoose-gridfs');

module.exports = function (opts) {
  let self = {};
  let instance;
  const options = Object.assign({}, opts);
  const mongooseNotConnectedErr = new Error('Mongoose not connected!');

  if (!options.mongooseConnection) {
    throw new Error('options.mongooseConnection is required!');
  }

  const setup = function () {
    debug(
      `mongoose connected, readyState(${options.mongooseConnection.readyState})`,
    );
    instance = createModel(options);
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
    return self.storage();
  };

  self.storage = () => {
    if (instance) return instance;
    throw mongooseNotConnectedErr;
  };

  const sanitizeOpts = (opts) => {
    if (!opts) return opts;

    const type = itypeof(opts, true);

    if (type === 'string' || type === 'ObjectID') {
      opts = {
        _id: opts,
        key: opts.toString(),
      };
    }

    opts.filename = opts.filename || opts.key || opts.name;
    opts.key = opts.key || opts.filename || opts.name;
    opts._id = opts._id || opts.key || opts.filename;
    return opts;
  };

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

    self.resource().write(blob, proxy, function (error, createdFile) {
      if (error) debug('error creating file', error);

      if (createdFile) {
        createdFile.key = createdFile._id;
      }

      debug('.createWriteStream: createdFile', createdFile);
      cb(error, createdFile);
    });

    return proxy;
  };

  self.createReadStream = function (opts) {
    var proxy = duplexify();
    opts = sanitizeOpts(opts);
    debug('.createReadStream: checking opts', opts);

    var stream = self.resource().read(opts);
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
    debug('.exists: checking opts', opts);
    self.resource().read(opts, (err, file) => {
      if (err && err.code && err.code === 'ENOENT') {
        debug('expected error when file is missing');
        err = null;
      }

      if (err) {
        debug('error finding file', err);
      }

      done(err, !!file);
    });
    return proxy;
  };

  self.remove = function (opts, cb) {
    opts = sanitizeOpts(opts);
    debug('.remove: checking opts', opts);
    self.storage().unlink(opts, function (error) {
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
