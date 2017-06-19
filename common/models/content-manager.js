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
      requestHandler.getRequest(url, function (err, placementsList) {
        if (err)
          return cb(err)
        return cb(null, placementsList)
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

        var campaignStarted = statusConfig.started
        var filterClause = {
          'where': {
            'status': campaignStarted
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

          for (var i = 0; i < placementsList.length; i++) {
            var placementModel = JSON.parse(JSON.stringify(placementsList[i]))
            var offlineRes = []
            var onlineRes = []

            var style = placementModel.style
            var subPlan = subPlanList
            var subcampaignApproved = statusConfig.approved
            // var category = utility.shuffleArray(placementModel.settingModel.category)
            var country = userModel.applicationModel.country
            var language = userModel.applicationModel.language
            var device = userModel.applicationModel.device
            var os = userModel.applicationModel.os
            var connection = userModel.applicationModel.connection
              
            var firstInputFilter = {
              'where': {
                'and': [
                  {
                    'status': subcampaignApproved
                  },
                  {
                    'style': style
                  },
                  {
                    'plan': {
                      'inq': subPlan
                    }
                  }
                ]
              }
            }

            var querySubcampaigns = applyFilter(totalSubcampaigns, firstInputFilter)
            var secondInputSubcampaigns = querySubcampaigns
            var firstInputSubcampaigns = []
            for (var k = 0; k < querySubcampaigns.length; k++) {
              var msub = querySubcampaigns[k]
              if (msub.settingModel.device.indexOf(device) >= 0 && msub.settingModel.os.indexOf(os) >= 0 && msub.settingModel.connection.indexOf(connection) >= 0 && msub.settingModel.language.indexOf(language) >= 0) {
                firstInputSubcampaigns.push(msub)
              }
            }
            if (firstInputSubcampaigns.length != 0) {
              fillSubcampaigns(firstInputSubcampaigns)
            }

            var yetOnlineRemaining = placementModel.onlineCapacity - onlineRes.length
            var yetOfflineremaining = placementModel.offlineCapacity - offlineRes.length
            if (yetOnlineRemaining > 0 || yetOfflineremaining > 0) {
              fillSubcampaigns(secondInputSubcampaigns)
            }

            fillFinalResult()

            function fillSubcampaigns(subcampaignsList) {
              var remaining
              
              function refineRandomChances(entry, inputArray, placement) {
                for (var j = 0; j < inputArray.length; j++)
                  fillModel(entry, inputArray[j], placement)
              }

              if (onlineRes.length < placementModel.onlineCapacity) {
                var onlineMode = subcampaignsList
                for (var j = 0; j < onlineMode.length; j++)
                  if (recoms.indexOf(onlineMode[j].id) > 0) {
                    fillModel(onlineRes, onlineMode[j], placementModel)
                  }

                remaining = placementModel.onlineCapacity - onlineRes.length
                if (remaining > 0) {
                  if (onlineMode.length < remaining)
                    remaining = onlineMode.length
                  var inp = utility.randomNonEqualChance(onlineMode, remaining)
                  var ans = []
                  for (var k = 0; k < inp.length; k++)
                    for (var t = 0; t < onlineMode.length; t++)
                      if (inp[k] === onlineMode[t].id)
                        ans.push(onlineMode[t])
                  refineRandomChances(onlineRes, ans, placementModel)
                }

                remaining = placementModel.onlineCapacity - onlineRes.length
                if (remaining > 0) {
                  if (onlineMode.length < remaining)
                    remaining = onlineMode.length
                  var inp = utility.randomEqualChance(onlineMode, remaining)
                  refineRandomChances(onlineRes, inp, placementModel)
                }
              }

              if (offlineRes.length < placementModel.offlineCapacity) {
                var offlineMode = []
                for (var j = 0; j < subcampaignsList.length; j++) {
                  var msub = subcampaignsList[j]
                  if (msub.plan === 'CPV')
                    offlineMode.push(msub)
                }

                if (offlineMode.length > 0) {
                  for (var j = 0; j < offlineMode.length; j++)
                    if (recoms.indexOf(offlineMode[j].id) > 0) {
                      fillModel(offlineRes, offlineMode[j], placementModel)
                    }

                  remaining = placementModel.offlineCapacity - offlineRes.length
                  if (remaining > 0) {
                    if (offlineMode.length < remaining)
                      remaining = offlineMode.length
                    var inp = utility.randomNonEqualChance(offlineMode, remaining)
                    var ans = []
                    for (var k = 0; k < inp.length; k++)
                      for (var t = 0; t < offlineMode.length; t++)
                        if (inp[k] === offlineMode[t].id)
                          ans.push(offlineMode[t])
                    refineRandomChances(offlineRes, ans, placementModel)
                  }

                  remaining = placementModel.offlineCapacity - offlineRes.length
                  if (remaining > 0) {
                    if (offlineMode.length < remaining)
                      remaining = offlineMode.length
                    var inp = utility.randomEqualChance(offlineMode, remaining)
                    refineRandomChances(offlineRes, inp, placementModel)
                  }
                }
              }
            }

            function fillFinalResult() {
              var model = {
                onlineContent: onlineRes,
                offlineContent: offlineRes,
                placementId: placementModel.id
              }
              res.push(model)
              if (res.length == placementsList.length)
                return cb(null, res)
            }
          }
        })
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
