var createSection    = require("./section");
var fragment         = require("./fragment");
var FragmentSection  = require("./_fragmentSection");
var NodeSection      = require("./_nodeSection");

/**
 */

function Element(nodeName, attributes, childNodes) {
  this.nodeName   = String(nodeName).toLowerCase();
  this.attributes = attributes;
  this.childNodes = childNodes;
  for (var i = childNodes.length; i--;) childNodes[i].parentNode = this;
}

/**
 */

Element.prototype.nodeType = 1;

/**
 */

Element.prototype.freeze = function(options, hydrators) {

  var components = options.components || {};
  var attributes = options.attributes || {};

  if (components[this.nodeName]) {
    return this._freezeComponent(components[this.nodeName], options, hydrators);
  }

  return this._freezeElement(options, hydrators);
};

/**
 */

Element.prototype._freezeComponent = function(clazz, options, hydrators) {

  // TODO - check parent node to see if there are anymore children. If not, then user NodeSection
  var section = new FragmentSection(options.document);
  var frag    = fragment.apply(this, this.childNodes);
  hydrators.push(new ComponentHydrator(clazz, section, frag, this._splitAttributes(options), options));
  return section.render();
};

/**
 */

Element.prototype._freezeElement = function(options, hydrators) {

  var element = options.document.createElement(this.nodeName);

  var inf = this._splitAttributes(options);

  for (var attrName in inf.staticAttributes) {
    element.setAttribute(attrName, inf.staticAttributes[attrName]);
  }

  for (var i = 0, n = this.childNodes.length; i < n; i++) {
    element.appendChild(this.childNodes[i].freeze(options, hydrators));
  }

  if (Object.keys(inf.dynamicAttributes).length) {
    hydrators.push(new ElementAttributeHydrator(new NodeSection(options.document, element), options, inf.dynamicAttributes));
  }

  return element;
};


/**
 */

Element.prototype._splitAttributes = function(options) {

  var dynamicAttributes = {};
  var staticAttributes  = {};

  if (options.attributes) {
    for (var key in this.attributes) {
      if (options.attributes[key]) {
        dynamicAttributes[key] = this.attributes[key];
      } else {
        staticAttributes[key]  = this.attributes[key];
      }
    }
  } else {
    staticAttributes = this.attributes;
  }

  return {
    dynamicAttributes : dynamicAttributes,
    staticAttributes  : staticAttributes
  };
};

/**
*/

function ComponentHydrator(clazz, section, childNodes, attrInfo, options) {
  this.clazz                = clazz;
  this.section              = section;
  this.childNodes           = childNodes;
  this.dynamicAttributes    = attrInfo.dynamicAttributes;
  this.attributes           = attrInfo.staticAttributes;
  this.hasDynamicAttributes = !!Object.keys(attrInfo.dynamicAttributes).length;
  this.options              = options;
}

/**
*/

ComponentHydrator.prototype.hydrate = function(root, bindings) {
  if (!this._marker) this._marker = this.section.createMarker();
  var ref = new this.clazz(this._marker.createSection(root), this.childNodes, this.attributes, this.options);
  if (this.hasDynamicAttributes) {
    _hydrateDynamicAttributes(ref, this.options, this.dynamicAttributes, bindings);
  }
  bindings.push(ref);
};

/**
 */

module.exports = function(name, attributes, children) {
  return new Element(name, attributes, Array.prototype.slice.call(arguments, 2));
};

/**
 */

function ElementAttributeHydrator(section, options, dynamicAttributes) {
  this.section           = section;
  this.options           = options;
  this.dynamicAttributes = dynamicAttributes;
}

/**
 */

ElementAttributeHydrator.prototype.hydrate = function(root, bindings) {
  if (!this._marker) this._marker = this.section.createMarker();
  _hydrateDynamicAttributes(this._marker.findNode(root), this.options, this.dynamicAttributes, bindings);
};

/**
 */

function _hydrateDynamicAttributes(ref, options, dynamicAttributes, bindings) {
  for (var key in dynamicAttributes) {
    var clazz = options.attributes[key];
    var attr = new clazz(ref, key, dynamicAttributes[key], options);
    if (attr.update) bindings.push(attr);
  }
}
