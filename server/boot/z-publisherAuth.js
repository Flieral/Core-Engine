var requestHandler = require('../../public/requestHandler')
var config = require('../config')

module.exports = function (app) {
  var baseURL = 'http://' + config.publisherService.server + ':' + config.publisherService.port + '/api/'
  
  var user = {
    email: 'Support@Flieral.com',
    password: 'Fl13r4lSupportPass'
  }

  var url = baseURL + 'clients/login'  
  requestHandler.postRequest(url, user, function (err, result) {
    if (err)
      throw err
    app.publisherAccessToken = result.id
  })

}
