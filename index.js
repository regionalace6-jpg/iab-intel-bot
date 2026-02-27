const Discord = require("discord.js");
const fetch = require("node-fetch");

const { Client, GatewayIntentBits, EmbedBuilder } = Discord;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const PREFIX = "!";

// PANEL BUILDER
function Panel(title, fields = []) {
  return new EmbedBuilder()
    .setTitle(`🟥 INTELLIGENCE PROPERTY | ${title}`)
    .addFields(fields)
    .setColor("#000000")
    .setTimestamp();
}

// COMMANDS OBJECT
const commands = {};

/*
=======================
HELP COMMAND
=======================
*/
commands.help = async (msg) => {
  const embed = Panel("Command List", [
    { name: "[DISCORD] Commands (1-25)", value: "1. !discord1\n2. !discord2\n3. !discord3\n4. !discord4\n5. !discord5\n6. !discord6\n7. !discord7\n8. !discord8\n9. !discord9\n10. !discord10\n11. !discord11\n12. !discord12\n13. !discord13\n14. !discord14\n15. !discord15\n16. !discord16\n17. !discord17\n18. !discord18\n19. !discord19\n20. !discord20\n21. !discord21\n22. !discord22\n23. !discord23\n24. !discord24\n25. !discord25" },
    { name: "[ROBLOX] Commands (26-50)", value: "26. !roblox1\n27. !roblox2\n28. !roblox3\n29. !roblox4\n30. !roblox5\n31. !roblox6\n32. !roblox7\n33. !roblox8\n34. !roblox9\n35. !roblox10\n36. !roblox11\n37. !roblox12\n38. !roblox13\n39. !roblox14\n40. !roblox15\n41. !roblox16\n42. !roblox17\n43. !roblox18\n44. !roblox19\n45. !roblox20\n46. !roblox21\n47. !roblox22\n48. !roblox23\n49. !roblox24\n50. !roblox25" },
    { name: "[OSINT] Commands (51-75)", value: "51. !osint1\n52. !osint2\n53. !osint3\n54. !osint4\n55. !osint5\n56. !osint6\n57. !osint7\n58. !osint8\n59. !osint9\n60. !osint10\n61. !osint11\n62. !osint12\n63. !osint13\n64. !osint14\n65. !osint15\n66. !osint16\n67. !osint17\n68. !osint18\n69. !osint19\n70. !osint20\n71. !osint21\n72. !osint22\n73. !osint23\n74. !osint24\n75. !osint25" },
    { name: "[UTILITY] Commands (76-100)", value: "76. !utility1\n77. !utility2\n78. !utility3\n79. !utility4\n80. !utility5\n81. !utility6\n82. !utility7\n83. !utility8\n84. !utility9\n85. !utility10\n86. !utility11\n87. !utility12\n88. !utility13\n89. !utility14\n90. !utility15\n91. !utility16\n92. !utility17\n93. !utility18\n94. !utility19\n95. !utility20\n96. !utility21\n97. !utility22\n98. !utility23\n99. !utility24\n100. !utility25" }
  ]);

  msg.reply({ embeds: [embed] });
};

/*
=======================
DISCORD INFO (25)
=======================
*/
commands.discord1 = async (msg, args) => {
  let user;
  if (args[0]) {
    try { user = await client.users.fetch(args[0]); } catch { return msg.reply("User not found"); }
  } else { user = msg.author; }

  const member = msg.guild?.members.cache.get(user.id);
  const accountAgeDays = Math.floor((Date.now() - user.createdTimestamp) / 86400000);
  const serverJoinDays = member ? Math.floor((Date.now() - member.joinedTimestamp) / 86400000) : "N/A";

  const embed = Panel("Discord Profile", [
    { name: "Username", value: user.tag, inline: true },
    { name: "ID", value: user.id, inline: true },
    { name: "Account Created", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`, inline: true },
    { name: "Account Age", value: `${accountAgeDays} days`, inline: true },
    { name: "Server Join", value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>` : "Not in server", inline: true },
    { name: "Server Join Age", value: serverJoinDays + " days", inline: true },
    { name: "Avatar", value: `[Link](${user.displayAvatarURL({ dynamic: true, size: 512 })})`, inline: true }
  ]);

  msg.reply({ embeds: [embed] });
};

for (let i = 2; i <= 25; i++) commands[`discord${i}`] = commands.discord1;

/*
=======================
ROBLOX INFO (25)
=======================
*/
commands.roblox1 = async (msg, args) => {
  if (!args[0]) return msg.reply("Provide Roblox username or ID");
  try {
    let target = args[0];
    if (isNaN(target)) {
      const res = await fetch("https://users.roblox.com/v1/usernames/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames: [target] })
      });
      const data = await res.json();
      if (!data.data.length) return msg.reply("User not found");
      target = data.data[0].id;
    }

    const info = await fetch(`https://users.roblox.com/v1/users/${target}`).then(r => r.json());
    const avatar = `https://www.roblox.com/headshot-thumbnail/image?userId=${target}&width=420&height=420&format=png`;

    const embed = Panel("Roblox Profile", [
      { name: "Username", value: info.name || "Unknown", inline: true },
      { name: "Display Name", value: info.displayName || "Unknown", inline: true },
      { name: "Created", value: new Date(info.created).toDateString(), inline: true },
      { name: "ID", value: info.id.toString(), inline: true },
      { name: "Avatar", value: `[Link](${avatar})`, inline: true }
    ]);

    msg.reply({ embeds: [embed] });
  } catch { msg.reply("Roblox lookup failed"); }
};
for (let i = 2; i <= 25; i++) commands[`roblox${i}`] = commands.roblox1;

/*
=======================
OSINT (25)
=======================
*/
commands.osint1 = async (msg, args) => {
  if (!args[0]) return msg.reply("Provide IP or domain");
  try {
    const data = await fetch(`http://ip-api.com/json/${args[0]}`).then(r => r.json());
    msg.reply("```json\n" + JSON.stringify(data, null, 2) + "\n```");
  } catch { msg.reply("OSINT lookup failed"); }
};
for (let i = 2; i <= 25; i++) commands[`osint${i}`] = commands.osint1;

/*
=======================
UTILITY (25)
=======================
*/
commands.utility1 = async (msg) => msg.reply("Ping: " + client.ws.ping + "ms");
for (let i = 2; i <= 25; i++) commands[`utility${i}`] = commands.utility1;

/*
=======================
MESSAGE HANDLER
=======================
*/
client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;
  if (!msg.content.startsWith(PREFIX)) return;

  const args = msg.content.slice(PREFIX.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  try {
    if (commands[cmd]) await commands[cmd](msg, args);
    else msg.reply("Unknown command");
  } catch (err) { console.error(err); msg.reply("Command execution failed"); }
});

client.once("ready", () => {
  console.log(`🟥 INTELLIGENCE PROPERTY ONLINE | ${client.user.tag}`);
});

client.login(process.env.TOKEN);
