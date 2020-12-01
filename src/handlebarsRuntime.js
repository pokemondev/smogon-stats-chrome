const Handlebars = require('handlebars');

Handlebars.registerHelper('lowercase', function (str) {
  return (str || "").toLowerCase();
});

Handlebars.registerHelper('safePkmName', function (str) {
  const name = (str || "");
  return name.replace("-*", "").replace(" ", "-").toLowerCase();
});

Handlebars.registerHelper('perc', function (context, block) {
  digits = parseInt(block.hash.digits) || 2;
  return parseFloat(context).toFixed(digits);
});

// a limited 'each' loop.
// usage: {{#limit items offset="1" limit="5"}} : items 1 thru 6
// usage: {{#limit items limit="10"}} : items 0 thru 9
// usage: {{#limit items offset="3"}} : items 3 thru context.length
// defaults are offset=0, limit=5
Handlebars.registerHelper('limit', function (context, block) {
  context = context ? context : {};
  var ret = "",
    offset = parseInt(block.hash.offset) || 0,
    limit = parseInt(block.hash.limit) || 5,
    i = (offset < context.length) ? offset : 0,
    j = ((limit + offset) < context.length) ? (limit + offset) : context.length;

  for (i, j; i < j; i++) {
    ret += block.fn(context[i]);
  }

  return ret;
});

module.exports = Handlebars;