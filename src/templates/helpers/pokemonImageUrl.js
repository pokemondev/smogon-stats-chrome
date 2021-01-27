module.exports = function (name) {
  name = name || "pikachu";
  return `https://play.pokemonshowdown.com/sprites/xyani/${name.replace(/ /g, '').toLowerCase()}.gif`;
};
