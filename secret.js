'use strict'
let crypto = require('crypto');
let zlib = require('zlib');
let tar = require('tar');
let util = require("util");
const { Transform } = require('stream');

const notWorkingTransformation = new Transform({
    transform(chunk, encoding, cb) {
        this.push(chunk + " " + this.fileName + "\n");
        cb(null);
    },
    flush(callback) {
        this.push("FLUSHED");
        callback()
    },
    final(callback) {
        this.push("FINAL");
        callback()
    }
});

notWorkingTransformation.on('end', function () {
    console.log("END");
});


function formatFileAndHash(fileName) {
    Transform.call(this);
    this.file = fileName;
}

util.inherits(formatFileAndHash, Transform);

formatFileAndHash.prototype._transform = function (obj, encoding, cb) {
    this.push(obj + " " + this.file + "\n");
    cb();
}

let parser = new tar.Parse();
let stream = crypto.createDecipher(process.argv[2], process.argv[3]);
process.stdin.pipe(stream).pipe(zlib.createGunzip()).pipe(parser)
parser.on('entry', function (e) {
    if (e.type === "File") {
        let md5Stream = crypto.createHash('md5', { encoding: 'hex' });
        // TAKE - 1
        // e.pipe(md5Stream).on('data', function (data) {
        //     process.stdout.write(data + " " + e.path + "\n");
        // });

        // TAKE - 2
        // e.pipe(md5Stream).pipe(new formatFileAndHash(e.path)).pipe(process.stdout);

        // TAKE - 3
        notWorkingTransformation.fileName = e.path;
        e.pipe(md5Stream).pipe(notWorkingTransformation).pipe(process.stdout);
    } else {
        e.resume();
    }
});
