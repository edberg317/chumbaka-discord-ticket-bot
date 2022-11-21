const Command = require('../modules/commands/command');
const {
	Interaction, // eslint-disable-line no-unused-vars
	MessageActionRow,
	MessageEmbed,
	MessageSelectMenu,
} = require('discord.js');
const { findOne } = require('../utils');

module.exports = class PanelCommand extends Command {
	constructor(client) {
		super(client, {
			description: client.log.commands.panel.description,
			internal: true,
			name: client.log.commands.panel.name,
			options: [
				{
					description: client.log.commands.panel.options.categories.description,
					multiple: true,
					name: client.log.commands.panel.options.categories.name,
					required: true,
					type: Command.option_types.STRING,
				},
				{
					description: client.log.commands.panel.options.select_menu_options.description,
					multiple: true,
					name: client.log.commands.panel.options.select_menu_options.name,
					required: true,
					type: Command.option_types.STRING,
				},
				{
					description: client.log.commands.panel.options.description.description,
					name: client.log.commands.panel.options.description.name,
					required: false,
					type: Command.option_types.STRING,
				},
				{
					description: client.log.commands.panel.options.image.description,
					name: client.log.commands.panel.options.image.name,
					required: false,
					type: Command.option_types.STRING,
				},
				{
					description: client.log.commands.panel.options.title.description,
					name: client.log.commands.panel.options.title.name,
					required: false,
					type: Command.option_types.STRING,
				},
				{
					description: client.log.commands.panel.options.thumbnail.description,
					name: client.log.commands.panel.options.thumbnail.name,
					required: false,
					type: Command.option_types.STRING,
				},
			],
			staff_only: true,
		});
	}

	/**
	 * @param {Interaction} interaction
	 * @returns {Promise<void|any>}
	 */
	async execute(interaction) {
		const categories = interaction.options.getString(this.client.log.commands.panel.options.categories.name).match(/\d{17,19}/g) ?? [];
		const select_menu_options = interaction.options.getString(this.client.log.commands.panel.options.select_menu_options.name);
		const description = interaction.options.getString(this.client.log.commands.panel.options.description.name)?.replace(/\\n/g, '\n');
		const image = interaction.options.getString(this.client.log.commands.panel.options.image.name);
		const title = interaction.options.getString(this.client.log.commands.panel.options.title.name);
		const thumbnail = interaction.options.getString(this.client.log.commands.panel.options.thumbnail.name);

		const settings = await this.client.db.config.getRow(0);
		const data = await this.client.db.categories.getData();

		const invalid_category = (() => {
			for (const element of categories) {
				if (!findOne({ 'category_id': element }, data)) {
					return true;
				}
			}
			return null;
		})();

		if (invalid_category) {
			return await interaction.reply({
				embeds: [
					new MessageEmbed()
						.setColor(settings.error_colour)
						.setTitle(this.client.log.commands.panel.response.invalid_category.title)
						.setDescription(this.client.log.commands.panel.response.invalid_category.description)
						.setFooter(settings.footer, interaction.guild.iconURL()),
				],
				ephemeral: true,
			});
		}

		const select_menu_options_array = [];
		if (select_menu_options !== null) {
			for (const i in JSON.parse(select_menu_options)) {
				select_menu_options_array.push(JSON.parse(select_menu_options)[i]);
			}
		}

		if (categories.length !== select_menu_options_array.length) {
			return await interaction.reply({
				embeds: [
					new MessageEmbed()
						.setColor(settings.error_colour)
						.setTitle(this.client.log.commands.panel.response.select_menu_options_mismatch.title)
						.setDescription(this.client.log.commands.panel.response.select_menu_options_mismatch.description)
						.setFooter(settings.footer, interaction.guild.iconURL()),
				],
				ephemeral: true,
			});
		}

		const rows = [];
		for (const i in categories) {
			rows.push({ id:categories[i] + i, name:select_menu_options_array[i] });
		}

		const embed = new MessageEmbed()
			.setColor(settings.colour)
			.setFooter(settings.footer, interaction.guild.iconURL());

		if (description) embed.setDescription(description);
		if (image) embed.setImage(image);
		if (title) embed.setTitle(title);
		if (thumbnail) embed.setThumbnail(thumbnail);

		const panel_channel = await interaction.guild.channels.create('create-a-ticket', {
			permissionOverwrites: [
				{
					allow: ['VIEW_CHANNEL', 'READ_MESSAGE_HISTORY'],
					deny: ['SEND_MESSAGES', 'ADD_REACTIONS'],
					id: interaction.guild.roles.everyone,
				},
				{
					allow: ['SEND_MESSAGES', 'EMBED_LINKS', 'ADD_REACTIONS'],
					id: this.client.user.id,
				},
			],
			position: 1,
			reason: `${interaction.user.tag} created a new panel`,
			type: 'GUILD_TEXT',
		});

		await panel_channel.send({
			components: [
				new MessageActionRow()
					.addComponents(
						new MessageSelectMenu()
							.setCustomId(`panel.multiple:${panel_channel.id}`)
							.setPlaceholder('Select a category')
							.addOptions(rows.map(row => ({
								label: row.name,
								value: row.id,
							}))),
					),
			],
			embeds: [embed],
		});
		console.log(`${interaction.user.tag} has created a new select panel`);

		interaction.reply({
			content: `✅ ${panel_channel}`,
			ephemeral: true,
		});

		return;
	}
};
