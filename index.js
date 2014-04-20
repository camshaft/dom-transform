/**
 * Module dependencies
 */

var debug = require('debug')('dom-transform:app');
var mori = require('mori');
var Batch = require('batch');

var inspect = require('util').inspect;

exports = module.exports = App;

function App(name, views) {
  if (!(this instanceof App)) return new App(views);
  this.name = name;
  this.views = views || {};
  this.directives = {};
  this.transforms = [];
  this.scope = mori.hash_map();
  this.mori = mori;
};

App.prototype.use = function(fn) {
  fn(this);
  return this;
};

App.prototype.directive = function(name, fn) {
  debug('adding directive', name);
  this.directives[name] = fn;
};

App.prototype.transform = function(fn) {
  debug('adding transform');
  this.transforms.push(fn);
};

App.prototype.init = function(name) {
  debug('rendering view', name);
  var self = this;
  var views = this.views[name] || [];
  var root = mori.vector.apply(null, views.map(createEl));
  var tree = init(self, root);
  return tree;
  return function(scope, fn) {
    // TODO
    fn(null, {});
  };
};

App.prototype.render = function(name, fn) {
  debug('rendering view', name);
  var self = this;
  var views = this.views[name] || [];
  var root = mori.vector.apply(null, views.map(createEl));

  init2(self, root, self.scope, fn);
};

function createEl(view) {
  var attrs = mori.hash_map.apply(null, view[0] || []);
  return mori.hash_map(
    'name', view[2] || 'div',
    'type', view[3] || 'tag',
    'attrs', attrs,
    'children', mori.vector.apply(null, (view[1] || []).map(createEl))
  );
}

function init(app, view) {
  if (mori.is_vector(view)) return initCollection(app, view);
  debug('initializing view', view);
  var view2 = initDirectives(app, view, mori.keys(mori.get(view, 'attrs')));
  // TODO initialize children
  // if (mori.is_vector(view2)) return initCollection(app, view2);
  // var children = initCollection(app, mori.get(view2, 'children'));
  // return mori.assoc(view2, 'children', children);
  return view2;
}

function initCollection(app, views) {
  debug('initiailizing collection', views);
  return mori.map(function(view) {
    return init(app, view);
  }, views);
}

function initDirectives(app, view, attrs) {
  if (mori.is_empty(attrs)) return view;
  var attr = mori.first(attrs);
  var rest = mori.rest(attrs);
  var conf = app.directives[attr];
  if (!conf) return initDirectives(app, view, rest);
  var param = mori.get_in(view, ['attrs', attr]);

  // the link function was only implemented
  // if (typeof conf === 'function') return initDirectives(app, view, rest);

  // TODO only init directive here
  var users = mori.vector(
    mori.hash_map('name', 'cameron'),
    mori.hash_map('name', 'mike'),
    mori.hash_map('name', 'tim'));
  var defaultScope = mori.hash_map('users', users);
  var scope = mori.get(view, 'scope', defaultScope);

  var view2 = conf(view, scope, param);
  return initDirectives(app, view2, rest);
}

function init2(app, view, scope, fn) {
  if (mori.is_vector(view)) return initCollection2(app, view, scope, fn);
  debug('initializing view', view);
  scope = mori.get('scope', view, scope);
  applyDirectives2(app, view, scope, mori.keys(view, 'children'), function(err, view2, scope2) {
    if (err) return fn(err);
    initCollection2(app, mori.get(view2, 'children'), scope, function(err, children) {
      if (err) return fn(err);
      fn(null, mori.assoc(view2, 'children', children));
    });
  });
}

function initCollection2(app, views, scope, fn) {
  debug('initiailizing collection', views);
  if (mori.is_empty(views)) return fn();
  var collection = [];

  mori.reduce_kv(function(acc, i, view) {
    init2(app, view, scope, function(err, el) {
      if (err) return fn(err);
      acc[i] = view;
      fn(null, mori.vector.apply(null, acc));
    });
  }, collection, views);
}

function applyDirectives2(app, el, scope, attrs, done) {
  if (mori.is_empty(attrs)) return done(null, el, scope);
  var attr = mori.first(attrs);
  var rest = mori.rest(attrs);
  var fn = app.directives[attr];
  if (!fn) return applyDirectives2(app, el, scope, rest, done);
  debug('applying directive', attr);
  var res;
  if (fn.length === 0) fn = fn();
  if (fn.length === 1) {
    res = fn(el);
    if (typeof res !== 'function') return applyDirectives2(app, res, scope, rest, done);
    if (res.length === 1) return applyDirectives2(app, res(scope), res, done);
    return res(scope, function(err, el2, scope2) {
      applyDirectives2(app, el2, scope2, rest, done);
    });
  }
  if (fn.length === 2) {
    res = fn(el, scope);
    if (typeof res !== 'function') return applyDirectives2(app, res, scope, rest, done);
    if (res.length === 0) return applyDirectives2(app, res(), res, done);
    return res(function(err, el2, scope2) {
      applyDirectives2(app, el2, scope2, rest, done);
    });
  }
  fn(el, scope, function(err, el2, scope2) {
    if (err) return done(err);
    applyDirectives2(app, el2, scope2, rest, done);
  });
}
