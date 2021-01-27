module.exports = function (context, block) {
  digits = block.hash.digits == "0" ? 0 : parseInt(block.hash.digits) || 2;
  return parseFloat(context).toFixed(digits);
};