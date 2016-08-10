'use strict';

class ListNode {
    constructor(go, pre, next){

        this.go = go;
        this.pre = pre;
        this.next = next;
    }

}


class List {
    constructor(array){
        var self = this;
        this._head = null;
        this._tail = null;
        this.nodes = new Set();
        array = array || [];
        if(array.length > 0){
            //this._head = array[0];
            //this._tail = array[0];
            for (var i of array){
                self.tail(i);
            }
        }

    }
    tail (call){
        var node = new ListNode(call);
        if(this._head && this._tail){
            this._tail.next = node;
            node.pre = this._tail;
            this._tail = node;
        }
        if(!this._head){
            this._head = node;
        }
        if(!this._tail){
            this._tail = node;
        }
    }
    head (call){
        var node = new ListNode(call);
        if(!this._head){
            this._head = node;
        }
        if(!this._tail){
            this._tail = node;
        }
        if(this._head && this._tail){
            node.next = this._head;
            this._head.pre = node;
            this._head = node;
        }

    }
}

class CallList{

    constructor(array,app){
        this.app = app;
        this.list = new List(array);
    }
    add(call){
        this.list.tail(call);
    }

    goThrough(req,cb){
        if(this.list && this.list._head){
            var head_node = this.list._head;
            head_node.go(req,nextcall(req,head_node,cb),cb);
        }
        else{
            cb && cb(req);
        }
        //nextcall(sock,this.list._head);
        //this.list._head.
    }

}

function nextcall(req,call_node,cb){

    //console.log("--------------------");
    //console.log(call_node);
    if(call_node.next && call_node.next.go){
        return function(result){
            call_node.next.go(req,nextcall(req,call_node.next,cb),cb,result);
        };
    }
    else{
        return function(result){
            cb && cb(req,result);

        }
    }
}
//test
/*
var test_arr = [];
function test1(par,next){
    console.log("------go into test1")
     console.log(par);
     next();
}
function test2(par,next){
   console.log("------go into test2")
    par.age=15
     console.log(par);
     next("alalalal")
}
function test3(par,next,cb,result){
   console.log("------go into test3")
   console.log("result:from pre:",result)
     par.sex = "female"
     console.log(par)
     next()
     //cb("oh my go")
}
function test4(par,next){
   console.log("------go into test4")
     par.career = "it"
     console.log(par)
     next();
}
function test5(par,next){
   console.log("------go into test5")
     par.race = "human"
     console.log(par)
     next();
}

function test6(par,next){
   console.log("------go into test6")
     par.area = "china"
     console.log(par)
     next();
}
test_arr.push(test1);
test_arr.push(test2);
test_arr.push(test3);
//test_arr.push(test4);
//test_arr.push(test5);
//test_arr.push(test6);
var call_list = new CallList(test_arr);
call_list.add(test4)
call_list.add(test5)
call_list.add(test6)
call_list.goThrough({name : 2},function(result){console.log("all done",result)});
*/
module.exports = CallList;
