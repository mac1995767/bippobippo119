module.exports = {
  properties: {
    code: { type: 'keyword' },
    name: { 
      type: 'text',
      analyzer: 'korean'
    },
    location: { type: 'geo_point' }
  }
}; 