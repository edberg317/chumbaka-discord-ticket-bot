const EventListener = require('../modules/listeners/listener');

module.exports = class DebugEventListener extends EventListener {
	constructor(client) {
		super(client, { event: 'debug' });
	}

	async execute(data) {
		if (this.client.config.developer_debug) {
			console.debug(data);
		}
	}
};