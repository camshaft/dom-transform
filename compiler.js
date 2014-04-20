/**
 * Module dependencies
 */

var htmlparser = require('htmlparser');

exports = module.exports = Compiler;

var TYPES = {
  'tag': 't'
};

function Compiler() {
  if (!(this instanceof Compiler)) return attach;
  this.views = {};
};

Compiler.prototype.view = function(name, template) {
  var self = this;
  var handler = new htmlparser.DefaultHandler(function(err, dom) {
    if (err) throw err;
    transform(dom);
  });
  var parser = new htmlparser.Parser(handler);
  parser.parseComplete(template);
  this.views[name] = handler.dom;
};

Compiler.prototype.toJSON = function() {
  var self = this;
  var views = {};
  Object.keys(this.views).forEach(function(view) {
    views[view] = minify(self.views[view]);
  });
  return views;
};

function transform(dom) {
  if (Array.isArray(dom)) return dom.map(transform);

  var transforms = dom.transforms = [];
  var attrs = dom.attribs || {};
  Object.keys(attrs).forEach(function(attr) {
    transforms.push({key: attr, value: attrs[attr]});
  });

  dom.children = transform(dom.children || []);

  dom.name = dom.name;
  dom.type = dom.type;

  return dom;
};

function minify(dom) {
  if (Array.isArray(dom)) return dom.map(minify);

  var el = [];

  var a = [];
  dom.transforms.forEach(function(attr) {
    a.push(attr.key, attr.value);
  });
  el.push(a);

  el.push(minify(dom.children || []));

  if (dom.name === 'div') return el;

  el.push(dom.name);

  el.push(dom.type);

  return el;
}

function attach(app) {
  var compiler = new Compiler();
  app.view = function(name, template) {
    compiler.view(name, template);
    this.views[name] = minify(compiler.views[name]);
  };
}
