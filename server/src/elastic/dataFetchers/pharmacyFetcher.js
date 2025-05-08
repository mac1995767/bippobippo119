const Pharmacy = require('../../models/Pharmacy');

async function fetchPharmacies() {
  const pharmacies = await Pharmacy.find({});
  return pharmacies.map(pharmacy => ({
    id: pharmacy._id.toString(),
    ykiho: pharmacy.ykiho,
    yadmNm: pharmacy.yadmNm,
    location: {
      lat: pharmacy.lat,
      lon: pharmacy.lon
    },
    addr: pharmacy.addr,
    telno: pharmacy.telno
  }));
}

module.exports = { fetchPharmacies }; 