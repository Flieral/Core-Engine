var request = require('request')

module.exports = {
  getRequest: function (url, callback) {
    request.get(url)
      .on('response', function (response) {
        callback(null, response)
      })
      .on('error', function (err) {
        callback(err, null)
      })
  },

  postRequest: function (url, body, callback) {
    request.post(url, {
        preambleCRLF: true,
        postambleCRLF: true,
        multipart: [{
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          body: JSON.stringify(body)
        }]
      })
      .on('response', function (response) {
        callback(null, response)
      })
      .on('error', function (err) {
        callback(err, null)
      })
  },

  putRequest: function (url, body, callback) {
    request.put(url, {
        preambleCRLF: true,
        postambleCRLF: true,
        multipart: [{
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          body: JSON.stringify(body)
        }]
      })
      .on('response', function (response) {
        callback(null, response)
      })
      .on('error', function (err) {
        callback(err, null)
      })
  },

  deleteRequest: function (url, body, callback) {
    request.delete(url, {
        preambleCRLF: true,
        postambleCRLF: true,
        multipart: [{
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          body: JSON.stringify(body)
        }]
      })
      .on('response', function (response) {
        callback(null, response)
      })
      .on('error', function (err) {
        callback(err, null)
      })
  },

  headRequest: function (url, callback) {
    request.head(url)
      .on('response', function (response) {
        callback(null, JSON.parse(response))
      })
      .on('error', function (err) {
        callback(err, null)
      })
  }
}
