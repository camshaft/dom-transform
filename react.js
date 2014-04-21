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
    app.renderReact = function(name, scope, fn) {
      if (typeof scope === 'function') {
        fn = scope;
        scope = app.scope;
      }
      var Component = React.createClass({
        displayName: app.name,
        getInitialState: function() {
          return {tree: this.props.tree};
        },
        render: function() {
          var tree = this.state.tree;
          if (!tree) return d.div(null, '');
          if (mori.count(tree) === 1) return toDom(mori.get(tree, 0));
          return d.div(null, toDom(tree));
        }
      });

      // render it to a string
      if (typeof fn === 'function') return app.render(name, scope, function(err, tree) {
        if (err) return fn(err);
        var str
        try {
          str = React.renderComponentToStaticMarkup(Component({tree: tree}));
        } catch(err) {
          return fn(err);
        };
        fn(null, str);
      });

      var component = Component();
      React.renderComponent(component, fn);
      app.render(name, function(err, tree) {
        if (err) return console.error(err.stack || err);
        component.setState({'tree': tree});
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
  if (!el) return '';
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
