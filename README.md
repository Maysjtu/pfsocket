# PF SOCKET 



------

## app
app 为PFSocket实例

### app.all_socket_map
`{Map}` 所有socket的map , 需要使用者在连接时将socket放入该map中,

```
app
    .when('connect').then(function(socket,next){
        var app = this;
        var id = uuid();
        socket.id = id;
        app.all_socket_map.set(id,socket);
        app.inChannels(socket,'all')
        socket.active_channel='all';
        next();
    }).end()
```

### app.channels 
`{Map<Set<Socket>>}`
默认会有一个"all"channel ,内容为app.all_socket
其他由使用者自定义
### app.when(event).then(job1).then(job2)....end([handler])
*event详见事件部分*

jobs:类似express的中间件,不同的事件可能有不同的参数,详见事件部分
handler为可选，其作用和job一样
end只是为了标记一个事件处理的过程结束
这是两张写法：
```
app
    .when("attack").then(preAttack).then(attack).then(afterAttack).end()
    .when("spell").then(useSpell).end()
```
```
app.when("attack").then(preAttack).then(attack).then(afterAttack);
app.when("spell").then(useSpell)
```

### app.recure(jobname).then(job1).then(job2)....every(inteval)
jobname:自定义的工作名
jobs:工作
inteval:间隔（毫秒）
```
app.recure("timer").then(function job(app,next){
    //do something every 10seconds
    next();
}).every(10000)
```



### app.notify(id,msg)
id:app.all_socket_map中socket对应的key
```
app.notify(121,"hello you")
```

### app.broadcast(channel_name, msg)
channel_name: app.channels对应channel的 key

```
app.broadcast("all","hello everyone")
```


-----------

## 事件

### 三个主要的生命周期
- 长链接: connect -> close
- 请求: data --> 自定义事件 -> write
- 定时器 

### 1.connect
socket连接事件
用户在这里必须维护app.all_socket_map
> (socket,next) => void

*参数见下面的参数说明部分*

### 2.close
socket 断开链接
> (socket,next) => void

### 3.data
socket收到来自客户端的信息,这个事件主要用来实现自定义协议的解析部分
处理分包粘包
解析数据,在这里通过req.event的设置，可以自定义事件

> (req, next, cb, result) => void

### 4.write
用来实现自定义协议的打包部分

> (res, next) => void

### 5.自定义事件

> (req, next, cb, result) => void

---------

## 参数说明
### socket
可以将一些自定义链接状态（buffer，offset, lastReplayTime, chunks...) 放在socket中

### req

#### req.socket
该请求来自的socket
#### req.raw_data
该请求的原始数据
#### req.notify(msg)
向该req的socket发送数据
#### req.event
自定义事件

可以将一些自定义请求状态（event, data )放在req中


### next
到下一个job
next(something) 将something传递到下一个job

### result 
来自上个next(something) 的something
### cb
cb()直接结束jobs列表
### res
res.send()
通过res.send()发送数据











