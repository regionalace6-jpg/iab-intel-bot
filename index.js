// index.js
import { Client, GatewayIntentBits, EmbedBuilder } from "discord.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const PREFIX = "!";

// -----------------------------
// Panel Builder
// -----------------------------
function Panel(title, fields = []) {
  return new EmbedBuilder()
    .setTitle(`🟥 INTELLIGENCE PROPERTY | ${title}`)
    .addFields(fields)
    .setColor("#000000")
    .setTimestamp();
}

// -----------------------------
// Commands
// -----------------------------
const commands = {};

// ---------- HELP ----------
commands.help = async msg => {
  const helpText = `
[Discord Commands]
1. !userinfo - Full Discord info
2. !userinfoglobal <id> - Global Discord user info
3. !avatar - Show avatar
4. !avatarglobal <id> - Global avatar
5. !serverinfo - Server info
6. !membercount - Members in server
7. !roles - Server roles list
8. !permissions - Show user permissions
9. !joineddate - Show join date
10. !accountage - Account age
11. !botcheck - Is bot?
12. !nickname - Server nickname
13. !status - Online status
14. !activity - Current activity
15. !toprole - Top role
16. !hoistedrole - Hoisted role
17. !discriminator - Show discriminator
18. !tag - Full tag
19. !joinedserver - Join date exact
20. !rolescount - Number of roles
21. !muted - Check mute
22. !boosted - Check if boosted
23. !boosteddate - Boost date
24. !lastmessage - Last message in server
25. !voicechannel - Current voice channel

[Roblox Commands]
26. !robloxinfo <username/id> - Roblox info
27. !robloxavatar <id> - Avatar image
28. !robloxfriends <username/id> - Friends count
29. !robloxfollowers <username/id> - Followers count
30. !robloxfollowing <username/id> - Following count
31. !robloxgroups <username/id> - Groups count
32. !robloxcreated <username/id> - Account creation
33. !robloxbio <username/id> - User bio
34. !robloxfavgames <username/id> - Favorite games
35. !robloxheadshot <id> - Headshot image
36. !robloxsearch <username> - Global search
37. !robloxusername <id> - ID → username
38-50. Placeholder Roblox commands (expandable)

[OSINT Commands]
51. !iplookup <ip> - IP info
52. !dnslookup <domain> - DNS info
53. !whois <domain> - WHOIS info
54. !geoip <ip> - Geolocation
55. !asn <ip> - ASN info
56. !reverseip <ip> - Reverse IP
57. !subdomains <domain> - Public subdomains
58. !emails <domain> - Public emails
59. !urlscan <url> - URL scan summary
60. !threatcheck <ip/domain> - Threat check
61-75. Additional OSINT placeholders

[Utility Commands]
76. !ping - Bot latency
77. !quote - Random quote
78. !iq - Random IQ
79. !roll <dice> - Roll dice
80. !flip - Coin flip
81. !randnum <min> <max> - Random number
82. !echo <text> - Repeat text
83. !say <text> - Bot says text
84. !time - Current time
85. !date - Current date
86. !math <expression> - Simple math
87. !joke - Random joke
88. !8ball <question> - Magic 8-ball
89. !remind <time> <text> - Reminder
90. !intel <id/username> - Full panel Discord+Roblox
91-100. Utility placeholders
`;
  msg.reply({ content: helpText });
};

// ---------- PING ----------
commands.ping = async msg => msg.reply(`🏴 Ping: ${client.ws.ping}ms`);

// ---------- QUOTE ----------
commands.quote = async msg => {
  const quotes = [
    "Intelligence is power",
    "Data is modern warfare",
    "Observe before acting",
    "Knowledge wins silently"
  ];
  msg.reply(`🧠 ${quotes[Math.floor(Math.random() * quotes.length)]}`);
};

// ---------- Global Discord Info ----------
commands.userinfoglobal = async (msg, args) => {
  if (!args[0]) return msg.reply("Provide a Discord ID");

  let user;
  try {
    user = await client.users.fetch(args[0]);
  } catch {
    return msg.reply("User not found");
  }

  const embed = new EmbedBuilder()
    .setTitle("🟥 Discord Intelligence Profile")
    .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 512 }))
    .addFields([
      { name: "Username", value: user.tag, inline: true },
      { name: "User ID", value: user.id, inline: true },
      { name: "Bot?", value: user.bot ? "Yes" : "No", inline: true },
      { name: "Account Created", value: `<t:${Math.floor(user.createdTimestamp/1000)}:F>` },
      { name: "Account Age", value: `${Math.floor((Date.now()-user.createdTimestamp)/86400000)} days`, inline: true }
    ])
    .setColor("#000000")
    .setTimestamp();

  msg.reply({ embeds: [embed] });
};

// ---------- Roblox Global Placeholder ----------
commands.robloxsearch = async (msg, args) => {
  if (!args[0]) return msg.reply("Provide Roblox username to search globally");
  msg.reply(`🔎 Roblox search for ${args[0]} is currently a placeholder (real API integration coming)`);
};

// ---------- Message Handler ----------
client.on("messageCreate", async msg => {
  if (msg.author.bot || !msg.content.startsWith(PREFIX)) return;

  const args = msg.content.slice(PREFIX.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  try {
    if (commands[cmd]) await commands[cmd](msg, args);
    else msg.reply("Unknown command. Use !help");
  } catch (err) {
    console.error(err);
    msg.reply("Command execution failed");
  }
});

// ---------- Ready ----------
client.once("ready", () => console.log(`🟥 INTELLIGENCE PROPERTY ONLINE | ${client.user.tag}`));

client.login(process.env.TOKEN);
