module.exports = {
  properties: {
    ykiho: { type: 'keyword' },
    yadmNm: { 
      type: 'text',
      analyzer: 'korean'
    },
    location: { type: 'geo_point' },
    addr: { 
      type: 'text',
      analyzer: 'korean'
    },
    telno: { type: 'keyword' }
  }
}; 