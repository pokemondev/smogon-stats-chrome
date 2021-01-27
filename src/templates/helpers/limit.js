// a limited 'each' loop.
// usage: {{#limit items offset="1" limit="5"}} : items 1 thru 6
// usage: {{#limit items limit="10"}} : items 0 thru 9
// usage: {{#limit items offset="3"}} : items 3 thru context.length
// defaults are offset=0, limit=5
module.exports = function (context, block) {
  context = context ? context : {};
  var ret = "",
    offset = parseInt(block.hash.offset) || 0,
    limit = parseInt(block.hash.limit) || 5,
    i = (offset < context.length) ? offset : 0,
    j = ((limit + offset) < context.length) ? (limit + offset) : context.length;

  for (i, j; i < j; i++) {
    try {
      ret += block.fn(context[i]);
    } catch (error) { }
  }

  return ret;
};