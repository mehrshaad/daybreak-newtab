// Hand angles for the analog face, in degrees clockwise from twelve.
//
// Hands move continuously rather than ticking between positions: the hour hand
// creeps with the minutes and the minute hand with the seconds, which is what
// a real movement does and what makes 3:59 read as nearly four.
export function handAngles(date) {
  const seconds = date.getSeconds() + date.getMilliseconds() / 1000;
  const minutes = date.getMinutes() + seconds / 60;
  const hours = (date.getHours() % 12) + minutes / 60;
  return {
    hour: hours * 30,
    minute: minutes * 6,
    second: seconds * 6,
  };
}

// Endpoint of a hand of the given length, for a face of radius 50 centred at
// (50, 50). Degrees are clockwise from twelve, so 0 points straight up.
export function handPoint(degrees, length, centre = 50) {
  const radians = ((degrees - 90) * Math.PI) / 180;
  return {
    x: centre + Math.cos(radians) * length,
    y: centre + Math.sin(radians) * length,
  };
}
