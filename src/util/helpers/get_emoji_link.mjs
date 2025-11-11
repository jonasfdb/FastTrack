export function get_emoji_link (emoji_markdown) {
  let emoji_id_split = emoji_markdown.split(":");
  let emoji_id = emoji_id_split[2].slice(0, -1);

  return `https://cdn.discordapp.com/emojis/${emoji_id.toString(10)}.webp?size=128`;
}