var requestHandler = require('../../public/requestHandler')
var config = require('../config')

module.exports = function (app) {
  var baseURL = 'http://' + config.announcerService.server + ':' + config.announcerService.port + '/api/'
  
  var user = {
    'email': 'support@flieral.com',
    'password': 'Fl13r4lSupportPass'
  }

  var url = baseURL + 'clients/login'  
  requestHandler.postRequest(url, user, function (err, result) {
    if (err)
      throw err
    app.announcerAccessToken = result.id
  })

}
