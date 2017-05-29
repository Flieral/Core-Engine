var receiptStatuses = require('../../config/receiptStatus.json')

module.exports = function (receipt) {
  var receiptVals = []
  for (var key in receiptStatuses)
    if (receiptStatuses.hasOwnProperty(key))
      receiptVals.push(receiptStatuses[key])

  receipt.validatesInclusionOf('status', { in: receiptVals})
}
