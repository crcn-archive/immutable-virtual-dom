var expect = require("expect.js");
var ivd    = require("..");
var doc    = require("nofactor");


describe(__filename + "#", function() {

  it("can be created", function() {
      ivd.element();
  });

  it("can create an element with attributes", function() {
    var el = ivd.element("div", { id: "test" });
    expect(el.attributes.id).to.be("test");
    expect(el.nodeName).to.be("div");
  });

  it("can create an element with children", function() {
    var el = ivd.element("div", { id: "test" }, ivd.text("hello"), ivd.text("world"));
    expect(el.childNodes.length).to.be(2);
    expect(el.childNodes[0].nodeValue).to.be("hello");
    expect(el.childNodes[1].nodeValue).to.be("world");
  });

  it("can create a node", function() {
    var vel = ivd.element("div", { a: "1", b: "2" }, ivd.text("hello"), ivd.text("world"));
    expect(vel.freeze({ document: doc }).toString()).to.be("<div a=\"1\" b=\"2\">helloworld</div>");
  });

  it("can specify a custom attribute", function() {
    var vel = ivd.template(ivd.element("div", { a: "1" }), {
      attributes: {
        a: function(ref, key, value) {
          expect(key).to.be("a");
          ref.setAttribute("b", value);
        }
      }
    });

  });

  it("can update registered attributes", function() {

    var vel = ivd.template(ivd.element("div", { a: true }), {
      attributes: {
        a: function(ref, key, value, options) {
          this.update = function(context) {
            ref.setAttribute(key, context.message);
          }
        }
      }
    });

    var v = vel.view({message:"Hello"});
    expect(v.render().toString()).to.be("<div a=\"Hello\"></div>");
    v.update({message:"blip"})
    expect(v.render().toString()).to.be("<div a=\"blip\"></div>");
    v.render();
  });

});
