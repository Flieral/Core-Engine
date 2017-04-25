var utility = require('../../public/utility')
  
module.exports = function (interaction) {

  interaction.generateUserHashId = function (cb) {
    var hashId = utility.generateUniqueHashID();
    cb(null, hashId)
  }

  interaction.remoteMethod('generateUserHashId', {
    accepts: [],
    description: 'generate and return end user identifier',
    http: {
      path: '/generateUserHashId',
      verb: 'GET',
      status: 200,
      errorStatus: 400
    },
    returns: {
      arg: 'response',
      type: 'string'
    }
  })
}
