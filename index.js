const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const axios = require("axios");
const dns = require("dns").promises;
const fs = require("fs");
const crypto = require("crypto");

// 🔐 SECURE TOKEN (DO NOT HARD CODE TOKEN)
const TOKEN = process.env.TOKEN;

// 🔑 PUT YOUR DISCORD USER ID HERE
const OWNER_ID = "924501682619052042";

const PREFIX = "!";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

let accessList = [];

if (fs.existsSync("access.json")) {
  accessList = JSON.parse(fs.readFileSync("access.json"));
}

function saveAccess() {
  fs.writeFileSync("access.json", JSON.stringify(accessList, null, 2));
}

function hasAccess(userId) {
  return userId === OWNER_ID || accessList.includes(userId);
}

function formatDate(date) {
  const d = new Date(date);
  return {
    day: d.toDateString(),
    time: d.toLocaleTimeString()
  };
}

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (!message.content.startsWith(PREFIX) || message.author.bot) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // 🔐 ACCESS SYSTEM
  if (command === "access") {
    if (message.author.id !== OWNER_ID)
      return message.reply("Owner only command.");

    const action = args[0];
    const id = args[1];

    if (!id) return message.reply("Provide a user ID.");

    if (action === "add") {
      if (!accessList.includes(id)) {
        accessList.push(id);
        saveAccess();
        return message.reply(`Access granted to ${id}`);
      }
    }

    if (action === "remove") {
      accessList = accessList.filter(u => u !== id);
      saveAccess();
      return message.reply(`Access removed from ${id}`);
    }

    if (action === "list") {
      return message.reply(
        accessList.length
          ? `Access List:\n${accessList.join("\n")}`
          : "No users have access."
      );
    }
  }

  if (!hasAccess(message.author.id)) {
    return message.reply("You are not authorized.");
  }

  // 🟥 DISCORD USER INFO
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
      )
      .setFooter({ text: "INTELLIGENCE PROPERTY • Public Data Only" });

    return message.reply({ embeds: [embed] });
  }

  // 🟨 EMAIL DNS CHECK
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

  // 🟩 IP GEO LOOKUP
  if (command === "ip") {
    const ip = args[0];
    if (!ip) return message.reply("Provide IP.");

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
  }

  // 🟪 HASH TOOL
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
