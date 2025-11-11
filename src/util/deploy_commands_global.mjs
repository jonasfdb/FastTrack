import { REST, Routes } from "discord.js";
import consola from "consola";
import fs from "fs"
import path from "path";
import ora from "ora";

import config_data from "./conf.json" assert { type: 'json' };
import { pathToFileURL, fileURLToPath } from "url";

const { client_id, token } = config_data;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.join(__filename, '..');

const rest = new REST().setToken(token);

const spinner = ora('Fetching commands...').start();

let cli_progress_max = 0;
let cli_progress_amount = 0;

const commands_folders_path = path.join(__dirname, '../commands');
const commands_folders = fs.readdirSync(commands_folders_path);
const commands = [];

for(const folder of commands_folders) {
  const commands_path = path.join(commands_folders_path, folder);
  const commands_files = fs.readdirSync(commands_path).filter(file => file.endsWith('.mjs'));
  cli_progress_max++;

  for(const file of commands_files) {
    cli_progress_max++;
  }
}

cli_progress_amount = 1 / cli_progress_max

// cli.progress.start();

for(const folder of commands_folders) {
  const commands_path = path.join(commands_folders_path, folder);
  const commands_files = fs.readdirSync(commands_path).filter(file => file.endsWith('.mjs'));

  for(const file of commands_files) {
    const file_path = path.join(commands_path, file);

    const command = await import(pathToFileURL(file_path))
      .then(module => module.default)

    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
      // cli.progress.update(cli_progress_amount);
    } else {
      consola.warn(`Command at ${file_path} is missing data or execute property!`);
      // cli.progress.update(cli_progress_amount);
    }
  }
}

try {
  // cli.progress.end();
  spinner.stop();
  consola.info(`Refreshing ${commands.length} application commands...`);
  const data = await rest.put(Routes.applicationCommands(client_id), { body: commands });
  consola.success(`Successfully reloaded ${data.length} application commands.`);
} catch (error) {
  consola.error(error)
};