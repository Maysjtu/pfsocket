const SocketServer = require('./lib/pfsock.js');

module.exports = SocketServer;

/*
一个简单的聊天室
无协议
body很简单 {操作}-{数据} 比如say-hello world\n
测试方式
终端1：
node --harmony demo.js
终端2：
telnet 127.0.0.1 8091
hello-\n
name-someone\n
say-hello someone is speaking\n

终端3:
telnet 127.0.0.1 8091
hello-\n
name-alia\n
say-hi there\n

*/
var app = new SocketServer();
const uuid = require('./lib/utils').uuid;
app.listen(8091,'127.0.0.1');
var initID = function (socket,next){
    var app = this;
    var id = uuid();
    socket.id = id;

    app.all_socket_map.set(id,socket);

    app.inChannels(socket,'all')
    socket.active_channel='all';
    next();

}
var parse = function(req,next){
    var string = req.raw_data.toString();
    var event = string.split('-')[0];
    var message = string.split('-')[1];
    req.event = event;
    req.message = message;
    next();

}


var auth = function(req,next){
    var app = this;

    if(req.socket.auth || req.event === 'hello'){
        next()
    } else {
        req.socket.write('bye you!\r\n');
        app.releaseSock(req.socket);

    }

}

var report = function(app,next){
    var all_sockets = app.channels.get('all');
    console.log('connected sock amount:',all_sockets.size);

}
var sayBye = function(socket,next){
    console.log('a new one escape ',socket.id)
    next();
}
var hello = function(req,next){
    console.log('auth :',req.socket.id,req.message);
    req.socket.write('hello you \r\n')
    req.socket.auth = true;
    next();
}
var putInChannel = function(req,next){
    var app = this;
    var channelName= req.message;
    app.inChannels(req.socket,channelName);
    req.socket.active_channel = channelName;

}
var say = function (req,next){
    var message= req.message;
    var channel_name = req.socket.active_channel;
    console.log('channel_name,',channel_name)
    app.broadcast(channel_name,`${req.socket.remoteAddress}:${req.socket.name || '匿名'} says: ${message} \r\n`);
    next();
}
var name = function (req,next){
    req.socket.name = req.message;
    next();
}

app
    .when('connect').then(initID).end()

    .when('data')
        .then(parse)
        .then(function(req,next){
            console.log(`${req.socket.remoteAddress} send: ${req.event}:${req.message}`);
            next();
        })
    .end(auth)

    .when('close').end(sayBye)

    .when('write')
        .then(function(res,next){
            if(typeof res.message ==='object'){
                res.message = JSON.stringify(res.message);
            }
            res.send(res.message);
        })
    .end()

    .recur('report').then(report).every(10000)

    .when('hello').then(hello).end()

    .when('in').then(putInChannel).end()

    .when('say').then(say).end()

    .when('wisper')
        .then(function(req,next){
            var app = this;
            var tmp = req.message.split(':');
            var to = tmp[0];
            var msg = tmp[1];
            app.notify(to,`${req.socket.remoteAddress}:${req.socket.name || '匿名'} wisper you: ${msg} `);
        })
    .end()

    .when('name').then(name).end()

    .when('list')
        .then(function(req,next){
            var channel_name = req.socket.active_channel;
            var list = [];
            var channel = this.channels.get(channel_name);
            for (var i of channel){

                list.push({id:i.id,name:i.name});
            }
            req.notify(list);
        })
    .end()



process.on('uncaughtException',function(err){
     console.log(err.stack);
})
