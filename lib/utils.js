const crypto = require('crypto');
const util = require('util');
const chars = ['1','2','3','4','5','6','7','8','9','0' ,'a','b','c','d','e','f'];

function _randomStr(length){
    var buffer = crypto.randomBytes(length/2);
    var byteLength =buffer.length;
    var offset = 0;
    var byte ;
    var value=[length];
    while (offset<byteLength){
        byte = buffer.readUInt8(offset);
        value[offset*2] =chars[byte & 15];
        value[offset*2+1] =chars[ (byte>>4) & 15];
        offset ++ ;
    }
    return value.join('');
}

exports.uuid = function(){
    return _randomStr(32);
};

exports.uuid_v4 = function(){
    return util.format( '%s-%s-%s-%s-%s',_randomStr(8),_randomStr(4),_randomStr(4),_randomStr(4),_randomStr(12));
};

