import consola from "consola";
import { Events } from "discord.js";

export default {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) return;

		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			consola.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			await command.execute(interaction.client, interaction);
		} catch (error) {
			consola.fatal(`Error, but how?\n${error}`);
		}
	},
};

