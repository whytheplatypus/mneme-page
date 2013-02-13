/*
 * grunt-mneme-page
 * https://github.com/whytheplatypus/dox-template
 *
 * Copyright (c) 2013 David Gage
 * Licensed under the MIT license.
 */

module.exports = function(grunt) {

  // Please see the grunt documentation for more information regarding task and
  // helper creation: https://github.com/gruntjs/grunt/blob/master/docs/toc.md

  // ==========================================================================
  // TASKS
  // ==========================================================================

  grunt.registerTask('mneme-page', 'Your task description goes here.', function() {
    grunt.log.write(grunt.helper('mneme-page'));
    var restify = require('restify'),
      portfinder = require('portfinder'),
      mdns = require('mdns');

    var server = restify.createServer();
/*
    server.pre(function(req, res, next){
      if(req.url == '/'){
        req.url = '/.git'
      }
      return next();
    });
*/
    server.get('/\/.*/', restify.serveStatic({
      directory: "."
    }));

    portfinder.getPort(function (err, port) {
      if(err){
        grunt.log.error(err);
        return err;
      }
      server.listen(port, function() {
        grunt.log.writeln(server.name+ ' listening at '+server.url);
        done();
      });
    });
  });

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  grunt.registerHelper('mneme-page', function() {
    return 'mneme-page!!!';
  });

};
