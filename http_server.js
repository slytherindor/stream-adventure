'use strict'
var http = require('http');
const { Transform } = require('stream');

const uppercaserer = new Transform({
    transform(chunk, encoding, callback) {
        this.push(chunk.toString().toUpperCase());
        callback();
    }

});
let server = http.createServer(function (req, res) {
    if (req.method === 'POST') {
        req.pipe(uppercaserer).pipe(res);
    }

});
server.listen(process.argv[2]);

