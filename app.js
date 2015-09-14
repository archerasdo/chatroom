/**
 * Created by asus on 2015/9/9.
 */


/**
 * Module dependencies.
 */

var express = require('express')
    , routes = require('./routes')
    , user = require('./routes/user')
    , http = require('http')
    , path = require('path')
    , fs = require('fs');

var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server, {log: false});
//维护在线用户socket
var clients = {};
//维护在线用户信息
var users = {};
var timer = {};
var cfg = {
    timeout:30000, //超时时间 30s
    port:3000
}
var oldSocket = "";
var getDiffTime = function () {
    if (disconnect) {
        return connect - disconnect;
    }
    return false;
}

//套接字事件
io.sockets.on('connection', function (socket) {
    socket.on('online', function (data) {
        var data = JSON.parse(data);

        //用于区别刷新和离线
        if (timer[data.user.name]) {
            clearTimeout(timer[data.user.name]);
            delete timer[data.user.name];
        }
        //检查是否是已经登录绑定
        if (!clients[data.user.name]) {
            //为新用户随机分配头像
            var fileNum = fs.readdirSync('public/images/head').length;
            var pic_index = Math.round(Math.random() * fileNum);
            pic_index = pic_index === 0 ? 1 : pic_index;
            data.user.pic = 'images/head/head_' + pic_index + '.jpg';

            //新上线用户，需要发送用户上线提醒,需要向客户端发送新的用户列表
            users[data.user.name] = data.user;
            for (var index in clients) {
                clients[index].emit('system', JSON.stringify({
                    type: 'online',
                    msg: data.user.name,
                    time: (new Date()).getTime()
                }));
                clients[index].emit('userflush', JSON.stringify({users: users}));
            }
            console.log(data.user);
            socket.emit('system', JSON.stringify({type: 'in', msg: data.user, time: (new Date()).getTime()}));
            socket.emit('userflush', JSON.stringify({users: users}));
            clients[data.user.name] = socket;
        } else {
            clients[data.user.name] = socket;
            clients[data.user.name].emit('system', JSON.stringify({
                type: 'refresh',
                msg: users[data.user.name],
                time: (new Date()).getTime()
            }));
            clients[data.user.name].emit('userflush', JSON.stringify({users: users}));
        }
    });
    socket.on('say', function (data) {
        //dataformat:{to:'all',from:'Nick',msg:'msg'}
        data = JSON.parse(data);
        console.log(data);
        console.log(users);
        var msgData = {
            time: (new Date()).getTime(),
            data: data,
            pic: users[data.from].pic
        };
        if (data.to == "all") {
            //对所有人说
            for (var index in clients) {
                clients[index].emit('say', msgData);
            }
        }
        else {
            //对某人说
            clients[data.to].emit('say', msgData);
            clients[data.from].emit('say', msgData);
        }
    });
    socket.on('offline', function (user) {
        console.log('disconnect');
        socket.disconnect();
    });
    socket.on('disconnect', function () {
        //有人下线
        console.log('disconnect');
        for (var index in clients) {
            if (clients[index] == socket) {
                timer[index] = setTimeout(userOffline, cfg.timeout);
                function userOffline() {
                    delete users[index];
                    delete clients[index];
                    for (var index_inline in clients) {
                        clients[index_inline].emit('system', JSON.stringify({
                            type: 'offline',
                            msg: index,
                            time: (new Date()).getTime()
                        }));
                        clients[index_inline].emit('userflush', JSON.stringify({users: users}));
                    }
                }
                break;
            }
        }
    });
    socket.on('img', function (data) {
        data = JSON.parse(data);
        var imgData = {
            time: (new Date()).getTime(),
            data: data
        }
        if (data.to == "all") {
            //对所有人说
            for (var index in clients) {
                clients[index].emit('img', imgData);
            }
        }
        else {
            //对某人说
            clients[data.to].emit('say', imgData);
            clients[data.from].emit('say', imgData);
        }
    });
});

app.configure(function () {
    app.set('port', cfg.port);
    app.set('views', __dirname + '/views');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function () {
    app.use(express.errorHandler());
});

app.get('/', function (req, res, next) {
    if (!req.headers.cookie) {
        res.redirect('/signin');
        return;
    }
    var cookies = req.headers.cookie.split("; ");
    var isSign = false;
    for (var i = 0; i < cookies.length; i++) {
        cookie = cookies[i].split("=");
        if (cookie[0] == "user" && cookie[1] != "") {
            isSign = true;
            break;
        }
    }
    if (!isSign) {
        res.redirect('/signin');
        return;
    }
    res.sendfile('views/index.html');
});

app.get('/signin', function (req, res, next) {
    res.sendfile('views/signin.html');
});
app.post('/signin', function (req, res, next) {
    res.cookie("user", req.body.username);
    res.redirect('/');
});
server.listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
});



