module.exports = function (context, block) {
  const digits = block.hash.digits == "0" ? 0 : parseInt(block.hash.digits, 10) || 2;
  return parseFloat(context).toFixed(digits);
};