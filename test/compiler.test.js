/**
 * Module dependencies
 */

var Compiler = require('../compiler');
var inspect = require('util').inspect;

describe('compiler', function() {
  it('should compile a template file', function() {
    var compiler = new Compiler();

    compiler.view('root', '<div data-hyper=".users"><div data-hyper-repeat="user in users"><span data-hyper-bind="user.name"></span></div></div>');

    compiler.toJSON();
  });
});
