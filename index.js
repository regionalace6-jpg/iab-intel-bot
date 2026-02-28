const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} = require("discord.js");

const axios = require("axios");
const dns = require("dns").promises;
const whois = require("whois");
const crypto = require("crypto");

const TOKEN = process.env.TOKEN;
const OWNER_ID = "924501682619052042";
const LOG_CHANNEL_ID = "1415589072201584642";

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

/* ===============================
   CLEARANCE SYSTEM
================================= */

const clearance = {
  owner: new Set([OWNER_ID]),
  tier1: new Set(),
  tier2: new Set()
};

function getClearance(id) {
  if (clearance.owner.has(id)) return "OWNER";
  if (clearance.tier2.has(id)) return "TIER2";
  if (clearance.tier1.has(id)) return "TIER1";
  return "NONE";
}

function requireAccess(interaction, level = "TIER1") {
  const userLevel = getClearance(interaction.user.id);

  if (userLevel === "OWNER") return true;
  if (level === "TIER2" && userLevel === "TIER2") return true;
  if (level === "TIER1" && (userLevel === "TIER1" || userLevel === "TIER2")) return true;

  return false;
}

/* ===============================
   THREAT SCORING
================================= */

function riskScore(flags) {
  let score = 0;
  if (flags.newAccount) score += 30;
  if (flags.noAvatar) score += 15;
  if (flags.lowData) score += 20;
  return Math.min(score, 100);
}

/* ===============================
   SLASH COMMAND REGISTRATION
================================= */

const commands = [
  new SlashCommandBuilder()
    .setName("discord")
    .setDescription("Discord account intelligence")
    .addUserOption(o => o.setName("user").setDescription("Target user").setRequired(true)),

  new SlashCommandBuilder()
    .setName("roblox")
    .setDescription("Roblox intelligence")
    .addStringOption(o => o.setName("username").setDescription("Roblox username").setRequired(true)),

  new SlashCommandBuilder()
    .setName("ip")
    .setDescription("IP intelligence")
    .addStringOption(o => o.setName("address").setDescription("IP address").setRequired(true)),

  new SlashCommandBuilder()
    .setName("email")
    .setDescription("Email intelligence")
    .addStringOption(o => o.setName("address").setDescription("Email").setRequired(true)),

  new SlashCommandBuilder()
    .setName("domain")
    .setDescription("Domain WHOIS")
    .addStringOption(o => o.setName("name").setDescription("Domain").setRequired(true)),

  new SlashCommandBuilder()
    .setName("hash")
    .setDescription("SHA256 hash")
    .addStringOption(o => o.setName("text").setDescription("Text").setRequired(true)),

  new SlashCommandBuilder()
    .setName("base64")
    .setDescription("Encode or decode base64")
    .addStringOption(o =>
      o.setName("mode")
        .setDescription("encode or decode")
        .setRequired(true)
        .addChoices(
          { name: "encode", value: "encode" },
          { name: "decode", value: "decode" }
        )
    )
    .addStringOption(o => o.setName("text").setDescription("Text").setRequired(true))
].map(cmd => cmd.toJSON());

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(TOKEN);
  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: commands }
  );

  console.log("Slash commands registered globally.");
});

/* ===============================
   INTERACTION HANDLER
================================= */

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (!requireAccess(interaction, "TIER1")) {
    return interaction.reply({
      content: "🚫 Access denied.",
      ephemeral: true
    });
  }

  await interaction.deferReply({ ephemeral: true });

  const cmd = interaction.commandName;

/* ===============================
   DISCORD
================================= */

  if (cmd === "discord") {
    const user = interaction.options.getUser("user");
    const created = `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`;
    const ageDays = (Date.now() - user.createdTimestamp) / 86400000;

    const score = riskScore({
      newAccount: ageDays < 30,
      noAvatar: !user.avatar
    });

    const embed = new EmbedBuilder()
      .setTitle("Discord Intelligence")
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        { name: "Tag", value: user.tag },
        { name: "ID", value: user.id },
        { name: "Created", value: created },
        { name: "Risk Score", value: `${score}/100` }
      )
      .setColor("Blue");

    return interaction.editReply({ embeds: [embed] });
  }

/* ===============================
   ROBLOX
================================= */

  if (cmd === "roblox") {
    const username = interaction.options.getString("username");

    const res = await axios.post(
      "https://users.roblox.com/v1/usernames/users",
      { usernames: [username] }
    );

    const user = res.data.data[0];
    if (!user) return interaction.editReply("User not found.");

    const embed = new EmbedBuilder()
      .setTitle("Roblox Intelligence")
      .addFields(
        { name: "Username", value: user.name },
        { name: "User ID", value: user.id.toString() }
      )
      .setColor("Red");

    return interaction.editReply({ embeds: [embed] });
  }

/* ===============================
   IP
================================= */

  if (cmd === "ip") {
    const ip = interaction.options.getString("address");

    const res = await axios.get(`http://ip-api.com/json/${ip}`);
    const d = res.data;

    const embed = new EmbedBuilder()
      .setTitle("IP Intelligence")
      .addFields(
        { name: "Country", value: d.country || "N/A" },
        { name: "ISP", value: d.isp || "N/A" },
        { name: "ASN", value: d.as || "N/A" }
      )
      .setColor("Purple");

    return interaction.editReply({ embeds: [embed] });
  }

/* ===============================
   EMAIL
================================= */

  if (cmd === "email") {
    const email = interaction.options.getString("address");
    const domain = email.split("@")[1];

    const mx = await dns.resolveMx(domain);

    const embed = new EmbedBuilder()
      .setTitle("Email Intelligence")
      .addFields(
        { name: "Domain", value: domain },
        { name: "MX Records", value: mx.length.toString() }
      )
      .setColor("Orange");

    return interaction.editReply({ embeds: [embed] });
  }

/* ===============================
   DOMAIN
================================= */

  if (cmd === "domain") {
    const domain = interaction.options.getString("name");

    whois.lookup(domain, (err, data) => {
      if (err) return interaction.editReply("WHOIS failed.");

      interaction.editReply("```" + data.substring(0, 1900) + "```");
    });
  }

/* ===============================
   HASH
================================= */

  if (cmd === "hash") {
    const text = interaction.options.getString("text");
    const hash = crypto.createHash("sha256").update(text).digest("hex");
    return interaction.editReply(hash);
  }

/* ===============================
   BASE64
================================= */

  if (cmd === "base64") {
    const mode = interaction.options.getString("mode");
    const text = interaction.options.getString("text");

    if (mode === "encode")
      return interaction.editReply(Buffer.from(text).toString("base64"));

    if (mode === "decode")
      return interaction.editReply(Buffer.from(text, "base64").toString("utf8"));
  }

});

/* ===============================
   LOGIN
================================= */

client.login(TOKEN);
