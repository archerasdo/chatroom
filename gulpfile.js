/**
 * Created by asus on 2015/9/9.
 */

var gulp = require('gulp');

// 引入组件
var jshint = require('gulp-jshint');
var less = require('gulp-less');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

//// 检查脚本
//gulp.task('lint', function() {
//  gulp.src('app/js/*.js')
//    .pipe(jshint())
//    .pipe(jshint.reporter('default'));
//});

// 编译Sass
gulp.task('less', function() {
  gulp.src('public/stylesheets/*.less')
    .pipe(less())
    .pipe(gulp.dest('public/stylesheets'));
});





// 默认任务
gulp.task('default', function(){
  // 监听文件变化
  gulp.watch('public/stylesheets/*.less', function(){
    gulp.run('less');
  });
});
