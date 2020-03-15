'use strict'
const { Transform } = require('stream');

const uppercaserer = new Transform({
        transform(chunk, encoding, callback) {
                this.push(chunk.toString().toUpperCase());
                callback();
        }

});
process.stdin.pipe(uppercaserer).pipe(process.stdout);