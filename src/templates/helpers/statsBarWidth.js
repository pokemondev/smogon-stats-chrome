module.exports = function (context, block) {
  const value = parseFloat(context);
  return value / 200.0 * 100;
};