const Command = require('../modules/commands/command');
const {
	Interaction, // eslint-disable-line no-unused-vars
	MessageEmbed,
} = require('discord.js');

module.exports = class HelpCommand extends Command {
	constructor(client) {
		super(client, {
			description: client.log.commands.help.description,
			internal: true,
			name: client.log.commands.help.name,
		});
	}

	/**
	 * @param {Interaction} interaction
	 * @returns {Promise<void|any>}
	 */
	async execute(interaction) {
		const settings = await this.client.db.config.getRow(0);

		const categories = await this.client.db.categories.getData();

		let roles_id = '';

		for (const element of categories) {
			roles_id += element.roles_id;
		}

		const roles = roles_id.split(',');
		const is_staff = roles.some(r => interaction.member.roles.cache.has(r));

		const commands = this.manager.commands.filter(command => {
			if (command.permissions.length >= 1) return interaction.member.permissions.has(command.permissions);
			else if (command.staff_only) return is_staff;
			else return true;
		});

		const list = commands.map(command => {
			const description = command.description.length > 50
				? command.description.substring(0, 50) + '...'
				: command.description;
			return `**\`/${command.name}\` ·** ${description}`;
		});

		return await interaction.reply({
			embeds: [
				new MessageEmbed()
					.setColor(settings.colour)
					.setTitle(this.client.log.commands.help.response.list.title)
					.setDescription(this.client.log.commands.help.response.list.description)
					.addField(this.client.log.commands.help.response.list.fields.commands, list.join('\n'))
					.setFooter(settings.footer, interaction.guild.iconURL()),
			],
			ephemeral: true,
		});
	}
};
