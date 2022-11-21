const EventListener = require('../modules/listeners/listener');

module.exports = class ReadyEventListener extends EventListener {
	constructor(client) {
		super(client, {
			event: 'ready',
			once: true,
		});
	}

	async execute() {
		console.log(`Connected to Discord as "${this.client.user.tag}"`);

		console.log('Loading commands');
		// load internal commands
		this.client.commands.load();

		// send commands to discord
		this.client.commands.publish();
	}
};