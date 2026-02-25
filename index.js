const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const axios = require("axios");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

/* ================= GLOBAL ANTI CRASH ================= */

process.on("unhandledRejection", err => {
  console.error("Unhandled Rejection:", err);
});

process.on("uncaughtException", err => {
  console.error("Uncaught Exception:", err);
});

/* ================= BOT READY ================= */

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

/* ================= ROBLOX INTEL FUNCTION ================= */

async function fetchRobloxUser(input) {
  let userId;

  if (!isNaN(input)) {
    userId = input;
  } else {
    const res = await axios.post(
      "https://users.roblox.com/v1/usernames/users",
      {
        usernames: [input],
        excludeBannedUsers: false
      }
    );

    if (!res.data.data[0]) throw new Error("User not found");

    userId = res.data.data[0].id;
  }

  const info = (await axios.get(
    `https://users.roblox.com/v1/users/${userId}`
  )).data;

  const friends = (await axios.get(
    `https://friends.roblox.com/v1/users/${userId}/friends/count`
  )).data.count;

  const followers = (await axios.get(
    `https://friends.roblox.com/v1/users/${userId}/followers/count`
  )).data.count;

  const following = (await axios.get(
    `https://friends.roblox.com/v1/users/${userId}/followings/count`
  )).data.count;

  const groups = (await axios.get(
    `https://groups.roblox.com/v2/users/${userId}/groups/roles`
  )).data.data;

  const avatar = (await axios.get(
    `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`
  )).data.data[0].imageUrl;

  return {
    info,
    friends,
    followers,
    following,
    groups,
    avatar
  };
}

/* ================= COMMANDS ================= */

client.on("messageCreate", async message => {
  if (message.author.bot) return;

  const args = message.content.split(" ");

  /* ===== ROBLOX GOD INTEL REPORT ===== */

  if (args[0] === "!rinfo") {
    const input = args[1];
    if (!input) return message.reply("Provide Roblox username or ID.");

    try {
      const data = await fetchRobloxUser(input);

      const createdDate = new Date(data.info.created);
      const ageDays = Math.floor(
        (Date.now() - createdDate) / (1000 * 60 * 60 * 24)
      );

      let riskScore = 0;

      if (ageDays < 30) riskScore += 40;
      if (data.friends < 15) riskScore += 20;
      if (!data.info.description) riskScore += 10;

      let riskText =
        riskScore > 60
          ? "🔴 HIGH RISK / Possible Alt Account"
          : riskScore > 35
          ? "🟠 Medium Risk"
          : "🟢 Low Risk";

      const groupList =
        data.groups.length > 0
          ? data.groups
              .slice(0, 10)
              .map(g => `• ${g.group.name} | ${g.role.name}`)
              .join("\n")
          : "No Groups Found";

      const embed = new EmbedBuilder()
        .setTitle("👑 IAB GOD TIER INTELLIGENCE REPORT")
        .setThumbnail(data.avatar)
        .setColor("DarkRed")
        .addFields(
          { name: "Username", value: data.info.name, inline: true },
          { name: "Display Name", value: data.info.displayName, inline: true },
          { name: "User ID", value: data.info.id.toString(), inline: true },

          { name: "Account Created", value: createdDate.toDateString(), inline: true },
          { name: "Account Age", value: `${ageDays} Days`, inline: true },

          { name: "Friends", value: data.friends.toString(), inline: true },
          { name: "Followers", value: data.followers.toString(), inline: true },
          { name: "Following", value: data.following.toString(), inline: true },

          { name: "Risk Analysis", value: riskText, inline: false },
          { name: "Groups", value: groupList, inline: false }
        );

      message.reply({ embeds: [embed] });

    } catch (err) {
      console.error(err);
      message.reply("❌ Intelligence scan failed.");
    }
  }

  /* ===== DISCORD INTEL ===== */

  if (args[0] === "!dinfo") {
    const member =
      message.mentions.members.first() ||
      message.guild.members.cache.get(args[1]);

    if (!member) return message.reply("Mention user or provide ID.");

    const embed = new EmbedBuilder()
      .setTitle("🔵 Discord Intelligence Report")
      .setThumbnail(member.user.displayAvatarURL())
      .setColor("Blue")
      .addFields(
        { name: "Username", value: member.user.tag, inline: true },
        { name: "User ID", value: member.user.id, inline: true },
        {
          name: "Account Created",
          value: member.user.createdAt.toDateString()
        },
        {
          name: "Server Joined",
          value: member.joinedAt?.toDateString() || "Unknown"
        },
        {
          name: "Bot Account",
          value: member.user.bot ? "Yes" : "No"
        }
      );

    message.reply({ embeds: [embed] });
  }
});

/* ================= LOGIN ================= */

client.login(process.env.TOKEN);
