/**
 * Created by archer on 2016/2/9.
 */
var mongoose = require('mongoose');
var db = mongoose.connect('mongodb://localhost/chatroom');
var Schema = mongoose.Schema;
var User = new Schema({
        username: String,
        password: String,

});
exports.user = db.model('user',User);
