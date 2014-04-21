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
  var app;

  beforeEach(function() {
    app = new App('test-app');

    app.use(minidom());
    app.use(compiler());
    app.use(react());

    app.directive('data-bind', function(el) {
      var el2 = mori.assoc(el, 'children', '');

      function change(el, scope, param, done) {
        var expr = param.split('.');
        var value = mori.get_in(scope, expr, '');
        var el2 =  mori.assoc(el, 'children', value);
        done(null, el2, scope);
      }

      return [el2, change];
    });
  });

  it('should render a single root element', function(done) {
    app.view('root', '<span data-bind="name"></span>');

    var scope = mori.hash_map('name', 'cameron');
    return done();

    app.renderReact('root', scope, function(err, str) {
      if (err) return done(err);
      should.exist(str);
      str.should.eql('<span data-bind="name">cameron</span>');
      done(err);
    });
  });

  it('should render a children', function(done) {
    app.view('root', '<ul data-each="name in names"><li data-bind="name"></li></ul>');

    var scope = mori.hash_map('names', mori.vector('cameron', 'mike', 'josh'));

    app.directive('data-each', function(el) {
      var tmpl = mori.get(el, 'children');
      var el2 = mori.assoc(el, 'children', '');

      // TODO should we only init once?

      function change(elem, scope, param, done) {
        var expr = param.split(' in ');
        var key = expr[0];
        var parent = expr[1].split('.');
        var values = mori.get_in(scope, parent);
        var children = [];

        mori.reduce_kv(function(acc, i, value) {
          var childScope = mori.assoc(scope, key, value);
          var render = app.init(tmpl);
          render(childScope, function(err, child) {
            if (err) return done(err);
            children[i] = child;
            var childColl = mori.concat.apply(null, children);
            done(null, mori.assoc(elem, 'children', childColl), scope);
          });
          return acc;
        }, '', values);

        done(null, elem, scope);
      }

      return [el2, change];
    });

    app.renderReact('root', scope, function(err, str) {
      if (err) return done(err);
      should.exist(str);
      return console.log('RESULT', str);
      str.should.eql(
        '<ul>' +
          '<li data-each="name in names" data-bind="name">cameron</li>' +
          '<li data-each="name in names" data-bind="name">mike</li>' +
          '<li data-each="name in names" data-bind="name">josh</li>' +
        '</ul>');
      done(err);
    });
    return done();
  });
});
