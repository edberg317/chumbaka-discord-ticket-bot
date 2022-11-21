const {
	Message, // eslint-disable-line no-unused-vars
	Interaction, // eslint-disable-line no-unused-vars
} = require('discord.js');

/**
 * A command
 */
module.exports = class Command {
	/**
	 *
	 * @typedef CommandOption
	 * @property {string} name - The option's name
	 * @property {number} type - The option's type (use `Command.option_types`)
	 * @property {string} description - The option's description
	 * @property {CommandOption[]} [options] - The option's options
	 * @property {(string|number)[]} [choices] - The option's choices
	 * @property {boolean} [required] - Is this arg required? Defaults to `false`
	 */
	/**
	 * Create a new Command
	 * @param {import('../../').Bot} client - The Discord Client
	 * @param {Object} data - Command data
	 * @param {string} data.name - The name of the command (3-32)
	 * @param {string} data.description - The description of the command (1-100)
	 * @param {boolean} [data.staff_only] - Only allow staff to use this command?
	 * @param {string[]} [data.permissions] - Array of permissions needed for a user to use this command
	 * @param {CommandOption[]} [data.options] - The command's options
	 */
	constructor(client, data) {

		/** The Discord Client */
		this.client = client;

		/** The CommandManager */
		this.manager = this.client.commands;

		if (typeof data !== 'object') {
			throw new TypeError(`Expected type of command "data" to be an object, got "${typeof data}"`);
		}

		/**
		 * The name of the command
		 * @type {string}
		 */
		this.name = data.name;

		/**
		 * The command description
		 * @type {string}
		 */
		this.description = data.description;

		/**
		 * Only allow staff to use this command?
		 * @type {boolean}
		 * @default false
		 */
		this.staff_only = data.staff_only === true;

		/**
		 * Array of permissions needed for a user to use this command
		 * @type {string[]}
		 */
		this.permissions = data.permissions ?? [];

		/**
		 * The command options
		 * @type {CommandOption[]}
		 */
		this.options = data.options ?? [];

		try {
			// register the command
			this.manager.register(this);
		}
		catch (error) {
			return this.client.log.error(error);
		}
	}

	async build(guild) {
		return {
			defaultPermission: !this.staff_only,
			description: this.description,
			name: this.name,
			options: typeof this.options === 'function' ? await this.options(guild) : this.options,
		};
	}

	static get option_types() {
		return {
			SUB_COMMAND: 1,
			SUB_COMMAND_GROUP: 2,
			STRING: 3,
			INTEGER: 4,
			BOOLEAN: 5,
			USER: 6,
			CHANNEL: 7,
			ROLE: 8,
			MENTIONABLE: 9,
			NUMBER: 10,
		};
	}

};