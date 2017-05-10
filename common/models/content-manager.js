var utility = require('../../public/utility')
var requestHandler = require('../../public/requestHandler')
var config = require('../../server/config')
var app = require('../../server/server')

var statusConfig = require('../../config/status')
var subPlanList = require('../../config/subPlan')

module.exports = function (contentManager) {

  var publisherBaseURL = 'http://' + config.publisherService.server + ':' + config.publisherService.port + '/api/'
  var announcerBaseURL = 'http://' + config.announcerService.server + ':' + config.announcerService.port + '/api/'

  contentManager.authorization = function (publisherHashId, applicationHashId, cb) {
    var url = utility.wrapAccessToken(publisherBaseURL + '/clients/' + publisherHashId + '/applications/' + applicationHashId, app.publisherAccessToken)
    requestHandler.getRequest(url, function (err, applicationResponse) {
      if (err)
        return cb(err, null)
      url = utility.wrapAccessToken(publisherBaseURL + '/applications/' + applicationHashId + '/placements', app.publisherAccessToken)
      requestHandler.getRequest(url, function (err, placementsResponse) {
        if (err)
          return cb(err, null)
        return cb(null, placementsResponse)
      })
    })
  }

  contentManager.remoteMethod('authorization', {
    accepts: [{
        arg: 'publisherHashId',
        type: 'string',
        required: true,
        http: {
          source: 'query'
        }
      },
      {
        arg: 'applicationHashId',
        type: 'string',
        required: true,
        http: {
          source: 'query'
        }
      }
    ],
    description: 'returns status of authorizing publisher and its application and placements of that patrticular applcation',
    http: {
      path: '/authorization',
      verb: 'POST',
      status: 200,
      errorStatus: 400
    },
    returns: {
      arg: 'response',
      type: 'object'
    }
  })

}
