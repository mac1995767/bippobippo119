module.exports = {
  properties: {
    ykiho: { type: 'keyword' },
    yadmNm: { 
      type: 'text',
      analyzer: 'korean',
      fields: {
        keyword: { type: 'keyword' }
      }
    },
    location: { type: 'geo_point' },
    clCdNm: { type: 'keyword' },
    addr: { 
      type: 'text',
      analyzer: 'korean'
    },
    telno: { type: 'keyword' }
  }
}; 