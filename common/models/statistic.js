var userLabelList = require('../../config/userLabel.json')
var countryList = require('../../config/country.json')
var languageList = require('../../config/language.json')
var osList = require('../../config/operatingSystem.json')
var connectionList = require('../../config/connection.json')
var deviceList = require('../../config/device.json')
var eventList = require('../../config/event.json')

var utility = require('../../public/utility.js')
var requestHandler = require('../../public/requestHandler.js')
var app = require('../../server/server')

module.exports = function (statistic) {
  var announcerBaseURL = 'http://' + config.announcerService.server + ':' + config.announcerService.port + '/api'

  statistic.beforeRemote('create', function (ctx, modelInstance, next) {
    var userLeastList = ['userId', 'userLabel', 'country', 'language', 'device', 'os', 'connection']
    var actionLeastList = ['event', 'time']
    var announcerLeastList = ['announcerHashId', 'campaignHashId', 'subcampaignHashId']
    var publisherLeastList = ['publisherHashId', 'applicationHashId', 'placementHashId']
    if (!utility.inputLeastChecker(ctx.args.data.userInfo, userLeastList))
      return next(new Error('White List Error! Least Parameters: ' + userLeastList.toString()))
    if (!utility.inputLeastChecker(ctx.args.data.actionInfo, actionLeastList))
      return next(new Error('White List Error! Least Parameters: ' + actionLeastList.toString()))
    if (!utility.inputLeastChecker(ctx.args.data.announcerInfo, announcerLeastList))
      return next(new Error('White List Error! Least Parameters: ' + announcerLeastList.toString()))
    if (!utility.inputLeastChecker(ctx.args.data.publisherInfo, publisherLeastList))
      return next(new Error('White List Error! Least Parameters: ' + publisherLeastList.toString()))

    if (!utility.inputPresence(ctx.args.data.userInfo.userLabel, userLabelList))
      return next(new Error('White List Error! Allowed Parameters for userLabel: ' + userLabelList.toString()))
    if (!utility.inputPresence(ctx.args.data.userInfo.country, countryList))
      return next(new Error('White List Error! Allowed Parameters for country: ' + countryList.toString()))
    if (!utility.inputPresence(ctx.args.data.userInfo.language, languageList))
      return next(new Error('White List Error! Allowed Parameters for language: ' + languageList.toString()))
    if (!utility.inputPresence(ctx.args.data.userInfo.device, deviceList))
      return next(new Error('White List Error! Allowed Parameters for device: ' + deviceList.toString()))
    if (!utility.inputPresence(ctx.args.data.userInfo.os, osList))
      return next(new Error('White List Error! Allowed Parameters for os: ' + osList.toString()))
    if (!utility.inputPresence(ctx.args.data.userInfo.connection, connectionList))
      return next(new Error('White List Error! Allowed Parameters for connection: ' + connectionList.toString()))
    if (!utility.inputPresence(ctx.args.data.actionInfo.event, eventList))
      return next(new Error('White List Error! Allowed Parameters for event: ' + eventList.toString()))
    return next()
  })

  statistic.afterRemote('create', function (ctx, modelInstance, next) {
    function doTransaction(event, price) {
      var transaction = app.model.transaction
      var input = {
        "announcerHashId": modelInstance.announcerInfo.announcerHashId,
        "campaignHashId": modelInstance.announcerInfo.campaignHashId,
        "subcampaignHashId": modelInstance.announcerInfo.subcampaignHashId,
        "publisherHashId": modelInstance.publisherInfo.publisherHashId,
        "applicationHashId": modelInstance.publisherInfo.applicationHashId,
        "placementHashId": modelInstance.publisherInfo.placementHashId,
        "userHashId": modelInstance.userInfo.userId,
        "event": event,
        "price": price,
        "time": modelInstance.actionInfo.time
      }
      transaction.create(input, function (err, instance) {
        if (err)
          return next(err)
        return next()
      })
    }
    var url = utility.wrapAccessToken(announcerBaseURL + '/campaigns/' + modelInstance.announcerInfo.campaignHashId + '/subcampaigns/' + modelInstance.announcerInfo.subcampaignHashId, app.announcerAccessToken)
    requestHandler.getRequest(url, function (err, subcampaign) {
      if (err)
        return next(err)
      if (subcampaign.plan === 'CPC' && modelInstance.actionInfo.event === 'Click') {
        doTransaction('Click', subcampaign.price)
      } else if (subcampaign.plan === 'CPV' && modelInstance.actionInfo.event === 'View') {
        var filter = {
          'where': {
            'and': [{
                'announcerInfo.subcampaignHashId': modelInstance.announcerInfo.subcampaignHashId
              },
              {
                'actionInfo.event': 'View'
              }
            ]
          },
          'order': 'actionInfo.time DESC'
        }
        statistic.find(filter, function (err, models) {
          if (err)
            return next(err)
          var count = models.length + 1
          if (count % 100 == 0)
            doTransaction('View', subcampaign.price)
        })
      }
    })
  })
}
