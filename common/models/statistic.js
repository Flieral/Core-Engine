var userLabelList = require('../../config/userLabel.json')
var countryList = require('../../config/country.json')
var languageList = require('../../config/language.json')
var osList = require('../../config/operatingSystem.json')
var connectionList = require('../../config/connection.json')
var deviceList = require('../../config/device.json')
var eventList = require('../../config/event.json')
var transactionStatus = require('../../config/transactionStatus.json')
var receiptStatus = require('../../config/receiptStatus.json')

var utility = require('../../public/utility.js')
var requestHandler = require('../../public/requestHandler.js')

var app = require('../../server/server')
var config = require('../../server/config')

module.exports = function (statistic) {
  var announcerBaseURL = 'http://' + config.announcerService.server + ':' + config.announcerService.port + '/api'
  var publisherBaseURL = 'http://' + config.publisherService.server + ':' + config.publisherService.port + '/api'

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
    function doMultiStuff(price) {
      var announcerInput = {
        "accountHashId": modelInstance.announcerInfo.announcerHashId,
        "campaignHashId": modelInstance.announcerInfo.campaignHashId,
        "subcampaignHashId": modelInstance.announcerInfo.subcampaignHashId,
        "reduceValue": price
      }
      var announcerQueryStr = utility.generateQueryString(announcerInput)
      var url = utility.wrapAccessToken(announcerBaseURL + '/subcampaigns/reduceChain?' + announcerQueryStr, app.announcerAccessToken)
      requestHandler.postRequest(url, {'blob': 'blob'}, function (err, response) {
        if (err)
          return next(err)
        var publisherInput = {
          "accountHashId": modelInstance.publisherInfo.publisherHashId,
          "applicationHashId": modelInstance.publisherInfo.applicationHashId,
          "placementHashId": modelInstance.publisherInfo.placementHashId,
          "additiveValue": response.response.reduceValue
        }
        var publisherQueryStr = utility.generateQueryString(publisherInput)
        var url = utility.wrapAccessToken(publisherBaseURL + '/placements/additiveChain?' + publisherQueryStr, app.publisherAccessToken)
        requestHandler.postRequest(url, {'blob': 'blob'}, function (err, response) {
          if (err)
            return next(err)
          return next()
        })
      }) 
    }

    function doTransaction(event, price) {
      var transaction = app.models.transaction
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
        "time": modelInstance.actionInfo.time,
        "status": transactionStatus.open
      }
      transaction.create(input, function (err, instance) {
        if (err)
          return next(err)
        doMultiStuff(price)
      })
    }
    var url = utility.wrapAccessToken(announcerBaseURL + '/campaigns/' + modelInstance.announcerInfo.campaignHashId + '/subcampaigns/' + modelInstance.announcerInfo.subcampaignHashId, app.announcerAccessToken)
    requestHandler.getRequest(url, function (err, subcampaign) {
      function getStatisticModels(subcampaignHashId, event, callback) {
        var filter = {
          'where': {
            'actionInfo.event': event
          },
          'order': 'actionInfo.time DESC'
        }
        statistic.find(filter, function (err, models) {
          if (err)
            return callback(err, null)
          var res = []
          for (var i = 0; i < models.length; i++)
            if (models[i].announcerInfo.subcampaignHashId === subcampaignHashId)
              res.push(models[i])
          return callback(null, res)
        })
      }
      function sendReportWarningEmail(publisherHashId) {
        var url = utility.wrapAccessToken(publisherBaseURL + '/clients/' + accountHashId + '/sendReportEmail', app.publisherAccessToken)
        requestHandler.postRequest(url, {'blob': 'blob'}, function (err, response) {
          if (err)
            return next(err)
          return next()
        }) 
      }
      
      if (err)
        return next(err)
      if (subcampaign.plan === 'CPC' && modelInstance.actionInfo.event === 'Click') {
        doTransaction('Click', subcampaign.price)
      } else if (subcampaign.plan === 'CPV' && modelInstance.actionInfo.event === 'View') {
        getStatisticModels(modelInstance.announcerInfo.subcampaignHashId, 'View', function(err, models) {
          if (err)
            return next(err)
          var count = models.length + 1
          if (count % 100 == 0)
            doTransaction('View', subcampaign.price)
        })
      }
      else if (modelInstance.actionInfo.event === 'Report') {
        getStatisticModels(modelInstance.announcerInfo.subcampaignHashId, 'Report', function(err, models) {
          if (err)
            return next(err)
          var count = models.length + 1
          if (count % 100 == 0)
            sendReportWarningEmail()
        })
      }
      else
        return next()
    })
  })

  statistic.getPublisherPayble = function (accountHashId, cb) {
    var transaction = app.models.transaction
    var filter = {
      'where': {
        'status': transactionStatus.open
      },
      'order': 'time DESC'
    }
    transaction.find(filter, function(err, result) {
      if (err)
        return cb(err)
      var payable = 0
      var ids = []
      for (var i = 0; i < result.length; i++) {
        if (result[i].publisherHashId === accountHashId) {
          payable += result[i].price
          ids.push(result[i].id)
        }
      }
      var model = {
        'transactionIds': ids,
        'payable': payable
      }
      return cb(null, model)
    })
  }

  statistic.remoteMethod('getPublisherPayble', {
    accepts: [{
      arg: 'accountHashId',
      type: 'string',
      required: true,
      http: {
        source: 'query'
      }
    }],
    description: 'returns the amount of payable money for publisher checkout',
    http: {
      path: '/getPublisherPayble',
      verb: 'GET',
      status: 200,
      errorStatus: 400
    },
    returns: {
      arg: 'response',
      type: 'object'
    }
  })

  statistic.publisherCheckout = function (accessToken, accountHashId, receiptData, transactionIds, cb) {
    if (!accessToken)
      return cb(new Error('missing accessToken'))
    var url = utility.wrapAccessToken(publisherBaseURL + '/clients/' + accountHashId + '/accessTokens/' + accessToken, accessToken)
    requestHandler.getRequest(url, function (err, response) {
      if (err)
        return cb(err)
      if (response.userId !== accountHashId)
        return cb(new Error('not authorized: accessToken did not match user'))
      var receipt = app.models.receipt
      var inputReceipt = {
        'accountHashId': accountHashId,
        'data': receiptData,
        'time': utility.getUnixTimeStamp(),
        'status': receiptStatus.unchecked
      }
      receipt.create(inputReceipt, function(err, model) {
        if (err)
          return cb(err)
        var transaction = app.models.transaction
        transaction.updateAll({id: {inq: transactionIds.Ids}}, {'status': transactionStatus.checkout}, function(err, transactionInfo) {
          if (err)
            return cb(err)
          var model = {}
          model.transaction = {}
          model.transaction.info = transactionInfo
          var url = utility.wrapAccessToken(publisherBaseURL + '/clients/' + accountHashId + '/checkout', app.publisherAccessToken)
          requestHandler.postRequest(url, {'blob': 'blob'}, function (err, response) {
            if (err)
              return cb(err)
            model.result = response
            return cb(null, model)
          })
        })
      })
    })
  }

  statistic.remoteMethod('publisherCheckout', {
    accepts: [{
      arg: 'accessTokenId',
      type: 'string',
      http: {
        source: 'query'
      }
    }, {
      arg: 'accountHashId',
      type: 'string',
      required: true,
      http: {
        source: 'query'
      }
    }, {
      arg: 'receiptData',
      type: 'object',
      required: true,
      http: {
        source: 'body'
      }
    }, {
      arg: 'transactionIds',
      type: 'object',
      required: true,
      http: {
        source: 'body'
      }
    }],
    description: 'checkout the amount of payable money for publisher',
    http: {
      path: '/publisherCheckout',
      verb: 'POST',
      status: 200,
      errorStatus: 400
    },
    returns: {
      arg: 'response',
      type: 'object'
    }
  })

  statistic.announcerCheckout = function (ctx, accountHashId, receiptData, cb) {
    if (!ctx.options.accessToken)
      return cb(new Error('missing accessToken'))
    var url = utility.wrapAccessToken(announcerBaseURL + '/accessTokens/' + ctx.options.accessToken, app.announcerAccessToken)
    requestHandler.getRequest(url, function (err, response) {
      if (err)
        return cb(err)
      if (response.userId !== accountHashId)
        return cb(new Error('not authorized: accessToken did not match user'))
      var receipt = app.models.receipt
      var inputReceipt = {
        'accountHashId': accountHashId,
        'data': receiptData,
        'time': utility.getUnixTimeStamp(),
        'status': receiptStatus.unchecked
      }
      receipt.create(inputReceipt, function(err, model) {
        if (err)
          return cb(err)
        url = utility.wrapAccessToken(announcerBaseURL + '/clients/'+ accountHashId + '/doRefinement' + ctx.options.accessToken, app.announcerAccessToken)
        requestHandler.postRequest(url, {'blob': 'blob'}, function (err, response) {
          if (err)
            return cb(err)
          return cb(null, 'receipt recorded and refinement done')
        })
      })
    })
  }

  statistic.remoteMethod('announcerCheckout', {
    accepts: [{
      arg: 'ctx',
      type: 'object',
      http: {
        source: 'context'
      }
    }, {
      arg: 'accountHashId',
      type: 'string',
      required: true,
      http: {
        source: 'query'
      }
    }, {
      arg: 'receiptData',
      type: 'object',
      required: true,
      http: {
        source: 'body'
      }
    }],
    description: 'checkout the amount of payable money for announcer',
    http: {
      path: '/announcerCheckout',
      verb: 'POST',
      status: 200,
      errorStatus: 400
    },
    returns: {
      arg: 'response',
      type: 'object'
    }
  })

  statistic.getAllStatistics = function (ctx, accountHashId, cb) {
    if (!ctx.req.accessToken)
      return cb(new Error('missing accessToken'))

    if (ctx.req.accessToken.userId !== accountHashId)
      return cb(new Error('missmatched accountHashId'))

    statistic.find(function(err, result) {
      if (err)
        return cb(err, null)
      var clickRes = []
      var viewRes = []
      var reportRes = []
      for (var i = 0; i < result.length; i++)
        if (result[i].announcerInfo.accountHashId === accountHashId) {
          if (result[i].actionInfo.event === 'Click')
            clickRes.push(result[i])
          else if (result[i].actionInfo.event === 'View')
            viewRes.push(result[i])
          else if (result[i].actionInfo.event === 'Report')
            reportRes.push(result[i])
        }
      var finalRes = {
        view: viewRes,
        click: clickRes,
        report: reportRes
      }
      return cb(null, finalRes)
    })
  }

  statistic.remoteMethod('getAllStatistics', {
    accepts: [{
      arg: 'ctx',
      type: 'object',
      http: {
        source: 'context'
      }
    }, {
      arg: 'accountHashId',
      type: 'string',
      required: true,
      http: {
        source: 'query'
      }
    }],
    description: 'get all statistics of related account',
    http: {
      path: '/getAllStatistics',
      verb: 'GET',
      status: 200,
      errorStatus: 400
    },
    returns: {
      type: 'object',
      root: true
    }
  })

  statistic.getAllReceipts = function (ctx, accountHashId, cb) {
    if (!ctx.req.accessToken)
      return cb(new Error('missing accessToken'))

    if (ctx.req.accessToken.userId !== accountHashId)
      return cb(new Error('missmatched accountHashId'))

    var receipt = app.models.receipt
    receipt.find(function(err, result) {
      if (err)
        return cb(err, null)
      var finalRes = []
      for (var i = 0; i < result.length; i++)
        if (result[i].accountHashId === accountHashId) {
          finalRes.push(result[i])
        }
      return cb(null, finalRes)
    })
  }

  statistic.remoteMethod('getAllReceipts', {
    accepts: [{
      arg: 'ctx',
      type: 'object',
      http: {
        source: 'context'
      }
    }, {
      arg: 'accountHashId',
      type: 'string',
      required: true,
      http: {
        source: 'query'
      }
    }],
    description: 'get all receipts of related account',
    http: {
      path: '/getAllReceipts',
      verb: 'GET',
      status: 200,
      errorStatus: 400
    },
    returns: {
      type: 'object',
      root: true
    }
  })

  statistic.getAllTransactions = function (ctx, accountHashId, isAnnouncer, cb) {
    if (!ctx.req.accessToken)
      return cb(new Error('missing accessToken'))

    if (ctx.req.accessToken.userId !== accountHashId)
      return cb(new Error('missmatched accountHashId'))

    var transaction = app.models.transaction
    transaction.find(function(err, result) {
      if (err)
        return cb(err, null)
      var finalRes = []
      for (var i = 0; i < result.length; i++) {
        if (isAnnouncer && result[i].announcerHashId === accountHashId)
          finalRes.push(result[i])
        else if (!isAnnouncer && result[i].publisherHashId === accountHashId)
          finalRes.push(result[i])
      }
      return cb(null, finalRes)
    })
  }

  statistic.remoteMethod('getAllTransactions', {
    accepts: [{
      arg: 'ctx',
      type: 'object',
      http: {
        source: 'context'
      }
    }, {
      arg: 'accountHashId',
      type: 'string',
      required: true,
      http: {
        source: 'query'
      }
    }, {
      arg: 'isAnnouncer',
      type: 'boolean',
      required: true,
      default: true,
      http: {
        source: 'query'
      }
    }],
    description: 'get all transaction of related account',
    http: {
      path: '/getAllTransactions',
      verb: 'GET',
      status: 200,
      errorStatus: 400
    },
    returns: {
      type: 'object',
      root: true
    }
  })

}
