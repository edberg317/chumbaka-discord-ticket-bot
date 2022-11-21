const Command = require('../modules/commands/command');
const {
	Interaction, // eslint-disable-line no-unused-vars
	MessageEmbed,
	// eslint-disable-next-line no-unused-vars
	ThreadManager,
	MessageActionRow,
	MessageSelectMenu,
} = require('discord.js');

// const { findOne, chunkArray } = require('../utils');

module.exports = class TurnCommand extends Command {
	constructor(client) {
		super(client, {
			description: client.log.commands.turn.description,
			internal: true,
			name: client.log.commands.turn.name,
		});
	}

	/**
	 * @param {Interaction} interaction
	 * @returns {Promise<void|any>}
	 */
	async execute(interaction) {
		const settings = await this.client.db.config.getRow(0);

		// check if this is a thread ~(open status)~ or forum ~(open status)~ , otherwise return
		const isThread = interaction.channel.isThread();
		const threadChannelId = interaction.channel.id;

		if (!isThread) {
			return await interaction.reply({
				embeds: [
					new MessageEmbed()
						.setColor(settings.error_colour)
						.setTitle(this.client.log.commands.turn.response.error.title)
						.setDescription(this.client.log.commands.turn.response.error.description)
						.setFooter(settings.footer, interaction.guild.iconURL()),
				],
				ephemeral: true,
			});
		}

		// create a new ticket
		const categories = await this.client.db.categories.getData();
		if (categories.length === 0) {
			return await interaction.reply({
				embeds: [
					new MessageEmbed()
						.setColor(settings.error_colour)
						.setAuthor(interaction.user.username, interaction.user.displayAvatarURL())
						.setTitle(this.client.log.commands.new.response.no_categories.title)
						.setDescription(this.client.log.commands.new.response.no_categories.description)
						.setFooter(settings.footer, interaction.guild.iconURL()),
				],
			});
		}
		else {
			return await interaction.reply({
				components: [
					new MessageActionRow()
						.addComponents(
							new MessageSelectMenu()
								.setCustomId(`turn:${threadChannelId}`)
								.setPlaceholder('Select a category')
								.addOptions(categories.map(row => ({
									label: row.category_name,
									value: row.category_id + '0',
								}))),
						),
				],
				embeds: [
					new MessageEmbed()
						.setColor(settings.colour)
						.setAuthor(interaction.user.username, interaction.user.displayAvatarURL())
						.setTitle(this.client.log.commands.new.response.select_category.title)
						.setDescription(this.client.log.commands.new.response.select_category.description)
						.setFooter(settings.footer, interaction.guild.iconURL()),
				],
				ephemeral: true,
			});
		}
	}
};
