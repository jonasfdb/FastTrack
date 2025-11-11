import {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  EmbedBuilder,
  TextInputBuilder,
  TextInputStyle,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';

import { v7 as uuidv7 } from 'uuid';

import { lt_cups, lt_tracks, lt_categories } from '../../util/lookuptables.mjs';
import { get_emoji_link } from '../../util/helpers/get_emoji_link.mjs';
import { get_console_tag } from '../../util/helpers/get_console_tag.mjs';

import { db_user, db_timetrial } from '../../util/db/dbmodels.mjs';

// Validate: [0-8]:[00-59].[xxx]
const timeRegex = /^[0-8]:[0-5]\d\.\d{3}$/;

export default {
  data: new SlashCommandBuilder()
    .setName('time-trial')
    .setDescription('Record a new time trial run'),

  async execute(client, interaction) {
    const userDB = await db_user.findOne({ where: { user_id: interaction.user.id } });

    if (!userDB) {
      // Option A) Show ephemeral error message telling them to create a profile
      try {
        await db_user.create({
          user_id: interaction.user.id,
          // set default values if needed
        });
      } catch (err) {
        console.error("Error creating user: ", err);
        return interaction.reply({
          content: `Failed to auto-create a user profile. Please try again or contact support.`,
          ephemeral: true
        });
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 1) INITIAL EPHEMERAL MESSAGE: CUP SELECT
    // ──────────────────────────────────────────────────────────────────────────
    const cupOptions = [];
    for (const [cupId, cupData] of lt_cups.entries()) {
      cupOptions.push({
        label: cupData.name,
        value: String(cupId),
        emoji: cupData.emoji, // e.g. <:MushroomCup:123456> or a unicode
      });
    }

    const cupMenu = new StringSelectMenuBuilder()
      .setCustomId('selectCup')
      .setPlaceholder('Select a Cup')
      .addOptions(cupOptions);

    const cupRow = new ActionRowBuilder().addComponents(cupMenu);

    const initialEmbed = new EmbedBuilder()
      .setColor(0xc42b2b) // Reddish
      .setThumbnail(get_emoji_link('<:icon_timetrial:1347885553575788595>'))
      .setTitle('Time Trial Entry')
      .setDescription(
        `Welcome to **FastTrack** Time Trial Recording!\n\n` +
        `► **Step 1:** Choose **a Cup** below.\n` +
        `\u200B\n` + // zero-width space for spacing
        `*(You have 60 seconds for each selection.)*`
      );

    // Send ephemeral
    let mainMsg = await interaction.reply({
      embeds: [initialEmbed],
      components: [cupRow],
      ephemeral: true,
    });

    // A helper function to quickly remove the ephemeral message on error.
    // We'll call this whenever we "bail out" from the command.
    async function deleteEphemeralOnError() {
      try {
        // If we can still edit/delete mainMsg, do so:
        await mainMsg.delete();
      } catch {
        // If the ephemeral was already deleted or no longer exists, ignore.
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 2) WAIT FOR CUP
    // ──────────────────────────────────────────────────────────────────────────
    let cupInteraction;
    try {
      cupInteraction = await mainMsg.awaitMessageComponent({
        filter: (i) =>
          i.customId === 'selectCup' && i.user.id === interaction.user.id,
        time: 60_000
      });
    } catch (err) {
      // Time’s up
      await interaction.editReply({
        content: 'You did not select a cup in time!',
        embeds: [],
        components: []
      });
      await deleteEphemeralOnError();
      return;
    }

    const selectedCupId = parseInt(cupInteraction.values[0], 10);
    const cupData = lt_cups.get(selectedCupId);
    if (!cupData) {
      await cupInteraction.update({
        content: 'Invalid cup selected (no data).',
        components: []
      });
      await deleteEphemeralOnError();
      return;
    }

    // Disable the Cup select
    cupMenu.setDisabled(true);

    // ──────────────────────────────────────────────────────────────────────────
    // 3) TRACK SELECT
    // ──────────────────────────────────────────────────────────────────────────
    const trackOptions = cupData.track_ids.map((trackId) => {
      const trackObj = lt_tracks.get(trackId);
      if (!trackObj) {
        return { label: `Track ${trackId}`, value: String(trackId) };
      }

      // parse the bracket => get a shortName + consoleDiscordEmoji
      const { shortName, consoleDiscordEmoji } = get_console_tag(trackObj.name, trackId);

      // Build a Discord "StringSelectMenuOption"
      const option = {
        label: shortName,           // e.g. "Rainbow Road"
        value: String(trackId)
        // We can pass an "emoji" field, but it must be either
        // a string for unicode or an object { id: 'xxxx' } for custom.
      };

      if (consoleDiscordEmoji) {
        option.emoji = consoleDiscordEmoji;
      }
      return option;
    });

    // Then:
    const trackMenu = new StringSelectMenuBuilder()
      .setCustomId('selectTrack')
      .setPlaceholder('Select a Track')
      .addOptions(trackOptions);

    const trackRow = new ActionRowBuilder().addComponents(trackMenu);

    // Update the ephemeral embed
    await cupInteraction.update({
      embeds: [
        new EmbedBuilder()
          .setColor(0xc42b2b)
          .setThumbnail(get_emoji_link('<:icon_timetrial:1347885553575788595>'))
          .setTitle('Time Trial Entry')
          .setDescription(
            `► **Cup Chosen:** ${cupData.emoji} **${cupData.name}**\n\n` +
            `**Step 2:** Select **a Track** below.\n` +
            `\u200B\n` +
            `*(You have 60 seconds to choose.)*`
          )
          // You can highlight the selection with a checkmark or arrow, e.g.:
          // .addFields({ name: 'Cup Selected', value: `✅ ${cupData.name}` })
      ],
      components: [cupRow, trackRow]
    });

    // ──────────────────────────────────────────────────────────────────────────
    // 4) WAIT FOR TRACK
    // ──────────────────────────────────────────────────────────────────────────
    let trackInteraction;
    try {
      trackInteraction = await interaction.channel.awaitMessageComponent({
        filter: (i) =>
          i.customId === 'selectTrack' && i.user.id === interaction.user.id,
        time: 60_000
      });
    } catch (err) {
      // Time’s up
      await interaction.editReply({
        content: 'You did not select a track in time!',
        embeds: [],
        components: []
      });
      await deleteEphemeralOnError();
      return;
    }

    const selectedTrackId = parseInt(trackInteraction.values[0], 10);
    const trackData = lt_tracks.get(selectedTrackId);
    if (!trackData) {
      await trackInteraction.update({
        content: 'Invalid track selected (no data).',
        components: []
      });
      await deleteEphemeralOnError();
      return;
    }

    trackMenu.setDisabled(true);

    // ──────────────────────────────────────────────────────────────────────────
    // 5) CATEGORY BUTTONS
    // ──────────────────────────────────────────────────────────────────────────
    const catButtons = [];
    for (const [catKey, catVal] of lt_categories.entries()) {
      catButtons.push(
        new ButtonBuilder()
          .setCustomId(`cat_${catKey}`)
          .setLabel(catVal.name)
          .setEmoji(catVal.emoji)
          .setStyle(ButtonStyle.Primary)
      );
    }

    const categoryRow = new ActionRowBuilder().addComponents(catButtons);
    
    const { shortName, consoleDiscordEmoji } = get_console_tag(trackData.name, selectedTrackId);
    
    // If consoleDiscordEmoji is an object, we can do
    // `'<:consoleicon_wii:12345>'` to show it in the embed text by reconstructing the syntax:
    let trackEmbedLine = `**${trackData.name}**`; // fallback
    if (consoleDiscordEmoji) {
      if (typeof consoleDiscordEmoji === 'object') {
        // custom emoji: manually reconstruct the text syntax if you want it in the embed
        trackEmbedLine = `<:${consoleDiscordEmoji.name}:${consoleDiscordEmoji.id}> **${shortName}**`;
        // if it's an animated emoji, it might be `<a:...:ID>`
      } else {
        // it's presumably a unicode like "🍄"
        trackEmbedLine = `${consoleDiscordEmoji} **${shortName}**`;
      }
    }
    
    await trackInteraction.update({
      embeds: [
        new EmbedBuilder()
          .setColor(0xc42b2b)
          .setThumbnail(get_emoji_link('<:icon_timetrial:1347885553575788595>'))
          .setTitle('Time Trial Entry')
          .setDescription(
            `► **Cup:** ${cupData.emoji} **${cupData.name}**\n` +
            `► **Track:** ${trackEmbedLine}\n\n` +
            `**Step 3:** Choose **a Category** below.\n` +
            `\u200B\n` +
            `*(You have 60 seconds to choose.)*`
          )
      ],
      components: [cupRow, trackRow, categoryRow]
    });
    

    // ──────────────────────────────────────────────────────────────────────────
    // 6) WAIT FOR CATEGORY → SHOW MODAL
    // ──────────────────────────────────────────────────────────────────────────
    let catInteraction;
    try {
      catInteraction = await mainMsg.awaitMessageComponent({
        filter: (i) =>
          i.customId.startsWith('cat_') && i.user.id === interaction.user.id,
        time: 60_000
      });
    } catch (err) {
      await interaction.editReply({
        content: 'You did not pick a category in time!',
        embeds: [],
        components: []
      });
      await deleteEphemeralOnError();
      return;
    }

    const catId = parseInt(catInteraction.customId.slice(4), 10);
    const catData = lt_categories.get(catId);
    if (!catData) {
      await catInteraction.update({
        content: 'Invalid category selected!',
        components: []
      });
      await deleteEphemeralOnError();
      return;
    }

    // We cannot `.update()` the ephemeral message if we want to show a modal.
    // The modal call must be the *only* response to this interaction.
    const modal = new ModalBuilder()
      .setCustomId('timeTrialModal')
      .setTitle('Enter Your Time (M:SS.xxx)');

    const timeInput = new TextInputBuilder()
      .setCustomId('timeInput')
      .setLabel('Your fastest time')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('e.g. 1:27.345')
      .setRequired(true);

    const modalRow = new ActionRowBuilder().addComponents(timeInput);
    modal.addComponents(modalRow);

    await catInteraction.showModal(modal);

    // ──────────────────────────────────────────────────────────────────────────
    // 7) WAIT FOR MODAL SUBMIT → VALIDATE TIME
    // ──────────────────────────────────────────────────────────────────────────
    let submittedModal;
    try {
      submittedModal = await catInteraction.awaitModalSubmit({
        filter: (i) =>
          i.customId === 'timeTrialModal' && i.user.id === interaction.user.id,
        time: 60_000
      });
    } catch (err) {
      await catInteraction.followUp({
        content: 'You did not enter your time in time!',
        ephemeral: true
      });
      await deleteEphemeralOnError();
      return;
    }

    const rawTime = submittedModal.fields.getTextInputValue('timeInput');

    // Validate
    if (!timeRegex.test(rawTime)) {
      // If invalid, send ephemeral error and delete main ephemeral message
      await submittedModal.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('<:failure_icon_flat:1222305977546706955> - Oops!')
            .setDescription(`Your input \`${rawTime}\` doesn't match format \`M:SS.xxx\` (M=0–8, SS=00–59, xxx=3 digits).\nPlease run \`/time-trial\` again.`)
        ],
        ephemeral: true
      });
      await deleteEphemeralOnError();
      return;
    }

    const runId = uuidv7(); // or use "import { v4 as uuidv4 } from 'uuid';" 
    const nowIso = new Date().toISOString();

    try {
      await db_timetrial.create({
        run_id: runId,
        user_id: interaction.user.id,
        time_result: rawTime,
        track_id: String(selectedTrackId),
        cup_id: String(selectedCupId),
        category_id: String(catId),
        timestamp: nowIso
      });
    } catch (dbErr) {
      console.error('Error inserting time trial:', dbErr);
      await submittedModal.reply({
        content: 'Database error while saving your time trial. Please try again later!',
        ephemeral: true
      });
      await deleteEphemeralOnError();
      return;
    }


    // ──────────────────────────────────────────────────────────────────────────
    // 8) FINAL: UPDATE THE ORIGINAL EPHEMERAL MESSAGE w/ ALL SELECTIONS
    //    Now we can highlight the category’s emoji as well.
    // ──────────────────────────────────────────────────────────────────────────
    await submittedModal.update({
      embeds: [
        new EmbedBuilder()
          .setColor(0x34b73f)
          .setTitle('<:success_icon_flat:1251580057596596366> - Time Trial Recorded!')
          .setDescription(
            `► **Cup:** ${cupData.emoji} **${cupData.name}**\n` +
            `► **Track:** ${trackEmbedLine}\n` +
            `► **Category:** ${catData.emoji} **${catData.name}**\n` +
            `► **Time:** \`${rawTime}\``
          )
      ],
      components: []
    });
    

    // Now you end with exactly one ephemeral message
    // showing final success.
  }
};