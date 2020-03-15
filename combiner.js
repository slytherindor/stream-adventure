'use strict'
let stream = require('stream');
let zlib = require('zlib');
require("util").inherits(Dx, stream.Duplex);

function Dx(writable, readableStream, args) {
    stream.Duplex.call(this, args);
    this.writable = writable;
    this.readableStream = readableStream;

    this._waiting = false;
    let self = this;

    // Once the write is finished on writeable stream
    // end the stream to avoid memory leak
    writable.once("finish", function () {
        self.end();
    });

    // Once this duplex stream is finished 
    // end the writeable stream attached to it
    // to avoid memory leak
    this.once("finish", function () {
        writable.end();
    });

    // When the readable stream is readable
    // let it's consumer read if he is waiting
    readableStream.on("readable", function () {
        if (self._waiting) {
            self._waiting = false;
            self._read();
        }
    });

    // Once the readable stream ends,
    // notify it's consumer about it
    readableStream.once("end", function () {
        self.push(null);
    });

    // Emit error when there is error on writable stream
    writable.on("error", function (err) {
        self.emit("error", err);
    });

    // Emit error when there is error on readable stream
    readableStream.on("error", function (err) {
        self.emit("error", err);
    });

    // Write to the writeable stream
    this._write = function (chunk, enc, cb) {
        this.writable.write(chunk, enc, cb);
    };

    // Provide data to the consumer of readable stream
    self._read = function (size) {
        var buf;
        var reads = 0;
        while ((buf = this.readableStream.read()) !== null) {
            this.push(buf);
            reads++;
        }
        if (reads === 0) {
            this._waiting = true;
        }
    };
}

module.exports = function () {
    let genreList = {};
    let combinedList = [];
    const combineGenres = new stream.Transform({
        transform(chunk, encoding, callback) {
            let obj = JSON.parse(chunk);
            if (obj.type === 'genre') {
                if (Object.keys(genreList).length) {
                    combinedList.push(genreList);
                    this.push(JSON.stringify(genreList) + "\n");
                    genreList = {};
                }
                genreList.name = obj.name;
            } else if (obj.type === 'book') {
                if (genreList.books === undefined) {
                    genreList.books = [];
                }
                genreList.books.push(obj.name);
            }
            callback()
        }, writableObjectMode: true
    });
    combineGenres._flush = function (callback) {
        this.push(JSON.stringify(genreList) + "\n");
        callback();
    }
    let zip = zlib.createGzip()
    combineGenres.pipe(zip);
    return new Dx(combineGenres, zip);
}