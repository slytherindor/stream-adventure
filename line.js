'use strict'
const { Transform } = require('stream');

let count = 0;
const caseChanger = new Transform({
    transform(chunk, encoding, callback) {
        count++;
        if (count % 2 == 0) {
            this.push(chunk.toString().toUpperCase())
        } else {
            this.push(chunk.toString().toLowerCase());
        }
        callback();
    }

});
process.stdin.pipe(caseChanger).pipe(process.stdout);