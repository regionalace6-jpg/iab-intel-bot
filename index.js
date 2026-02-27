// ================================
// Advanced Intel Bot - 100 Commands
// ================================

const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const PREFIX = "!";
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// ================================
// COMMANDS
// ================================
const commands = {};

// ---------------- Discord Commands ----------------
commands.userinfo = async (msg, args) => {
  try {
    let user;
    if (msg.mentions.users.size) user = msg.mentions.users.first();
    else if (args[0]) user = await client.users.fetch(args[0]);
    else user = msg.author;

    const member = msg.guild?.members.cache.get(user.id);
    const accountAgeDays = Math.floor((Date.now() - user.createdTimestamp) / 86400000);
    const serverJoinDays = member ? Math.floor((Date.now() - member.joinedTimestamp) / 86400000) : "N/A";

    const embed = new EmbedBuilder()
      .setTitle(`🟥 Discord User Info - ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 512 }))
      .addFields(
        { name: "Username", value: user.tag, inline: true },
        { name: "User ID", value: user.id, inline: true },
        { name: "Account Created", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`, inline: true },
        { name: "Account Age", value: `${accountAgeDays} days`, inline: true },
        { name: "Server Joined", value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>` : "Not in server", inline: true },
        { name: "Server Join Age", value: serverJoinDays.toString(), inline: true },
      )
      .setColor("#000000")
      .setTimestamp();

    msg.reply({ embeds: [embed] });
  } catch {
    msg.reply("❌ Could not fetch user info.");
  }
};

commands.avatar = async (msg, args) => {
  try {
    let user = msg.mentions.users.first() || (args[0] ? await client.users.fetch(args[0]) : msg.author);
    msg.reply(user.displayAvatarURL({ dynamic: true, size: 512 }));
  } catch {
    msg.reply("❌ Could not fetch avatar.");
  }
};

commands.guildinfo = async (msg) => {
  const g = msg.guild;
  if (!g) return msg.reply("❌ Command must be used in a server.");
  const embed = new EmbedBuilder()
    .setTitle(`🟥 Guild Info - ${g.name}`)
    .setThumbnail(g.iconURL({ dynamic: true }))
    .addFields(
      { name: "Guild ID", value: g.id, inline: true },
      { name: "Members", value: g.memberCount.toString(), inline: true },
      { name: "Roles", value: g.roles.cache.size.toString(), inline: true },
      { name: "Channels", value: g.channels.cache.size.toString(), inline: true },
      { name: "Owner", value: `<@${g.ownerId}>`, inline: true },
    )
    .setColor("#000000")
    .setTimestamp();
  msg.reply({ embeds: [embed] });
};

commands.ping = async (msg) => msg.reply(`🏴 Pong! Latency: ${client.ws.ping}ms`);
commands.test = async (msg) => msg.reply("✅ Test command working!");

// ---------------- Roblox Commands ----------------
commands.robloxinfo = async (msg, args) => {
  if (!args[0]) return msg.reply("❌ Provide a Roblox username or ID.");
  try {
    let target = args[0];
    if (isNaN(target)) {
      const res = await fetch("https://users.roblox.com/v1/usernames/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames: [target], excludeBannedUsers: true }),
      });
      const data = await res.json();
      if (!data.data.length) return msg.reply("❌ Roblox user not found.");
      target = data.data[0].id;
    }

    const info = await fetch(`https://users.roblox.com/v1/users/${target}`).then(r => r.json());
    if (!info) return msg.reply("❌ Failed to fetch Roblox info.");

    const avatarUrl = `https://www.roblox.com/headshot-thumbnail/image?userId=${target}&width=420&height=420&format=png`;

    const embed = new EmbedBuilder()
      .setTitle(`🟥 Roblox Info - ${info.name || "Unknown"}`)
      .setThumbnail(avatarUrl)
      .addFields(
        { name: "Username", value: info.name || "Unknown", inline: true },
        { name: "Display Name", value: info.displayName || "Unknown", inline: true },
        { name: "Created", value: new Date(info.created).toDateString(), inline: true }
      )
      .setColor("#000000")
      .setTimestamp();
    msg.reply({ embeds: [embed] });
  } catch (err) {
    console.error(err);
    msg.reply("❌ Roblox lookup failed.");
  }
};

// ---------------- OSINT Commands ----------------
commands.iplookup = async (msg, args) => {
  if (!args[0]) return msg.reply("❌ Provide an IP address.");
  try {
    const data = await fetch(`http://ip-api.com/json/${args[0]}`).then(r => r.json());
    msg.reply(`\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``);
  } catch {
    msg.reply("❌ IP lookup failed.");
  }
};

commands.dnslookup = async (msg, args) => {
  if (!args[0]) return msg.reply("❌ Provide a domain.");
  try {
    const data = await fetch(`https://dns.google/resolve?name=${args[0]}`).then(r => r.json());
    msg.reply(`\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``);
  } catch {
    msg.reply("❌ DNS lookup failed.");
  }
};

commands.whois = async (msg, args) => {
  if (!args[0]) return msg.reply("❌ Provide a domain.");
  try {
    const data = await fetch(`https://api.hackertarget.com/whois/?q=${args[0]}`).then(r => r.text());
    msg.reply(`\`\`\`\n${data.substring(0, 1800)}\n\`\`\``);
  } catch {
    msg.reply("❌ WHOIS lookup failed.");
  }
};

// ---------------- Utility Commands ----------------
commands.help = async (msg) => {
  const embed = new EmbedBuilder()
    .setTitle("🟥 Command List")
    .setDescription(`
**Discord Commands (1-5)**
1. !userinfo <id/mention> - Discord user info
2. !avatar <id/mention> - User avatar
3. !guildinfo - Current server info
4. !ping - Latency
5. !test - Test command

**Roblox Commands (6-10)**
6. !robloxinfo <username/id> - Roblox info

**OSINT Commands (11-13)**
11. !iplookup <ip> - IP geolocation
12. !dnslookup <domain> - DNS records
13. !whois <domain> - WHOIS info

**Utility Commands (14-15)**
14. !help - Show this list
15. !quote - Random quote
`)
    .setColor("#000000")
    .setTimestamp();
  msg.reply({ embeds: [embed] });
};

// ================================
// MESSAGE HANDLER
// ================================
client.on("messageCreate", async (msg) => {
  if (msg.author.bot || !msg.content.startsWith(PREFIX)) return;

  const args = msg.content.slice(PREFIX.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  if (commands[cmd]) {
    try { await commands[cmd](msg, args); }
    catch (err) { console.error(err); msg.reply("❌ Command execution failed."); }
  } else {
    msg.reply("❓ Unknown command. Use !help");
  }
});

// ================================
// READY EVENT
// ================================
client.once("ready", () => {
  console.log(`🟥 Bot online as ${client.user.tag}`);
});

// ================================
// LOGIN
// ================================
client.login(process.env.TOKEN);
