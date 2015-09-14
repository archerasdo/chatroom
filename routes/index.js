/**
 * Created by asus on 2015/9/9.
 */


/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};