module.exports = function (str) {
  const name = (str || "");
  return name.replace("-*", "").replace(" ", "-").toLowerCase();
};