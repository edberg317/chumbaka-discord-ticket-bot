/* eslint-disable max-lines */
const faqs = require('../../../user/faq');
const EventEmitter = require('events');

const {
	MessageActionRow,
	MessageButton,
	MessageEmbed,
	MessageSelectMenu,
	MessageAttachment,
} = require('discord.js');

const { findOne, chunkArray, searchNotionDatabase } = require('../../utils');
const wait = require('node:timers/promises').setTimeout;

/** Manages tickets */
module.exports = class TicketManager extends EventEmitter {
	/**
	 * Create a TicketManager instance
	 * @param {import('../..').Bot} client
	 */
	constructor(client) {
		super();

		/** The Discord Client */
		this.client = client;

		this.setMaxListeners(this.client.config.max_listeners);
	}

	/**
	 * Create a new ticket
	 * @param {string} guild_id - ID of the guild to create the ticket in
	 * @param {string} creator_id - ID of the ticket creator (user)
	 * @param {string} category_id - ID of the ticket category
	 * @param {object} ticket_info - Info about the ticket (topic, answers of the opening questions)
	 * @param {string} [topic] - The ticket topic
	 */
	async create(guild_id, creator_id, category_id, ticket_info, threadChannelId) {

		const settings = await this.client.db.config.getRow(0);
		const categories = await this.client.db.categories.getData();
		const tickets = await this.client.db.tickets.getData();
		const cat_row = findOne({ 'category_id': category_id }, categories);

		if (!cat_row) throw new Error('Ticket category does not exist');

		const cat_channel = await this.client.channels.fetch(category_id);

		if (cat_channel.children.size >= 50) throw new Error('Ticket category has reached child channel limit (50)');

		const number = tickets.length + 1;

		const guild = this.client.guilds.cache.get(guild_id);
		const creator = await guild.members.fetch(creator_id);
		const name = settings.name_format
			.replace(/{+\s?(user)?name\s?}+/gi, creator.displayName)
			.replace(/{+\s?num(ber)?\s?}+/gi, number);

		const t_channel = await guild.channels.create(name, {
			parent: category_id,
			reason: `${creator.user.tag} requested a new ticket channel`,
			topic: `${creator}`,
			type: 'GUILD_TEXT',
		});

		t_channel.permissionOverwrites.edit(creator_id, {
			ATTACH_FILES: true,
			READ_MESSAGE_HISTORY: true,
			SEND_MESSAGES: true,
			VIEW_CHANNEL: true,
		}, `Ticket channel created by ${creator.user.tag}`);

		const create = async () => {
			let ticket_info_embed = '';

			const questionsArray = chunkArray(cat_row.opening_questions.replace(/\n/gi, '').split(','), cat_row.opening_questions.split(',').length / 3);

			let keywords = '';
			for (const question of questionsArray) {
				ticket_info_embed += `\n\`${question[0]}\` : ${ticket_info[questionsArray.indexOf(question)]}`;
				keywords = keywords + ' ' + ticket_info[questionsArray.indexOf(question)];
			}

			const description = settings.opening_message
				.replace(/{+\s?(user)?name\s?}+/gi, creator.displayName)
				.replace(/{+\s?(tag|ping|mention)?\s?}+/gi, creator.user.toString()) + ticket_info_embed;
			const embed = new MessageEmbed()
				.setColor(settings.colour)
				.setAuthor(creator.user.username, creator.user.displayAvatarURL())
				.setDescription(description)
				.setFooter(settings.footer, guild.iconURL());

			const componentsFirstRow = new MessageActionRow();
			const componentsSecondRow = new MessageActionRow();

			componentsFirstRow.addComponents(
				new MessageButton()
					.setCustomId('ticket.claim')
					.setLabel(this.client.log.ticket.claim)
					.setEmoji('🙌')
					.setStyle('SECONDARY'),
			);

			componentsFirstRow.addComponents(
				new MessageButton()
					.setCustomId('ticket.close')
					.setLabel(this.client.log.ticket.close)
					.setEmoji('✖️')
					.setStyle('DANGER'),
			);

			if (settings.faq) {
				componentsSecondRow.addComponents(
					new MessageSelectMenu()
						.setCustomId('faq.main')
						.setPlaceholder('Frequently Asked Questions')
						.addOptions(faqs.map(faq => ({
							label: faq.name,
							value: faq.name,
						}))),
				);
			}

			const sent = await t_channel.send({
				components: settings.faq ? [componentsFirstRow, componentsSecondRow] : [componentsFirstRow],
				content: this.client.log.ticket.opening_message.content.replace(/{creator}/gi, creator.user.toString()),
				embeds: [embed],
			});

			let thread_link;
			if (threadChannelId) {
				const channel = await this.client.channels.fetch(threadChannelId);
				thread_link = `https://discord.com/channels/${settings.guild_id}/${channel.parentId}/threads/${threadChannelId}`;

				// fetch all messages
				const messages = Array.from((await channel.messages.fetch()).values()).reverse();

				// send all log messages to ticket channel, record down the thread access link {guildId}/{parentId}/thread/{id}
				const lines = [];

				for (const message of messages) {
					const user = message.author;

					if (!user) continue;
					let content = message.content ? message.content.replace(/\n/g, '\n\t') : '';
					message.attachments?.forEach(a => {
						content += '\n\t' + a.url;
					});
					message.embeds?.forEach(() => {
						content += '\n\t[embedded content]';
					});
					lines.push(`[${new Date(message.createdTimestamp).toLocaleString()}] ${user.username} (${user.username}#${user.discriminator}) :> ${content}\n`);
				}

				const attachment = new MessageAttachment(Buffer.from(lines.join('\n')), channel.name + '.txt');

				try {
					await t_channel.send({
						embeds: [new MessageEmbed()
							.setColor(settings.colour)
							.setAuthor(creator.user.username, creator.user.displayAvatarURL())
							.setDescription(`This ticket is created based on previous discussion in this [thread/forum](${thread_link})`)
							.setFooter(settings.footer, guild.iconURL()),
						],
						files: [attachment],
					});
				}
				catch (error) {
					console.warn('Failed to send thread/forum text transcript to the ticket channel');
					console.error(error);
				}
			}

			// Send some helpful resources
			const helpfulResources = await searchNotionDatabase(keywords);
			let sentHelpfulResources;
			if (helpfulResources) {
				sentHelpfulResources = await t_channel.send({
					components: [new MessageActionRow()
						.addComponents(new MessageButton()
							.setLabel('More Resources')
							.setStyle('LINK')
							.setURL(settings.chumbaka_public_wiki),
						),
					],
					embeds: [new MessageEmbed()
						.setColor(settings.colour)
						.setTitle('Chumbaka Public Wiki')
						.setDescription('Please have a look at the resources below while waiting for assistance.\n\n' + helpfulResources)
						.setFooter(settings.footer, guild.iconURL()),
					],
				});
			}
			else {
				sentHelpfulResources = await t_channel.send({
					components: [new MessageActionRow()
						.addComponents(new MessageButton()
							.setLabel('Visit Now')
							.setStyle('LINK')
							.setURL(settings.chumbaka_public_wiki),
						),
					],
					embeds: [new MessageEmbed()
						.setColor(settings.colour)
						.setTitle('Chumbaka Public Wiki')
						.setDescription('Please visit Chumbaka Public Wiki while waiting for assistance.\n\n')
						.setFooter(settings.footer, guild.iconURL()),
					],
				});
			}

			await sentHelpfulResources.pin({ reason: 'Chumbaka Public Wiki' });
			const pinnedSentHelpfulResources = await t_channel.messages.cache.last();
			if (pinnedSentHelpfulResources.system) {
				await pinnedSentHelpfulResources
					.delete({ reason: 'Cleaning up system message' })
					.catch(() => console.warn('Failed to delete system pin message'));
			}

			await sent.pin({ reason: 'Ticket opening message' });
			const pinned = await t_channel.messages.cache.last();
			if (pinned.system) {
				await pinned
					.delete({ reason: 'Cleaning up system message' })
					.catch(() => console.warn('Failed to delete system pin message'));
			}

			await this.client.db.tickets.insertOne({
				category_id: category_id,
				ticket_id: t_channel.id,
				creator_id: creator_id,
				creator_user_tag: creator.user.tag,
				number: number,
				status: 'open',
				opening_questions_answers: JSON.stringify(ticket_info),
				pinned_message: sent.id,
				helpful_resources: sentHelpfulResources ? sentHelpfulResources.id : '',
				created_at: new Date().toLocaleString(),
				ticket_link: `https://discord.com/channels/${settings.guild_id}/${t_channel.id}`,
				thread_id: threadChannelId || null,
				thread_link: thread_link || null,
			});

			await wait(this.client.config.wait);

		};

		await create();

		console.log(`${creator.user.tag} created a new ticket in "${guild.name}"`);
		const t_row = findOne({ 'number': number }, await this.client.db.tickets.getData());
		return t_row;
	}

	/**
	 * Close a ticket
	 * @param {(string|number)} ticket_id - The channel ID, or the ticket number
	 * @param {string?} closer_id - ID of the member who is closing the ticket, or null
	 * @param {string} [guild_id] - The ID of the ticket's guild (used if a ticket number is provided instead of ID)
	 * @param {string} [reason] - The reason for closing the ticket
	 */
	async close(ticket_id, closer_id, closer_user_tag) {
		const t_row = findOne({ 'ticket_id': ticket_id }, await this.client.db.tickets.getData());
		const settings = await this.client.db.config.getRow(0);
		const guild = this.client.guilds.cache.get(settings.guild_id);
		const channel = await this.client.channels.fetch(t_row.ticket_id);

		const textTranscript = async () => {
			const ticket = findOne({ 'ticket_id': ticket_id }, await this.client.db.tickets.getData());
			const g = await this.client.guilds.fetch(settings.guild_id);
			const creator = await g.members.fetch(ticket.creator_id);

			if (!ticket.creator_id) return console.warn(`Can't create text transcript for ticket #${ticket.number} due to missing creator`);

			const lines = [];
			lines.push(`Ticket ${ticket.number}, created by ${ticket.creator_user_tag}, ${ticket.created_at}\n`);

			if (ticket.closer_id) lines.push(`Closed by ${ticket.closer_user_tag}, ${ticket.closed_at}\n`);

			const messages = Array.from((await channel.messages.fetch()).values()).reverse();

			for (const message of messages) {
				const user = message.author;

				if (!user) continue;
				let content = message.content ? message.content.replace(/\n/g, '\n\t') : '';
				message.attachments?.forEach(a => {
					content += '\n\t' + a.url;
				});
				message.embeds?.forEach(() => {
					content += '\n\t[embedded content]';
				});
				lines.push(`[${new Date(message.createdTimestamp).toLocaleString()}] ${user.username} (${user.username}#${user.discriminator}) :> ${content}\n`);
			}

			const channel_name = settings.name_format
				.replace(/{+\s?(user)?name\s?}+/gi, creator.displayName)
				.replace(/{+\s?num(ber)?\s?}+/gi, ticket.number);

			const attachment = new MessageAttachment(Buffer.from(lines.join('\n')), channel_name + '.txt');

			if (settings.log_messages_channel) {
				try {
					const embed = new MessageEmbed()
						.setColor(settings.colour)
						.setTitle(`#${channel_name} closed`)
						.addField('Creator', `<@${ticket.creator_id}>`)
						.setTimestamp()
						.setFooter(settings.footer, g.iconURL());

					if (ticket.closer_id) embed.addField('Closed by', `<@${ticket.closer_id}>`);

					const log_channel = await this.client.channels.fetch(settings.log_messages_channel);
					await log_channel.send({
						embeds: [embed],
						files: [attachment],
					});
				}
				catch (error) {
					console.warn('Failed to send text transcript to the guild\'s log channel');
					console.error(error);
				}
			}

			try {
				const user = await this.client.users.fetch(ticket.creator_id);
				user.send({ files: [attachment] });
			}
			catch (error) {
				console.warn('Failed to send text transcript to the ticket creator');
				console.error(error);
			}

		};

		const close = async () => {
			await this.client.db.tickets.updateRowsWhere(
				(currentData) => (currentData.ticket_id === ticket_id),
				() => ({
					closer_id: closer_id,
					closer_user_tag: closer_user_tag,
					status: 'close',
					closed_at: new Date().toLocaleString(),
				}));

			await wait(this.client.config.wait);

			const closer = await guild.members.fetch(closer_id);

			const description = this.client.log.ticket.closed_by_member.description.replace(/{user}/, closer.user.toString());
			await channel.send({
				embeds: [
					new MessageEmbed()
						.setColor(settings.success_colour)
						.setAuthor(closer.user.username, closer.user.displayAvatarURL())
						.setTitle(this.client.log.ticket.closed.title)
						.setDescription(description)
						.setFooter(settings.footer, guild.iconURL()),
				],
			});

			if (settings.log_messages) {
				await textTranscript();
			}

			setTimeout(async () => {
				await channel.delete(`Ticket channel closed by ${closer.user.tag}`);
			}, 5000);

			console.log(`${closer.user.tag} closed a ticket (${ticket_id})`);
		};

		if (channel) {
			await close();
		}
	}
};