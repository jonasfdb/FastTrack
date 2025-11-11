// get_console_tag.mjs

// By default, trackIDs <= 48 => Wii U
// trackIDs >= 49 => Switch
// You can store real ID objects here or fallback to a known ID if bracket is not recognized.
const bracketToEmoji = {
  'SNES':       '<:consoleicon_snes:1347875782084530227>',
  'N64':        '<:consoleicon_n64:1347875995612479501>',
  'GCN':        '<:consoleicon_gcn:1347876112788754482>',
  'WII':        '<:consoleicon_wii:1347876225372127252>',
  'WII U':      '<:consoleicon_wiiu:1347876374362456149>',
  'SWITCH':     '<:consoleicon_switch:1347876497259626539>',
  'GBA':        '<:consoleicon_h_gba:1347876574820700201>',
  'DS':         '<:consoleicon_h_ds:1347876756287258715>',
  '3DS':        '<:consoleicon_h_3ds:1347876822230110278>',
  'TOUR':       '<:consoleicon_h_phone:1349556951733764168>' // or your ID for Tour
};

// fallback if bracket is not found or recognized
const EMOJI_WIIU   = '<:consoleicon_wiiu:1347876374362456149>';
const EMOJI_SWITCH = '<:consoleicon_switch:1347876497259626539>';

/**
 * @param {string} trackName e.g. "[Wii] Rainbow Road"<
 * @param {number} trackId
 * @returns {object} { shortName: string, consoleDiscordEmoji: { id: '...', name: '...' } | string | null }
 */
export function get_console_tag(trackName, trackId) {
  // 1) See if name starts with bracket, e.g. [Wii]
  const match = trackName.match(/^\[([A-Za-z0-9 ]+)\]\s*(.*)$/);
  let bracketText = null;
  let remainder   = trackName;

  if (match) {
    bracketText = match[1].toUpperCase();  // e.g. "WII"
    remainder   = match[2];               // e.g. "Rainbow Road"
  }

  // 2) Determine the raw emoji string from the bracket map
  let rawEmoji = null;
  if (bracketText && bracketToEmoji[bracketText] !== undefined) {
    rawEmoji = bracketToEmoji[bracketText];
  } else {
    // fallback by track ID
    rawEmoji = (trackId <= 48) ? EMOJI_WIIU : EMOJI_SWITCH;
  }

  // rawEmoji might be null, or a string like "<:consoleicon_wii:1347876225372127252>"
  // or a unicode like "🍄".

  // 3) Convert the rawEmoji string into a Discord "emoji" property if possible
  //    e.g. rawEmoji = "<:consoleicon_wii:1347876225372127252>"
  //    We want { id: '1347876225372127252' } if it's custom
  let consoleDiscordEmoji = null;

  if (typeof rawEmoji === 'string') {
    // check if it's a custom emoji like <:xxx:1234> or <a:xxx:1234>
    const customMatch = rawEmoji.match(/^<a?:([^:]+):(\d+)>$/);
    if (customMatch) {
      // e.g. "consoleicon_wii" = customMatch[1], "1347876225372127252" = customMatch[2]
      consoleDiscordEmoji = {
        id: customMatch[2],
        name: customMatch[1], // optional
      };
    } else {
      // If it doesn't match that pattern, it might be a normal unicode like "🍄",
      // in which case we can directly pass it as a string.
      consoleDiscordEmoji = rawEmoji;
    }
  }

  return {
    shortName: remainder,
    consoleDiscordEmoji
  };
}