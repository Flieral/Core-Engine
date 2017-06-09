var request = require('request')

function requestToBackend(url, verb, payload, callback) {
  var options = {
    method: verb,
    url: url,
    preambleCRLF: true,
    postambleCRLF: true,
    headers: {
      'content-type': 'application/json',
      'accept': 'application/json'
    },
    body: JSON.stringify(payload)
  }

  request(options, function (error, response, body) {
    if (error || response.statusCode >= 400)
      return callback(error, null)
    return callback(null, JSON.parse(body))
  })
}

module.exports = {
  getRequest: function (url, callback) {
    request.get(url)
      .on('data', function(data) {
        callback(null, JSON.parse(data))
      })
      .on('error', function (err) {
        console.log(err);
        callback(err, null)
      })
  },

  postRequest: function (url, body, callback) {
    requestToBackend(url, 'POST', body, function (err, result) {
      if (err)
        return callback(err, null) 
      return callback(null, result)
    })
  },

  putRequest: function (url, body, callback) {
    requestToBackend(url, 'PUT', body, function (err, result) {
      if (err)
        return callback(err, null) 
      return callback(null, result)
    })
  },

  deleteRequest: function (url, body, callback) {
    requestToBackend(url, 'DELETE', body, function (err, result) {
      if (err)
        return callback(err, null) 
      return callback(null, result)
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
