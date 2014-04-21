/**
 * Module dependencies
 */

var should = require('should');
var App = require('..');
var compiler = require('../compiler');
var minidom = require('../minidom');
var react = require('../react');
var mori = require('mori');

describe('app', function() {
  it('should start', function(done) {
    var app = new App('test-app');

    app.use(minidom());
    app.use(compiler());
    app.use(react());

    app.view('root', '<span data-bind="name"></span>');

    app.directive('data-bind', function(el, scope, param, done) {
      var expr = param.split('.');
      var value = mori.get_in(scope, expr, '');
      var el2 =  mori.assoc(el, 'children', value);
      done(null, el2, scope);
    });

    var scope = mori.hash_map('name', 'cameron');

    app.renderReact('root', scope, function(err, str) {
      if (err) return done(err);
      should.exist(str);
      str.should.eql('<span data-bind="name">cameron</span>');
      done(err);
    });
  });
});
