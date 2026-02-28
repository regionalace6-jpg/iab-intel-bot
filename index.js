const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    Partials
} = require("discord.js");
const axios = require("axios");
const fs = require("fs");
const whois = require("whois-json");

// ==========================
// CONFIG
// ==========================

const TOKEN = process.env.BOT_TOKEN; // SET IN HOSTING PANEL
const OWNER_ID = "924501682619052042";
const LOG_CHANNEL_ID = "1475519152616898670";

if (!TOKEN) {
    console.error("BOT_TOKEN environment variable is missing.");
    process.exit(1);
}

const PREFIX = "*";

// ==========================
// CLIENT SETUP
// ==========================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel]
});

// ==========================
// PERSISTENT ACCESS STORAGE
// ==========================

const ACCESS_FILE = "./access.json";
let accessList = new Set([OWNER_ID]);

if (fs.existsSync(ACCESS_FILE)) {
    const data = JSON.parse(fs.readFileSync(ACCESS_FILE));
    accessList = new Set(data);
}

function saveAccess() {
    fs.writeFileSync(ACCESS_FILE, JSON.stringify([...accessList]));
}

function hasAccess(id) {
    return accessList.has(id);
}

// ==========================
// LOGGING SYSTEM
// ==========================

async function logAction(text) {
    if (!LOG_CHANNEL_ID) return;

    const channel = await client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
    if (!channel) return;

    const embed = new EmbedBuilder()
        .setTitle("INTELLIGENCE AUDIT LOG")
        .setColor("DarkGold")
        .setDescription(text)
        .setTimestamp();

    channel.send({ embeds: [embed] }).catch(() => {});
}

// ==========================
// READY
// ==========================

client.once("ready", () => {
    console.log(`OSINT Suite Online: ${client.user.tag}`);
});

// ==========================
// COMMAND HANDLER
// ==========================

client.on("messageCreate", async (message) => {

    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // OWNER COMMANDS
    if (command === "grant") {
        if (message.author.id !== OWNER_ID)
            return message.reply("Owner only.");

        const user = message.mentions.users.first();
        if (!user) return message.reply("Mention user.");

        accessList.add(user.id);
        saveAccess();

        await logAction(`Access GRANTED to ${user.tag}`);
        return message.reply(`Access granted to ${user.tag}`);
    }

    if (command === "revoke") {
        if (message.author.id !== OWNER_ID)
            return message.reply("Owner only.");

        const user = message.mentions.users.first();
        if (!user) return message.reply("Mention user.");

        accessList.delete(user.id);
        saveAccess();

        await logAction(`Access REVOKED from ${user.tag}`);
        return message.reply(`Access revoked from ${user.tag}`);
    }

    // ACCESS CHECK
    if (!hasAccess(message.author.id)) {
        await logAction(`Unauthorized attempt by ${message.author.tag}`);
        return message.reply("Access Denied.");
    }

    // =====================
    // DISCORD LOOKUP
    // =====================

    if (command === "dlookup") {

        let user;

        if (message.mentions.users.first()) {
            user = message.mentions.users.first();
        } else {
            try {
                user = await client.users.fetch(args[0]);
            } catch {
                return message.reply("Invalid ID.");
            }
        }

        const embed = new EmbedBuilder()
            .setTitle("DISCORD INTELLIGENCE REPORT")
            .setColor("DarkRed")
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: "Username", value: user.tag, inline: true },
                { name: "User ID", value: user.id, inline: true },
                { name: "Bot", value: user.bot ? "Yes" : "No", inline: true },
                { name: "Created", value: `<t:${parseInt(user.createdTimestamp / 1000)}:R>` }
            )
            .setTimestamp();

        await logAction(`Discord lookup: ${user.tag}`);
        return message.reply({ embeds: [embed] });
    }

    // =====================
    // ROBLOX LOOKUP
    // =====================

    if (command === "rlookup") {

        if (!args[0]) return message.reply("Provide username.");

        try {
            const userRes = await axios.post(
                "https://users.roblox.com/v1/usernames/users",
                { usernames: [args[0]] }
            );

            const robloxUser = userRes.data.data[0];
            if (!robloxUser) return message.reply("User not found.");

            const infoRes = await axios.get(
                `https://users.roblox.com/v1/users/${robloxUser.id}`
            );

            const avatarRes = await axios.get(
                `https://thumbnails.roblox.com/v1/users/avatar?userIds=${robloxUser.id}&size=420x420&format=Png&isCircular=false`
            );

            const avatar = avatarRes.data.data[0].imageUrl;

            const embed = new EmbedBuilder()
                .setTitle("ROBLOX INTELLIGENCE REPORT")
                .setColor("DarkBlue")
                .setThumbnail(avatar)
                .addFields(
                    { name: "Username", value: infoRes.data.name, inline: true },
                    { name: "Display Name", value: infoRes.data.displayName, inline: true },
                    { name: "User ID", value: robloxUser.id.toString(), inline: true },
                    { name: "Bio", value: infoRes.data.description || "No bio." }
                )
                .setTimestamp();

            await logAction(`Roblox lookup: ${infoRes.data.name}`);
            return message.reply({ embeds: [embed] });

        } catch {
            return message.reply("Lookup failed.");
        }
    }

    // =====================
    // WHOIS
    // =====================

    if (command === "whois") {

        if (!args[0]) return message.reply("Provide domain.");

        try {
            const result = await whois(args[0]);

            const embed = new EmbedBuilder()
                .setTitle("DOMAIN INTELLIGENCE REPORT")
                .setColor("DarkGreen")
                .addFields(
                    { name: "Domain", value: args[0] },
                    { name: "Registrar", value: result.registrar || "Unknown" },
                    { name: "Creation Date", value: result.creationDate || "Unknown" },
                    { name: "Expiry Date", value: result.registryExpiryDate || "Unknown" }
                )
                .setTimestamp();

            await logAction(`WHOIS lookup: ${args[0]}`);
            return message.reply({ embeds: [embed] });

        } catch {
            return message.reply("WHOIS failed.");
        }
    }

    // HELP
    if (command === "help") {
        const embed = new EmbedBuilder()
            .setTitle("ELITE INTELLIGENCE PANEL")
            .setColor("DarkPurple")
            .addFields(
                { name: "*dlookup <id/@>", value: "Discord scan" },
                { name: "*rlookup <username>", value: "Roblox scan" },
                { name: "*whois <domain>", value: "Domain lookup" },
                { name: "*grant @user", value: "Grant access (Owner)" },
                { name: "*revoke @user", value: "Revoke access (Owner)" }
            )
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }

});

client.login(TOKEN);
