// Import necessary packages and modules
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

// Use node-fetch properly
const fetch = (...args) => import("node-fetch").then(({default: fetch}) => fetch(...args));

const PREFIX = "!";

// Create Discord client with proper intents enabled
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,  // IMPORTANT: Required to read message content
  ],
});

// Command collection
const commands = {};

/* ======= COMMANDS ======= */

// Ping command - test bot responsiveness
commands.ping = async (msg) => {
  msg.reply(`🏴 Pong! Latency: ${client.ws.ping}ms`);
};

// Test command - check if commands are working
commands.test = async (msg) => {
  msg.reply("✅ Test command working!");
};

// Userinfo - global lookup by ID, mention, or defaults to author
commands.userinfo = async (msg, args) => {
  let user;
  try {
    if (msg.mentions.users.size > 0) user = msg.mentions.users.first();
    else if (args[0]) user = await client.users.fetch(args[0]);
    else user = msg.author;
  } catch {
    return msg.reply("❌ Could not find user.");
  }

  // If possible, get guild member info for join date etc.
  const member = msg.guild ? msg.guild.members.cache.get(user.id) : null;

  const accountCreated = `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`;
  const accountAgeDays = Math.floor((Date.now() - user.createdTimestamp) / 86400000);

  let serverJoined = "Not in this server";
  let serverJoinAge = "N/A";
  if (member && member.joinedTimestamp) {
    serverJoined = `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`;
    serverJoinAge = Math.floor((Date.now() - member.joinedTimestamp) / 86400000) + " days";
  }

  const embed = new EmbedBuilder()
    .setTitle(`🟥 Discord Userinfo - ${user.tag}`)
    .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 512 }))
    .addFields(
      { name: "Username", value: user.tag, inline: true },
      { name: "User ID", value: user.id, inline: true },
      { name: "Account Created", value: accountCreated, inline: true },
      { name: "Account Age", value: `${accountAgeDays} days`, inline: true },
      { name: "Server Joined", value: serverJoined, inline: true },
      { name: "Server Join Age", value: serverJoinAge, inline: true },
    )
    .setColor("#000000")
    .setTimestamp();

  msg.reply({ embeds: [embed] });
};

// Roblox info command - username or ID to profile
commands.robloxinfo = async (msg, args) => {
  if (!args[0]) return msg.reply("❌ Provide a Roblox username or ID.");

  try {
    let target = args[0];

    if (isNaN(target)) {
      // Lookup user ID by username
      const res = await fetch("https://users.roblox.com/v1/usernames/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames: [target], excludeBannedUsers: true }),
      });
      const data = await res.json();
      if (!data.data || data.data.length === 0) return msg.reply("❌ Roblox user not found.");
      target = data.data[0].id;
    }

    // Fetch user info
    const infoRes = await fetch(`https://users.roblox.com/v1/users/${target}`);
    const info = await infoRes.json();

    if (!info || info.errors) return msg.reply("❌ Roblox user info fetch failed.");

    const avatarUrl = `https://www.roblox.com/headshot-thumbnail/image?userId=${target}&width=420&height=420&format=png`;

    const embed = new EmbedBuilder()
      .setTitle(`🟥 Roblox Profile - ${info.name || "Unknown"}`)
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
    msg.reply("❌ Failed to fetch Roblox info.");
  }
};

// Help command
commands.help = async (msg) => {
  const helpList = [
    "**Discord Commands:**",
    "1. !ping - Check bot latency",
    "2. !test - Test if bot commands work",
    "3. !userinfo <id or mention> - Get Discord user info",
    "",
    "**Roblox Commands:**",
    "4. !robloxinfo <username or id> - Get Roblox user info",
    "",
    "**Utility:**",
    "5. !help - Show this help list",
  ];

  msg.reply(helpList.join("\n"));
};

/* ======= EVENT LISTENER ======= */
client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;
  if (!msg.content.startsWith(PREFIX)) return;

  const args = msg.content.slice(PREFIX.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  if (commands[cmd]) {
    try {
      await commands[cmd](msg, args);
    } catch (err) {
      console.error("Command execution error:", err);
      msg.reply("❌ Command execution failed.");
    }
  } else {
    msg.reply("❓ Unknown command. Use !help");
  }
});

/* ======= READY EVENT ======= */
client.once("ready", () => {
  console.log(`🟥 Bot online as ${client.user.tag}`);
});

/* ======= LOGIN ======= */
client.login(process.env.TOKEN);
