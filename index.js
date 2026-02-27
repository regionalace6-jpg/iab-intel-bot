import Discord from "discord.js";
const { Client, GatewayIntentBits, EmbedBuilder } = Discord;
const fetch = (...args) => import("node-fetch").then(({default: fetch}) => fetch());

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
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
    { name: "[DISCORD] 1-25", value:
`1. !userinfo <id/mention>
2. !avatar <id/mention>
3. !ping
4. !iq
5. !quote
6. !serverinfo
7. !roles
8. !membercount
9. !botinfo
10. !joined <id/mention>
11. !username <id/mention>
12. !id <id/mention>
13. !tag <id/mention>
14. !botping
15. !discrules
16. !toprole <id/mention>
17. !status <id/mention>
18. !nickname <id/mention>
19. !badges <id/mention>
20. !created <id/mention>
21. !banner <id/mention>
22. !accent <id/mention>
23. !presence <id/mention>
24. !voice <id/mention>
25. !boosts` },
    { name: "[ROBLOX] 26-50", value:
`26. !robloxinfo <id/username>
27. !robloxavatar <id>
28. !robloxfriends <id>
29. !robloxfollowers <id>
30. !robloxfollowing <id>
31. !robloxgroups <id>
32. !robloxstatus <id>
33. !robloxjoin <id>
34. !robloxdisplay <id>
35. !robloxfriendslist <id>
36. !robloxgames <id>
37. !robloxbadges <id>
38. !robloxfavorites <id>
39. !robloxlastonline <id>
40. !robloxpresence <id>
41. !robloxpremium <id>
42. !robloxrank <id>
43. !robloxfriendscount <id>
44. !robloxfollowerscount <id>
45. !robloxfollowingcount <id>
46. !robloxuniverse <id>
47. !robloxtrade <id>
48. !robloxinventory <id>
49. !robloxmessages <id>
50. !robloxgroupinfo <groupid>` },
    { name: "[OSINT] 51-75", value:
`51. !iplookup <ip>
52. !dnslookup <domain>
53. !domaininfo <domain>
54. !geoip <ip>
55. !asn <ip>
56. !emailcheck <email>
57. !usernamecheck <username>
58. !socialcheck <username>
59. !pwned <email>
60. !reverseip <ip>
61. !subdomains <domain>
62. !urlscan <url>
63. !shodanip <ip>
64. !rdap <domain>
65. !iplocation <ip>
66. !leakcheck <email>
67. !hunter <domain>
68. !breach <email>
69. !socialscan <username>
70. !osintnotes
71. !torcheck <ip>
72. !vpncheck <ip>
73. !threat <ip>
74. !blacklist <ip>
75. !metadata <url>` },
    { name: "[UTILITY] 76-100", value:
`76. !ping
77. !uptime
78. !stats
79. !invite
80. !help
81. !clear <amount>
82. !say <message>
83. !embed <text>
84. !poll <question>
85. !timer <seconds>
86. !userinfoall <id>
87. !avatarall <id>
88. !server <id>
89. !roleinfo <role>
90. !channelinfo <channel>
91. !botinfo
92. !uptimecheck
93. !quote
94. !random <min> <max>
95. !coinflip
96. !dice
97. !calc <expression>
98. !remind <time> <message>
99. !discordroblox <id>
100. !robloxlookup <id/username>` }
  ]);
  msg.reply({ embeds: [embed] });
};

/*
=======================
EXAMPLE FUNCTIONAL COMMANDS
=======================
*/

// !userinfo
commands.userinfo = async (msg, args) => {
  let user;
  if (args[0]) {
    try { user = await client.users.fetch(args[0]); } catch { return msg.reply("User not found"); }
  } else { user = msg.author; }

  const member = msg.guild?.members.cache.get(user.id);
  const accountAge = Math.floor((Date.now() - user.createdTimestamp)/86400000);
  const serverJoin = member ? Math.floor((Date.now() - member.joinedTimestamp)/86400000) : "N/A";

  const embed = Panel("Discord Profile", [
    { name: "Username", value: user.tag, inline: true },
    { name: "ID", value: user.id, inline: true },
    { name: "Account Created", value: `<t:${Math.floor(user.createdTimestamp/1000)}:F>`, inline: true },
    { name: "Account Age", value: `${accountAge} days`, inline: true },
    { name: "Server Join", value: member ? `<t:${Math.floor(member.joinedTimestamp/1000)}:F>` : "Not in server", inline: true },
    { name: "Server Join Age", value: serverJoin + " days", inline: true },
    { name: "Avatar", value: `[Link](${user.displayAvatarURL({ dynamic:true, size:512 })})`, inline: true }
  ]);
  msg.reply({ embeds: [embed] });
};

// !robloxlookup (global)
commands.robloxlookup = async (msg, args) => {
  if (!args[0]) return msg.reply("Provide Roblox username or ID");
  try {
    let target = args[0];
    if (isNaN(target)) {
      const res = await fetch("https://users.roblox.com/v1/usernames/users", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ usernames: [target], excludeBannedUsers:true })
      }).then(r => r.json());
      if (!res.data.length) return msg.reply("User not found");
      target = res.data[0].id;
    }
    const info = await fetch(`https://users.roblox.com/v1/users/${target}`).then(r => r.json());
    const avatar = `https://www.roblox.com/headshot-thumbnail/image?userId=${target}&width=420&height=420&format=png`;

    const embed = Panel("Roblox Profile", [
      { name: "Username", value: info.name || "Unknown", inline:true },
      { name: "Display Name", value: info.displayName || "Unknown", inline:true },
      { name: "ID", value: info.id.toString(), inline:true },
      { name: "Created", value: new Date(info.created).toDateString(), inline:true },
      { name: "Avatar", value: `[Link](${avatar})`, inline:true }
    ]);
    msg.reply({ embeds: [embed] });
  } catch { msg.reply("Roblox lookup failed"); }
};

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
  } catch(err) { console.error(err); msg.reply("Command execution failed"); }
});

client.once("ready", () => console.log(`🟥 INTELLIGENCE PROPERTY ONLINE | ${client.user.tag}`));
client.login(process.env.TOKEN);
