/**
 * Module dependencies
 */

// init
// change
// destroy

exports.hyper = function(el, app) {
  var req, prevValue, prevParam, prevRoot;

  function change(element, scope, param, done) {

  }

  function destroy(fn) {

  }

  return [el, change, destroy];
};

exports.bind = function(el, scope, param, done) {
  var val = mori.get(scope, param);
  var el2 = mori.assoc(el, 'children', val);
  done(null, el2, scope);
};

exports.each = function(el, app) {
  var children = mori.get(el, 'children');
  var el2 = mori.assoc(el, 'children', null);

  function onchange(element, scope, param, done) {

  }

  function destroy(fn) {

  }

  return [el2, onchange, destroy];
};
