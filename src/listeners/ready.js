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

		if (this.client.config.presence.presences.length > 1) {
			const { selectPresence } = require('../utils/discord');
			setInterval(() => {
				const presence = selectPresence();
				this.client.user.setPresence(presence);
				console.log(`Updated presence: ${presence.activities[0].type} ${presence.activities[0].name}`);
			}, this.client.config.presence.duration * 1000);
		}

	}
};