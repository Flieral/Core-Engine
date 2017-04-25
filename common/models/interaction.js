var utility = require('../../public/utility')
const raccoon = require('raccoon')

module.exports = function (interaction) {

  raccoon.config.nearestNeighbors = 5
  raccoon.config.className = 'content'
  raccoon.config.numOfRecsStore = 30

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

  interaction.inputReactions = function (userId, contentId, interactionType, cb) {
    var whiteList = ['liked', 'disliked', 'unliked', 'undisliked']
    if (!utility.inputPresence(interactionType, whiteList))
      return cb(new Error('White List Error! Allowed Parameters: ' + whiteList.toString()), null)
    switch (interactionType) {
      case 'liked':
        raccoon.liked(userId, contentId).then(() => {
          return cb(null, '[liked] Successful: Content (' + contentId + ') By User (' + userId + ')')
        })
        break
      case 'disliked':
        raccoon.disliked(userId, contentId).then(() => {
          return cb(null, '[disliked] Successful: Content (' + contentId + ') By User (' + userId + ')')
        })
        break
      case 'unliked':
        raccoon.unliked(userId, contentId).then(() => {
          return cb(null, '[unliked] Successful: Content (' + contentId + ') By User (' + userId + ')')
        })
        break
      case 'undisliked':
        raccoon.undisliked(userId, contentId).then(() => {
          return cb(null, '[undisliked] Successful: Content (' + contentId + ') By User (' + userId + ')')
        })
        break
    }
  }

  interaction.remoteMethod('inputReactions', {
    accepts: [{
        arg: 'userId',
        type: 'string',
        required: true,
        http: {
          source: 'query'
        }
      },
      {
        arg: 'contentId',
        type: 'string',
        required: true,
        http: {
          source: 'query'
        }
      },
      {
        arg: 'interactionType',
        type: 'string',
        required: true,
        http: {
          source: 'query'
        }
      }
    ],
    description: 'set input reaction for this particualr user',
    http: {
      path: '/inputReactions',
      verb: 'POST',
      status: 200,
      errorStatus: 400
    },
    returns: {
      arg: 'response',
      type: 'string'
    }
  })

  interaction.recommendFor = function (userId, numberOfRecs, cb) {
    raccoon.recommendFor(userId, numberOfRecs).then((results) => {
      return cb(null, results)
    })    
  }

  interaction.remoteMethod('recommendFor', {
    accepts: [{
        arg: 'userId',
        type: 'string',
        required: true,
        http: {
          source: 'query'
        }
      },
      {
        arg: 'numberOfRecs',
        type: 'number',
        required: true,
        http: {
          source: 'query'
        }
      }
    ],
    description: 'return recommendations for a particular user',
    http: {
      path: '/recommendFor',
      verb: 'GET',
      status: 200,
      errorStatus: 400
    },
    returns: {
      arg: 'response',
      type: 'object'
    }
  })

  interaction.mostSimilarUsers = function (userId, cb) {
    raccoon.mostSimilarUsers(userId).then((results) => {
      return cb(null, results)
    })    
  }

  interaction.remoteMethod('mostSimilarUsers', {
    accepts: [{
        arg: 'userId',
        type: 'string',
        required: true,
        http: {
          source: 'query'
        }
      }
    ],
    description: 'return most similar users to a particular user',
    http: {
      path: '/mostSimilarUsers',
      verb: 'GET',
      status: 200,
      errorStatus: 400
    },
    returns: {
      arg: 'response',
      type: 'object'
    }
  })

  interaction.leastSimilarUsers = function (userId, cb) {
    raccoon.leastSimilarUsers(userId).then((results) => {
      return cb(null, results)
    })    
  }

  interaction.remoteMethod('leastSimilarUsers', {
    accepts: [{
        arg: 'userId',
        type: 'string',
        required: true,
        http: {
          source: 'query'
        }
      }
    ],
    description: 'return least similar users to a particular user',
    http: {
      path: '/leastSimilarUsers',
      verb: 'GET',
      status: 200,
      errorStatus: 400
    },
    returns: {
      arg: 'response',
      type: 'object'
    }
  })

  interaction.bestRated = function (cb) {
    raccoon.bestRated().then((results) => {
      return cb(null, results)
    })    
  }

  interaction.remoteMethod('bestRated', {
    accepts: [],
    description: 'return bast rated contents representing global ranking',
    http: {
      path: '/bestRated',
      verb: 'GET',
      status: 200,
      errorStatus: 400
    },
    returns: {
      arg: 'response',
      type: 'object'
    }
  })

}
