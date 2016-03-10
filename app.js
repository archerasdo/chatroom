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
    , fs = require('fs')
    , imgProcess = require('./util/imgConvert')
    , db = require('./db/db');
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server, {log: false});
//维护在线用户socket
var clients = {};
//维护在线用户信息
var users = {};
var timer = {};
var cfg = {
    timeout: 30000, //超时时间 30s
    port: 3000,
    SYSTEM_MSG_ONLINE: 'online',
    SYSTEM_MSG_OFFLINE: 'offline',
    SYSTEM_MSG_LOGIN: 'login',
    SYSTEM_MSG_REFRESH: 'refresh',
    SYSTEM_MSG_DISCONNECT: 'disconnect',
    SYSTEM_MSG_RECONNECT: 'reconnect',
    MSG_MIME_TYPE_TEXT: 'text',
    MSG_MIME_TYPE_IMG: 'img',
    MSG_MIME_TYPE_EMOJI: 'emoji'
};

var oldSocket = "";



//套接字事件
io.sockets.on('connection', function (socket) {
    //系统通信监听
    socket.on('online', function (data) {
        var data = JSON.parse(data);

        //用于区别刷新和离线
        if (timer[data.user.name]) {
            clearTimeout(timer[data.user.name]);
            delete timer[data.user.name];
        }
        var emojiNum = fs.readdirSync('public/emoji').length;
        //检查是否是已经登录绑定

        if (!clients[data.user.name]) {
            //为新用户随机分配头像
            var fileNum = fs.readdirSync('public/images/head').length;
            var pic_index = Math.round(Math.random() * fileNum);
            pic_index = pic_index === 0 ? 1 : pic_index;
            data.user.pic = 'images/head/head_' + pic_index + '.jpg';

            //新上线用户，需要发送用户上线提醒,需要向客户端发送新的用户列表
            users[data.user.name] = data.user;
            clients[data.user.name] = socket;
            for (var index in clients) {

                clients[index].emit('userflush', JSON.stringify({users: users, time: (new Date()).getTime()}));
            }

            //初始化用户信息
            socket.emit('initUser', {emojiNum: emojiNum, time: (new Date()).getTime(), userInfo: data.user});
        } else {
            clients[data.user.name] = socket;

            clients[data.user.name].emit('userflush', JSON.stringify({users: users, time: (new Date()).getTime()}));
            //初始化用户信息
            clients[data.user.name].emit('initUser', {
                emojiNum: emojiNum,
                time: (new Date()).getTime(),
                userInfo: data.user
            });
        }
    });
    socket.on('offline', function (user) {
        socket.disconnect();
    });
    socket.on('disconnect', function () {
        //有人下线
        for (var index in clients) {
            if (clients[index] == socket) {
                timer[index] = setTimeout(userOffline, cfg.timeout);
                function userOffline() {
                    delete users[index];
                    delete clients[index];
                    for (var index_inline in clients) {
                        //clients[index_inline].emit('system', JSON.stringify({
                        //    type: 'offline',
                        //    msg: index,
                        //    time: (new Date()).getTime()
                        //}));
                        clients[index_inline].emit('userflush', JSON.stringify({
                            users: users,
                            time: (new Date()).getTime()
                        }));
                    }
                }

                break;
            }
        }
    });

    //业务监听
    socket.on('say', function (data) {
        //textformat:{to:'all',from:'Nick',msg:'xxx',type:'text',fontColor:'#xxx'}
        //imgformat:{to:'all',from:'Nick',picSrc:'xxx',type:'img'}
        //emojiformat:{to:'all',from:'Nick',emojiSrc:'xx',type:'emoji'}
        data = JSON.parse(data);
        //var msgData = {};
        //clients[data.from].emit('recvBeat');
        //对不同媒体进行服务器端处理
        switch (data.type) {
            case cfg.MSG_MIME_TYPE_TEXT:
                break;
            case cfg.MSG_MIME_TYPE_IMG:
                data.previewSrc = imgProcess.save_img(data.picSrc);
                data.picSrc = imgProcess.get_reduced_dataurl(data.picSrc);
                break;
            case  cfg.MSG_MIME_TYPE_EMOJI:
                break;
            default :
                break;
        }

        if (data.to == "all") {
            //对所有人说
            for (var index in clients) {
                if (index === data.from && data.type !== cfg.MSG_MIME_TYPE_IMG) {
                    continue;
                }
                clients[index].emit('say', data);
            }
        }
        else {
            //对某人说
            clients[data.to].emit('say', data);
            clients[data.from].emit('say', data);
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
app.get('/videotest', function (req, res, next) {
    res.sendfile('views/videotest.html');
});
app.post('/signin', function (req, res, next) {
    res.cookie("user", req.body.username);
    res.redirect('/');
});
server.listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
});



