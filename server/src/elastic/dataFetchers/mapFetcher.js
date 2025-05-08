const MapData = require('../../models/MapData');

async function fetchMapData() {
  const mapData = await MapData.find({});
  return mapData.map(data => ({
    id: data._id.toString(),
    type: data.type,
    properties: data.properties,
    geometry: data.geometry
  }));
}

module.exports = { fetchMapData }; 