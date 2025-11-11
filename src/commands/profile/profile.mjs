import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';

import { db_user, db_timetrial } from '../../util/db/dbmodels.mjs';
import { lt_categories, lt_tracks } from '../../util/lookuptables.mjs';
import { parse_time_to_ms } from '../../util/helpers/parse_time_to_ms.mjs';

/**
 * A simple friend code regex, matching "SW-1234-5678-9999"
 * Optionally, you can remove the "SW-" requirement if you like.
 */
const friendCodeRegex = /^SW-\d{4}-\d{4}-\d{4}$/;

export default {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View or edit your FastTrack profile.')
    .addSubcommand((sub) =>
      sub
        .setName('view')
        .setDescription('View your profile, stats, best runs, etc.')
    )
    .addSubcommand((sub) =>
      sub
        .setName('update')
        .setDescription('Update your Nintendo username or friend code.')
    ),

  async execute(client, interaction) {
    const sub = interaction.options.getSubcommand();

    switch (sub) {
      // ─────────────────────────────────────────────────────────────
      // /profile view
      // ─────────────────────────────────────────────────────────────
      case 'view': {
        await interaction.deferReply();   // { ephemeral: true });

        // 1) Find user in DB
        const userRecord = await db_user.findOne({
          where: { user_id: interaction.user.id },
        });

        if (!userRecord) {
          return interaction.editReply({
            content:
              'You do not have a FastTrack profile yet. Use `/profile update` to create one.',
          });
        }

        // 2) Basic info from the user table
        const nintendoName = userRecord.nintendo_username || '_Not set_';
        const friendCode = userRecord.nintendo_friend_code || '_Not set_';

        // 3) Stats from db_timetrial
        //    - total runs
        //    - best run per category
        //    - top 3 runs overall

        // 3.1) Gather all runs for this user
        const runs = await db_timetrial.findAll({
          where: { user_id: interaction.user.id },
        });

        const totalRuns = runs.length;

        if (totalRuns === 0) {
          // If no runs, easy reply
          const embedNoRuns = new EmbedBuilder()
            .setColor(0x3498db)
            // .setAuthor({
            //   name: interaction.user.tag,
            //   // iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
            // })
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setTitle('Your FastTrack Profile')
            .setDescription(
              `**Nintendo Username:** ${nintendoName}\n` +
              `**Friend Code:** ${friendCode}\n\n` +
              `You have no recorded runs yet. Go do \`/time-trial\`!`
            );
          return interaction.editReply({ embeds: [embedNoRuns] });
        }

        // 3.2) Compute best run *per category* (lowest time)
        // We'll store a map: catId -> { run, timeMs }
        const bestByCategory = new Map();
        // Also store an array so we can find top 3 overall
        const allValidRuns = [];

        for (const run of runs) {
          const ms = parse_time_to_ms(run.time_result);
          if (ms === null) continue; // skip invalid format
          allValidRuns.push(run);

          const catKey = run.category_id;
          const existing = bestByCategory.get(catKey);
          if (!existing || ms < existing.timeMs) {
            bestByCategory.set(catKey, { run, timeMs: ms });
          }
        }

        // 3.3) Summarize best runs per category in text
        let bestCategoryLines = [];
        for (const [catKey, catVal] of lt_categories.entries()) {
          // catVal: { name, emoji }
          const best = bestByCategory.get(String(catKey));
          if (!best) {
            // user has no run in that category
            continue;
          }
          const catName = catVal.name;
          const catEmoji = catVal.emoji || '';

          // Possibly show track info
          const trackName = lt_tracks.get(Number(best.run.track_id))?.name || '??';
          bestCategoryLines.push(
            `${catEmoji} **${catName}:** \`${best.run.time_result}\` on ${trackName}`
          );
        }

        if (bestCategoryLines.length === 0) {
          bestCategoryLines.push('*(No valid runs in any known category.)*');
        }

        // 3.4) Top 3 runs overall (lowest times)
        // We'll parse them all, sort ascending
        const validRunsWithMs = allValidRuns
          .map((r) => {
            const ms = parse_time_to_ms(r.time_result);
            return ms === null ? null : { r, ms };
          })
          .filter(Boolean);

        validRunsWithMs.sort((a, b) => a.ms - b.ms);
        const top5 = validRunsWithMs.slice(0, 5); // best 5

        let top5Lines = [];
        if (top5.length === 0) {
          top5Lines.push('*(No valid runs found.)*');
        } else {
          top5.forEach((obj, idx) => {
            const rank = idx + 1;
            const run = obj.r;
            const cat = lt_categories.get(Number(run.category_id));
            const trackName = lt_tracks.get(Number(run.track_id))?.name || '??';
            const catLabel = cat ? cat.emoji + ' ' + cat.name : `Cat ${run.category_id}`;

            top5Lines.push(
              `**${rank})** \`${run.time_result}\` on **${trackName}** - (${catLabel})`
            );
          });
        }

        // 4) Build final embed
        const embed = new EmbedBuilder()
          .setColor(0x3498db)
          // .setAuthor({
          //   name: interaction.user.tag,
          //   // iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
          // })
          .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
          .setTitle(`Your FastTrack Profile`)
          .setDescription(
            `**Nintendo Username:** ${nintendoName}\n` +
            `**Friend Code:** ${friendCode}\n\n` +
            `**Total Runs:** ${totalRuns}`
          )
          .addFields({
            name: `Best Run Per Category`,
            value: bestCategoryLines.join('\n'),
          })
          .addFields({
            name: `Top 5 Runs Overall`,
            value: top5Lines.join('\n'),
          });

        return interaction.editReply({ embeds: [embed] });
      }

      // ─────────────────────────────────────────────────────────────
      // /profile update
      // ─────────────────────────────────────────────────────────────
      case 'update': {
        // We'll show a single ephemeral message with buttons:
        //  - "Edit Nintendo Username"
        //  - "Set Friend Code" (only if not already set)
        // Then we wait for the user's button press -> show a modal -> update DB.

        // 1) Check if user exists or create
        let userRecord = await db_user.findOne({
          where: { user_id: interaction.user.id },
        });
        if (!userRecord) {
          // auto-create empty record
          userRecord = await db_user.create({
            user_id: interaction.user.id,
            nintendo_username: null,
            nintendo_friend_code: null,
          });
        }

        // 2) Build the ephemeral message
        const updateEmbed = new EmbedBuilder()
          .setColor(0xf39c12)
          .setAuthor({
            name: interaction.user.tag,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
          })
          .setTitle('Update Your Profile')
          .setDescription(
            `**Nintendo Username:** ${userRecord.nintendo_username || '_Not set_'}\n` +
            `**Friend Code:** ${userRecord.nintendo_friend_code || '_Not set_'}\n\n` +
            `Choose what you want to update below!`
          );

        // Buttons
        const btns = [];
        btns.push(
          new ButtonBuilder()
            .setCustomId('profile_update_username')
            .setLabel('Edit Nintendo Username')
            .setStyle(ButtonStyle.Primary)
        );

        // Only show friend code button if not set
        if (!userRecord.nintendo_friend_code) {
          btns.push(
            new ButtonBuilder()
              .setCustomId('profile_set_friendcode')
              .setLabel('Set Friend Code')
              .setStyle(ButtonStyle.Secondary)
          );
        } else {
          // Already set, lock it
          btns.push(
            new ButtonBuilder()
              .setCustomId('profile_friendcode_locked')
              .setLabel('Friend Code Already Set')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true)
          );
        }

        const row = new ActionRowBuilder().addComponents(btns);

        await interaction.reply({
          embeds: [updateEmbed],
          components: [row],
          ephemeral: true,
        });

        // 3) Wait for button press
        let buttonInteraction;
        try {
          buttonInteraction = await interaction.channel.awaitMessageComponent({
            filter: (i) =>
              (i.customId === 'profile_update_username' ||
                i.customId === 'profile_set_friendcode' ||
                i.customId === 'profile_friendcode_locked') &&
              i.user.id === interaction.user.id,
            time: 60_000,
          });
        } catch (err) {
          // user never pressed a button
          await interaction.editReply({
            content: 'No action selected in time!',
            embeds: [],
            components: [],
          });
          return;
        }

        // If user clicked "Friend Code Already Set"
        if (buttonInteraction.customId === 'profile_friendcode_locked') {
          return buttonInteraction.reply({
            content: 'Your friend code is already set. You can’t change it.',
            ephemeral: true,
          });
        }

        // 4) If user wants to update username, show a modal
        if (buttonInteraction.customId === 'profile_update_username') {
          const usernameModal = new ModalBuilder()
            .setCustomId('profileUsernameModal')
            .setTitle('Edit Nintendo Username');

          const usernameInput = new TextInputBuilder()
            .setCustomId('profileUsernameInput')
            .setLabel('Nintendo Username')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(64)
            .setMinLength(2)
            .setPlaceholder('e.g. BowserFan99');

          const row1 = new ActionRowBuilder().addComponents(usernameInput);
          usernameModal.addComponents(row1);

          await buttonInteraction.showModal(usernameModal);

          // Wait for modal submit
          let usernameSubmit;
          try {
            usernameSubmit = await buttonInteraction.awaitModalSubmit({
              filter: (i) =>
                i.customId === 'profileUsernameModal' && i.user.id === interaction.user.id,
              time: 60_000,
            });
          } catch (err) {
            return buttonInteraction.followUp({
              content: 'You did not submit a username in time!',
              ephemeral: true,
            });
          }

          const newName = usernameSubmit.fields.getTextInputValue('profileUsernameInput');

          // Update DB
          try {
            await userRecord.update({ nintendo_username: newName });
          } catch (err) {
            console.error('Error updating username:', err);
            return usernameSubmit.reply({
              content: 'Database error while updating username.',
              ephemeral: true,
            });
          }

          // Acknowledge
          return usernameSubmit.reply({
            content: `Your Nintendo username has been updated to **${newName}**!`,
            ephemeral: true,
          });
        }

        // 5) If user wants to set friend code
        if (buttonInteraction.customId === 'profile_set_friendcode') {
          const fcModal = new ModalBuilder()
            .setCustomId('profileFCModal')
            .setTitle('Set Your Switch Friend Code.');

          const fcInput = new TextInputBuilder()
            .setCustomId('profileFCInput')
            .setLabel('Friend Code (format: SW-1234-5678-9999)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(17)
            .setPlaceholder('SW-0000-0000-0000');

          const row1 = new ActionRowBuilder().addComponents(fcInput);
          fcModal.addComponents(row1);

          await buttonInteraction.showModal(fcModal);

          let fcSubmit;
          try {
            fcSubmit = await buttonInteraction.awaitModalSubmit({
              filter: (i) =>
                i.customId === 'profileFCModal' && i.user.id === interaction.user.id,
              time: 60_000,
            });
          } catch (err) {
            return buttonInteraction.followUp({
              content: 'You did not submit a friend code in time!',
              ephemeral: true,
            });
          }

          const newFriendCode = fcSubmit.fields.getTextInputValue('profileFCInput');

          // Validate format
          if (!friendCodeRegex.test(newFriendCode)) {
            return fcSubmit.reply({
              content:
                `\`${newFriendCode}\` is not a valid friend code!\n` +
                `Use format: \`SW-1234-5678-9999\`.`,
              ephemeral: true,
            });
          }

          // Update DB
          try {
            // Double-check if user already has a code set
            // (though we've hidden the button if so)
            if (userRecord.nintendo_friend_code) {
              return fcSubmit.reply({
                content: 'Your friend code is already set and cannot be changed.',
                ephemeral: true,
              });
            }

            await userRecord.update({
              nintendo_friend_code: newFriendCode,
            });
          } catch (err) {
            console.error('Error updating friend code:', err);
            return fcSubmit.reply({
              content: 'Database error while updating friend code.',
              ephemeral: true,
            });
          }

          return fcSubmit.reply({
            content: `Your friend code has been set to **${newFriendCode}**!`,
            ephemeral: true,
          });
        }

        break;
      }
    }
  },
};