module.exports = {
  properties: {
    code: { type: 'keyword' },
    name: { 
      type: 'text',
      analyzer: 'korean'
    },
    geometry: { type: 'geo_shape' }
  }
}; 