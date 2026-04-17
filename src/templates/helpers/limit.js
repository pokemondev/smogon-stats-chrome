// a limited 'each' loop.
// usage: {{#limit items offset="1" limit="5"}} : items 1 thru 6
// usage: {{#limit items limit="10"}} : items 0 thru 9
// usage: {{#limit items offset="3"}} : items 3 thru context.length
// defaults are offset=0, limit=5
module.exports = function (context, block) {
  const items = context || [];
  let ret = "";
  const offset = parseInt(block.hash.offset, 10) || 0;
  const limit = parseInt(block.hash.limit, 10) || 5;
  let index = offset < items.length ? offset : 0;
  const endIndex = (limit + offset) < items.length ? (limit + offset) : items.length;

  for (; index < endIndex; index++) {
    try {
      ret += block.fn(items[index]);
    } catch (error) { }
  }

  return ret;
};