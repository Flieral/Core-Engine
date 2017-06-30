var path = require('path')
var utility = require('../../public/utility.js')

var PRODUCTION = false

var methodDisabler = require('../../public/methodDisabler.js')
var relationMethodPrefixes = [
  'create',
  'replaceOrCreate',
  'patchOrCreate',
  'exists',
  'findById',
  'findOne',
  'count',
  'prototype.patchAttributes',
  'createChangeStream',
  'updateAll',
  'replaceOrCreate',
  'changePassword',
  'confirm',
  'resetPassword',
  'upsertWithWhere',
  'prototype.__get__accessTokens',
  'prototype.__create__accessTokens',
  'prototype.__delete__accessTokens',
  'prototype.__findById__accessTokens',
  'prototype.__updateById__accessTokens',
  'prototype.__destroyById__accessTokens',
  'prototype.__count__accessTokens'
]

var app = require('../../server/server')

module.exports = function (client) {

  methodDisabler.disableOnlyTheseMethods(client, relationMethodPrefixes)

  client.beforeRemote('login', function (ctx, modelInstance, next) {
    if (PRODUCTION) {
      var pass1 = utility.base64Decoding(ctx.args.credentials.password).toString()
      var pass2 = utility.base64Decoding(ctx.req.body.password).toString()
      ctx.args.credentials.password = pass1
      ctx.req.body.password = pass2
    }
    return next()
  })

}
