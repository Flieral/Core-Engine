var uuid = require('uuid')
var rwc = require('random-weighted-choice')

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

  inputLeastChecker: function (reqInput, whiteList) {
    var input = Object.keys(reqInput)
    for (var i = 0; i < whiteList.length; i++)
      if (input.indexOf(whiteList[i]) <= -1)
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
  },

  wrapFilter: function (url, filter) {
    if (url.indexOf('?') !== -1)
      return url + '&filter=' + filter  
    else  
      return url + '?filter=' + filter
  },

  shuffleArray: function (array) {
    var currentIndex = array.length, temporaryValue, randomIndex
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex)
      currentIndex -= 1
      temporaryValue = array[currentIndex]
      array[currentIndex] = array[randomIndex]
      array[randomIndex] = temporaryValue
    }
    return array
  },

  randomEqualChance: function (array, number) {
    var result = []
    for (var i = 0; i < number; i++)
      result.push(array[Math.floor(Math.random() * array.length)])
    return result
  },

  randomNonEqualChance: function (table, number) {
    var result = []
    for (var i = 0; i < number; i++)
      result.push(rwc(table))
    return result
  }
}
