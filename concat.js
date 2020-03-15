'use strict'
let buffer = ""
process.stdin.on('data', function (data) {
    buffer = buffer + data
}).on('end', function () {
    process.stdout.write(buffer.toString().trim().split("").reverse().join(""));
})