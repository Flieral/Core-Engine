var transactionStatuses = require('../../config/transactionStatus.json')
var events = require('../../config/event.json')

module.exports = function (transaction) {
	var transactionVals = []
	for (var key in transactionStatuses)
		if (transactionStatuses.hasOwnProperty(key))
			transactionVals.push(transactionStatuses[key])

	var eventVals = []
	for (var key in events)
		if (events.hasOwnProperty(key))
			eventVals.push(events[key])

	transaction.validatesInclusionOf('status', {in: transactionVals})
	transaction.validatesInclusionOf('event', {in: eventVals})
}
