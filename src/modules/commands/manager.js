const {
	Client, // eslint-disable-line no-unused-vars
	Collection,
	Interaction, // eslint-disable-line no-unused-vars
	MessageEmbed,
} = require('discord.js');

const fs = require('fs');
const { path } = require('../../utils/fs');

/**
 * Manages the loading and execution of commands
 */
module.exports = class CommandManager {
	/**
	 * Create a CommandManager instance
	 * @param {import('../..').Bot} client
	 */
	constructor(client) {
		/** The Discord Client */
		this.client = client;

		/**
		 * A discord.js Collection (Map) of loaded commands
		 * @type {Collection<string, import('./command')>}
		 */
		this.commands = new Collection();
	}

	/** Automatically load all internal commands */
	load() {
		const files = fs.readdirSync(path('./src/commands'))
			.filter(file => file.endsWith('.js'));

		for (let file of files) {
			try {
				file = require(`../../commands/${file}`);
				new file(this.client);
			}
			catch (e) {
				console.warn('An error occurred whilst loading an internal command');
				console.error(e);
			}
		}
	}

	/** Register a command */
	register(command) {
		const exists = this.commands.has(command.name);

		if (exists) {
			throw new Error(`A non-internal command with the name "${command.name}" already exists`);
		}

		this.commands.set(command.name, command);
		console.log(`Loaded "${command.name}" command`);
	}

	async publish(guild) {
		if (!guild) {
			// eslint-disable-next-line no-shadow
			return this.client.guilds.cache.forEach(guild => {
				this.publish(guild);
			});
		}

		try {
			const commands = await Promise.all(this.client.commands.commands.map(async command => await command.build(guild)));
			await this.client.application.commands.set(commands, guild.id);
			console.log(`Published ${this.client.commands.commands.size} commands to "${guild.name}"`);
		}
		catch (error) {
			console.warn('An error occurred whilst publishing the commands');
			console.error(error);
		}
	}

	/**
	 * Execute a command
	 * @param {Interaction} interaction - Command message
	 */
	async handle(interaction) {
		const settings = await this.client.db.config.getRow(0);
		if (!interaction.guild) return console.debug('Ignoring non-guild command interaction');

		const command = this.commands.get(interaction.commandName);
		if (!command) return;

		if (!interaction.channel.isThread()) {
			const bot_permissions = interaction.guild.me.permissionsIn(interaction.channel);

			const required_bot_permissions = [
				'ATTACH_FILES',
				'EMBED_LINKS',
				'MANAGE_CHANNELS',
				'MANAGE_MESSAGES',
				'MANAGE_THREADS',
			];

			if (!bot_permissions.has(required_bot_permissions)) {
				const perms = required_bot_permissions.map(p => `\`${p}\``).join(', ');
				if (bot_permissions.has('EMBED_LINKS')) {
					await interaction.reply({
						embeds: [
							new MessageEmbed()
								.setColor('ORANGE')
								.setTitle(this.client.log.bot.missing_permissions.title)
								.setDescription(this.client.log.bot.missing_permissions.description.replace(/{permission}/, perms)),
						],
					});
				}
				else {
					await interaction.reply({ content: this.client.log.bot.missing_permissions.description.replace(/{permission}/, perms) });
				}
				return;
			}
		}

		const missing_permissions = command.permissions instanceof Array && !interaction.member.permissions.has(command.permissions);
		if (missing_permissions) {
			const perms = command.permissions.map(p => `\`${p}\``).join(', ');
			return await interaction.reply({
				embeds: [
					new MessageEmbed()
						.setColor(settings.error_colour)
						.setTitle(this.client.log.missing_permissions.title)
						.setDescription(this.client.log.bot.missing_permissions.description.replace(/{permission}/, perms)),
				],
				ephemeral: true,
			});
		}

		try {
			console.log(`Executing "${command.name}" command (invoked by ${interaction.user.tag})`);
			// execute the command
			await command.execute(interaction);
		}
		// hopefully no user will ever see this message
		catch (e) {
			console.warn(`An error occurred whilst executing the ${command.name} command`);
			console.error(e);
			await interaction.reply({
				embeds: [
					new MessageEmbed()
						.setColor('ORANGE')
						.setTitle(this.client.log.command_execution_error.title)
						.setDescription(this.client.log.command_execution_error.description),
				],
			});
		}
	}
};
