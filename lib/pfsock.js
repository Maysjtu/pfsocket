'use strict';

const net = require('net');
const _ = require('lodash');
const CallList = require('./call_list.js');
const defaults = require('./default.js');
//const uuid = require('./util').uuid;

class Reesock{
    constructor (option) {
        option = option || {};
        var self = this;
        var timer_interval = option.timer_interval || 5000;
        self.info = option.info;
        self._option = _.assign(option, {keepAlive:[true,50000],timeout:5000} );

        self.all_socket_map = new Map();
        self.channels = new Map();
        self.all_socket = new Set();
        self.channels.set("all",self.all_socket);
        var default_socket_handler = {};
        Object
            .keys(defaults.socket_handler)
            .forEach( call_name=>{
                default_socket_handler[call_name] = defaults.socket_handler[call_name].bind(self);
            })

        self._socket_handler = option.socket_handler || default_socket_handler;

        self._call_list = {};
        self._call_list.data = new CallList(option.call_list && option.call_list.data || [] );
        self._call_list.close = new CallList(option.call_list && option.call_list.close || []);
        self._call_list.timer = new CallList(option.call_list && option.call_list.timer || []);
        self._call_list.write = new CallList(option.call_list && option.call_list.write || []);



        if(option.call_list ){

            Object
                .keys(option.call_list)
                .filter(call_type=> _.indexOf(['data','close','timer','writer'],call_type)===-1)
                .forEach(custom_call=>{
                    self._call_list[custom_call] = new CallList(option.call_list[custom_call]);
                })
        }

        self.server = net.createServer(option.server || Reesock._netServer.bind(self));


        self._timers = new Map();


    }

    recur(topic){

        var type = `timer:${topic}`;
        var self = this;
        return {
            type:type,
            then:function(then_call){
                self._next(this.type,then_call);
                return this;
            },
            every:function(interval){
                //if(then_call){
                    //self._next(this.type,then_call);
                //}

                var _this = this;
                var timer = setInterval(function(){
                    self._pass(_this.type,self,function(){console.log('ever done')})
                },interval);
                self._timers.set(this.type,timer)
                return self;
            }

        }
    }

    broadcast(channel_name,msg){
        var self = this;
        channel_name = (channel_name instanceof Set) ? channel_name : new Set([channel_name]);
        for(var item of channel_name){
            var channel = self.channels.get(item);
            if(channel){
                for(var socket of channel){
                    self.send(socket,msg);
                }

            }
        }

        //var self = this;
        //if( channel_name instanceof Array ){
            //channel_name.forEach(channel_name_item =>{
                //self.broadcast(channel_name_item,msg);
            //})
        //} else {
            //var channel = this.channels.get(channel_name);

            //if(channel){
                //for(var socket of this.channels){
                    //this.send(socket,msg);
                //}
            //}
        //}
    }
    notify(id,msg){
        var socket = this.all_socket_map.get(id);
        if(socket){
            this.send(socket,msg);
        }
    }
    send(socket,msg){
        var self = this;
        this._pass('write',{socket:socket,message:msg,send:function(send_msg){
            if(this.socket.writable){
                this.socket.write(send_msg);
            }else {
                self.releaseSock(socket);
            }
        }});
    }

    on(event, handler){
        this._next(event,handler);
    }



    _pass(type,par,cb){
        var call_list = this._call_list[type];
        if(call_list){
            this._call_list[type].goThrough(par,cb);
        }
    }

    when (type){
        var self = this;
        return {
            type:type,
            then:function(then_call){
                self._next(this.type,then_call);
                return this;
            },
            end:function(then_call){
                if(then_call){
                    self._next(this.type,then_call);
                }
                return self;
            }

        }
    }

    listen(port,host,cb){
        host = host || 'localhost';
        cb = cb || function(){
            console.log(`listening on ${host}:${port}  `)
        }
        this.server.listen(port,host,cb);
    }

    inChannels(sock,channelName){

        var self = this;
        if(sock.channels){
            sock.channels.add(channelName);
        } else{
            sock.channels = new Set();
            sock.channels.add(channelName);

        }
        var channel = self.channels.get(channelName);
        if(channel){
            channel.add(sock);
        } else {
            var new_channel = new Set();
            self.channels.set(channelName,new_channel);
            new_channel.add(sock)
        }


    }

    outChannels(sock,channelName){

        var self = this;
        if(sock.channels){
            sock.chennels.delete(channelName);
        }
        var channel = self.channels.get(channelName);
        if(channel){
            channel.delete(sock);
        }

    }
    releaseSock(sock){
        var self = this;
        if(sock.channels){
            for(var channelName of sock.channels){
                var channel = self.channels.get(channelName);
                if(channel){
                    channel.delete(sock);
                }
            }
        }
        this.all_socket_map.delete(sock.id);
        sock.destroy();
    }

    setEncoder(encoder){
        this.encoder = encoder;
        return this;
    }

    setDecoder(decoder){
        this.decoder = decoder;
        return this;
    }

    _next(type, call){
        call = call.bind(this);
        var self = this;
        if((typeof call) === 'function' && type){

            var call_list = this._call_list[type];
            if(call_list){
                call_list.add(call);
            } else{
                self._call_list[type] = new CallList([call]);
            }
        }
        return this;
    }

    setSocketHandler(handler_object){
        this._socket_handler = _.assign(handler_object,(this._socket_handler || {}));
        return this;
    }

    setBusinessHandler(handler){
        this._business_handler = handler.bind(this);
        return this;
    }
    static _netServer(sock){
        var self = this;
        sock
            .setKeepAlive(...self._option.keepAlive)
            .setTimeout(self._option.timeout)
            .on('data',data =>{
                self._socket_handler.data(sock,data);
            })
            .on('close',()=>{
                self._socket_handler.close(sock);
            })
        self._pass('connect',sock)


    }


}

module.exports = Reesock;
