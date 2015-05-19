/**
 */

function Comment(nodeValue) {
  this.nodeValue = nodeValue || "";
}

/**
 */

Comment.prototype.create = function(document) {
  return document.createComment(this.nodeValue);
};

/**
 */

module.exports = function(nodeValue) {
  return new Comment(nodeValue);
};