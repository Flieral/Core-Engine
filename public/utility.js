var uuid = require('uuid')

module.exports = {
  generateQueryString: function (data) {
    var ret = []
    for (var d in data)
      if (data[d])
        ret.push(encodeURIComponent(d) + "=" + encodeURIComponent(data[d]))
    return ret.join("&")
  },

  base64Encoding: function (data) {
    return new Buffer(data).toString('base64')
  },

  base64Decoding: function (data) {
    return new Buffer(data, 'base64')
  },
  
  getUnixTimeStamp: function () {
    return Math.floor((new Date).getTime() / 1000)
  },

  stringReplace: function (source, find, replace) {
    return source.replace(find, replace)
  },

  inputChecker: function (reqInput, whiteList) {
    var input = Object.keys(reqInput)
    for (var i = 0; i < input.length; i++)
      if (whiteList.indexOf(input[i]) <= -1)
        return false
    return true
  },

  JSONIterator: function (input, validator) {
    for (var i = 0; i < input.length; i++)
      if (validator.indexOf(input[i]) == -1)
        return false
    return true
  },

  inputPresence: function (input, whiteList) {
    if (whiteList.indexOf(input) <= -1)
      return false
    return true
  },

  generateUniqueHashID: function () {
    return uuid.v4()
  },

  wrapAccessToken: function (url, accessToken) {
    if (url.indexOf('?') !== -1)
      return url + '&accessToken=' + accessToken  
    else  
      return url + '?accessToken=' + accessToken
  }
}  
