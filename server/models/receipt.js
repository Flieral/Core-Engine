var receiptStatuses = require('../../config/receiptStatus.json')

module.exports = function (receipt) {
  var receiptVals = []
  for (var key in receiptStatuses)
    if (receiptStatuses.hasOwnProperty(key))
      receiptVals.push(receiptStatuses[key])

  var eventVals = []
  for (var key in events)
    if (events.hasOwnProperty(key))
      eventVals.push(events[key])

  receipt.validatesInclusionOf('status', { in: receiptVals})
}
