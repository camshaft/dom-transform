/**
 * Module dependencies
 */

var App = require('..');
var compiler = require('../compiler');
var minidom = require('../minidom');
var mori = require('mori');

describe('app', function() {
  it('should start', function(done) {
    var app = new App('test-app');

    app.use(minidom());
    app.use(compiler());

    app.view('root', '<div data-each="user in users"><span data-bind="user.name"></span></div>');

    app.directive('data-each', function(el, scope, param) {
      var expr = param.split(' in ');
      var items = mori.get(scope, expr[1]);
      return mori.map(function(item) {
        var itemScope = mori.assoc(scope, expr[0], item);
        return mori.assoc(el, 'scope', itemScope);
      }, items);
    });

    app.directive('data-bind', function(el, scope, param) {
      var expr = param.split('.');
      var value = mori.get_in(scope, expr, '');
      return mori.assoc(el, 'text', value, 'children', null);
    });

    app.render('root', function(err, str) {
      console.log('result', str);
      done(err);
    });
  });
});
