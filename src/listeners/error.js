const EventListener = require('../modules/listeners/listener');

module.exports = class ErrorEventListener extends EventListener {
	constructor(client) {
		super(client, { event: 'error' });
	}

	async execute(error) {
		console.warn('The client encountered an error');
		console.error(error);
	}
};