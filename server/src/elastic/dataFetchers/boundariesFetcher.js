const SgguBoundary = require('../../models/SgguBoundary');

async function fetchBoundaries() {
  const boundaries = await SgguBoundary.find({});
  return boundaries.map(boundary => ({
    id: boundary._id.toString(),
    code: boundary.code,
    name: boundary.name,
    geometry: boundary.geometry
  }));
}

module.exports = { fetchBoundaries }; 