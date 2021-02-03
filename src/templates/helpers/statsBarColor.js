module.exports = function (context) {
  function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }
  
  function colorToHex(color) {
    return "#" + componentToHex(color.r) + componentToHex(color.g) + componentToHex(color.b);
  }

  lerp = function(a,b,u) {
    return (1-u) * a + u * b;
  };

  function getColorInBetween(colorA, colorB, perc) {
    return {
      r: parseInt(lerp(colorA.r, colorB.r, perc)),
      g: parseInt(lerp(colorA.g, colorB.g, perc)),
      b: parseInt(lerp(colorA.b, colorB.b, perc)),
    };
  }

  function getColorTransition(colorA, colorB, stats, targetStats) {
    const perc = (stats - targetStats) / 50.0;
    const newColor = getColorInBetween(colorA, colorB, perc);
    return colorToHex(newColor);
  }

  const low  = { r: 255, g:   0, b:   0 };
  const mid  = { r: 255, g: 254, b:   0 };
  const high = { r: 002, g: 255, b:  42 };
  const top  = { r: 002, g: 255, b: 255 };
  
  const value = parseFloat(context);
  
  if (value <= 50)  return colorToHex(low);
  if (value >= 200) return colorToHex(top);

  if (value > 150) return getColorTransition(high, top, value, 150);
  if (value > 100) return getColorTransition(mid, high, value, 100);
  if (value >  50) return getColorTransition(low,  mid, value, 50);

  return colorToHex(mid);
};