/**
 * Created by asus on 2015/9/9.
 */

define('chat', ['jquery', 'template', 'cookie'], function ($, template) {
    return function () {

        var cfg = {
            SEL_INPUT_CONTENT: '#input_content',
            SEL_LIST: '#list',
            SEL_CONTENTS: '#contents',
            SEL_SAY: '#say',
            SEL_IMG_TRIGGER: '#imgTrigger',
            SEL_SEND_IMG: '#sendImage',
            SEL_EMOJI: '#emoji',
            SEL_EMOJI_WRAPPER: '#emojiWrapper',
            SEL_COLOR_STYLE: '#colorStyle',
            SEL_USER_PIC: '#userinfo #userpic',
            SEL_USER_NAME: '#userinfo #username',
            SEL_RING:'#ring'
        };
        var $emojiContainer = $(cfg.SEL_EMOJI_WRAPPER);
        var $colorStyle = $(cfg.SEL_COLOR_STYLE);
        var $list = $(cfg.SEL_LIST);
        var $contents = $(cfg.SEL_CONTENTS);
        var $inputContent = $(cfg.SEL_INPUT_CONTENT);
        var $say = $(cfg.SEL_SAY);
        var $imgTrigger = $(cfg.SEL_IMG_TRIGGER);
        var $sendImg = $(cfg.SEL_SEND_IMG);
        var $emoji = $(cfg.SEL_EMOJI);
        var $userpic = $(cfg.SEL_USER_PIC);
        var $username = $(cfg.SEL_USER_NAME);
        var $ring = $(cfg.SEL_RING);
        var chat = {
            config: {
                from: $.cookie('user'),
                to: 'all',
                color: '#000'
            },
            socket: null,
            //初始化套接字
            initSocket: function () {
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
            //初始化聊天面板
            init: function () {
                var self = this;
                self.initSocket();
                debugger
                self.socket.emit('online', JSON.stringify({user: {name: self.config.from}}));
                self.socket.on('disconnect', function () {
                    var msg = '<div style="color:#f00">SYSTEM:连接服务器失败</div>';
                    self.addMsg(msg);
                    $list.empty();
                });
                self.socket.on('reconnect', function () {
                    self.socket.emit('online', JSON.stringify({user: {name: self.config.from}}));
                    var msg = '<div style="color:#f00">SYSTEM:重新连接服务器</div>';
                    self.addMsg(msg);
                });
                self.socket.on('system', function (data) {
                    var data = JSON.parse(data);
                    var time = self.util.getTimeShow(data.time);
                    var msg = '';
                    if (data.type == 'online') {
                        msg += '用户 ' + data.msg + ' 上线了！';
                    } else if (data.type == 'offline') {
                        msg += '用户 ' + data.msg + ' 下线了！';
                    } else if (data.type == 'in') {
                        msg += '你进入了聊天室！';
                        $userpic.attr('src', data.msg.pic);
                        $username.text(data.msg.name);
                    } else if (data.type == 'refresh') {
                        msg += '页面刷新';
                        debugger
                        $userpic.attr('src', data.msg.pic);
                        $username.text(data.msg.name);
                    } else {
                        msg += '未知系统消息！';
                    }
                    var msg = '<div style="color:#f00">SYSTEM(' + time + '):' + msg + '</div>';
                    self.addMsg(msg);
                    chat.util.play_ring('system');
                });
                self.socket.on('userflush', function (data) {
                    var data = JSON.parse(data);
                    var users = data.users;
                    self.flushUsers(users);
                });
                self.socket.on('say', function (msgData) {
                    var data = msgData.data;
                    data.time = self.util.getTimeShow(msgData.time);
                    data.pic = msgData.pic;
                    if (data.to == 'all') {
                        self.addMsg(self.msgSection(data));
                    } else if (data.from == self.config.from) {
                        data.secret = true;
                        self.addMsg(self.msgSection(data));
                    } else if (data.to == self.config.from) {
                        data.secret = true;
                        debugger
                        self.addMsg(self.msgSection(data));
                        chat.util.play_ring('msg');
                    }
                });
                $inputContent.html("");
                $.cookie('isLogin', true);
                self.initEmoji();
                self.bindEvts();
            },
            //通用化消息结构
            msgSection: function (data) {
                var tpl = '<dl class="talk-section clearfix">' +
                    '<dt ><img class="userPic" src="{{pic}}" alt="userpic"></dt>' +
                    '<dd>' +
                    '<em id="username">{{from}}</em><span id="timestamp">{{time}}</span>' +
                    '{{if secret}}<span class="red">&lt;悄悄话&gt;<span>{{/if}}' +
                    '<p class="content" style="color: {{color}}">{{#msg}}</msg></p>' +
                    '</dd>' +
                    '</dl>';
                var render = template.compile(tpl);
                console.log(data.msg);
                return render(data);
            },
            //添加消息
            addMsg: function (msg) {
                $contents.append(msg);
                $contents.append("<br/>");
                $contents.scrollTop($contents[0].scrollHeight);
            },
            //刷新在线用户
            flushUsers: function (users) {
                var ulEle = $list;
                var self = this;
                ulEle.empty();
                ulEle.append('<li title="双击聊天" alt="all" onselectstart="return false">所有人</li>');
                for (var i in users) {
                    ulEle.append('<li alt="' + users[i].name + '" title="双击聊天" onselectstart="return false">' + users[i].name + '</li>')
                }
                self.show_say_to();
            },
            //绑定事件
            bindEvts: function () {
                var self = this;
                //刷新提示
                $(window).keydown(function (e) {
                    if (e.keyCode == 116) {
                        if (!confirm("刷新会将所有数据情况，确定要刷新么？")) {
                            e.preventDefault();
                        }
                    }
                });
                //触发发送
                $inputContent.keydown(function (e) {
                    if (e.shiftKey && e.which == 13) {
                        $inputContent.append("<br/>");
                    } else if (e.which == 13) {
                        e.preventDefault();
                        self.say($inputContent.data('type'));
                    }
                });
                $say.click(function (e) {
                    self.say($inputContent.data('type'));
                });

                // 图片
                $imgTrigger.click(function () {
                    $sendImg.click();
                });
                $sendImg.change(function () {
                    if (this.files.length != 0) {
                        var file = this.files[0],
                            reader = new FileReader();
                        if (!reader) {
                            alert('your browser dones\'t support filereader');
                            this.value = '';
                            return;
                        }
                        if (!/image\/\w+/.test(file.type)) {
                            alert("请确保文件为图像类型");
                            this.value = '';
                            return false;
                        }
                        if (file.size > 1024 * 500) {
                            alert("上传图片不得大于500k");
                            this.value = '';
                            return false;
                        }
                        reader.onload = function (e) {
                            this.value = '';
                            self.imgDisplay(this.result);
                        };
                        reader.readAsDataURL(file);
                    }
                });

                //文字颜色
                $colorStyle.change(function () {
                    self.config.color = this.value;
                    $inputContent.css('color', self.config.color);
                });

                //双击对某人聊天
                $list.on('click', 'li', function (e) {
                    if ($(this).attr('alt') != self.config.from) {
                        self.config.to = $(this).attr('alt');
                        self.show_say_to();
                    }
                });

            },
            //发送消息通用处理
            say: function (type) {
                var self = this;
                if ($inputContent.html() == "") {
                    return;
                }
                switch (type || 'normal') {
                    case 'img':
                        self.socket.emit('say', JSON.stringify({
                            to: self.config.to,
                            from: self.config.from,
                            msg: $inputContent.html(),
                            isImg: true,
                            color: self.config.color
                        }));
                        break;
                    case 'emoji':
                        self.socket.emit('say', JSON.stringify({
                            to: self.config.to,
                            from: self.config.from,
                            msg: $inputContent.html(),
                            isEmoji: true,
                            color: self.config.color
                        }));
                        break;
                    default:
                        self.socket.emit('say', JSON.stringify({
                            to: self.config.to,
                            from: self.config.from,
                            msg: $inputContent.html(),
                            color: self.config.color
                        }));
                        break;
                }
                $inputContent.html("");
                $inputContent.focus();
            },
            //工具对象
            util: {
                //播发提示音
                play_ring: function (type) {
                    switch (type) {
                        case 'system':
                            $ring[0].play();
                            break;
                        case 'msg':
                            $ring[0].play();
                            break;
                        default :
                            break;
                    }

                },
                //获取时间格式
                getTimeShow: function (time) {
                    var dt = new Date(time);
                    time = dt.getFullYear() + '-' + (dt.getMonth() + 1) + '-' + dt.getDate() + ' ' + dt.getHours() + ':' + (dt.getMinutes() < 10 ? ('0' + dt.getMinutes()) : dt.getMinutes()) + ":" + (dt.getSeconds() < 10 ? ('0' + dt.getSeconds()) : dt.getSeconds());
                    return time;
                }
            },
            //初始化表情面板
            initEmoji: function () {
                for (var i = 0; i < 15; i++) {
                    $emojiContainer.append('<img class="emoji" src="emoji/' + i + '.gif" title="' + i + '">');
                }
                var emojiPanel = {
                    init: function () {
                        this.bindEvt();
                    },
                    status: 'close',
                    statusChange: function (status) {
                        switch (status) {
                            case 'close':
                                $emojiContainer.fadeOut();
                                break;
                            case 'open':
                                $emojiContainer.fadeIn();
                                break;
                        }
                    },
                    handler: {
                        //点击其他
                        otherPlaceClick: function (e) {
                            var triggerObject = $('#emojiWrapper');
                            if (e.target.id != 'emoji' && $(e.target).closest('#emojiWrapper').length === 0) {
                                emojiPanel.statusChange('close');
                            }
                        },
                        emojiClick: function (e) {
                            debugger
                            $inputContent.append('<img id="msgImg" src="emoji/' + $(this).index() + '.gif"/>');
                            $inputContent.data('type', "emoji");
                        }
                    },
                    bindEvt: function () {
                        $emoji.click(function () {
                            emojiPanel.statusChange('open');
                        });
                        debugger
                        $(document).click(this.handler.otherPlaceClick);
                        $emojiContainer.on('click', '.emoji', this.handler.emojiClick);
                        debugger
                    }
                }
                emojiPanel.init();
                debugger
            },
            //聊天目标通用处理
            show_say_to: function () {
                var self = this;
                $("#from").html(self.config.from);
                $("#to").html(self.config.to == "all" ? "所有人" : self.config.to);
                var users = $list.find('li');
                for (var i = 0; i < users.length; i++) {
                    if ($(users[i]).attr('alt') == self.config.to) {
                        $(users[i]).addClass('sayingto');
                    }
                    else {
                        $(users[i]).removeClass('sayingto');
                    }
                }
            },
            //图片显示通用结构
            imgDisplay: function (imgData) {
                $inputContent.append('<a href="' + imgData + '" target="_blank"><img id="msgImg" src="' + imgData + '"/></a>');
                $inputContent.data('type', "img");
            }
        };
        chat.init();
    }
});