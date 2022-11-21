process.title = 'Chumbaka Discord Ticket Bot';

const min_node_version = '16.6.0';
const semver = require('semver');
if (semver.lt(process.versions.node, min_node_version)) return console.log(`\x07Error: Chumbaka Discord Ticket Bot does not work on Node v${process.versions.node}; please upgrade to v${min_node_version} or above.`);

require('dotenv').config();

// To catch unhandledRejection or error
const { version } = require('../package.json');
process.on('unhandledRejection', error => {
	console.log('PLEASE INCLUDE THIS INFORMATION IF YOU ASK FOR HELP ABOUT THE FOLLOWING ERROR:');
	console.log(`Chumbaka Discord Ticket Bot v${version}, Node v${process.versions.node} on ${process.platform}`);
	console.log('An error was not caught');
	if (error instanceof Error) {
		console.log(`Uncaught ${error.name}`);
	}
	console.log(error);
});

const ListenerLoader = require('./modules/listeners/loader');
const CommandManager = require('./modules/commands/manager');
const TicketManager = require('./modules/tickets/manager');

const { Client, Intents } = require('discord.js');
const { SheetDatabase } = require('sheets-database');

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

		(async () => {
			this.version = version;

			// User configuration
			this.config = require('../user/config');

			// Log util
			this.log = require('../user/log');

			// set the max listeners for each event
			this.setMaxListeners(this.config.max_listeners);

			const listeners = new ListenerLoader(this);
			// load listeners
			listeners.load();

			/** The ticket manager */
			this.tickets = new TicketManager(this);

			/** The command manager, used by internal and plugin commands */
			this.commands = new CommandManager(this);

			// Google Spreadsheet DB connection
			this.db = new SheetDatabase(this.config.sheetId);
			const creds = require('../app-credentials.json');
			await this.db.useServiceAccount(creds);

			/*
			await this.db.useServiceAccount({
				client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
				private_key: process.env.GOOGLE_PRIVATE_KEY,
			});
			await this.db.sync();
			*/

			console.log('Connecting to Discord API...');

			this.login(process.env.DISCORD_TOKEN);
		})();
	}
}

new Bot();