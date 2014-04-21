/**
 * Module dependencies
 */

var React = require('react');
var d = React.DOM;
var mori = require('mori');

/**
 * Initialize the React plugin
 *
 * @return {Function}
 */

module.exports = function() {
  return function(app) {
    app.renderReact = function(name, fn) {
      var component = React.createClass({
        displayName: self.name,
        getInitialState: function() {
          return {tree: ''};
        },
        render: function() {
          return d.div(null, toDom(this.tree));
        }
      })();

      // check if a dom node was passed and mount it
      var isDomNode = typeof fn !== 'function';
      if (isDomNode) React.renderComponent(component, fn);

      app.render(name, function(err, tree) {
        if (err) return console.error(err.stack);
        component.setState('tree', tree);

        if (isDomNode) return;

        try {
          var str = React.renderComponentToString(component);
        } catch(err) {
          return fn(err);
        };
        fn(null, str);
      });
    };
  };
};

/**
 * Convert a mori data structure to a react dom
 *
 * @param {Element} el
 * @return {ReactDom}
 * @TODO use the immutable checking to be more efficient in dom changes
 */

function toDom(el) {
  if (mori.is_vector(el)) return mori.into_array(mori.map(toDom, el));
  var name = mori.get(el, 'name');

  var attrs = mori.reduce_kv(function(acc, key, val) {
    acc[key] = val;
    return acc;
  }, {}, mori.get(el, 'attrs'));

  var children = mori.get(el, 'children');
  if (typeof children !== 'string') children = toDom(el);
  return d[name](attrs, children);
}
