/**
 * Created by asus on 2015/9/9.
 */

requirejs.config({
    //By default load any module IDs from js/lib
    baseUrl: 'javascripts',
    //except, if the module ID starts with "app",
    //load it from the js/app directory. paths
    //config is relative to the baseUrl, and
    //never includes a ".js" extension since
    //the paths config could be for a directory.
    paths: {
        'jquery': 'lib/jquery.min',
        'cookie': 'lib/jquery.cookie',
        'json': 'lib/json2',
        'template': 'lib/artTemplate',
        'angular': 'lib/angular.min',
        'angular-route': '//cdn.staticfile.org/angular-ui-router/0.2.8/angular-ui-router.min',
        'domReady': '//cdn.staticfile.org/require-domReady/2.0.1/domReady.min'
    },
    shim: {
        'cookie': {
            deps: ['jquery']
        },
        'angular': {
            exports: 'angular'
        },
        'angular-route': {
            deps: ['angular'],
            exports: 'angular-route'
        }
    }
});


// 原则： 数据和显示逻辑分开
define(['angular'], function (angular) {

    // 使用严格模式
    'use strict';
    // 定义 angular 模块
    var app = angular.module('chat', []);
    var cfg = {
        SYSTEM_MSG_ONLINE: 'online',
        SYSTEM_MSG_OFFLINE: 'offline',
        SYSTEM_MSG_LOGIN: 'login',
        SYSTEM_MSG_REFRESH: 'refresh',
        SYSTEM_MSG_DISCONNECT: 'disconnect',
        SYSTEM_MSG_RECONNECT: 'reconnect',
        MSG_MIME_TYPE_TEXT: 'text',
        MSG_MIME_TYPE_IMG: 'img',
        MSG_MIME_TYPE_EMOJI: 'emoji',
        TIMEOUT_MSECONDS: 30000
    };

    function objDiff(newA, oldA) {
        Array.prototype.each = function (fn) {
            var a = [];
            //自定义参数
            var args = Array.prototype.slice.call(arguments, 1);
            for (var i = 0; i < this.length; i++) {
                //对函数传入[数组成员，索引，自定义参数]
                var res = fn.apply(this, [this[i], i].concat(args));
                if (res != null) {
                    a.push(res);
                }
            }
            return a;
        };
        Array.prototype.contains = function (val) {
            for (var i = 0; i < this.length; i++) {
                if (this[i] === val) {
                    return true;
                }
            }
            return false;
        };
        Array.prototype.uniquelize = function () {
            var ra = [];
            for (var i = 0; i < this.length; i++) {
                if (!ra.contains(this[i])) {
                    ra.push(this[i]);
                }
            }
            return ra;
        };
        Array.prototype.diff = function (a, b) {
            return a.uniquelize().each(function (x) {
                return b.contains(x) ? null : x;
            })
        };
        return {
            add: Array.minus(Object.getOwnPropertyNames(newA), Object.getOwnPropertyNames(oldA)),
            minus: Array.minus(Object.getOwnPropertyNames(oldA), Object.getOwnPropertyNames(newA))
        }
    };
    Object.prototype.isOwnEmpty = function () {
        for (var index in this) {
            if (this.hasOwnProperty(this[index])) {
                return false;
            }
        }
        return true;
    }
    app.factory('ioService', function () {
        return {
            socket: null,
            init: function () {
                if (/Firefox\/\s/.test(navigator.userAgent)) {
                    this.socket = io.connect({transports: ['xhr-polling']});
                }
                else if (/MSIE (\d+.\d+);/.test(navigator.userAgent)) {
                    this.socket = io.connect({transports: ['jsonp-polling']});
                }
                else {
                    this.socket = io.connect();
                }
            },
            emit: function (evtType, msg) {
                this.socket.emit(evtType, JSON.stringify(msg));
            },
            on: function (evtType, func) {
                this.socket.on(evtType, func);
            }
        };
    });
    app.controller('system', function ($scope, ioService) {
        //聊天信息显示
        $scope.msg = [];
        $scope.users = {};
        $scope.from = 'archersado';
        $scope.reciver = 'all';
        $scope.input = '';
        $scope.username = '';
        $scope.userpic = '';
        $scope.previewShow = false;
        $scope.currentPreviewImg = '';
        //canvas裁剪图片

        $scope.panelClose = function ($event) {
            $scope.$broadcast('panelClose', $event);
        };
        $scope.getMsgReciver = function ($event) {
            $scope.reciver = $event.target.textContent;
            $event.stopPropagation();
        };

        ioService.init();
        ioService.emit('online', {user: {name: $scope.from}});
        ioService.on('disconnect', function () {
            $scope.$apply(function () {
                $scope.msg.push({type: "notify", content: "SYSTEM:连接服务器失败"});
                $scope.users = {};
            });
        });
        ioService.on('reconnect', function () {
            ioService.emit('online', {user: {name: self.from}});
            $scope.$apply(function () {
                ioService.emit('online', {user: {name: self.from}});
                $scope.msg.push({type: "notify", content: "SYSTEM:重新连接服务器"});
            });
        });

        //初始化用户信息
        ioService.on('initUser', function (data) {
                $scope.$apply(function () {
                    $scope.userpic = data.userInfo.pic;
                    $scope.username = data.userInfo.name;
                    $scope.$broadcast('emojiNumChange', data.emojiNum);
                });
            }
        );
        //ioService.on('system', function (data) {
        //    var data = JSON.parse(data);
        //    $scope.$apply(function () {
        //        switch (data.type) {
        //            case 'online':
        //                $scope.push({type: "notify", content: "用户" + data.msg + "上线了！", date: data.time});
        //                break;
        //            case 'offline':
        //                $scope.push({type: "notify", content: "用户" + data.msg + "下线了！", date: data.time});
        //                break;
        //            case 'in':
        //                $scope.msg.push({type: "notify", content: "你进入了聊天室！", date: data.time});
        //                $scope.userpic = data.msg.pic;
        //                $scope.username = data.msg.name;
        //                $scope.$broadcast('emojiNumChange', emojiNum);
        //                break;
        //            case 'refresh':
        //                $scope.msg.push({type: "notify", content: "页面刷新！", date: data.time});
        //
        //                $scope.userpic = data.msg.pic;
        //                $scope.username = data.msg.name;
        //                $scope.$broadcast('emojiNumChange', data.emojiNum);
        //                break;
        //            default:
        //                $scope.msg.push({type: "notify", content: "未知系统消息！", date: data.time});
        //                break;
        //        }
        //    });
        //});

        //系统提示显示管理
        $scope.showSystemMsg = function (data) {
            for (var index = 0; index < data.length; index++) {
                var current = data[index];
                switch (current.type) {
                    case cfg.SYSTEM_MSG_ONLINE:
                        $scope.push({type: "notify", content: "用户" + current.msg + "上线了！", date: current.time});
                        break;
                    case cfg.SYSTEM_MSG_OFFLINE:
                        $scope.push({type: "notify", content: "用户" + current.msg + "下线了！", date: current.time});
                        break;
                    case cfg.SYSTEM_MSG_LOGIN:
                        $scope.msg.push({type: "notify", content: "你进入了聊天室！", date: current.time});
                        break;
                    case cfg.SYSTEM_MSG_REFRESH:
                        $scope.msg.push({type: "notify", content: "页面刷新！", date: current.time});
                        break;
                    case cfg.SYSTEM_MSG_DISCONNECT:
                        $scope.msg.push({type: "notify", content: "SYSTEM:连接服务器失败", date: current.time});
                        break;
                    case cfg.SYSTEM_MSG_RECONNECT:
                        $scope.msg.push({type: "notify", content: "SYSTEM:重新连接服务器", date: current.time});
                        break;
                    default:
                        $scope.msg.push({type: "notify", content: "未知系统消息！", date: current.time});
                        break;
                }
            }
        };
        //点击显示大图
        $scope.previewImg = function (e) {

            $scope.currentPreviewImg = e.target.dataset.previewsrc;
            $scope.previewShow = true;
        };
        ioService.on('userflush', function (data) {
            var multiData = [];
            var data = JSON.parse(data);
            $scope.$apply(function () {


                if ($scope.users.isOwnEmpty() && data.users) {
                    data.type = cfg.SYSTEM_MSG_LOGIN;
                    multiData.push(data);
                } else {
                    var diff = objDiff(data.user, $scope.users);
                    if (diff) {
                        var addUser = diff.add;
                        var minusUser = diff.minus;
                        if (addUser) {
                            data.type = cfg.SYSTEM_MSG_ONLINE;
                            for (var i in addUser) {
                                data.msg = addUser[i];
                                multiData.push(data);
                            }
                        }
                        if (minusUser) {
                            data.type = cfg.SYSTEM_MSG_OFFLINE;
                            for (var j in minusUser) {
                                data.msg = minusUser[j];
                                multiData.push(data);
                            }
                        }
                    }
                }
                $scope.showSystemMsg(multiData);
                $scope.users = data.users;
            });
        });


        ioService.on('say', function (msgData) {
            msgData.senderPic = $scope.users[msgData.from].pic;
            console.log(msgData);
            $scope.$apply(function () {
                $scope.msg.push(msgData);
            });
            console.log($scope.msg)
        });


        //通用消息发送
        $scope.$on('sendMsg', function (e, data) {
            //媒体消息格式

            var msgData = {};
            switch (data.type) {
                case cfg.MSG_MIME_TYPE_TEXT:
                    msgData = {
                        from: $scope.from,
                        to: $scope.reciver,
                        type: data.type,
                        msg: data.msg,
                        fontColor: data.fontColor,
                        time: (new Date()).getTime()
                    };
                    break;
                case cfg.MSG_MIME_TYPE_IMG:
                    msgData = {
                        from: $scope.from,
                        to: $scope.reciver,
                        type: data.type,
                        picSrc: data.picBase64Src,
                        time: (new Date()).getTime()
                    };
                    break;
                case  cfg.MSG_MIME_TYPE_EMOJI:
                    msgData = {
                        from: $scope.from,
                        to: $scope.reciver,
                        type: data.type,
                        emojiSrc: data.emojiSrc,
                        time: (new Date()).getTime()
                    };
                    break;
                default :
                    break;
            }
            ;
            ioService.emit('say', msgData);
            msgData.senderPic = $scope.users[msgData.from].pic;
            msgData.valid = true;
            if (data.type !== cfg.MSG_MIME_TYPE_IMG) {
                $scope.msg.push(msgData);
            }
            var msgId = $scope.msg.length - 1;
            //ioService.on('recvBeat',function(){
            //    clearTimeout(msgTimer);
            //});
            //var msgTimer = setTimeout(function(){
            //    $scope.msg[msgId].valid = false;
            //},cfg.TIMEOUT_MSECONDS);
            //for (var index in data.msg) {
            //    var msgData = {
            //        from: $scope.from,
            //        to: $scope.reciver,
            //        type: data.type,
            //        msg: data.msg[index],
            //        color: data.color
            //    };
            //    ioService.emit('say', msgData);
            //}
        });
    });

    //消息面板控制器
    app.controller('msgInput', function ($scope) {
        $scope.enterEvt = function (e) {
            var keycode = window.event ? e.keyCode : e.which;
            if (keycode == 13) {
                $scope.sendMsg();
            }
        };
        $scope.sendMsg = function (data) {
            if (data) {
                $scope.$emit('sendMsg', data);
            } else {
                $scope.$emit('sendMsg', {type: 'text', msg: $scope.msgContent, fontColor: $scope.fontColor});
            }
            $scope.msgContent = '';
        };
        $scope.$on('sendEmoji', function (e, data) {
            $scope.sendMsg(data);
        });
    });

    //emoji面板控制器
    app.controller('emoji', function ($scope) {
        $scope.$on('emojiNumChange', function (e, emojiNum) {
            $scope.emojiList = [];
            for (var i = 0; i < emojiNum; i++) {
                $scope.emojiList.push(i);
            }
        });
        $scope.emojiOpened = false;
        $scope.$on('panelClose', function (s, event) {
            if ($scope.emojiOpened && event.target.id != 'emoji' && event.target.id != 'emojiWrapper') {
                $scope.emojiOpened = false;
                event.stopPropagation();
            }
        });
        $scope.addEmoji = function (e) {
            $scope.$emit('sendEmoji', {type: 'emoji', emojiSrc: event.target.src});
        }
    });

    //此处使用父类scope 未使用隔离scope
    app.directive("filereader", function () {
        return {
            restrict: 'A',
            link: function (scope, element, attributes) {
                element.bind("change", function (changeEvent) {
                    var readers = [],
                        files = changeEvent.target.files,
                        datas = [];
                    for (var i = 0; i < files.length; i++) {
                        readers[i] = new FileReader();
                        readers[i].onload = function (loadEvent) {
                            datas.push(loadEvent.target.result);
                            if (datas.length === files.length) {
                                scope.sendMsg({type: 'img', picBase64Src: datas[0]});
                            }
                            element.val('');
                        };
                        readers[i].readAsDataURL(files[i]);
                    }
                });
            }
        }
    });
});


