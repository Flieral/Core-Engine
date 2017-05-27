var utility = require('../../public/utility')
var requestHandler = require('../../public/requestHandler')
var config = require('../../server/config')
var applyFilter = require('loopback-filters')

var app = require('../../server/server')

var statusConfig = require('../../config/status')
var subPlanList = require('../../config/subPlan')

module.exports = function (contentManager) {

  var publisherBaseURL = 'http://' + config.publisherService.server + ':' + config.publisherService.port + '/api'
  var announcerBaseURL = 'http://' + config.announcerService.server + ':' + config.announcerService.port + '/api'

  contentManager.authorization = function (publisherHashId, applicationHashId, cb) {
    var url = utility.wrapAccessToken(publisherBaseURL + '/clients/' + publisherHashId + '/applications/' + applicationHashId, app.publisherAccessToken)
    requestHandler.getRequest(url, function (err, applicationResponse) {
      if (err)
        return cb(err)
      url = utility.wrapAccessToken(publisherBaseURL + '/applications/' + applicationHashId + '/placements', app.publisherAccessToken)
      requestHandler.getRequest(url, function (err, placementsList[i]) {
        if (err)
          return cb(err)
        return cb(placementsList[i])
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

  contentManager.requestForContent = function (placementsList, userId, cb) {
    var res = []

    function fillModel(entry, subcampaign, placement) {
      var model = {
        announcerInfo: {
          announcerHashId: subcampaign.clientId,
          campaignHashId: subcampaign.campaignId,
          subcampaignHashId: subcampaign.id,
          fileURL: subcampaign.fileURL
        },
        publisherInfo: {
          publisherHashId: placement.clientId,
          applicationHashId: placement.applicationId,
          placementHashId: placement.id
        }
      }
      entry.push(model)
    }

    var interaction = app.models.interaction
    interaction.loadInformation(userId, function (err, userModel) {
      if (err)
        return cb(err)

      interaction.recommendFor(userId, 20, function (err, recoms) {
        if (err)
          return cb(err)

        for (var i = 0; i < placementsList.length; i++) {
          var offlineRes = []
          var onlineRes = []

          var callbackFired = false
          var contentCounter = 0

          var style = placementsList[i].style
          var subPlan = subPlanList
          var subcampaignApproved = statusConfig.approved
          var campaignStarted = statusConfig.started
          var category = utility.shuffleArray(placementsList[i].settingModel.category)
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
                  'subcampaigns.status': subcampaignApproved
                },
                {
                  'subcampaigns.style': style
                }
              ]
            },
            'include': [
              'subcampaigns'
            ]
          }

          url = utility.wrapAccessToken(announcerBaseURL + '/campaigns', app.announcerAccessToken)
          url = utility.wrapFilter(url, JSON.stringify(filterClause))

          requestHandler.getRequest(url, function (err, campaignsResponse) {
            if (err)
              return cb(err)
            
            if (campaignsResponse.length == 0)
              return cb(new Error('empty campaign response'))

            var totalSubcampaigns = []
            for (var j = 0; j < campaignsResponse.length; j++)
              for (var k = 0; k < campaignsResponse[j].subcampaigns.length; k++)
                totalSubcampaigns.push(campaignsResponse[j].subcampaigns[k])

            var firstInputFilter = {
              'where': {
                'and': [
                  {
                    'style': style
                  },
                  {
                    'plan': {
                      'inq': subPlan
                    }
                  },
                  {
                    'settingModel.category': {
                      'inq': category
                    }
                  },
                  {
                    'settingModel.country': {
                      'inq': country
                    }
                  },
                  {
                    'settingModel.language': {
                      'inq': language
                    }
                  },
                  {
                    'settingModel.device': {
                      'inq': device
                    }
                  },
                  {
                    'settingModel.os': {
                      'inq': os
                    }
                  },
                  {
                    'settingModel.connection': {
                      'inq': connection
                    }
                  }
                ]
              }
            }
            var firstInputSubcampaigns = applyFilter(totalSubcampaigns, firstInputFilter)
            fillSubcampaigns(firstInputSubcampaigns)

            function fillSubcampaigns(subcampaignsList) {
              var remaining
              
              function refineRandomChances(entry, inputArray, placement) {
                for (var j = 0; j < inputArray.length; j++)
                  fillModel(entry, inputArray[j], placement)
              }

              if (onlineRes.length < placementsList[i].onlineCapacity) {
                var onlineMode = subcampaignsList
                for (var j = 0; j < onlineMode.length; j++)
                  if (recoms.indexOf(onlineMode[j].id) > 0)
                    fillModel(onlineRes, onlineMode[j], placementsList[i])

                remaining = placementsList[i].onlineCapacity - onlineRes.length
                if (remaining > 0)
                  refineRandomChances(onlineRes, utility.randomNonEqualChance(onlineMode, Math.floor((2 / 3) * remaining)))
                
                remaining = placementsList[i].onlineCapacity - onlineRes.length
                if (remaining > 0)
                  refineRandomChances(onlineRes, utility.randomNonEqualChance(onlineMode, Math.floor((1 / 3) * remaining)))
              }

              if (offlineRes.length < placementsList[i].offlineCapacity) {
                var offlineMode = applyFilter(subcampaignsList, { where: { 'plan': 'CPV' } })
                for (var j = 0; j < offlineMode.length; j++)
                  if (recoms.indexOf(offlineMode[j].id) > 0)
                    fillModel(offlineRes, offlineMode[j], placementsList[i])

                remaining = placementsList[i].offlineCapacity - offlineRes.length
                if (remaining > 0)
                  refineRandomChances(offlineRes, utility.randomNonEqualChance(offlineMode, Math.floor((2 / 3) * remaining)))

                remaining = placementsList[i].offlineCapacity - offlineRes.length
                if (remaining > 0)
                  refineRandomChances(offlineRes, utility.randomNonEqualChance(offlineMode, Math.floor((1 / 3) * remaining)))
              }
            }

            var yetOnlineRemaining = placementsList[i].onlineCapacity - onlineRes.length
            var yetOfflineremaining = placementsList[i].offlineCapacity - offlineRes.length
            if (yetOnlineRemaining > 0 || yetOfflineremaining > 0) {
              fillSubcampaigns(totalSubcampaigns)
            }

            function fillFinalResult() {
              var model = {
                onlineContent: onlineRes,
                offlineContent: offlineRes,
                placementId: placementsList[i]
              }
              res.push(model)
              if (res.length == placementsList.length)
                return cb(res)
            }

            fillFinalResult()
          })
        }
      })
    })
  }

  contentManager.remoteMethod('requestForContent', {
    accepts: [{
      arg: 'placementsList',
      type: 'array',
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
