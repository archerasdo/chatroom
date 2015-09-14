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
        'jquery': 'jquery.min',
        'cookie': 'jquery.cookie',
        'json': 'json2',
        'template': 'artTemplate'
    },
    shim: {
        'cookie': {
            deps: ['jquery']
        }
    }
});

define(['chat','jquery', 'template', 'cookie'], function (Chat,$, template) {
    $(document).ready(function (e) {
		Chat();
    });
});


