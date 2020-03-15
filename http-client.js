'use strict'
var request = require('request');
let resp = request.post('http://localhost:8099')
process.stdin.pipe(resp).pipe(process.stdout);