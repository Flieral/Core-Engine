'use strict';

module.exports = function (Statitic) {
  Statitic.beforeRemote('create', function (ctx, modelInstance, next) {
    if (!ctx.args.options.accessToken)
      return next()
    var userWhiteList = ['userHashID', 'device', 'time', 'event']
    var campaignWhiteList = ['annId', 'campaignId', 'subcampaignId', 'style', 'fileURL', 'category']
    var pubWhiteList = ['pubId', 'appId', 'placementId']
    if (!utility.inputChecker(ctx.args.data.userInfo, userWhiteList))
      return next(new Error('White List Error! Allowed Parameters: ' + userWhiteList.toString()))
    if (!utility.inputChecker(ctx.args.data.campaignInfo, campaignWhiteList))
      return next(new Error('White List Error! Allowed Parameters: ' + campaignWhiteList.toString()))
    if (!utility.inputChecker(ctx.args.data.appInfo, pubWhiteList))
      return next(new Error('White List Error! Allowed Parameters: ' + pubWhiteList.toString()))
  })
}
