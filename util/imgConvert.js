/**
 * Created by archer on 2016/1/29.
 */

var images = require('images'),
    fs = require('fs'),
    path = require('path');
var conf = {
    URL_IMG_JPEG: 'data:image/jpeg;base64,',
    _UPLOAD_DIRNAME:'images/upload',
    _IMG_FMT:'.jpeg',
    _IMG_NAME_OFFSET: 50,
    _IMG_NAME_LEN:20
}

exports.get_img_from_dataurl = function(dataurl) {
    return dataurl.replace(/^[data:].*,/g,'');
};


exports.get_reduced_img = function (dataurl) {
    var imgBuff = new Buffer(this.get_img_from_dataurl(dataurl),'base64');
    return images(imgBuff).size(110,110).encode("jpg", {operation:50}).toString('base64');
};

exports.get_reduced_dataurl = function (dataurl) {
    return conf.URL_IMG_JPEG + this.get_reduced_img(dataurl);
}

exports.save_img = function(dataurl) {
    var imgBuff = new Buffer(this.get_img_from_dataurl(dataurl),'base64');

    //图片Base64编码生成的前n位内容类似或相同，根据图片格式决定
    var filename = imgBuff.toString('base64',conf._IMG_NAME_OFFSET,conf._IMG_NAME_OFFSET + conf._IMG_NAME_LEN).replace(/[^\w]/g,'') + conf._IMG_FMT;
    var filePath = path.join(conf._UPLOAD_DIRNAME,filename);

    fs.exists(filePath,function(isExist){
        if (!isExist) {
            fs.writeFile(filePath,imgBuff,function(err){
                if(err) {
                    console.log(err);
                }
                console.log('img save success');
            });
        }
    });
    return path.join(conf._UPLOAD_DIRNAME,filename).replace(/\\/g,'/');
}

exports.save_reduce_img = function(dataurl) {
    var imgBuff = new Buffer(this.get_img_from_dataurl(dataurl),'base64');
    imgBuff = images(imgBuff).size(110,110).encode("jpg", {operation:50});
    //图片Base64编码生成的前n位内容类似或相同，根据图片格式决定
    var filename = imgBuff.toString('base64',conf._IMG_NAME_OFFSET,conf._IMG_NAME_OFFSET + conf._IMG_NAME_LEN).replace(/[^\w]/g,'') + conf._IMG_FMT;
    var filePath = path.join(conf._UPLOAD_DIRNAME,filename);

    fs.exists(filePath,function(isExist){
        if (!isExist) {
            fs.writeFile(filePath,imgBuff,function(err){
                if(err) {
                    console.log(err);
                }
                console.log('img save success');
            });
        }
    });
    return path.join(conf._UPLOAD_DIRNAME,filename);
}