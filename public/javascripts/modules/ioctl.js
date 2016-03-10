/**
 * Created by asus on 2016/1/12.
 */
define('modules/ioctl', function () {

    // ʹ���ϸ�ģʽ
    'use strict';
    // ���� angular ģ��

    var socketObj = {
        socket:null,
        init:function(){
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
        emit:function(evtType,msg){
            this.socket.emit(evtType,JSON.stringify(msg));
        },
        on:function(evtType,func){
            this.socket.on(evtType,func);
        }
    };
    return socketObj;
});