// const faqs = require('../../user/faq');
const EventListener = require('../modules/listeners/listener');
const {
	Interaction, // eslint-disable-line no-unused-vars
	MessageActionRow,
	MessageButton,
	MessageEmbed,
	Modal,
	TextInputComponent,
	// eslint-disable-next-line no-unused-vars
	MessageSelectMenu,
} = require('discord.js');

const { findOne, findAndCountAll, chunkArray, searchNotionDatabase } = require('../utils');
const wait = require('node:timers/promises').setTimeout;

module.exports = class InteractionCreateEventListener extends EventListener {
	constructor(client) {
		super(client, { event: 'interactionCreate' });
	}

	/**
	 * @param {Interaction} interaction
	 */
	async execute(interaction) {
		const settings = await this.client.db.config.getRow(0);
		const categories = await this.client.db.categories.getData();
		const tickets = await this.client.db.tickets.getData();

		// customId (threadChannelId) is used to deal with /turn slash command
		// /turn slash command turns a thread/forum into a ticket
		const handlePanel = async (id, threadChannelId) => {
			id = id.slice(0, -1);
			const cat_row = findOne({ 'category_id': id }, categories);

			if (!cat_row) {
				console.warn('Could not find a category with the ID given by a panel interaction');
				return interaction.reply({
					embeds: [
						new MessageEmbed()
							.setColor(settings.error_colour)
							.setTitle(this.client.log.command_execution_error.title)
							.setDescription(this.client.log.command_execution_error.description),
					],
					ephemeral: true,
				});
			}

			const t_row = findAndCountAll({
				category_id: cat_row.category_id,
				'creator_id': interaction.user.id,
				'status': 'open',
			}, tickets);

			if (t_row.length >= settings.max_per_member) {
				if (settings.max_per_member === 1) {
					return interaction.reply({
						embeds: [
							new MessageEmbed()
								.setColor(settings.error_colour)
								.setAuthor(interaction.user.username, interaction.user.displayAvatarURL())
								.setTitle(this.client.log.commands.new.response.has_a_ticket.title)
								.setDescription(this.client.log.commands.new.response.has_a_ticket.description.replace(/{ticket}/gi, t_row[0].ticket_id))
								.setFooter(settings.footer, interaction.guild.iconURL()),
						],
						ephemeral: true,
					});
				}
				else {
					const list = t_row.map(row => {
						if (row.topic) {
							const description = row.topic.substring(0, 30);
							const ellipses = row.topic.length > 30 ? '...' : '';
							return `<#${row.ticket_id}>: \`${description}${ellipses}\``;
						}
						else {
							return `<#${row.ticket_id}>`;
						}
					});

					return interaction.reply({
						embeds: [
							new MessageEmbed()
								.setColor(settings.error_colour)
								.setAuthor(interaction.user.username, interaction.user.displayAvatarURL())
								.setTitle(this.client.log.commands.new.response.max_tickets.title.replace(/{count}/gi, t_row.length))
								.setDescription(this.client.log.commands.new.response.max_tickets.description + list.join('\n'))
								.setFooter(settings.footer, interaction.guild.iconURL()),
						],
						ephemeral: true,
					});
				}
			}

			else {
				// Create a modal
				const combineId = threadChannelId ? id + ',' + threadChannelId : id;
				const modal = new Modal()
					// Ticket Category Id or
					// Ticket Category Id + threadChannelId
					.setCustomId('create.a.ticket' + combineId)
					.setTitle('Create a Ticket');

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

		if (interaction.isCommand()) {
			// handle slash commands
			this.client.commands.handle(interaction);
		}

		else if (interaction.isButton()) {

			if (interaction.customId.startsWith('ticket.claim')) {
				// handle ticket claiming
				const t_row = findOne({ 'ticket_id': interaction.channel.id }, await this.client.db.tickets.getData());
				const cat_row = findOne({ 'category_id': t_row.category_id }, await this.client.db.categories.getData());

				const roles = cat_row.roles_id.split(',');
				const isntStaff = !roles.some(r => interaction.member.roles.cache.has(r));
				if (isntStaff) return;

				await interaction.channel.permissionOverwrites.edit(interaction.user.id, { VIEW_CHANNEL: true }, `Ticket claimed by ${interaction.user.tag}`);

				for (const role of roles) {
					await interaction.channel.permissionOverwrites.edit(role, { VIEW_CHANNEL: false }, `Ticket claimed by ${interaction.user.tag}`);
				}

				console.log(`${interaction.user.tag} has claimed "${interaction.channel.name}" in "${interaction.guild.name}"`);

				await this.client.db.tickets.updateRowsWhere(
					(currentData) => (currentData.ticket_id === interaction.channel.id),
					() => ({ claimer_id: interaction.user.id, claimer_user_tag: interaction.user.tag, status: 'in progress' }));

				await interaction.deferReply({
					ephemeral: true,
				});

				await wait(this.client.config.wait);
				await this.client.db.sync();

				await interaction.editReply({
					embeds: [
						new MessageEmbed()
							.setColor(settings.colour)
							.setAuthor(interaction.user.username, interaction.user.displayAvatarURL())
							.setTitle(this.client.log.ticket.claimed.title)
							.setDescription(this.client.log.ticket.claimed.description.replace(/{user}/, interaction.member.toString()))
							.setFooter(settings.footer, interaction.guild.iconURL()),
					],
				});

				const components = new MessageActionRow();

				components.addComponents(
					new MessageButton()
						.setCustomId('ticket.unclaim')
						.setLabel(this.client.log.ticket.unclaim)
						.setEmoji('♻️')
						.setStyle('SECONDARY'),
				);

				components.addComponents(
					new MessageButton()
						.setCustomId('ticket.close')
						.setLabel(this.client.log.ticket.close)
						.setEmoji('✖️')
						.setStyle('DANGER'),
				);

				await interaction.message.edit({ components: [components] });

				return;
			}

			else if (interaction.customId.startsWith('ticket.unclaim')) {
				// handle ticket unclaiming
				const t_row = findOne({ 'ticket_id': interaction.channel.id }, await this.client.db.tickets.getData());
				const cat_row = findOne({ 'category_id': t_row.category_id }, await this.client.db.categories.getData());

				const roles = cat_row.roles_id.split(',');
				const isntStaff = !roles.some(r => interaction.member.roles.cache.has(r));
				if (isntStaff) return;

				await interaction.channel.permissionOverwrites.delete(interaction.user.id, `Ticket released by ${interaction.user.tag}`);

				for (const role of roles) {
					await interaction.channel.permissionOverwrites.edit(role, { VIEW_CHANNEL: true }, `Ticket released by ${interaction.user.tag}`);
				}

				console.log(`${interaction.user.tag} has released "${interaction.channel.name}" in "${interaction.guild.name}"`);

				await this.client.db.tickets.updateRowsWhere(
					(currentData) => (currentData.ticket_id === interaction.channel.id),
					() => ({ claimer_id: '', claimer_user_tag: '', status: 'open' }));

				await interaction.deferReply({
					ephemeral: true,
				});

				await wait(this.client.config.wait);
				await this.client.db.sync();

				await interaction.editReply({
					embeds: [
						new MessageEmbed()
							.setColor(settings.colour)
							.setAuthor(interaction.user.username, interaction.user.displayAvatarURL())
							.setTitle(this.client.log.ticket.released.title)
							.setDescription(this.client.log.ticket.released.description.replace(/{user}/, interaction.member.toString()))
							.setFooter(settings.footer, interaction.guild.iconURL()),
					],
				});

				const components = new MessageActionRow();

				components.addComponents(
					new MessageButton()
						.setCustomId('ticket.claim')
						.setLabel(this.client.log.ticket.claim)
						.setEmoji('🙌')
						.setStyle('SECONDARY'),
				);

				components.addComponents(
					new MessageButton()
						.setCustomId('ticket.close')
						.setLabel(this.client.log.ticket.close)
						.setEmoji('✖️')
						.setStyle('DANGER'),
				);

				await interaction.message.edit({ components: [components] });

				return;
			}

			else if (interaction.customId.startsWith('ticket.close')) {
				// handle ticket close button
				const t_row = findOne({ 'ticket_id': interaction.channel.id }, await this.client.db.tickets.getData());
				await interaction.reply({
					components: [
						new MessageActionRow()
							.addComponents(
								new MessageButton()
									.setCustomId(`confirm_close:${interaction.id}`)
									.setLabel(this.client.log.commands.close.response.confirm.buttons.confirm)
									.setEmoji('✅')
									.setStyle('SUCCESS'),
							)
							.addComponents(
								new MessageButton()
									.setCustomId(`cancel_close:${interaction.id}`)
									.setLabel(this.client.log.commands.close.response.confirm.buttons.cancel)
									.setEmoji('❌')
									.setStyle('SECONDARY'),
							),
					],
					embeds: [
						new MessageEmbed()
							.setColor(settings.colour)
							.setTitle(this.client.log.commands.close.response.confirm.title)
							.setDescription(settings.log_messages ? this.client.log.commands.close.response.confirm.description_with_archive : this.client.log.commands.close.response.confirm.description)
							.setFooter(settings.footer + ' | ' + this.client.log.collector_expires_in.replace(/{second}/, 30), interaction.guild.iconURL()),
					],
					ephemeral: true,
				});

				const filter = i => i.user.id === interaction.user.id && i.customId.includes(interaction.id);
				const collector = interaction.channel.createMessageComponentCollector({
					filter,
					time: 30000,
				});

				collector.on('collect', async i => {
					await i.deferUpdate();

					if (i.customId === `confirm_close:${interaction.id}`) {
						await this.client.tickets.close(t_row.ticket_id, interaction.user.id, interaction.user.tag);
						await i.editReply({
							components: [],
							embeds: [
								new MessageEmbed()
									.setColor(settings.success_colour)
									.setTitle(this.client.log.commands.close.response.closed.title)
									.setDescription(this.client.log.commands.close.response.closed.description.replace(/{number}/, t_row.number))
									.setFooter(settings.footer, interaction.guild.iconURL()),
							],
							ephemeral: true,
						});
					}
					else {
						await i.editReply({
							components: [],
							embeds: [
								new MessageEmbed()
									.setColor(settings.error_colour)
									.setTitle(this.client.log.commands.close.response.canceled.title)
									.setDescription(this.client.log.commands.close.response.canceled.description)
									.setFooter(settings.footer, interaction.guild.iconURL()),
							],
							ephemeral: true,
						});
					}

					collector.stop();
				});

				collector.on('end', async collected => {
					if (collected.size === 0) {
						await interaction.editReply({
							components: [],
							embeds: [
								new MessageEmbed()
									.setColor(settings.error_colour)
									.setAuthor(interaction.user.username, interaction.user.displayAvatarURL())
									.setTitle(this.client.log.commands.close.response.confirmation_timeout.title)
									.setDescription(this.client.log.commands.close.response.confirmation_timeout.description)
									.setFooter(settings.footer, interaction.guild.iconURL()),
							],
							ephemeral: true,
						});
					}
				});

				return;
			}

			else if (interaction.customId.startsWith('chumbaka.public.wiki')) {
				await interaction.reply({
					content: 'Chumbaka Public Wiki is opened in a new tab.',
					ephemeral: true,
				});
				return require('open')('https://www.notion.so/chumbaka/Chumbaka-Public-Wiki-211dd84b04a5487e83a86e647f162cdc');
			}
		}

		else if (interaction.isSelectMenu()) {
			if (interaction.customId.startsWith('panel.multiple')) {
				// handle multi-category panels and new command
				handlePanel(interaction.values[0]);
			}
			else if (interaction.customId.startsWith('turn')) {
				// handle /turn slash command (it turns a thread/forum into a ticket)
				handlePanel(interaction.values[0], interaction.customId.slice(5));
			}
			/*
			else if (interaction.customId.startsWith('faq')) {
				const interactionId = interaction.customId.slice(4);
				const t_row = await this.client.db.models.Ticket.findOne({ where: { id: interaction.channel.id } });
				const cat_row = await this.client.db.models.Category.findOne({ where: { id: t_row.category } });
				const creator = await interaction.guild.members.fetch(t_row.creator);
				const opening_message = await interaction.channel.messages.fetch(t_row.opening_message);
				const topic = this.client.cryptr.decrypt(t_row.topic);

				const componentsFirstRow = new MessageActionRow();
				const componentsSecondRow = new MessageActionRow();
				const selectMenuOptions = new MessageSelectMenu();

				if (interaction.values[0] === 'return') {
					// return to main page to show ticket info, claim, close, selection menu FAQ
					if (cat_row.claiming) {
						componentsFirstRow.addComponents(
							new MessageButton()
								.setCustomId('ticket.claim')
								.setLabel(i18n('ticket.claim'))
								.setEmoji('🙌')
								.setStyle('SECONDARY'),
						);
					}

					if (settings.close_button) {
						componentsFirstRow.addComponents(
							new MessageButton()
								.setCustomId('ticket.close')
								.setLabel(i18n('ticket.close'))
								.setEmoji('✖️')
								.setStyle('DANGER'),
						);
					}

					if (cat_row.faq) {
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

					let ticket_info_embed = '';

					for (const question in cat_row.opening_questions) {
						ticket_info_embed += `\n\`${cat_row.opening_questions[question]}\` : ${t_row.opening_questions_answers[question]}`;
					}

					const description = cat_row.opening_message
						.replace(/{+\s?(user)?name\s?}+/gi, creator.displayName)
						.replace(/{+\s?(tag|ping|mention)?\s?}+/gi, creator.user.toString()) +
						`\n\n\`${i18n('ticket.opening_message.fields.topic')}\` : ${topic}` + ticket_info_embed;

					await opening_message.edit({
						components: cat_row.faq && (cat_row.claiming || settings.close_button) ? [componentsFirstRow, componentsSecondRow] : cat_row.faq ? [componentsSecondRow] : [],
						embeds: [
							new MessageEmbed()
								.setColor(settings.colour)
								.setAuthor(creator.user.username, creator.user.displayAvatarURL())
								.setDescription(description)
								.setFooter(settings.footer, interaction.guild.iconURL()),
						],
					});

					return await interaction.reply({
						embeds: [
							new MessageEmbed()
								.setColor(settings.success_colour)
								.setAuthor(interaction.user.username, interaction.user.displayAvatarURL())
								.setTitle('✅ FAQ is closed')
								.setDescription('Please **close** the ticket if you found the answer for your enquiry.')
								.setFooter(settings.footer, interaction.guild.iconURL()),
						],
						ephemeral: true,
					});

				}
				else if (interactionId === 'main') {
					// interaction.values[0] -> FAQ category name
					// create selection menu based on FAQ category (remove close and claim button)
					// remove the opening's message

					// list of available questions
					let description = '';

					for (const i in faqs) {
						if (faqs[i].name === interaction.values[0]) {
							selectMenuOptions
								.setCustomId('faq.questions' + i)
								.setPlaceholder('Frequently Asked Questions')
								.addOptions({
									label: '⬅ Return',
									value: 'return',
								});

							for (const j in faqs[i].faq) {
								description += `${faqs[i].faq[j].question}\n`;
							}

							let count = 0;
							selectMenuOptions
								.addOptions(faqs[i].faq.map(k => ({
									label: k.question,
									value: `${count++}`,
								})));
						}
					}
					componentsFirstRow.addComponents(selectMenuOptions);

					await opening_message.edit({
						components:[componentsFirstRow],
						embeds: [
							new MessageEmbed()
								.setColor(settings.colour)
								.setAuthor(creator.user.username, creator.user.displayAvatarURL())
								.setDescription(description)
								.setFooter(settings.footer, interaction.guild.iconURL()),
						],
					});

					return await interaction.reply({
						embeds: [
							new MessageEmbed()
								.setColor(settings.success_colour)
								.setAuthor(interaction.user.username, interaction.user.displayAvatarURL())
								.setTitle('❔ FAQ')
								.setDescription('Try to find the answer from frequently asked questions.')
								.setFooter(settings.footer, interaction.guild.iconURL()),
						],
						ephemeral: true,
					});
				}
				else if (interactionId.startsWith('questions')) {

					const faqCategoryId = interactionId.slice(9);

					// interaction.values[0] -> no. questions of the selected category
					const question = faqs[faqCategoryId].faq[parseInt(interaction.values[0])].question;
					const answer = faqs[faqCategoryId].faq[parseInt(interaction.values[0])].answer;

					await interaction.reply({
						embeds: [
							new MessageEmbed()
								.setColor(settings.success_colour)
								.setAuthor(interaction.user.username, interaction.user.displayAvatarURL())
								.setTitle(question)
								.setDescription(answer)
								.setFooter(settings.footer, interaction.guild.iconURL()),
						],
						ephemeral: true,
					});
				}
			}*/
		}

		else if (interaction.isModalSubmit()) {
			if (interaction.customId.startsWith('create.a.ticket')) {
				// Ticket Category Id or
				// Ticket Category Id + threadChannelId
				const id = interaction.customId.slice(15);
				const idArray = id.split(',');

				const category_id = idArray[0];
				const threadChannelId = idArray[1] || null;

				const cat_row = findOne({ 'category_id': category_id }, categories);

				const ticket_info = [];

				const questionsArray = chunkArray(cat_row.opening_questions.replace(/\n/gi, '').split(','), cat_row.opening_questions.split(',').length / 3);

				if (questionsArray) {
					for (const question of questionsArray) {
						ticket_info.push(interaction.fields.getTextInputValue(question[0]));
					}
				}

				try {
					await interaction.deferReply({
						ephemeral: true,
					});

					const t_row = await this.client.tickets.create(interaction.guild.id, interaction.user.id, category_id, ticket_info, threadChannelId);

					return interaction.editReply({
						embeds: [
							new MessageEmbed()
								.setColor(settings.success_colour)
								.setAuthor(interaction.user.username, interaction.user.displayAvatarURL())
								.setTitle(this.client.log.commands.new.response.created.title)
								.setDescription(this.client.log.commands.new.response.created.description.replace(/{ticket_id}/gi, t_row.ticket_id))
								.setFooter(settings.footer, interaction.guild.iconURL()),
						],
						ephemeral: true,
					});
				}
				catch (error) {
					console.error(error);
					return interaction.editReply({
						embeds: [
							new MessageEmbed()
								.setColor(settings.error_colour)
								.setAuthor(interaction.user.username, interaction.user.displayAvatarURL())
								.setTitle(this.client.log.commands.new.response.error.title)
								.setDescription(error.message)
								.setFooter(settings.footer, interaction.guild.iconURL()),
						],
						ephemeral: true,
					});
				}
			}
			else if (interaction.customId.startsWith('update.a.ticket')) {
				// This is not a Ticket Category Id, this is a Ticket Id
				const ticket_id = interaction.customId.slice(15);
				const t_row = findOne({ 'ticket_id': ticket_id }, await this.client.db.tickets.getData());
				const category_id = t_row.category_id;
				const cat_row = findOne({ 'category_id': category_id }, await this.client.db.categories.getData());

				const ticket_info = [];

				const questionsArray = chunkArray(cat_row.opening_questions.replace(/\n/gi, '').split(','), cat_row.opening_questions.split(',').length / 3);

				if (questionsArray) {
					for (const question of questionsArray) {
						ticket_info.push(interaction.fields.getTextInputValue(question[0]));
					}
				}

				await this.client.db.tickets.updateRowsWhere(
					(currentData) => (currentData.ticket_id === ticket_id),
					() => ({ opening_questions_answers: JSON.stringify(ticket_info) }));

				const creator = await interaction.guild.members.fetch(t_row.creator_id);

				let ticket_info_embed = '';
				let keywords = '';

				for (const question of questionsArray) {
					ticket_info_embed += `\n\`${question[0]}\` : ${ticket_info[questionsArray.indexOf(question)]}`;
					keywords = keywords + ' ' + ticket_info[questionsArray.indexOf(question)];
				}

				const description = settings.opening_message
					.replace(/{+\s?(user)?name\s?}+/gi, creator.displayName)
					.replace(/{+\s?(tag|ping|mention)?\s?}+/gi, creator.user.toString()) + ticket_info_embed;

				const opening_message = await interaction.channel.messages.fetch(t_row.pinned_message);

				await opening_message.edit({
					embeds: [
						new MessageEmbed()
							.setColor(settings.colour)
							.setAuthor(creator.user.username, creator.user.displayAvatarURL())
							.setDescription(description)
							.setFooter(settings.footer, interaction.guild.iconURL()),
					],
				});

				await interaction.deferReply({
					ephemeral: true,
				});

				// Send some helpful resources
				const helpfulResources_message = await interaction.channel.messages.fetch(t_row.helpful_resources);
				const helpfulResources = await searchNotionDatabase(keywords);
				if (helpfulResources_message && helpfulResources) {
					await helpfulResources_message.edit({
						components: [new MessageActionRow()
							.addComponents(new MessageButton()
								.setCustomId('chumbaka.public.wiki')
								.setLabel('More Resources')
								.setStyle('PRIMARY'),
							),
						],
						embeds: [
							new MessageEmbed()
								.setColor(settings.colour)
								.setTitle('Chumbaka Public Wiki')
								.setDescription('Please have a look at the resources below while waiting for assistance.\n\n' + helpfulResources)
								.setFooter(settings.footer, interaction.guild.iconURL()),
						],
					});
				}
				else if (helpfulResources_message && !helpfulResources) {
					await helpfulResources_message.edit({
						components: [new MessageActionRow()
							.addComponents(new MessageButton()
								.setCustomId('chumbaka.public.wiki')
								.setLabel('Visit Now')
								.setStyle('PRIMARY'),
							),
						],
						embeds: [
							new MessageEmbed()
								.setColor(settings.colour)
								.setTitle('Chumbaka Public Wiki')
								.setDescription('Please visit Chumbaka Public Wiki while waiting for assistance.\n\n')
								.setFooter(settings.footer, interaction.guild.iconURL()),
						],
					});

				}

				await wait(this.client.config.wait);
				await this.client.db.sync();

				await interaction.editReply({
					embeds: [
						new MessageEmbed()
							.setColor(settings.success_colour)
							.setAuthor(interaction.user.username, interaction.user.displayAvatarURL())
							.setTitle(this.client.log.commands.update.response.changed.title)
							.setDescription(this.client.log.commands.update.response.changed.description)
							.setFooter(settings.footer, interaction.guild.iconURL()),
					],
					ephemeral: false,
				});

				console.log(`${interaction.user.tag} changed the ticket info of #${interaction.channel.name}`);

				return;
			}
		}
	}
};