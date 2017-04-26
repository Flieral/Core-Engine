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
    var whiteList = ['liked', 'disliked', 'unliked', 'undisliked', 'reported', 'shared']
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
      case 'reported':
        raccoon.reported(userId, contentId).then(() => {
          return cb(null, '[reported] Successful: Content (' + contentId + ') By User (' + userId + ')')
        })
        break
      case 'shared':
        raccoon.shared(userId, contentId).then(() => {
          return cb(null, '[shared] Successful: Content (' + contentId + ') By User (' + userId + ')')
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
    description: 'set input reaction for a particualr user',
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
    description: 'returns an ranked sorted array of contentIds representing the top recommendations for that a user',
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
    }],
    description: 'returns an array of the similarityZSet set for a user representing their ranked similarity to other users',
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
    }],
    description: 'same as mostSimilarUsers but the opposite',
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
    description: 'returns an array of the scoreboard sorted set which represents the global ranking of contents',
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

  interaction.worstRated = function (cb) {
    raccoon.worstRated().then((results) => {
      return cb(null, results)
    })
  }

  interaction.remoteMethod('worstRated', {
    accepts: [],
    description: 'same as bestRated but in reverse',
    http: {
      path: '/worstRated',
      verb: 'GET',
      status: 200,
      errorStatus: 400
    },
    returns: {
      arg: 'response',
      type: 'object'
    }
  })

  interaction.mostLiked = function (cb) {
    raccoon.mostLiked().then((results) => {
      return cb(null, results)
    })
  }

  interaction.remoteMethod('mostLiked', {
    accepts: [],
    description: 'returns an array of the mostliked set representing the global number of likes',
    http: {
      path: '/mostLiked',
      verb: 'GET',
      status: 200,
      errorStatus: 400
    },
    returns: {
      arg: 'response',
      type: 'object'
    }
  })

  interaction.mostDisliked = function (cb) {
    raccoon.mostDisliked().then((results) => {
      return cb(null, results)
    })
  }

  interaction.remoteMethod('mostDisliked', {
    accepts: [],
    description: 'returns an array of the mostDisliked set representing the global number of dislikes',
    http: {
      path: '/mostDisliked',
      verb: 'GET',
      status: 200,
      errorStatus: 400
    },
    returns: {
      arg: 'response',
      type: 'object'
    }
  })

  interaction.mostShared = function (cb) {
    raccoon.mostShared().then((results) => {
      return cb(null, results)
    })
  }

  interaction.remoteMethod('mostShared', {
    accepts: [],
    description: 'returns an array of the mostShared set representing the global number of shares',
    http: {
      path: '/mostShared',
      verb: 'GET',
      status: 200,
      errorStatus: 400
    },
    returns: {
      arg: 'response',
      type: 'object'
    }
  })  

  interaction.likedBy = function (contentId, cb) {
    raccoon.likedBy(contentId).then((results) => {
      return cb(null, results)
    })
  }

  interaction.remoteMethod('likedBy', {
    accepts: [{
      arg: 'contentId',
      type: 'string',
      required: true,
      http: {
        source: 'query'
      }
    }],
    description: 'returns an array which lists all the users who liked that content',
    http: {
      path: '/likedBy',
      verb: 'GET',
      status: 200,
      errorStatus: 400
    },
    returns: {
      arg: 'response',
      type: 'object'
    }
  })

  interaction.likedCount = function (contentId, cb) {
    raccoon.likedCount(contentId).then((results) => {
      return cb(null, results)
    })
  }

  interaction.remoteMethod('likedCount', {
    accepts: [{
      arg: 'contentId',
      type: 'string',
      required: true,
      http: {
        source: 'query'
      }
    }],
    description: 'returns the number of users who have liked that content',
    http: {
      path: '/likedCount',
      verb: 'GET',
      status: 200,
      errorStatus: 400
    },
    returns: {
      arg: 'response',
      type: 'object'
    }
  })

  interaction.dislikedBy = function (contentId, cb) {
    raccoon.dislikedBy(contentId).then((results) => {
      return cb(null, results)
    })
  }

  interaction.remoteMethod('dislikedBy', {
    accepts: [{
      arg: 'contentId',
      type: 'string',
      required: true,
      http: {
        source: 'query'
      }
    }],
    description: 'returns an array which lists all the users who disliked that content',
    http: {
      path: '/dislikedBy',
      verb: 'GET',
      status: 200,
      errorStatus: 400
    },
    returns: {
      arg: 'response',
      type: 'object'
    }
  })

  interaction.dislikedCount = function (contentId, cb) {
    raccoon.dislikedCount(contentId).then((results) => {
      return cb(null, results)
    })
  }

  interaction.remoteMethod('dislikedCount', {
    accepts: [{
      arg: 'contentId',
      type: 'string',
      required: true,
      http: {
        source: 'query'
      }
    }],
    description: 'returns the number of users who have disliked that content',
    http: {
      path: '/dislikedCount',
      verb: 'GET',
      status: 200,
      errorStatus: 400
    },
    returns: {
      arg: 'response',
      type: 'object'
    }
  })

  interaction.allLikedFor = function (userId, cb) {
    raccoon.allLikedFor(UserId).then((results) => {
      return cb(null, results)
    })
  }

  interaction.remoteMethod('allLikedFor', {
    accepts: [{
      arg: 'userId',
      type: 'string',
      required: true,
      http: {
        source: 'query'
      }
    }],
    description: 'returns an array of all the contents that user has liked',
    http: {
      path: '/allLikedFor',
      verb: 'GET',
      status: 200,
      errorStatus: 400
    },
    returns: {
      arg: 'response',
      type: 'object'
    }
  })

  interaction.allDislikedFor = function (userId, cb) {
    raccoon.allDislikedFor(UserId).then((results) => {
      return cb(null, results)
    })
  }

  interaction.remoteMethod('allDislikedFor', {
    accepts: [{
      arg: 'userId',
      type: 'string',
      required: true,
      http: {
        source: 'query'
      }
    }],
    description: 'returns an array of all the contents that user has disliked',
    http: {
      path: '/allDislikedFor',
      verb: 'GET',
      status: 200,
      errorStatus: 400
    },
    returns: {
      arg: 'response',
      type: 'object'
    }
  })

  interaction.allWatchedFor = function (userId, cb) {
    raccoon.allWatchedFor(UserId).then((results) => {
      return cb(null, results)
    })
  }

  interaction.remoteMethod('allWatchedFor', {
    accepts: [{
      arg: 'userId',
      type: 'string',
      required: true,
      http: {
        source: 'query'
      }
    }],
    description: 'returns an array of all the contents that user has liked or disliked',
    http: {
      path: '/allWatchedFor',
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
