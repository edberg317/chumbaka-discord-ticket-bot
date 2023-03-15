const { GuildMember } = require('discord.js'); // eslint-disable-line no-unused-vars
const config = require('../../user/config');
let current_presence = -1;

module.exports = class DiscordUtils {
	constructor(client) {
		this.client = client;
	}

	/**
	 * Select a presence from the config
	 * @returns {PresenceData}
	 */
	static selectPresence() {
		const length = config.presence.presences.length;
		if (length === 0) return {};

		let num;
		if (length === 1) {
			num = 0;
		}
		else if (config.presence.randomise) {
			num = Math.floor(Math.random() * length);
		}
		else {
			// ++ doesn't work on negative numbers
			current_presence = current_presence + 1;
			if (current_presence === length) {
				current_presence = 0;
			}
			num = current_presence;
		}

		const {
			activity: name,
			status,
			type,
			url,
		} = config.presence.presences[num];

		return {
			activities: [
				{
					name,
					type,
					url,
				},
			],
			status,
		};
	}
};