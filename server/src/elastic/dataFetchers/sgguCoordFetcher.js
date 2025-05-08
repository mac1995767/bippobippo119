const SgguCoordinate = require('../../models/SgguCoordinate');

async function fetchSgguCoordinates() {
  const coordinates = await SgguCoordinate.find({});
  return coordinates.map(coord => ({
    id: coord._id.toString(),
    code: coord.code,
    name: coord.name,
    location: {
      lat: coord.lat,
      lon: coord.lon
    }
  }));
}

module.exports = { fetchSgguCoordinates }; 