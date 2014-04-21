/**
 * Module dependencies
 */

var debug = require('debug')('dom-transform:app');
var mori = require('mori');

/**
 * Expose the App constuctor
 */

exports = module.exports = App;

/**
 * Create an app
 *
 * @param {String} name
 * @param {Array} views
 */

function App(name, views) {
  if (!(this instanceof App)) return new App(views);
  this.name = name;
  this.views = views || {};
  this.directives = {};
  this.scope = mori.hash_map();
  this.mori = mori;
};

/**
 * Use a plugin
 *
 * @param {Function} fn
 * @return {App}
 */

App.prototype.use = function(fn) {
  fn(this);
  return this;
};

/**
 * Add a view
 *
 * @param {String} name
 * @param {Vector|HashMap} view
 * @return {App}
 */

App.prototype.view = function(name, view) {
  debug('adding view', name, view);
  if (!(mori.is_vector(view) || mori.is_map(view))) throw new Error('invalid view: ' + name);
  this.views[name] = view;
  return this;
};

/**
 * Add a directive
 *
 * @param {String} name
 * @param {Function} fn
 * @return {App}
 */

App.prototype.directive = function(name, fn) {
  debug('adding directive', name);
  this.directives[name] = (fn.length === 4 || fn.length === 3)
    ? noopInit(fn)
    : fn;
  return this;
};

/**
 * Initialize a view for rendering
 *
 * @param {String|Vector|HashMap} name
 * @return {Function}
 */

App.prototype.init = function(name) {
  debug('rendering view', name);
  var self = this;

  var root = typeof name === 'string'
    ? this.views[name]
    : name;

  if (!(mori.is_vector(root) || mori.is_map(root))) throw new Error('invalid view: ' + name);
  if (!root) throw new Error(name + ' not found');

  var tree = init(self, root);

  return function render(scope, fn) {
    if (typeof scope === 'function') {
      fn = scope;
      scope = self.scope;
    }
    if (!mori.is_map(scope)) return fn(new Error('invalid scope passed'));
    return renderElement(self, tree, scope, fn);
  };
};

/**
 * Render a view
 *
 * @param {String|Vector|HashMap} name
 * @param {Function} fn
 * @return {Function}
 */

App.prototype.render = function(name, scope, fn) {
  if (typeof scope === 'function') {
    fn = scope;
    scope = this.scope;
  }

  try {
    var render = this.init(name);
  } catch(err) {
    return fn(err);
  }
  render(scope, fn);
  return render;
};

/**
 * Initialize an element
 *
 * @param {App} app
 * @param {Element} el
 * @return {Element}
 * @api private
 */

function init(app, el) {
  if (mori.is_vector(el)) return initCollection(app, el);
  debug('initializing view', el);
  var el2 = initDirectives(app, el, mori.keys(mori.get(el, 'attrs')));
  var children = initCollection(app, mori.get(el2, 'children'));
  return mori.assoc(el2, 'children', children);
}

/**
 * Initialize a collection
 *
 * @param {App} app
 * @param {Element[]} els
 * @return {Element[]}
 * @api private
 */

function initCollection(app, els) {
  debug('initiailizing collection', els);
  return mori.reduce_kv(function(acc, i, view) {
    return mori.assoc(acc, i, init(app, view));
  }, mori.vector(), els);
}

/**
 * Initialize directives on an element
 *
 * @param {App} app
 * @param {Element} el
 * @param {Vector} atts
 * @return {Element}
 * @api private
 */

function initDirectives(app, el, attrs) {
  if (mori.is_empty(attrs)) return el;

  var attr = mori.first(attrs);
  var rest = mori.rest(attrs);
  var initFn = app.directives[attr] || app.directives[attr.replace(/^data-/, '')];
  if (!initFn) return initDirectives(app, el, rest);

  var res = initFn(el, app);
  var conf = mori.hash_map('change', res[1], 'destroy', res[2], 'name', attr);
  var directives =  mori.conj(mori.get(res[0], 'directives'), conf);
  var el2 = mori.assoc(res[0], 'directives', directives);

  return initDirectives(app, el2, rest);
}

/**
 * Noop for an init function
 *
 * @param {Function} fn
 * @return {Function}
 */

function noopInit(fn) {
  return function(el) {
    return [el, fn];
  };
}

/**
 * Render a element
 *
 * @param {App} app
 * @param {Element} el
 * @param {Scope} scope
 * @param {Function} fn
 */

function renderElement(app, el, scope, fn) {
  if (mori.is_vector(el)) return renderElements(app, el, scope, fn);
  var directives = mori.get(el, 'directives');
  renderDirective(app, el, scope, directives, fn);
}

function renderElements(app, els, scope, fn) {
  var state = mori.vector();
  mori.reduce_kv(function(acc, key, el) {
    renderElement(app, el, scope, function(err, el2) {
      if (err) return fn(err);
      state = mori.assoc(state, key, el2);
      fn(null, state);
    });
  }, state, els);
}

function renderDirective(app, el, scope, directives, fn) {
  if (mori.is_empty(directives)) return fn(null, el, scope);

  var directive = mori.first(directives);
  var rest = mori.rest(directives);

  var name = mori.get(directive, 'name');
  var change = mori.get(directive, 'change', noopChange);
  var param = mori.get_in(el, ['attrs', name]);

  change(el, scope, param, function(err, el2, scope2) {
    if (err) return fn(err);
    renderDirective(app, el2, scope2 || scope, rest, fn);
  });
}

function noopChange(el, scope, param, done) {
  done(null, el, scope);
}
