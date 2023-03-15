// Load modules
const semver = require('semver');
const DiscordUtils = require('./utils/discord');
const ListenerLoader = require('./modules/listeners/loader');
const CommandManager = require('./modules/commands/manager');
const TicketManager = require('./modules/tickets/manager');
const { Client, Intents } = require('discord.js');
const { SheetDatabase } = require('sheets-database');

// Load environment variables from a .env file
require('dotenv').config();

// Set the process title
process.title = 'Chumbaka Tickets Bot';

// Check if the Node.js version is greater than or equal to a minimum version
const min_node_version = '16.6.0';
if (semver.lt(process.versions.node, min_node_version)) {
	// If the version is too low, print an error message and exit the program
	return console.log(`\x07Error: Chumbaka Tickets Bot does not work on Node v${process.versions.node}; please upgrade to v${min_node_version} or above.`);
}

// Log unhandled rejections and errors with relevant information
const { version } = require('../package.json');
process.on('unhandledRejection', error => {
	console.log('PLEASE INCLUDE THIS INFORMATION IF YOU ASK FOR HELP ABOUT THE FOLLOWING ERROR:');
	console.log(`Discord Tickets v${version}, Node v${process.versions.node} on ${process.platform}`);
	console.log('An error was not caught');
	if (error instanceof Error) console.log(`Uncaught ${error.name}`);
	console.log(error);
});

/**
 * The Discord client
 * @typedef {Bot} Bot
 * @extends {Client}
 */
class Bot extends Client {
	constructor() {
		super({
			intents: [
				Intents.FLAGS.GUILDS,
				Intents.FLAGS.GUILD_MEMBERS,
				Intents.FLAGS.GUILD_MESSAGES,
				Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
			],
			partials: [
				'CHANNEL',
				'MESSAGE',
				'REACTION',
			],
		});

		// Asynchronously initialize the bot
		(async () => {
			// Set the version of the bot
			this.version = version;

			// Load user configuration from a separate file
			this.config = require('../user/config');

			// Load a log utility from a separate file
			this.log = require('../user/log');

			// Set the maximum number of listeners for each event
			this.setMaxListeners(this.config.max_listeners);

			// Create a utility instance for some utility methods
			this.utils = new DiscordUtils(this);

			// Load listeners using a custom ListenerLoader class
			const listeners = new ListenerLoader(this);
			listeners.load();

			// Create a new TicketManager instance for handling tickets
			/** The ticket manager */
			this.tickets = new TicketManager(this);

			// Create a new CommandManager instance for handling commands
			/** The command manager, used by internal and plugin commands */
			this.commands = new CommandManager(this);

			// Create a new Google Sheets Database instance using a sheet ID and credentials
			this.db = new SheetDatabase(this.config.sheetId);
			const creds = require('../app-credentials.json');
			await this.db.useServiceAccount(creds);

			/*
			await this.db.useServiceAccount({
				client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
				private_key: process.env.GOOGLE_PRIVATE_KEY,
			});
			*/

			// Sync the database
			await this.db.sync();

			// Log in to the Discord API using a bot token
			console.log('Connecting to Discord API...');
			this.login(process.env.DISCORD_TOKEN);
		})();
	}
}

new Bot();

const keepAlive = require('./server');
keepAlive();