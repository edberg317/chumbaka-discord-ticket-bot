const Command = require('../modules/commands/command');
const {
	Interaction, // eslint-disable-line no-unused-vars
	MessageEmbed,
	MessageActionRow,
	Modal,
	TextInputComponent,
} = require('discord.js');

const { findOne, chunkArray } = require('../utils');

module.exports = class TopicCommand extends Command {
	constructor(client) {
		super(client, {
			description: client.log.commands.update.description,
			internal: true,
			name: client.log.commands.update.name,
		});
	}

	/**
	 * @param {Interaction} interaction
	 * @returns {Promise<void|any>}
	 */
	async execute(interaction) {
		const settings = await this.client.db.config.getRow(0);
		const t_row = findOne({ 'ticket_id': interaction.channel.id }, await this.client.db.tickets.getData());

		if (!t_row) {
			return await interaction.reply({
				embeds: [
					new MessageEmbed()
						.setColor(settings.error_colour)
						.setTitle(this.client.log.commands.update.response.not_a_ticket.title)
						.setDescription(this.client.log.commands.update.response.not_a_ticket.description)
						.setFooter(settings.footer, interaction.guild.iconURL()),
				],
				ephemeral: true,
			});
		}

		// Create a modal
		const category_id = t_row.category_id;
		const cat_row = findOne({ 'category_id': category_id }, await this.client.db.categories.getData());

		const modal = new Modal()
		// This is not a Ticket Category Id, this is a Ticket Id
			.setCustomId('update.a.ticket' + t_row.ticket_id)
			.setTitle('Update This Ticket');

		const modalQuestions = {};

		if (cat_row.opening_questions) {
			// Add components to modal
			// Create the text input components based on opening questions
			const questionsArray = chunkArray(cat_row.opening_questions.replace(/\n/gi, '').split(','), cat_row.opening_questions.split(',').length / 3);

			for (const question of questionsArray) {
				modalQuestions.question = new MessageActionRow().addComponents(
					new TextInputComponent()
					// CustomId must be a string
						.setCustomId(question[0])
						.setLabel(question[0])
						.setStyle('SHORT')
						.setRequired(question[1])
						.setPlaceholder(question[2]),
				);
				modal.addComponents(modalQuestions.question);
			}
		}
		await interaction.showModal(modal);
	}
};
