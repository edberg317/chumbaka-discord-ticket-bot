const Command = require('../modules/commands/command');
const {
	MessageEmbed,
} = require('discord.js');

const { findOne } = require('../utils');

module.exports = class RemoveCommand extends Command {
	constructor(client) {
		super(client, {
			description: client.log.commands.remove.description,
			internal: true,
			name: client.log.commands.remove.name,
			options: [
				{
					description: client.log.commands.remove.options.member.description,
					name: client.log.commands.remove.options.member.name,
					required: true,
					type: Command.option_types.USER,
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
		const channel = interaction.channel;
		const t_row = findOne({ 'ticket_id': interaction.channel.id }, await this.client.db.tickets.getData());

		if (!t_row) {
			return await interaction.reply({
				embeds: [
					new MessageEmbed()
						.setColor(settings.error_colour)
						.setTitle(this.client.log.commands.remove.response.not_a_channel.title)
						.setDescription(this.client.log.commands.remove.response.not_a_channel.description)
						.setFooter(settings.footer, interaction.guild.iconURL()),
				],
				ephemeral: true,
			});
		}

		const member = interaction.options.getMember(this.client.log.commands.remove.options.member.name);

		if (!member) {
			return await interaction.reply({
				embeds: [
					new MessageEmbed()
						.setColor(settings.error_colour)
						.setTitle(this.client.log.commands.remove.response.no_member.title)
						.setDescription(this.client.log.commands.remove.response.no_member.description)
						.setFooter(settings.footer, interaction.guild.iconURL()),
				],
				ephemeral: true,
			});
		}

		const cat_row = findOne({ 'category_id': t_row.category_id }, await this.client.db.categories.getData());

		const roles = cat_row.roles_id.split(',');
		const isntStaff = !roles.some(r => interaction.member.roles.cache.has(r));

		if (t_row.creator_id !== interaction.user.id && isntStaff) {
			return await interaction.reply({
				embeds: [
					new MessageEmbed()
						.setColor(settings.error_colour)
						.setTitle(this.client.log.commands.remove.response.no_permission.title)
						.setDescription(this.client.log.commands.remove.response.no_permission.description)
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
					.setTitle(this.client.log.commands.remove.response.removed.title)
					.setDescription(this.client.log.commands.remove.response.removed.description.replace(/{user}/, member.toString()).replace(/{channel}/, channel.toString()))
					.setFooter(settings.footer, interaction.guild.iconURL()),
			],
			ephemeral: true,
		});

		await channel.send({
			embeds: [
				new MessageEmbed()
					.setColor(settings.colour)
					.setAuthor(member.user.username, member.user.displayAvatarURL())
					.setTitle(this.client.log.ticket.member_removed.title)
					.setDescription(this.client.log.ticket.member_removed.description.replace(/{user}/, member.toString()).replace(/{member}/, interaction.user.toString()))
					.setFooter(settings.footer, interaction.guild.iconURL()),
			],
		});

		await channel.permissionOverwrites.delete(member.user.id, `${interaction.user.tag} removed ${member.user.tag} from the ticket`);

		console.log(`${interaction.user.tag} removed ${member.user.tag} from ${channel.id}`);

		return;
	}
};
