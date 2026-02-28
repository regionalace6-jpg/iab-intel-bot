const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder
} = require("discord.js");

const axios = require("axios");
const dns = require("dns").promises;
const crypto = require("crypto");

const TOKEN = process.env.TOKEN;
const OWNER_ID = "924501682619052042";

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

/* ===============================
   ACCESS CONTROL
================================= */

function hasAccess(id) {
  return id === OWNER_ID;
}

/* ===============================
   RISK SCORE
================================= */

function riskScore(flags) {
  let score = 0;
  if (flags.newAccount) score += 30;
  if (flags.noAvatar) score += 15;
  return Math.min(score, 100);
}

/* ===============================
   SLASH COMMANDS
================================= */

const commands = [
  new SlashCommandBuilder()
    .setName("discord")
    .setDescription("Discord account intelligence")
    .addUserOption(o =>
      o.setName("user").setDescription("Target user").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("roblox")
    .setDescription("Roblox intelligence")
    .addStringOption(o =>
      o.setName("username").setDescription("Username").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("ip")
    .setDescription("IP intelligence")
    .addStringOption(o =>
      o.setName("address").setDescription("IP address").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("email")
    .setDescription("Email domain intelligence")
    .addStringOption(o =>
      o.setName("address").setDescription("Email").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("domain")
    .setDescription("Domain WHOIS lookup")
    .addStringOption(o =>
      o.setName("name").setDescription("Domain").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("hash")
    .setDescription("SHA256 hash")
    .addStringOption(o =>
      o.setName("text").setDescription("Text").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("base64")
    .setDescription("Encode or decode base64")
    .addStringOption(o =>
      o.setName("mode")
        .setDescription("encode/decode")
        .setRequired(true)
        .addChoices(
          { name: "encode", value: "encode" },
          { name: "decode", value: "decode" }
        )
    )
    .addStringOption(o =>
      o.setName("text").setDescription("Text").setRequired(true)
    )
].map(c => c.toJSON());

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
   INTERACTIONS
================================= */

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (!hasAccess(interaction.user.id)) {
    return interaction.reply({
      content: "🚫 Access denied.",
      ephemeral: true
    });
  }

  await interaction.deferReply({ ephemeral: true });

  const cmd = interaction.commandName;

/* DISCORD */

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

/* ROBLOX */

  if (cmd === "roblox") {
    const username = interaction.options.getString("username");

    try {
      const res = await axios.post(
        "https://users.roblox.com/v1/usernames/users",
        { usernames: [username] }
      );

      const user = res.data.data[0];
      if (!user) return interaction.editReply("User not found.");

      return interaction.editReply(
        `Username: ${user.name}\nUser ID: ${user.id}`
      );

    } catch {
      return interaction.editReply("Roblox lookup failed.");
    }
  }

/* IP */

  if (cmd === "ip") {
    const ip = interaction.options.getString("address");

    try {
      const res = await axios.get(`http://ip-api.com/json/${ip}`);
      const d = res.data;

      return interaction.editReply(
        `Country: ${d.country}\nISP: ${d.isp}\nASN: ${d.as}`
      );

    } catch {
      return interaction.editReply("Invalid IP.");
    }
  }

/* EMAIL */

  if (cmd === "email") {
    const email = interaction.options.getString("address");
    const domain = email.split("@")[1];

    try {
      const mx = await dns.resolveMx(domain);
      return interaction.editReply(
        `Domain: ${domain}\nMX Records: ${mx.length}`
      );

    } catch {
      return interaction.editReply("Domain lookup failed.");
    }
  }

/* DOMAIN */

  if (cmd === "domain") {
    const domain = interaction.options.getString("name");

    try {
      const res = await axios.get(
        `https://api.hackertarget.com/whois/?q=${domain}`
      );

      return interaction.editReply(
        "```" + res.data.substring(0, 1900) + "```"
      );

    } catch {
      return interaction.editReply("WHOIS lookup failed.");
    }
  }

/* HASH */

  if (cmd === "hash") {
    const text = interaction.options.getString("text");
    const hash = crypto.createHash("sha256").update(text).digest("hex");
    return interaction.editReply(hash);
  }

/* BASE64 */

  if (cmd === "base64") {
    const mode = interaction.options.getString("mode");
    const text = interaction.options.getString("text");

    if (mode === "encode")
      return interaction.editReply(Buffer.from(text).toString("base64"));

    if (mode === "decode")
      return interaction.editReply(Buffer.from(text, "base64").toString("utf8"));
  }

});

client.login(TOKEN);
