const Command = require('../modules/commands/command');
const {
	MessageEmbed,
} = require('discord.js');

const { findOne } = require('../utils');

module.exports = class AddCommand extends Command {
	constructor(client) {
		super(client, {
			description: client.log.commands.add.description,
			internal: true,
			name: client.log.commands.add.name,
			options: [
				{
					description: client.log.commands.add.options.member.description,
					name: client.log.commands.add.options.member.name,
					required: true,
					type: Command.option_types.USER,
				},
				{
					description: client.log.commands.add.options.ticket.description,
					name: client.log.commands.add.options.ticket.name,
					required: false,
					type: Command.option_types.CHANNEL,
				},
			],
		});
	}

	/**
	 * @param {Interaction} interaction
	 * @returns {Promise<void|any>}
	 */
	async execute(interaction) {
		const settings = await this.client.db.config.getRow(0);
		const channel = interaction.options.getChannel(this.client.botReply.commands.add.options.ticket.name) ?? interaction.channel;
		const t_row = findOne({ 'ticket_id': interaction.channel.id }, await this.client.db.tickets.getData());

		if (!t_row) {
			return await interaction.reply({
				embeds: [
					new MessageEmbed()
						.setColor(settings.error_colour)
						.setTitle(this.client.log.commands.add.response.not_a_ticket.title)
						.setDescription(this.client.log.commands.add.response.not_a_ticket.description)
						.setFooter(settings.footer, interaction.guild.iconURL()),
				],
				ephemeral: true,
			});
		}

		const member = interaction.options.getMember(this.client.log.commands.add.options.member.name);

		if (!member) {
			return await interaction.reply({
				embeds: [
					new MessageEmbed()
						.setColor(settings.error_colour)
						.setTitle(this.client.log.commands.add.response.no_member.title)
						.setDescription(this.client.log.commands.add.response.no_member.description)
						.setFooter(settings.footer, interaction.guild.iconURL()),
				],
				ephemeral: true,
			});
		}

		const cat_row = findOne({ 'category_id': t_row.category_id }, await this.client.db.categories.getData());

		const roles = cat_row.roles_id.split(',');
		const isntStaff = !roles.some(r => interaction.member.roles.cache.has(r));

		if (t_row.creator !== interaction.member.id && isntStaff) {
			return await interaction.reply({
				embeds: [
					new MessageEmbed()
						.setColor(settings.error_colour)
						.setTitle(this.client.log.commands.add.response.no_permission.title)
						.setDescription(this.client.log.commands.add.response.no_permission.description)
						.setFooter(settings.footer, interaction.guild.iconURL()),
				],
				ephemeral: true,
			});
		}

		await interaction.reply({
			embeds: [
				new MessageEmbed()
					.setColor(settings.success_colour)
					.setAuthor(member.user.username, member.user.displayAvatarURL())
					.setTitle(this.client.log.commands.add.response.added.title)
					.setDescription(this.client.log.commands.add.response.added.description.replace(/{user}/, member.toString()).replace(/{channel}/, channel.toString()))
					.setFooter(settings.footer, interaction.guild.iconURL()),
			],
			ephemeral: true,
		});

		await channel.send({
			embeds: [
				new MessageEmbed()
					.setColor(settings.colour)
					.setAuthor(member.user.username, member.user.displayAvatarURL())
					.setTitle(this.client.log.ticket.member_added.title)
					.setDescription(this.client.log.ticket.member_added.description.replace(/{user}/, member.toString()).replace(/{member}/, interaction.user.toString()))
					.setFooter(settings.footer, interaction.guild.iconURL()),
			],
		});

		await channel.permissionOverwrites.edit(member, {
			ATTACH_FILES: true,
			READ_MESSAGE_HISTORY: true,
			SEND_MESSAGES: true,
			VIEW_CHANNEL: true,
		}, `${interaction.user.tag} added ${member.user.tag} to the ticket`);

		console.log(`${interaction.user.tag} added ${member.user.tag} to ${channel.id}`);

		return;
	}
};
