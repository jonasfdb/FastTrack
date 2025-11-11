import {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
} from 'discord.js';

import { db_user, db_timetrial } from '../../util/db/dbmodels.mjs';

import { lt_cups, lt_tracks, lt_categories } from '../../util/lookuptables.mjs';
import { get_emoji_link } from '../../util/helpers/get_emoji_link.mjs';
import { get_console_tag } from '../../util/helpers/get_console_tag.mjs';

// Let’s define a small helper to parse "M:SS.xxx" -> total ms
function parseTimeStringToMs(timeStr) {
  // Expect e.g. "1:27.345" or "0:59.999"
  // A simple regex or split approach:
  const match = timeStr.match(/^([0-8]):([0-5]\d)\.(\d{3})$/);
  if (!match) return null; // invalid format
  // match[1] = minutes (0-8)
  // match[2] = seconds (00-59)
  // match[3] = ms (xxx)
  const mins = parseInt(match[1], 10);
  const secs = parseInt(match[2], 10);
  const ms   = parseInt(match[3], 10);
  return mins * 60_000 + secs * 1_000 + ms;
}

// We have 4 categories in lt_categories for example
// If you have more, just iterate over them all in the final step.

export default {
  data: new SlashCommandBuilder()
    .setName('track-leaderboard')
    .setDescription('Show top runs for a chosen track'),

  async execute(client, interaction) {
    
    await interaction.deferReply();

    // ──────────────────────────────────────────────────────────────
    // 1) Build & show Cup select
    // ──────────────────────────────────────────────────────────────
    const cupOptions = [];
    for (const [cupId, cupData] of lt_cups.entries()) {
      cupOptions.push({
        label: cupData.name,
        value: String(cupId),
        emoji: cupData.emoji,
      });
    }

    const cupMenu = new StringSelectMenuBuilder()
      .setCustomId('selectCup_leaderboard')
      .setPlaceholder('Select a Cup')
      .addOptions(cupOptions);

    const cupRow = new ActionRowBuilder().addComponents(cupMenu);

    const initEmbed = new EmbedBuilder()
      .setColor(0x3366ff)
      .setTitle('Track Leaderboard Lookup')
      .setThumbnail(get_emoji_link('<:icon_timetrial:1347885553575788595>'))
      .setDescription(
        `Select **a Cup** to see track leaderboards.\n` +
        `\u200B\n` +
        `*(60 seconds per selection)*`
      );

    let mainMsg = await interaction.editReply({
      embeds: [initEmbed],
      components: [cupRow],
      ephemeral: false // Let's make it public so everyone sees the scoreboard
    });

    // A small helper if we want to remove the interactive UI on error/timeouts
    async function removeAllComponents() {
      try {
        await interaction.editReply({ components: [] });
      } catch {}
    }

    // ──────────────────────────────────────────────────────────────
    // 2) Wait for Cup
    // ──────────────────────────────────────────────────────────────
    let cupSelect;
    try {
      cupSelect = await mainMsg.awaitMessageComponent({
        filter: (i) =>
          i.customId === 'selectCup_leaderboard' && i.user.id === interaction.user.id,
        time: 60_000
      });
    } catch (err) {
      await interaction.editReply({
        content: 'You did not pick a cup in time!',
        embeds: [],
        components: []
      });
      return;
    }

    const selectedCupId = parseInt(cupSelect.values[0], 10);
    const cupData = lt_cups.get(selectedCupId);
    if (!cupData) {
      await cupSelect.update({
        content: 'Invalid cup selected.',
        components: []
      });
      return;
    }

    // disable cup selection
    cupMenu.setDisabled(true);

    // ──────────────────────────────────────────────────────────────
    // 3) Build & show Track select
    // ──────────────────────────────────────────────────────────────
    const trackOptions = cupData.track_ids.map((trackId) => {
      const trackObj = lt_tracks.get(trackId);
      if (!trackObj) {
        return { label: `Track ${trackId}`, value: String(trackId) };
      }
      const { shortName, consoleDiscordEmoji } = get_console_tag(trackObj.name, trackId);

      let option = {
        label: shortName,
        value: String(trackId)
      };

      if (consoleDiscordEmoji) {
        option.emoji = consoleDiscordEmoji;
      }
      return option;
    });

    const trackMenu = new StringSelectMenuBuilder()
      .setCustomId('selectTrack_leaderboard')
      .setPlaceholder('Select a Track')
      .addOptions(trackOptions);

    const trackRow = new ActionRowBuilder().addComponents(trackMenu);

    await cupSelect.update({
      embeds: [
        new EmbedBuilder()
          .setColor(0x3366ff)
          .setTitle('Track Leaderboard Lookup')
          .setThumbnail(get_emoji_link('<:icon_timetrial:1347885553575788595>'))
          .setDescription(
            `**Cup:** ${cupData.emoji} **${cupData.name}**\n\n` +
            `Now select a **Track**:`
          )
      ],
      components: [cupRow, trackRow]
    });

    // ──────────────────────────────────────────────────────────────
    // 4) Wait for Track
    // ──────────────────────────────────────────────────────────────
    let trackSelect;
    try {
      trackSelect = await interaction.channel.awaitMessageComponent({
        filter: (i) =>
          i.customId === 'selectTrack_leaderboard' && i.user.id === interaction.user.id,
        time: 60_000
      });
    } catch (err) {
      await interaction.editReply({
        content: 'You did not pick a track in time!',
        embeds: [],
        components: []
      });
      return;
    }

    const selectedTrackId = parseInt(trackSelect.values[0], 10);
    const trackData = lt_tracks.get(selectedTrackId);
    if (!trackData) {
      await trackSelect.update({
        content: 'Invalid track selected!',
        components: []
      });
      return;
    }

    // disable track menu
    trackMenu.setDisabled(true);

    // ──────────────────────────────────────────────────────────────
    // 5) Query the Top Runs in Each Category
    // ──────────────────────────────────────────────────────────────
    // Suppose our lt_categories keys are:
    //   1500 -> { name: "150cc", ... }
    //   1501 -> { name: "150cc Itemless", ... }
    //   2000 -> { name: "200cc", ... }
    //   2001 -> { name: "200cc Itemless", ... }

    // We'll gather them, sorted by time ascending. 
    // Because we store time as a string, we'll parse in JS.

    // We'll build an array of objects:
    // { catId, catName, runs: [ { user_id, nintendo_username, time_result, timeMs } ] }

    const categoriesArray = Array.from(lt_categories.entries());
    // e.g. [ [1500, {...}], [1501, {...}], [2000, {...}], [2001, {...}] ]

    const resultsForEmbed = [];

    for (const [catKey, catVal] of categoriesArray) {
      // fetch runs for track_id + category_id
      const runs = await db_timetrial.findAll({
        where: {
          track_id: String(selectedTrackId),
          category_id: String(catKey)
        }
      });

      // Build an array of { user_id, time_result, nintendo_username, timeMs }
      const runDetails = [];
      for (const run of runs) {
        // parse the time string to ms
        const ms = parseTimeStringToMs(run.time_result);
        if (ms === null) {
          // skip if invalid format
          continue;
        }
        // find the user’s nintendo_username from db_user
        let userName = run.user_id;
        const userRec = await db_user.findOne({ where: { user_id: run.user_id } });
        if (userRec && userRec.nintendo_username) {
          userName = userRec.nintendo_username;
        } else {
          let nonNintendoUser = await interaction.guild.members.fetch(run.user_id);
          // console.log(nonNintendoUser.user.username, nonNintendoUser.nickname)

          userName = `${nonNintendoUser.user.username} <:discord_icon:1349580026567458878>`
        }

        runDetails.push({
          user_id: run.user_id,
          userName,
          time_result: run.time_result,
          timeMs: ms
        });
      }

      // sort ascending by timeMs
      runDetails.sort((a, b) => a.timeMs - b.timeMs);

      // take top 5
      const topFive = runDetails.slice(0, 5);

      // We'll store them for the embed
      resultsForEmbed.push({
        catId: catKey,
        catName: catVal.name,
        catEmoji: catVal.emoji || '',
        runs: topFive
      });
    }

    // ──────────────────────────────────────────────────────────────
    // 6) Build the Leaderboard Embed
    // ──────────────────────────────────────────────────────────────
    // One embed with multiple fields, one per category. Each field shows up to 5 runs.

    let trackLine = trackData.name;
    // optionally parse console bracket for inline icon:
    const { shortName, consoleDiscordEmoji } = get_console_tag(trackData.name, selectedTrackId);
    if (consoleDiscordEmoji) {
      if (typeof consoleDiscordEmoji === 'object') {
        trackLine = `<:${consoleDiscordEmoji.name}:${consoleDiscordEmoji.id}> ${shortName}`;
      } else {
        trackLine = `${consoleDiscordEmoji} ${shortName}`;
      }
    }

    const leaderboardEmbed = new EmbedBuilder()
      .setColor(0x3366ff)
      .setTitle('Track Leaderboard')
      .setThumbnail(get_emoji_link('<:icon_timetrial:1347885553575788595>'))
      .setDescription(
        `**Cup:** ${cupData.emoji} **${cupData.name}**\n` +
        `**Track:** ${trackLine}\n\n` +
        `_Below are the top 5 times in each category (if available)_`
      );

    for (const catRes of resultsForEmbed) {
      // catRes: { catId, catName, catEmoji, runs: [] }
      if (catRes.runs.length === 0) {
        // If no runs, just say "No runs recorded"
        leaderboardEmbed.addFields({
          name: `${catRes.catEmoji} ${catRes.catName}`,
          value: `No runs recorded yet.`,
          inline: false
        });
      } else {
        // Build a small listing of top runs
        // e.g. 1) [1:27.345] @NintendoUser
        let lines = [];
        catRes.runs.forEach((r, idx) => {
          lines.push(
            `**${idx + 1})** \`${r.time_result}\` — ${r.userName}`
          );
        });

        leaderboardEmbed.addFields({
          name: `${catRes.catEmoji} ${catRes.catName}`,
          value: lines.join('\n'),
          inline: false
        });
      }
    }

    // ──────────────────────────────────────────────────────────────
    // 7) Finally, update to show the results
    // ──────────────────────────────────────────────────────────────
    await trackSelect.update({
      embeds: [leaderboardEmbed],
      components: [] // keep them visible but disabled
    });
  }
};
