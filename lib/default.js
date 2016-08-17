
var socket_handler = {

    data:function(socket,data){


        var self = this;
        var req = {socket:socket,raw_data:data,notify:function(msg){
            self.send(socket,msg);
        }};
        self._pass('data',req, self._business_handler || default_business_handler.bind(self));

    },
    close:function(socket){

        console.log(`${socket.id} is closed!`);
        var self = this;
        self._pass('close',socket, default_close_handler.bind(self));
    }


};

function default_business_handler (req){

    var self = this;
    var event = req.event;
    if(event){
        self._pass(event,req);
    }

}
function default_close_handler(socket,result){
    console.log('releaseSock');
    this.releaseSock(socket);
    //if(result){
        //console.log();
    //}
}
exports.socket_handler = socket_handler;
