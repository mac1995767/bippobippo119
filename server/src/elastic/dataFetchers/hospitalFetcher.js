const Hospital = require('../../models/Hospital');

async function fetchHospitals() {
  const hospitals = await Hospital.find({});
  return hospitals.map(hospital => ({
    id: hospital._id.toString(),
    ykiho: hospital.ykiho,
    yadmNm: hospital.yadmNm,
    location: {
      lat: hospital.lat,
      lon: hospital.lon
    },
    clCdNm: hospital.clCdNm,
    addr: hospital.addr,
    telno: hospital.telno
  }));
}

module.exports = { fetchHospitals }; 