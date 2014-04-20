/**
 * Module dependencies
 */

var React = require('react');
var d = React.DOM;
var mori = require('mori');

module.exports = function() {
  return function(app) {
    var render = app.render;
    app.render = function(name, el) {
      var dom;
      var AppClass = React.createClass({
        displayName: self.name,
        render: function() {
          return d.div(null, dom);
        }
      });
      render.call(app, name, function(err, tree) {
        if (err) return console.error(err.stack);
        tree = toDom(tree);
      });
    };
  };
};

function toDom(elem) {
  if (mori.is_vector(elem)) return mori.into_array(mori.map(toDom, elem));
  var name = mori.get(elem, 'name');
  var text = mori.get(elem, 'text');

  var attrs = mori.reduce_kv(function(acc, key, val) {
    acc[key] = val;
    return acc;
  }, {}, mori.get(elem, 'attrs'));

  if (text) return d[name](attrs, text);
  return d[name](attrs, toDom(mori.get(elem, 'children')));
}
