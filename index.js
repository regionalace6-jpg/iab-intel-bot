// ===================== SETUP =====================
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const PREFIX = "!";

// ===================== COMMANDS OBJECT =====================
const commands = {};

// ===================== HELP =====================
commands.help = async (msg) => {
  const helpList = [];

  for (let i = 1; i <= 25; i++) helpList.push(`[Discord] ${i}. !discord${i}`);
  for (let i = 1; i <= 25; i++) helpList.push(`[Roblox] ${i + 25}. !roblox${i}`);
  for (let i = 1; i <= 25; i++) helpList.push(`[OSINT] ${i + 50}. !osint${i}`);
  for (let i = 1; i <= 25; i++) helpList.push(`[Utility] ${i + 75}. !utility${i}`);

  const embed = new EmbedBuilder()
    .setTitle("🟥 INTELLIGENCE PROPERTY COMMANDS")
    .setDescription(helpList.join("\n"))
    .setColor("#000000")
    .setTimestamp();

  msg.reply({ embeds: [embed] });
};

// ===================== DISCORD USERINFO =====================
commands.userinfo = async (msg, args) => {
  let user;
  if (args[0]) {
    try { user = await client.users.fetch(args[0]); } catch { user = msg.author; }
  } else {
    user = msg.mentions.users.first() || msg.author;
  }

  const member = msg.guild.members.cache.get(user.id);
  const accountAge = Math.floor((Date.now() - user.createdTimestamp) / 86400000);
  const serverJoinAge = member ? Math.floor((Date.now() - member.joinedTimestamp) / 86400000) : "N/A";

  const embed = new EmbedBuilder()
    .setTitle(`🟥 Discord Intelligence | ${user.tag}`)
    .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 512 }))
    .addFields([
      { name: "— Discord Info —", value: "────────────────", inline: false },
      { name: "Username", value: user.tag, inline: true },
      { name: "User ID", value: user.id, inline: true },
      { name: "Bot?", value: user.bot ? "Yes" : "No", inline: true },
      { name: "Account Created", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>` },
      { name: "Account Age", value: accountAge + " days", inline: true },
      { name: "Server Joined", value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>` : "N/A" },
      { name: "Server Join Age", value: serverJoinAge + " days", inline: true }
    ])
    .setColor("#000000")
    .setTimestamp();

  msg.reply({ embeds: [embed] });
};

// ===================== GLOBAL ROBLOX FETCH =====================
async function getRobloxDataGlobal(input) {
  try {
    let targetId;

    if (!isNaN(input)) {
      targetId = input;
    } else {
      const res = await fetch("https://users.roblox.com/v1/usernames/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames: [input] })
      });
      const data = await res.json();
      if (!data.data.length) return null;
      targetId = data.data[0].id;
    }

    const info = await fetch(`https://users.roblox.com/v1/users/${targetId}`).then(r => r.json());
    const avatar = `https://www.roblox.com/headshot-thumbnail/image?userId=${targetId}&width=420&height=420&format=png`;

    const friends = await fetch(`https://friends.roblox.com/v1/users/${targetId}/friends/count`).then(r => r.json());
    const followers = await fetch(`https://friends.roblox.com/v1/users/${targetId}/followers/count`).then(r => r.json());
    const following = await fetch(`https://friends.roblox.com/v1/users/${targetId}/followings/count`).then(r => r.json());
    const groups = await fetch(`https://groups.roblox.com/v2/users/${targetId}/groups/roles`).then(r => r.json());

    return {
      id: targetId,
      info,
      avatar,
      friends: friends.count,
      followers: followers.count,
      following: following.count,
      groups: groups.data.length
    };
  } catch (e) { return null; }
}

// ===================== ROBLOX INFO COMMAND =====================
commands.robloxinfo = async (msg, args) => {
  if (!args[0]) return msg.reply("Provide Roblox username or ID");
  const data = await getRobloxDataGlobal(args[0]);
  if (!data) return msg.reply("Roblox user not found");

  const embed = new EmbedBuilder()
    .setTitle(`🟥 Roblox Profile | ${data.info.name}`)
    .setThumbnail(data.avatar)
    .addFields([
      { name: "— Roblox Info —", value: "────────────────", inline: false },
      { name: "Username", value: data.info.name, inline: true },
      { name: "Display Name", value: data.info.displayName, inline: true },
      { name: "Roblox ID", value: data.id.toString(), inline: true },
      { name: "Friends", value: data.friends.toString(), inline: true },
      { name: "Followers", value: data.followers.toString(), inline: true },
      { name: "Following", value: data.following.toString(), inline: true },
      { name: "Groups", value: data.groups.toString(), inline: true },
      { name: "Created", value: new Date(data.info.created).toDateString(), inline: true }
    ])
    .setColor("#000000")
    .setTimestamp();

  msg.reply({ embeds: [embed] });
};

// ===================== INTEL COMMAND =====================
commands.intel = async (msg, args) => {
  let user;
  if (args[0]) {
    try { user = await client.users.fetch(args[0]); } catch { user = msg.author; }
  } else {
    user = msg.mentions.users.first() || msg.author;
  }

  const member = msg.guild.members.cache.get(user.id);
  const accountAge = Math.floor((Date.now() - user.createdTimestamp) / 86400000);
  const serverJoinAge = member ? Math.floor((Date.now() - member.joinedTimestamp) / 86400000) : "N/A";

  // Roblox global search using Discord username as guess
  let robloxData = await getRobloxDataGlobal(user.username.replace(/\s+/g, ""));

  const embed = new EmbedBuilder()
    .setTitle(`🟥 INTELLIGENCE DASHBOARD | ${user.tag}`)
    .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 512 }))
    .setColor("#000000")
    .addFields([
      { name: "— Discord Info —", value: "────────────────", inline: false },
      { name: "Username", value: user.tag, inline: true },
      { name: "User ID", value: user.id, inline: true },
      { name: "Bot?", value: user.bot ? "Yes" : "No", inline: true },
      { name: "Account Created", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>` },
      { name: "Account Age", value: accountAge + " days", inline: true },
      { name: "Server Joined", value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>` : "N/A" },
      { name: "Server Join Age", value: serverJoinAge + " days", inline: true },
      { name: "— Roblox Info —", value: "────────────────", inline: false },
      { name: "Username", value: robloxData ? robloxData.info.name : "N/A", inline: true },
      { name: "Display Name", value: robloxData ? robloxData.info.displayName : "N/A", inline: true },
      { name: "Roblox ID", value: robloxData ? robloxData.id.toString() : "N/A", inline: true },
      { name: "Friends", value: robloxData ? robloxData.friends.toString() : "N/A", inline: true },
      { name: "Followers", value: robloxData ? robloxData.followers.toString() : "N/A", inline: true },
      { name: "Following", value: robloxData ? robloxData.following.toString() : "N/A", inline: true },
      { name: "Groups", value: robloxData ? robloxData.groups.toString() : "N/A", inline: true },
      { name: "Created", value: robloxData ? new Date(robloxData.info.created).toDateString() : "N/A", inline: true }
    ])
    .setImage(robloxData ? robloxData.avatar : null)
    .setTimestamp();

  msg.reply({ embeds: [embed] });
};

// ===================== PLACEHOLDER 100 COMMANDS =====================
for (let i = 1; i <= 25; i++) commands[`discord${i}`] = async msg => msg.reply(`[Discord] Command ${i} executed`);
for (let i = 1; i <= 25; i++) commands[`roblox${i}`] = async msg => msg.reply(`[Roblox] Command ${i} executed`);
for (let i = 1; i <= 25; i++) commands[`osint${i}`] = async msg => msg.reply(`[OSINT] Command ${i} executed`);
for (let i = 1; i <= 25; i++) commands[`utility${i}`] = async msg => msg.reply(`[Utility] Command ${i} executed`);

// ===================== MESSAGE HANDLER =====================
client.on("messageCreate", async msg => {
  if (msg.author.bot) return;
  if (!msg.content.startsWith(PREFIX)) return;

  const args = msg.content.slice(PREFIX.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  if (commands[cmd]) {
    try { await commands[cmd](msg, args); } catch (e) { msg.reply("Command failed"); console.log(e); }
  } else msg.reply("Unknown command. Use !help");
});

// ===================== READY =====================
client.once("ready", () => {
  console.log(`🟥 INTELLIGENCE PROPERTY ONLINE | ${client.user.tag}`);
});

client.login(process.env.TOKEN);
