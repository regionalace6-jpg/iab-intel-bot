// index.js
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const fetch = (...args) => import("node-fetch").then(({default: fetch}) => fetch(...args));
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const PREFIX = "!";

// ================================
// Panel Builder
// ================================
function Panel(title, fields = []) {
  return new EmbedBuilder()
    .setTitle(`🟥 INTELLIGENCE PROPERTY | ${title}`)
    .addFields(fields)
    .setColor("#000000")
    .setTimestamp();
}

// ================================
// Commands
// ================================
const commands = {};

// ----------------
// HELP
// ----------------
commands.help = async msg => {
  const helpText = `
1. !userinfo - Show full Discord user info
2. !avatar - Show user avatar
3. !serverinfo - Show server info
4. !membercount - Total members in server
5. !roles - List server roles
6. !permissions - Show user permissions
7. !joineddate - Show user server join date
8. !accountage - Show Discord account age
9. !botcheck - Check if user is bot
10. !nickname - Show server nickname
11. !status - Show user online status
12. !activity - Show current activity/game
13. !toprole - Show top role of user
14. !hoistedrole - Show hoisted role
15. !avatarurl - Direct avatar URL
16. !discriminator - User discriminator (#0001)
17. !tag - Show full Discord tag
18. !joinedserver - Exact date user joined server
19. !rolescount - Number of roles a user has
20. !botstatus - Show bot status
21. !muted - Check if user is muted
22. !boosted - Check if user boosted server
23. !boosteddate - Show boost start date
24. !lastmessage - Show last message in server
25. !voicechannel - Show current voice channel

26. !robloxinfo <username/id> - Roblox user info
27. !robloxavatar <id> - Roblox avatar image
28. !robloxfriends <username/id> - Total friends
29. !robloxfollowers <username/id> - Followers count
30. !robloxfollowing <username/id> - Following count
31. !robloxgroups <username/id> - Number of groups
32. !robloxcreated <username/id> - Account creation date
33. !robloxbio <username/id> - Display user bio
34. !robloxfavgames <username/id> - Favorite games list
35. !robloxthumbnails <id> - Thumbnail image
36. !robloxfriendslist <id> - List friend names
37. !robloxfollowerslist <id> - List followers
38. !robloxfollowinglist <id> - List following
39. !robloxstatus <username/id> - Online/offline status
40. !robloxfriendscount <id> - Friends count
41. !robloxfollowerscount <id> - Followers count
42. !robloxfollowingcount <id> - Following count
43. !robloxgroupslist <id> - List groups joined
44. !robloxygrouproles <id> - Group roles info
45. !robloxpremium <id> - Premium membership status
46. !robloxusername <id> - Convert ID → username
47. !robloxsearch <username> - Global username search
48. !robloxheadshot <id> - Full headshot image
49. !robloxdisplayname <id> - Display name
50. !robloxtitle <id> - Profile title / badges

51. !iplookup <ip> - Public IP info
52. !dnslookup <domain> - DNS records
53. !whois <domain> - WHOIS info
54. !geoip <ip> - Geolocation info
55. !asn <ip> - ASN info
56. !reverseip <ip> - Reverse IP lookup
57. !subdomains <domain> - Public subdomains
58. !emails <domain> - Public emails found
59. !urlscan <url> - URL scan summary
60. !threatcheck <ip/domain> - Threat check
61. !socialsearch <username> - Public profiles by username
62. !github <username> - Public GitHub info
63. !linkedin <username> - Public LinkedIn info
64. !twitter <username> - Public Twitter info
65. !reddit <username> - Public Reddit info
66. !pwned <email> - Check if email leaked
67. !reversewhois <domain> - Domain ownership
68. !mxrecords <domain> - Mail exchange records
69. !txtrecords <domain> - TXT DNS records
70. !nsrecords <domain> - Name server records
71. !shodan <ip> - Public Shodan scan info
72. !censys <ip> - Public Censys scan info
73. !iplocation <ip> - IP city/region/country
74. !blacklist <ip/domain> - Check blacklist status
75. !osintsummary <ip/domain> - Quick OSINT summary

76. !ping - Bot latency
77. !quote - Random intelligence quote
78. !iq - Random IQ test
79. !roll <dice> - Roll dice
80. !flip - Coin flip
81. !randnum <min> <max> - Random number
82. !echo <text> - Repeat text
83. !say <text> - Bot says text
84. !time - Current UTC time
85. !date - Current date
86. !math <expression> - Simple math
87. !joke - Random joke
88. !8ball <question> - Magic 8-ball
89. !remind <time> <text> - Reminder
90. !userinfoglobal <id> - Discord info by ID anywhere
91. !avatarglobal <id> - Avatar by ID anywhere
92. !serverroles - List server roles
93. !serverboosts - Show boosts count
94. !emojiinfo <emoji> - Emoji details
95. !channelinfo <channel> - Channel info
96. !botinfo - Bot uptime & info
97. !uptime - Bot uptime
98. !help - Show this list
99. !intel <id/mention> - Full Discord + Roblox panel
100. !invite - Bot invite link
  `;
  msg.reply({ content: helpText });
};

// ================================
// Utility Commands Example
// ================================
commands.ping = async msg => msg.reply(`🏴 Ping: ${client.ws.ping}ms`);
commands.quote = async msg => {
  const quotes = ["Intelligence is power", "Data is modern warfare", "Observe before acting", "Knowledge wins silently"];
  msg.reply(`🧠 ${quotes[Math.floor(Math.random() * quotes.length)]}`);
};
commands.iq = async msg => msg.reply(`🧠 IQ: ${Math.floor(Math.random() * 100) + 1}`);

// ================================
// Global Discord User Info
// ================================
commands.userinfoglobal = async (msg, args) => {
  let user;
  if (args[0]) {
    try { user = await client.users.fetch(args[0]); } catch { return msg.reply("User not found"); }
  }
  if (!user) user = msg.author;
  const member = msg.guild?.members.cache.get(user.id);
  const embed = new EmbedBuilder()
    .setTitle("🟥 Discord Intelligence Profile")
    .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 512 }))
    .addFields([
      { name: "Username", value: user.tag, inline: true },
      { name: "User ID", value: user.id, inline: true },
      { name: "Account Created", value: `<t:${Math.floor(user.createdTimestamp/1000)}:F>` },
      { name: "Account Age", value: `${Math.floor((Date.now()-user.createdTimestamp)/86400000)} days`, inline: true },
      { name: "Server Joined", value: member ? `<t:${Math.floor(member.joinedTimestamp/1000)}:F>` : "Not in server", inline: true },
      { name: "Server Join Age", value: member ? `${Math.floor((Date.now()-member.joinedTimestamp)/86400000)} days` : "N/A", inline: true },
      { name: "Bot?", value: user.bot ? "Yes" : "No", inline: true }
    ])
    .setColor("#000000")
    .setTimestamp();
  msg.reply({ embeds: [embed] });
};

// ================================
// Message Handler
// ================================
client.on("messageCreate", async msg => {
  if (msg.author.bot || !msg.content.startsWith(PREFIX)) return;
  const args = msg.content.slice(PREFIX.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();
  try {
    if (commands[cmd]) await commands[cmd](msg, args);
    else msg.reply("Unknown command. Use !help for list.");
  } catch (err) {
    console.error(err);
    msg.reply("Command execution failed");
  }
});

// ================================
// Ready
// ================================
client.once("ready", () => console.log(`🟥 INTELLIGENCE PROPERTY ONLINE | ${client.user.tag}`));
client.login(process.env.TOKEN);
