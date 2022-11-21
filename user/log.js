module.exports = {
	'blacklisted': '❌ You are blacklisted',
	'bot': {
		'missing_permissions': {
			'description': 'Discord Tickets requires the following permissions:\n{permission}',
			'title': '⚠️',
		},
		'version': '[Discord Tickets](%s) v%s by [eartharoid](%s)',
	},
	'collector_expires_in': 'Expires in {second} seconds',
	'command_execution_error': {
		'description': 'An unexpected error occurred during command execution.\nPlease ask an administrator to check the console output / logs for details.',
		'title': '⚠️',
	},
	'commands': {
		'add': {
			'description': 'Add a member to a ticket',
			'name': 'add',
			'options': {
				'member': {
					'description': 'The member to add to the ticket',
					'name': 'member',
				},
				'ticket': {
					'description': 'The ticket to add the member to',
					'name': 'ticket',
				},
			},
			'response': {
				'added': {
					'description': '{user} has been added to {channel}.',
					'title': '✅ Member added',
				},
				'no_member': {
					'description': 'Please mention the member you want to add.',
					'title': '❌ Unknown member',
				},
				'no_permission': {
					'description': 'You are not the creator of this ticket and you are not a staff member; you can\'t add members to this ticket.',
					'title': '❌ Insufficient permission',
				},
				'not_a_ticket': {
					'description': 'Please use this command in the ticket channel, or mention the channel.',
					'title': '❌ This isn\'t a ticket channel',
				},
			},
		},
		'blacklist': {
			'description': 'View or modify the blacklist',
			'name': 'blacklist',
			'options': {
				'add': {
					'description': 'Add a member or role to the blacklist',
					'name': 'add',
					'options': {
						'member_or_role': {
							'description': 'The member or role to add to the blacklist',
							'name': 'member_or_role',
						},
					},
				},
				'remove': {
					'description': 'Remove a member or role from the blacklist',
					'name': 'remove',
					'options': {
						'member_or_role': {
							'description': 'The member or role to remove from the blacklist',
							'name': 'member_or_role',
						},
					},
				},
				'show': {
					'description': 'Show the members and roles in the blacklist',
					'name': 'show',
				},
			},
			'response': {
				'empty_list': {
					'description': 'There are no members or roles blacklisted. Type `/blacklist add` to add a member or role to the blacklist.',
					'title': '📃 Blacklisted members and roles',
				},
				'illegal_action': {
					'description': '%s is a staff member and cannot be blacklisted.',
					'title': '❌ You can\'t blacklist this member',
				},
				'invalid': {
					'description': 'This member or role can not be removed from the blacklist as they are not blacklisted.',
					'title': '❌ Error',
				},
				'list': {
					'fields': {
						'members': 'Members',
						'roles': 'Roles',
					},
					'title': '📃 Blacklisted members and roles',
				},
				'member_added': {
					'description': '<@%s> has been added to the blacklist. They will no longer be able to interact with the bot.',
					'title': '✅ Added member to blacklist',
				},
				'member_removed': {
					'description': '<@%s> has been removed from the blacklist. They can now use the bot again.',
					'title': '✅ Removed member from blacklist',
				},
				'role_added': {
					'description': '<@&%s> has been added to the blacklist. Members with this role will no longer be able to interact with the bot.',
					'title': '✅ Added role to blacklist',
				},
				'role_removed': {
					'description': '<@&%s> has been removed from the blacklist. Members with this role can now use the bot again.',
					'title': '✅ Removed role from blacklist',
				},
			},
		},
		'close': {
			'description': 'Close a ticket channel',
			'name': 'close',
			'options': {
				'reason': {
					'description': 'The reason for closing the ticket(s)',
					'name': 'reason',
				},
				'ticket': {
					'description': 'The ticket to close, either the number or the channel ID',
					'name': 'ticket',
				},
				'time': {
					'description': 'Close all tickets that have been inactive for the specified time',
					'name': 'time',
				},
			},
			'response': {
				'canceled': {
					'description': 'You canceled the operation.',
					'title': '🚫 Canceled',
				},
				'closed': {
					'description': 'Ticket #{number} has been closed.',
					'title': '✅ Ticket closed',
				},
				'closed_multiple': {
					'description': [
						'%d ticket has been closed.',
						'%d tickets have been closed.',
					],
					'title': [
						'✅ Ticket closed',
						'✅ Tickets closed',
					],
				},
				'confirm': {
					'buttons': {
						'cancel': 'Cancel',
						'confirm': 'Close',
					},
					'description': 'Please confirm your decision.',
					'description_with_archive': 'The ticket will be archived for future reference.',
					'title': '❔ Are you sure?',
				},
				'confirm_multiple': {
					'buttons': {
						'cancel': 'Cancel',
						'confirm': [
							'Close %d ticket',
							'Close %d tickets',
						],
					},
					'description': [
						'You are about to close %d ticket.',
						'You are about to close %d tickets.',
					],
					'title': '❔ Are you sure?',
				},
				'confirmation_timeout': {
					'description': 'You took too long to confirm.',
					'title': '❌ Interaction time expired',
				},
				'invalid_time': {
					'description': 'The time period provided could not be parsed.',
					'title': '❌ Invalid input',
				},
				'no_permission': {
					'description': 'You are not a staff member or the ticket creator.',
					'title': '❌ Insufficient permission',
				},
				'no_tickets': {
					'description': 'There are no tickets which have been inactive for this time period.',
					'title': '❌ No tickets to close',
				},
				'not_a_ticket': {
					'description': 'Please use this command in a ticket channel or use the ticket flag.\nType `/help close` for more information.',
					'title': '❌ This isn\'t a ticket channel',
				},
				'unresolvable': {
					'description': '`%s` could not be resolved to a ticket. Please provide the ticket ID/mention or number.',
					'title': '❌ Error',
				},
			},
		},
		'help': {
			'description': 'List the commands you have access to',
			'name': 'help',
			'response': {
				'list': {
					'description': 'The commands you have access to are listed below. To create a ticket, type **`/new`**.',
					'fields': {
						'commands': 'Commands',
					},
					'title': '❔ Help',
				},
			},
		},
		'new': {
			'description': 'Create a new ticket',
			'name': 'new',
			'options': {
				'topic': {
					'description': 'The topic of the ticket',
					'name': 'topic',
				},
			},
			'request_topic': {
				'description': 'Please briefly state what this ticket is about in a few words.',
				'title': '⚠️ Ticket topic',
			},
			'response': {
				'created': {
					'description': 'Your ticket has been created: <#{ticket_id}>.',
					'title': '✅ Ticket created',
				},
				'error': {
					'title': '❌ Error',
				},
				'has_a_ticket': {
					'description': 'Please use your existing ticket {ticket} or close it before creating another.',
					'title': '❌ You already have an open ticket',
				},
				'max_tickets': {
					'description': 'Please use `/close` to close any unneeded tickets.\n\n',
					'title': '❌ You already have {count} open tickets',
				},
				'no_categories': {
					'description': 'A server administrator must create at least one ticket category before a new ticket can be opened.',
					'title': '❌ Can\'t create ticket',
				},
				'select_category': {
					'description': 'Select the category most relevant to your ticket\'s topic.',
					'title': '🔤 Please select the ticket category',
				},
				'select_category_timeout': {
					'description': 'You took too long to select the ticket category.',
					'title': '❌ Interaction time expired',
				},
			},
		},
		'panel': {
			'description': 'Create a new ticket panel',
			'name': 'panel',
			'options': {
				'categories': {
					'description': 'A comma-separated list of category IDs',
					'name': 'categories',
				},
				'description': {
					'description': 'The description for the panel message',
					'name': 'description',
				},
				'image': {
					'description': 'An image URL for the panel message',
					'name': 'image',
				},
				'select_menu_options': {
					'description': 'An array of string of select menu options',
					'name': 'select_menu_options',
				},
				'thumbnail': {
					'description': 'A thumbnail image URL for the panel message',
					'name': 'thumbnail',
				},
				'title': {
					'description': 'The title for the panel message',
					'name': 'title',
				},
			},
			'response': {
				'invalid_category': {
					'description': 'One or more of the specified category IDs is invalid.',
					'title': '❌ Invalid category',
				},
				'select_menu_options_mismatch': {
					'description': 'Mismatch between category IDs and select menu options.',
					'title': '❌ Invalid select menu options',
				},
			},
		},
		'remove': {
			'description': 'Remove a member from a ticket',
			'name': 'remove',
			'options': {
				'member': {
					'description': 'The member to remove from the ticket',
					'name': 'member',
				},
				'ticket': {
					'description': 'The ticket to remove the member from',
					'name': 'ticket',
				},
			},
			'response': {
				'no_member': {
					'description': 'Please mention the member you want to remove.',
					'title': '❌ Unknown member',
				},
				'no_permission': {
					'description': 'You are not the creator of this ticket and you are not a staff member; you can\'t remove members from this ticket.',
					'title': '❌ Insufficient permission',
				},
				'not_a_ticket': {
					'description': 'Please use this command in the ticket channel, or mention the channel.',
					'title': '❌ This isn\'t a ticket channel',
				},
				'removed': {
					'description': '{user} has been removed from {channel}.',
					'title': '✅ Member removed',
				},
			},
		},
		'create': {
			'description': 'Create a new category',
			'name': 'create',
			'options': {
				'name': {
					'description': 'The name of the category',
					'name': 'name',
				},
				'roles': {
					'description': 'A comma-separated list of staff role IDs for this category',
					'name': 'roles',
				},
			},
			'response': {
				'category_created': {
					'description': 'The `{category}` ticket category has been created',
					'title': '✅ New category created',
				},
			},
		},
		'stats': {
			'description': 'Display ticket statistics',
			'fields': {
				'messages': 'Messages',
				'response_time': {
					'minutes': '%s minutes',
					'title': 'Avg. response time',
				},
				'tickets': 'Tickets',
			},
			'name': 'stats',
			'response': {
				'global': {
					'description': 'Statistics about tickets across all guilds where this Discord Tickets instance is used.',
					'title': '📊 Global stats',
				},
				'guild': {
					'description': 'Statistics about tickets within this guild. This data is cached for an hour.',
					'title': '📊 This server\'s stats',
				},
			},
		},
		'survey': {
			'description': 'View survey responses',
			'name': 'survey',
			'options': {
				'survey': {
					'description': 'The name of the survey to view responses of',
					'name': 'survey',
				},
			},
			'response': {
				'list': {
					'title': '📃 Surveys',
				},
			},
		},
		'tag': {
			'description': 'Use a tag response',
			'name': 'tag',
			'options': {
				'tag': {
					'description': 'The name of the tag to use',
					'name': 'tag',
				},
			},
			'response': {
				'error': '❌ Error',
				'list': {
					'title': '📃 Tag list',
				},
				'missing': 'This tag requires the following arguments:\n%s',
				'not_a_ticket': {
					'description': 'This tag can only be used within a ticket channel as it uses ticket references.',
					'title': '❌ This isn\'t a ticket channel',
				},
			},
		},
		'turn': {
			'description': 'Turn a thread/forum into a ticket',
			'name': 'turn',
			'response': {
				'error': {
					'title': '❌ This isn\'t a thread or forum',
					'description': 'Please use this command in a thread or forum',
				},
			},
		},
		'update': {
			'description': 'Update the ticket info',
			'name': 'update',
			'response': {
				'changed': {
					'description': 'This ticket\'s info has been changed.',
					'title': '✅ Ticket info changed',
				},
				'not_a_ticket': {
					'description': 'Please use this command in the ticket channel you want to update.',
					'title': '❌ This isn\'t a ticket channel',
				},
			},
		},
	},
	'message_will_be_deleted_in': 'This message will be deleted in %d seconds',
	'missing_permissions': {
		'description': 'You do not have the permissions required to use this command:\n%s',
		'title': '❌ Error',
	},
	'panel': {
		'create_ticket': 'Create a ticket',
	},
	'ticket': {
		'claim': 'Claim',
		'claimed': {
			'description': '{user} has claimed this ticket.',
			'title': '✅ Ticket claimed',
		},
		'close': 'Close',
		'closed': {
			'description': 'This ticket has been closed.\nThe channel will be deleted in 5 seconds.',
			'title': '✅ Ticket closed',
		},
		'closed_by_member': {
			'description': 'This ticket has been closed by {user}.\nThe channel will be deleted in 5 seconds.',
			'title': '✅ Ticket closed',
		},
		'closed_by_member_with_reason': {
			'description': 'This ticket has been closed by %s: `%s`\nThe channel will be deleted in 5 seconds.',
			'title': '✅ Ticket closed',
		},
		'closed_with_reason': {
			'description': 'This ticket has been closed: `%s`\nThe channel will be deleted in 5 seconds.',
			'title': '✅ Ticket closed',
		},
		'member_added': {
			'description': '{user} has been added by {member}',
			'title': 'Member added',
		},
		'member_removed': {
			'description': '{user} has been removed by {member}',
			'title': 'Member removed',
		},
		'opening_message': {
			'content': '{creator} has created a new ticket',
			'fields': {
				'topic': 'Ticket topic',
			},
		},
		'questions': 'Please answer the following questions:\n\n%s',
		'released': {
			'description': '{user} has released this ticket.',
			'title': '✅ Ticket released',
		},
		'survey': {
			'complete': {
				'description': 'Thank you for your feedback.',
				'title': '✅ Thank you',
			},
			'start': {
				'buttons': {
					'ignore': 'No',
					'start': 'Start survey',
				},
				'description': 'Hey, %s. Before this channel is deleted, would you mind completing a quick %d-question survey?',
				'title': '❔ Feedback',
			},
		},
		'unclaim': 'Release',
	},
	'updated_permissions': '✅ Slash command permissions updated',
};
