const Command = require('../modules/commands/command');
const {
	Interaction, // eslint-disable-line no-unused-vars,
	MessageActionRow,
	MessageEmbed,
	MessageSelectMenu,
} = require('discord.js');

module.exports = class NewCommand extends Command {
	constructor(client) {
		super(client, {
			description: client.log.commands.new.description,
			internal: true,
			name: client.log.commands.new.name,
		});
	}

	/**
	 * @param {Interaction} interaction
	 * @returns {Promise<void|any>}
	 */
	async execute(interaction) {

		const settings = await this.client.db.config.getRow(0);
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
								.setCustomId(`panel.multiple:${interaction.id}`)
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
