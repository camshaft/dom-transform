/**
 * Module dependencies
 */

var mori = require('mori');

module.exports = function() {
  return function(app) {
    var _view = app.view;
    app.view = function(name, view) {
      var el = mori.vector.apply(null, view.map(element));
      return _view.call(app, name, el);
    };
  };
};

function element(view) {
  var attrs = mori.hash_map.apply(null, view[0] || []);
  return mori.hash_map(
    'name', view[2] || 'div',
    'type', view[3] || 'tag',
    'attrs', attrs,
    'children', mori.vector.apply(null, (view[1] || []).map(element)),
    'directives', mori.hash_map()
  );
}
