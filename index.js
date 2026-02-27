const Discord = require("discord.js");
const fetch = (...args) => import("node-fetch").then(({default: fetch}) => fetch());

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
    { name: "[DISCORD] Commands (1-25)", value: 
      `1. !userinfo <id/mention> - Show Discord info
2. !avatar <id/mention> - Show avatar
3. !ping - Check bot latency
4. !iq - Random IQ
5. !quote - Random intelligence quote
6. !serverinfo - Server stats
7. !roles - List server roles
8. !membercount - Server member count
9. !botinfo - Bot stats
10. !joined - Show your join date
11. !username <id> - Get username
12. !id <mention> - Get user ID
13. !tag <mention> - Get user tag
14. !botping - Ping bot ws
15. !discrules - Server rules info
16. !toprole <mention> - Top role
17. !status <mention> - Online/offline
18. !nickname <mention> - Server nickname
19. !badges <mention> - Discord badges
20. !created <mention> - Account creation
21. !banner <mention> - Banner link
22. !accent <mention> - Accent color
23. !presence <mention> - Presence info
24. !voice <mention> - Voice channel
25. !boosts - Server boosts info`
    },
    { name: "[ROBLOX] Commands (26-50)", value:
      `26. !robloxinfo <id/username> - Roblox info
27. !robloxavatar <id> - Roblox avatar
28. !robloxfriends <id> - Friends count
29. !robloxfollowers <id> - Followers
30. !robloxfollowing <id> - Following
31. !robloxgroups <id> - Roblox groups
32. !robloxstatus <id> - Online/offline
33. !robloxjoin <id> - Join date
34. !robloxdisplay <id> - Display name
35. !robloxfriendslist <id> - Friend list
36. !robloxgames <id> - Games created
37. !robloxbadges <id> - Badges
38. !robloxfavorites <id> - Favorites
39. !robloxlastonline <id> - Last online
40. !robloxpresence <id> - Presence info
41. !robloxpremium <id> - Premium status
42. !robloxrank <id> - Group ranks
43. !robloxfriendscount <id> - Friends count
44. !robloxfollowerscount <id> - Followers
45. !robloxfollowingcount <id> - Following
46. !robloxuniverse <id> - Games owned
47. !robloxtrade <id> - Trade info
48. !robloxinventory <id> - Inventory
49. !robloxmessages <id> - Messages info
50. !robloxgroupinfo <groupid> - Group info`
    },
    { name: "[OSINT] Commands (51-75)", value:
      `51. !iplookup <ip> - IP geolocation
52. !dnslookup <domain> - DNS info
53. !domaininfo <domain> - WHOIS info
54. !geoip <ip> - Country/region info
55. !asn <ip> - ASN lookup
56. !emailcheck <email> - Breach check
57. !usernamecheck <username> - Public usernames
58. !socialcheck <username> - Social media lookup
59. !pwned <email> - HIBP check
60. !reverseip <ip> - Reverse IP lookup
61. !subdomains <domain> - Subdomain info
62. !urlscan <url> - URL scan
63. !shodanip <ip> - Shodan basic info
64. !rdap <domain> - RDAP lookup
65. !iplocation <ip> - GeoIP lookup
66. !leakcheck <email> - Data leaks
67. !hunter <domain> - Email hunter
68. !breach <email> - Breached domains
69. !socialscan <username> - Public accounts
70. !osintnotes - Tips
71. !torcheck <ip> - Tor exit node
72. !vpncheck <ip> - VPN detection
73. !threat <ip> - Threat score
74. !blacklist <ip> - IP blacklist check
75. !metadata <url> - File metadata`
    },
    { name: "[UTILITY] Commands (76-100)", value:
      `76. !ping - Bot latency
77. !uptime - Bot uptime
78. !stats - Bot stats
79. !invite - Bot invite link
80. !help - Show help
81. !clear <amount> - Delete messages
82. !say <message> - Bot repeat
83. !embed <text> - Send embed
84. !poll <question> - Poll
85. !timer <seconds> - Countdown
86. !userinfo - Discord info
87. !avatar - Avatar
88. !server - Server info
89. !roleinfo <role> - Role info
90. !channelinfo <channel> - Channel info
91. !botinfo - Bot info
92. !uptimecheck - Uptime
93. !quote - Random quote
94. !random <min> <max> - Random number
95. !coinflip - Coin flip
96. !dice - Roll dice
97. !calc <expression> - Calculator
98. !remind <time> <message> - Reminder
99. !userinfoall <id> - Global user info
100. !robloxlookup <id/username> - Global Roblox info`
    }
  ]);

  msg.reply({ embeds: [embed] });
};

/*
=======================
PLACEHOLDER FOR REAL FUNCTIONALITY
=======================
*/

// Example: !userinfo
commands.userinfo = async (msg, args) => {
  let user;
  if (args[0]) {
    try { user = await client.users.fetch(args[0]); } catch { return msg.reply("User not found"); }
  } else { user = msg.author; }

  const member = msg.guild?.members.cache.get(user.id);
  const accountAgeDays = Math.floor((Date.now() - user.createdTimestamp)/86400000);
  const serverJoinDays = member ? Math.floor((Date.now() - member.joinedTimestamp)/86400000) : "N/A";

  const embed = Panel("Discord Profile", [
    { name: "Username", value: user.tag, inline: true },
    { name: "ID", value: user.id, inline: true },
    { name: "Account Created", value: `<t:${Math.floor(user.createdTimestamp/1000)}:F>`, inline: true },
    { name: "Account Age", value: accountAgeDays + " days", inline: true },
    { name: "Server Join", value: member ? `<t:${Math.floor(member.joinedTimestamp/1000)}:F>` : "Not in server", inline: true },
    { name: "Server Join Age", value: serverJoinDays + " days", inline: true },
    { name: "Avatar", value: `[Link](${user.displayAvatarURL({ dynamic: true, size: 512 })})`, inline: true }
  ]);

  msg.reply({ embeds: [embed] });
};

// Repeat for Roblox, OSINT, etc. (robloxlookup, iplookup) using real API calls
// All commands from !help must be mapped here with real functions

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
