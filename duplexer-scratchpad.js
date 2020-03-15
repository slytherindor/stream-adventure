'use strict'
let util = require("util");
let stream = require('stream');

require("util").inherits(Dx, stream.Duplex);

function Dx(stdin, stdout, args) {
    stream.Duplex.call(this, args);
    this.stdin = stdin;
    this.stdout = stdout;

    this._waiting = false;
    let self = this;

    // Once the write is finished on writeable stream
    // end the stream to avoid memory leak
    stdin.once("finish", function() {
        self.end();
      });
    
    // Once this duplex stream is finished 
    // end the writeable stream attached to it
    // to avoid memory leak
    this.once("finish", function() {
        stdin.end();
    });

    // When the readable stream is readable
    // let it's consumer read if he is waiting
    stdout.on("readable", function() {
        if (self._waiting) {
          self._waiting = false;
          self._read();
        }
      });
    
    // Once the readable stream ends,
    // notify it's consumer about it
    stdout.once("end", function() {
        self.push(null);
      });
    
    // Emit error when there is error on writable stream
    stdin.on("error", function(err) {
        self.emit("error", err);
    });

    // Emit error when there is error on readable stream
    stdout.on("error", function(err) {
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





function StringifyStream(){
    stream.Transform.call(this);

    this._readableState.objectMode = false;
    this._writableState.objectMode = true;
}
util.inherits(StringifyStream, stream.Transform);


let counts = {};
StringifyStream.prototype._transform = function(obj, encoding, cb){
    counts[obj.country] = (counts[obj.country] || 0) + 1;
    this.push(JSON.stringify(obj));
    // console.log(counts)
    cb();
}


var rs = new stream.Readable({ objectMode: true });
rs.setCounts = function (counts) {
    var self = this;
    Object.keys(counts).sort().forEach(function (key) {
        self.push(key + ' => ' + counts[key] + '\n');
    });
    this.push(null);
};
rs.push({"short":"OH","name":"Ohio","country":"US"});
rs.push({"name":"West Lothian","country":"GB","region":"Scotland"});
rs.push({"short":"NSW","name":"New South Wales","country":"AU"});
rs.push(null);
// var ss = new StringifyStream()
// ss.on('end', function(){
//     console.log(counts);
// });
// rs.pipe(ss).pipe(process.stdout);



function countryCounter(counter) {
    let counts = {};
    const countCountries = new stream.Transform({transform(chunk, encoding, callback) {
        counts[chunk.country] = (counts[chunk.country] || 0) + 1;
        this.push(JSON.stringify(chunk));
        callback()
    }, writableObjectMode: true
    });
    countCountries.on('end', function(){
        counter.setCounts(counts);
    });

    counter.pipe(countCountries).pipe(process.stdout);

}

countryCounter(rs);