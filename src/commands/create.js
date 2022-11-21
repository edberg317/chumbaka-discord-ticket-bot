const Command = require('../modules/commands/command');
const {
	MessageEmbed,
} = require('discord.js');

const wait = require('node:timers/promises').setTimeout;

module.exports = class CreateCommand extends Command {
	constructor(client) {
		super(client, {
			description: client.log.commands.create.description,
			internal: true,
			name: client.log.commands.create.name,
			options: [
				{
					description: client.log.commands.create.options.name.description,
					name: client.log.commands.create.options.name.name,
					required: true,
					type: Command.option_types.STRING,
				},
				{
					description: client.log.commands.create.options.roles.description,
					name: client.log.commands.create.options.roles.name,
					required: true,
					type: Command.option_types.STRING,
				},
			],
			permissions: ['MANAGE_GUILD'],
			staff_only: true,
		});

	}

	/**
	 * @param {Interaction} interaction
	 * @returns {Promise<void|any>}
	 */
	async execute(interaction) {
		const name = interaction.options.getString(this.client.log.commands.create.options.name.name);
		const roles = interaction.options.getString(this.client.log.commands.create.options.roles.name)?.match(/\d{17,19}/g) ?? [];
		const allowed_permissions = ['VIEW_CHANNEL', 'READ_MESSAGE_HISTORY', 'SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES'];

		const settings = await this.client.db.config.getRow(0);

		const cat_channel = await interaction.guild.channels.create(name, {
			permissionOverwrites: [
				...[
					{
						deny: ['VIEW_CHANNEL'],
						id: interaction.guild.roles.everyone,
					},
					{
						allow: allowed_permissions,
						id: this.client.user.id,
					},
				],
				...roles.map(r => ({
					allow: allowed_permissions,
					id: r,
				})),
			],
			position: 1,
			reason: `Tickets category created by ${interaction.user.tag}`,
			type: 'GUILD_CATEGORY',
		});

		await this.client.db.categories.insertOne({
			'category_id': cat_channel.id,
			'category_name': name,
			'roles_id': roles.toString(),
		});

		await interaction.deferReply({
			ephemeral: true,
		});

		await wait(this.client.config.wait);
		await this.client.db.sync();

		return await interaction.editReply({
			embeds: [
				new MessageEmbed()
					.setColor(settings.success_colour)
					.setTitle(this.client.log.commands.create.response.category_created.title)
					.setDescription(this.client.log.commands.create.response.category_created.description
						.replace(/{category}/gi, name)),
			],
			ephemeral: true,
		});
	}
};