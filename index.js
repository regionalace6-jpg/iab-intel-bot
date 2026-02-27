const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const axios = require("axios");
const dns = require("dns").promises;
const fs = require("fs");
const crypto = require("crypto");

const TOKEN = process.env.TOKEN;
const OWNER_ID = "924501682619052042";
const PREFIX = "!";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

/* ================= ACCESS SYSTEM ================= */

let accessList = [];

if (fs.existsSync("access.json")) {
  accessList = JSON.parse(fs.readFileSync("access.json"));
}

function saveAccess() {
  fs.writeFileSync("access.json", JSON.stringify(accessList, null, 2));
}

function hasAccess(id) {
  return id === OWNER_ID || accessList.includes(id);
}

function formatDate(date) {
  const d = new Date(date);
  return {
    day: d.toDateString(),
    time: d.toLocaleTimeString()
  };
}

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

/* ================= MAIN HANDLER ================= */

client.on("messageCreate", async (message) => {
  if (!message.content.startsWith(PREFIX) || message.author.bot) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  /* ===== ACCESS CONTROL ===== */

  if (command === "access") {
    if (message.author.id !== OWNER_ID)
      return message.reply("Owner only command.");

    const action = args[0];
    const id = args[1];

    if (!action) return message.reply("Usage: !access add/remove/list <id>");

    if (action === "add") {
      if (!id) return message.reply("Provide user ID.");
      if (!accessList.includes(id)) {
        accessList.push(id);
        saveAccess();
        return message.reply(`✅ Access granted to ${id}`);
      }
    }

    if (action === "remove") {
      accessList = accessList.filter(u => u !== id);
      saveAccess();
      return message.reply(`❌ Access removed from ${id}`);
    }

    if (action === "list") {
      return message.reply(
        accessList.length
          ? `🔐 Access List:\n${accessList.join("\n")}`
          : "No users authorized."
      );
    }
  }

  if (!hasAccess(message.author.id))
    return message.reply("⛔ You are not authorized to use this bot.");

  /* ================= HELP ================= */

  if (command === "help") {
    const embed = new EmbedBuilder()
      .setColor("DarkPurple")
      .setTitle("🧠 Intelligence Bot Commands")
      .addFields(
        { name: "🔐 Access", value: "`!access add/remove/list <id>`" },
        { name: "🟥 Discord", value: "`!discorduser <@user/id>`\n`!altscan <@user>`" },
        { name: "🟦 Roblox", value: "`!rbxuser <username>`" },
        { name: "🟨 Email", value: "`!email <email>`" },
        { name: "🟩 IP", value: "`!ip <ip>`" },
        { name: "🟪 Hash", value: "`!hash <text>`" }
      )
      .setFooter({ text: "Public API Data Only • Legal OSINT" });

    return message.reply({ embeds: [embed] });
  }

  /* ================= DISCORD USER ================= */

  if (command === "discorduser") {
    const user =
      message.mentions.users.first() ||
      (await client.users.fetch(args[0]).catch(() => null));

    if (!user) return message.reply("User not found.");

    const created = formatDate(user.createdAt);

    const embed = new EmbedBuilder()
      .setColor("Red")
      .setTitle("Discord Intelligence Report")
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "Username", value: user.tag, inline: true },
        { name: "User ID", value: user.id, inline: true },
        { name: "Bot Account", value: user.bot ? "Yes" : "No", inline: true },
        { name: "Created Date", value: created.day, inline: true },
        { name: "Created Time", value: created.time, inline: true }
      );

    return message.reply({ embeds: [embed] });
  }

  /* ================= DISCORD ALT SCAN ================= */

  if (command === "altscan") {
    const user = message.mentions.users.first() || message.author;

    let score = 0;
    const ageDays = (Date.now() - user.createdAt) / (1000 * 60 * 60 * 24);

    if (ageDays < 30) score += 40;
    if (!user.avatar) score += 20;
    if (user.username.match(/\d{4,}/)) score += 20;

    let risk = "Low";
    if (score > 60) risk = "High";
    else if (score > 30) risk = "Medium";

    const embed = new EmbedBuilder()
      .setColor("Orange")
      .setTitle("Discord Alt Risk Analysis")
      .addFields(
        { name: "Account Age (days)", value: ageDays.toFixed(1), inline: true },
        { name: "Risk Score", value: `${score}/100`, inline: true },
        { name: "Risk Level", value: risk, inline: true }
      );

    return message.reply({ embeds: [embed] });
  }

  /* ================= ROBLOX USER ================= */

  if (command === "rbxuser") {
    const username = args[0];
    if (!username) return message.reply("Provide Roblox username.");

    try {
      const userRes = await axios.post(
        "https://users.roblox.com/v1/usernames/users",
        { usernames: [username], excludeBannedUsers: false }
      );

      if (!userRes.data.data.length)
        return message.reply("Roblox user not found.");

      const userId = userRes.data.data[0].id;

      const profile = await axios.get(
        `https://users.roblox.com/v1/users/${userId}`
      );

      const avatar = await axios.get(
        `https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=420x420&format=Png&isCircular=false`
      );

      const friends = await axios.get(
        `https://friends.roblox.com/v1/users/${userId}/friends/count`
      );

      const followers = await axios.get(
        `https://friends.roblox.com/v1/users/${userId}/followers/count`
      );

      const following = await axios.get(
        `https://friends.roblox.com/v1/users/${userId}/followings/count`
      );

      const groups = await axios.get(
        `https://groups.roblox.com/v2/users/${userId}/groups/roles`
      );

      const created = formatDate(profile.data.created);

      const embed = new EmbedBuilder()
        .setColor("Blue")
        .setTitle("Roblox Intelligence Report")
        .setThumbnail(avatar.data.data[0].imageUrl)
        .addFields(
          { name: "Username", value: profile.data.name, inline: true },
          { name: "Display Name", value: profile.data.displayName, inline: true },
          { name: "User ID", value: userId.toString(), inline: true },
          { name: "Banned", value: profile.data.isBanned ? "Yes" : "No", inline: true },
          { name: "Friends", value: friends.data.count.toString(), inline: true },
          { name: "Followers", value: followers.data.count.toString(), inline: true },
          { name: "Following", value: following.data.count.toString(), inline: true },
          { name: "Groups", value: groups.data.data.length.toString(), inline: true },
          { name: "Created Date", value: created.day, inline: true },
          { name: "Created Time", value: created.time, inline: true }
        );

      return message.reply({ embeds: [embed] });

    } catch {
      return message.reply("Error fetching Roblox data.");
    }
  }

  /* ================= EMAIL ================= */

  if (command === "email") {
    const email = args[0];
    if (!email) return message.reply("Provide email.");

    const domain = email.split("@")[1];
    if (!domain) return message.reply("Invalid email.");

    const mx = await dns.resolveMx(domain).catch(() => null);

    const embed = new EmbedBuilder()
      .setColor("Yellow")
      .setTitle("Email Intelligence")
      .addFields(
        { name: "Email", value: email },
        { name: "Domain", value: domain },
        {
          name: "MX Records",
          value: mx ? mx.map(m => m.exchange).join("\n") : "None Found"
        }
      );

    return message.reply({ embeds: [embed] });
  }

  /* ================= IP ================= */

  if (command === "ip") {
    const ip = args[0];
    if (!ip) return message.reply("Provide IP.");

    try {
      const res = await axios.get(`http://ip-api.com/json/${ip}`);
      const data = res.data;

      const embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("IP Intelligence")
        .addFields(
          { name: "Country", value: data.country || "N/A", inline: true },
          { name: "City", value: data.city || "N/A", inline: true },
          { name: "ISP", value: data.isp || "N/A", inline: true },
          { name: "Timezone", value: data.timezone || "N/A", inline: true }
        );

      return message.reply({ embeds: [embed] });

    } catch {
      return message.reply("Invalid IP or lookup failed.");
    }
  }

  /* ================= HASH ================= */

  if (command === "hash") {
    const text = args.join(" ");
    if (!text) return message.reply("Provide text.");

    const embed = new EmbedBuilder()
      .setColor("Purple")
      .setTitle("Hash Generator")
      .addFields(
        { name: "MD5", value: crypto.createHash("md5").update(text).digest("hex") },
        { name: "SHA256", value: crypto.createHash("sha256").update(text).digest("hex") }
      );

    return message.reply({ embeds: [embed] });
  }

});

client.login(TOKEN);
