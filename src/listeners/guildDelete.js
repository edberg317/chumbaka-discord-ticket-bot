const EventListener = require('../modules/listeners/listener');

module.exports = class GuildDeleteEventListener extends EventListener {
	constructor(client) {
		super(client, { event: 'guildDelete' });
	}

	async execute(guild) {
		console.log(`Removed from "${guild.name}"`);
	}
};