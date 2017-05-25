var utility = require('../../public/utility')
var requestHandler = require('../../public/requestHandler')
var config = require('../../server/config')
var applyFilter = require('loopback-filters')

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

  contentManager.requestForContent = function (placementHashIdList, userId, cb) {
    var res = []

    var interaction = app.models.interaction
    interaction.loadInformation(userId, function (err, userModel) {
      if (err)
        return cb(err, null)

      interaction.recommendFor(userId, 20, function (err, recoms) {
        if (err)
          return cb(err, null)

        for (var i = 0; i < placementHashIdList.length; i++) {
          var offlineRes = []
          var onlineRes = []

          var url = utility.wrapAccessToken(publisherBaseURL + '/placements/' + placementHashIdList[i], app.publisherAccessToken)
          requestHandler.getRequest(url, function (err, placementsResponse) {
            if (err)
              return cb(err, null)
            
            var callbackFired = false
            var contentCounter = 0

            var style = placementsResponse.style
            var subPlan = subPlanList
            var subcampaignStarted = statusConfig.started
            var campaignStarted = statusConfig.started
            var category = utility.shuffleArray(placementsResponse.settingModel.category)
            var country = userModel.applicationModel.country
            var language = userModel.applicationModel.language
            var device = userModel.applicationModel.device
            var os = userModel.applicationModel.os
            var connection = userModel.applicationModel.connection
            
            var filterClause = {
              'where': {
                'and': [
                  {
                    'status': campaignStarted
                  },
                  {
                    'subcampaignList.status': subcampaignStarted
                  },
                  {
                    'subcampaignList.style': style
                  },
                  {
                    'subcampaignList.plan': {
                      'inq': subPlan
                    }
                  },
                  {
                    'subcampaignList.settingModel.category': {
                      'inq': category
                    }
                  },
                  {
                    'subcampaignList.settingModel.country': {
                      'inq': country
                    }
                  },
                  {
                    'subcampaignList.settingModel.language': {
                      'inq': language
                    }
                  },
                  {
                    'subcampaignList.settingModel.device': {
                      'inq': device
                    }
                  },
                  {
                    'subcampaignList.settingModel.os': {
                      'inq': os
                    }
                  },
                  {
                    'subcampaignList.settingModel.connection': {
                      'inq': connection
                    }
                  }
                ]
              },
              'include': [
                'subcampaignList'
              ],
              'order' : 'subcampaignList.ranking DESC'
            }

            url = utility.wrapAccessToken(announcerBaseURL + '/campaigns', app.announcerAccessToken)
            url = utility.wrapFilter(url, filterClause)

            requestHandler.getRequest(url, function (err, campaignsResponse) {
              if (err)
                return cb(err, null)
              
              function fillSubcampaigns(campsResponse) {
                var remaining
                
                if (onlineRes.length < placementsResponse.onlineCapacity) {
                  var onlineMode = applyFilter(campsResponse, { where: { 'subcampaignList.plan': { inq: subPlan } } })
                  for (var j = 0; j < onlineMode.length; j++)
                    if (recoms.indexOf(onlineMode[j].subcampaignList.id) > 0)
                      onlineRes.push(onlineMode[j].subcampaignList.id)

                  remaining = placementsResponse.onlineCapacity - onlineRes.length

                  if (remaining > 0)
                    Array.prototype.push.apply(onlineRes, utility.randomNonEqualChance(onlineMode, Math.floor((2 / 3) * remaining)))

                  if (remaining > 0)
                    Array.prototype.push.apply(onlineRes, utility.randomEqualChance(onlineMode, Math.floor((1 / 3) * remaining)))
                }

                if (offlineRes.length < placementsResponse.offlineCapacity) {
                  var offlineMode = applyFilter(campsResponse, { where: { 'subcampaignList.plan': 'CPV' } })
                  for (var j = 0; j < offlineMode.length; j++)
                    if (recoms.indexOf(offlineMode[j].subcampaignList.id) > 0)
                      offlineRes.push(offlineMode[j].subcampaignList.id)

                  remaining = placementsResponse.offlineCapacity - offlineRes.length

                  if (remaining > 0)
                    Array.prototype.push.apply(offlineRes, utility.randomNonEqualChance(offlineMode, Math.floor((2 / 3) * remaining)))

                  if (remaining > 0)
                    Array.prototype.push.apply(offlineRes, utility.randomEqualChance(offlineMode, Math.floor((1 / 3) * remaining)))
                }
              }

              fillSubcampaigns(campaignsResponse)

              var yetOnlineRemaining = placementsResponse.onlineCapacity - onlineRes.length
              var yetOfflineremaining = placementsResponse.offlineCapacity - offlineRes.length
              var innerCallback = false
              if (yetOnlineRemaining > 0 || yetOfflineremaining > 0) {
                innerCallback = true
                var baseFilterClause = {
                  'where': {
                    'and': [
                      {
                        'status': campaignStarted
                      },
                      {
                        'subcampaignList.status': subcampaignStarted
                      },
                      {
                        'subcampaignList.style': style
                      }
                    ]
                  },
                  'include': [
                    'subcampaignList'
                  ],
                  'order' : 'subcampaignList.ranking DESC'
                }
                url = utility.wrapAccessToken(announcerBaseURL + '/campaigns', app.announcerAccessToken)
                url = utility.wrapFilter(url, baseFilterClause)

                requestHandler.getRequest(url, function (err, yetCampaignsResponse) {
                  if (err)
                    return cb(err, null)
                  
                  fillSubcampaigns(yetCampaignsResponse)
                  var model = {
                    onlineContent: onlineRes,
                    offlineContent: offlineRes,
                    placementId: placementHashIdList[i]
                  }
                  res.push(model)

                  if (res.length == placementHashIdList.length)
                    return cb(null, res)
                })
              }
              
              if (!innerCallback) {
                var model = {
                  onlineContent: onlineRes,
                  offlineContent: offlineRes,
                  placementId: placementHashIdList[i]
                }
                res.push(model)

                if (res.length == placementHashIdList.length)
                  return cb(null, res)
              }
            })
          })
        }
      })
    })
  }

  contentManager.remoteMethod('requestForContent', {
    accepts: [{
      arg: 'placementHashIdList',
      type: 'object',
      required: true,
      http: {
        source: 'body'
      }
    },
    {
      arg: 'userId',
      type: 'string',
      required: true,
      http: {
        source: 'query'
      }
    }],
    description: 'returns file url list of requested placements',
    http: {
      path: '/requestForContent',
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
