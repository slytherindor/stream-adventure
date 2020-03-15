'use strict'

let stream = require('stream');
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

module.exports = function (counter) {
    let counts = {};
    const countCountries = new stream.Transform({
        transform(chunk, encoding, callback) {

            counts[chunk.country] = (counts[chunk.country] || 0) + 1;
            // We dont have to push anything because we are just
            // counting the countries here
            // When the counting is finish we set count on counter stream
            this.push();
            callback()
        }, writableObjectMode: true
    });
    countCountries.on('finish', function () {
        // counter here is writable stream because it is going
        // through transform. Therefore we can write/set counts on it
        counter.setCounts(counts);
    });

    let reduxer = new Dx(countCountries, counter, { writableObjectMode: true });
    return reduxer;
}