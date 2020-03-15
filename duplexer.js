'use strict'
let spawn = require('child_process').spawn;
let Stream = require('stream');

require("util").inherits(Dx, Stream.Duplex);

function Dx(stdin, stdout) {
    Stream.Duplex.call(this);
    this.stdin = stdin;
    this.stdout = stdout;

    this._waiting = false;
    let self = this;

    // Once the write is finished on writeable stream
    // end the stream to avoid memory leak
    stdin.once("finish", function () {
        self.end();
    });

    // Once this duplex stream is finished 
    // end the writeable stream attached to it
    // to avoid memory leak
    this.once("finish", function () {
        stdin.end();
    });

    // When the readable stream is readable
    // let it's consumer read if he is waiting
    stdout.on("readable", function () {
        if (self._waiting) {
            self._waiting = false;
            self._read();
        }
    });

    // Once the readable stream ends,
    // notify it's consumer about it
    stdout.once("end", function () {
        self.push(null);
    });

    // Emit error when there is error on writable stream
    stdin.on("error", function (err) {
        self.emit("error", err);
    });

    // Emit error when there is error on readable stream
    stdout.on("error", function (err) {
        self.emit("error", err);
    });

    // Write to the writeable stream
    this._write = function (chunk, enc, cb) {
        this.stdin.write(chunk, enc, cb);
    };

    // Provide data to the consumer of readable stream
    self._read = function (size) {
        var buf;
        var reads = 0;
        while ((buf = this.stdout.read()) !== null) {
            this.push(buf);
            reads++;
        }
        if (reads === 0) {
            this._waiting = true;
        }
    };
}

module.exports = function (cmd, args) {
    let ps = spawn(cmd, args);

    // TAKE - 1
    let stream = new Dx(ps.stdin, ps.stdout);
    return stream;

    // TAKE - 2

    // let stream = new Stream();
    // stream.write = function (chunk, enc, cb) { ps.stdin.write(chunk, enc, cb); }
    // stream.end = function (chunk, enc, cb) { ps.stdin.end(chunk, enc, cb); }
    // ps.stdout.on("data", function (chunk) { stream.emit("data", chunk); });
    // ps.stdout.on("end", function () { stream.emit("end"); });
    // return stream;
}

