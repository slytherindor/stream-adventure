'use strict'
let trumpet = require('trumpet');
const { Transform } = require('stream');
let tr = trumpet();

const uppercaserer = new Transform({
    transform(chunk, encoding, callback) {
        this.push(chunk.toString().toUpperCase());
        callback();
    }
});

let stream = tr.select('.loud').createStream();
stream.pipe(uppercaserer).pipe(stream);
process.stdin.pipe(tr).pipe(process.stdout);
