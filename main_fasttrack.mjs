import Discord, { PermissionFlagsBits, TextInputStyle } from "discord.js";
import consola from "consola";
import fs from "fs";
import path from "path";
import { fasttrack_db } from "./src/util/db/dbconfig.mjs"

// ##########   Utility Constants   ##########
import config_data from './src/util/conf.json' assert { type: 'json' };
import { InteractionType, ButtonStyle } from "discord.js";
import { pathToFileURL, fileURLToPath } from "url";
import ora from "ora";

const { token } = config_data;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.join(__filename, '..');

const gatewayIntentList = new Discord.IntentsBitField();
gatewayIntentList.add(
  Discord.GatewayIntentBits.Guilds,
  Discord.GatewayIntentBits.GuildMessages,
  Discord.GatewayIntentBits.DirectMessages,
);

// ##########   Client and REST   ##########
const client = new Discord.Client({
  intents: gatewayIntentList,
  // partials: partialsList,  -> partial structures are not needed (check discord.js for details)
});

// ##########   Commands   ##########
const commands = []

client.commands = new Discord.Collection();

const spinner = new ora('Starting up FastTrack...').start();

const commands_folders_path = path.join(__dirname, 'src', 'commands');
const commands_folders = fs.readdirSync(commands_folders_path);

for(const folder of commands_folders) {
  const commands_path = path.join(commands_folders_path, folder);
  const commands_files = fs.readdirSync(commands_path).filter(file => file.endsWith('.mjs'));

  for(const file of commands_files) {
    const file_path = path.join(commands_path, file);

    const command = await import(pathToFileURL(file_path))
      .then(module => module.default)

    console.log(command)

    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
      commands.push(command.data.toJSON())
    } else {
      consola.warn(`Command at ${file_path} is missing properties`)
    }
  }
}

const events_path = path.join(__dirname, 'src', 'events');
const events_files = fs.readdirSync(events_path).filter(file => file.endsWith('.mjs'));

for (const file of events_files) {
	const file_path = path.join(events_path, file);

  const event = await import(pathToFileURL(file_path))
    .then(module => module.default)

	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));     //    ... means spread (spread syntax, argument array)
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
};

consola.info("\nCreating/Updating database...")
await fasttrack_db.sync({ alter: true })
  .then(() => {
    // consola.success("Successfully created/updated aura_db tables.")
  })
  .catch((err) => consola.error(err));

spinner.stop();
consola.success('Ready!')

/*

###
###   THIS IS THE CRON BACKUP TAKEN FROM ORB - FOR SQLITE, THIS IS NOT NEEDED - !!! YET !!!
###   IF NEEDED, CHANGE DATABASE DATA TO THAT FROM ./util/db!!!!!!!!!!!!!!!!!!!!! WILL BREAK OTHERWISE
###


cron.schedule('0 0 * * *', () => {
  // ### Daily database backup function ###
  // const db_connection_string = 'postgres://postgres:JhGa15012004@localhost:5432/orb_experimental';  // ###!!!!!! this must be production database too!!
  const db_connection_string = 'postgres://postgres:postgres@localhost:5432/orb_experimental';  // ###!!!!!! this is the production database connection string!!
  const db_backup_timestamp = "D" + new Date().toISOString().replace(/:/g, '-').slice(0, -8);
  const db_backup_filename = `backup_${db_backup_timestamp}.sql`;
  const db_backup_filepath = path.join(__dirname, "db_backup", db_backup_filename);

  const db_pgdump_command = `pg_dump -d "${db_connection_string}" -f "${db_backup_filepath}"`;

  exec(db_pgdump_command, (error, stdout, stderr) => {
    if (error) {
      consola.error('Error on database backup:', error);
    } else {
      consola.success('Database backup created successfully: ', db_backup_filename);
    }
  })

  try {
    const retention_days = 7  // how long to keep old files for, in days

    const backup_dir = path.join(__dirname, "db_backup")
    const files = fs.readdirSync(backup_dir);

    const current_date = new Date();

    for (const file of files) {
      if (file.startsWith('backup_') && file.endsWith('.sql')) {
        const timestamp_string_prototype = file.replace('backup_', '').replace('.sql', '');
        let timestamp = new Date(timestamp_string_prototype.split("T")[0].replace("D", "") + "T" + timestamp_string_prototype.split("T")[1].replace(/-/g, ':') + ":00.000Z");

        const millisecond_time_difference = current_date - timestamp;
        // const minute_time_difference = millisecond_time_difference / (1000 * 60) + 1;
        const days_time_difference = millisecond_time_difference / (1000 * 60 * 60 * 24);

        if (days_time_difference >= retention_days) {
          const filePath = path.join(backup_dir, file);
          fs.unlink(filePath, (err => {
            if (err) {
              consola.error(err)
            } else {
              consola.success(`Deleted old backup file: ${file}`);
            }
          }));
        }
      }
    }
  } catch (error) {
    consola.error('Error deleting old backup files:', error);
  }
});

/*
cron.schedule('0 0 * * *', () => {
  // ### Product update checker and sender ###
});
*/

client.on(Discord.Events.InteractionCreate, async (interaction) => {
  if (interaction.type != InteractionType.ApplicationCommand) return;
  //  will only handle interaction commands
  consola.info("interaction_COMMAND", interaction.channel.id, interaction.guild.id)
  return;
});

client.login(token);