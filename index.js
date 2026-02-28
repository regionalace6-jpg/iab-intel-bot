const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    Partials
} = require("discord.js");

const axios = require("axios");
const fs = require("fs");
const geoip = require("geoip-lite");
const moment = require("moment");

// ================= CONFIG =================

const TOKEN = process.env.BOT_TOKEN;
const OWNER_ID = "924501682619052042";
const LOG_CHANNEL_ID = "1475519152616898670";
const PREFIX = "*";

if (!TOKEN) {
    console.error("BOT_TOKEN missing");
    process.exit(1);
}

// ================= CLIENT =================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel]
});

// ================= ACCESS SYSTEM =================

const ACCESS_FILE = "./access.json";
let accessList = new Set([OWNER_ID]);

if (fs.existsSync(ACCESS_FILE)) {
    try {
        accessList = new Set(JSON.parse(fs.readFileSync(ACCESS_FILE)));
    } catch {}
}

function saveAccess() {
    fs.writeFileSync(ACCESS_FILE, JSON.stringify([...accessList]));
}

function hasAccess(id) {
    return accessList.has(id);
}

// ================= LOGGING =================

async function logAction(text) {

    if (!LOG_CHANNEL_ID) return;

    const channel = await client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
    if (!channel) return;

    const embed = new EmbedBuilder()
        .setTitle("INTELLIGENCE LOG")
        .setColor("DarkGold")
        .setDescription(text)
        .setTimestamp();

    channel.send({ embeds: [embed] }).catch(() => {});
}

// ================= READY =================

client.once("ready", () => {
    console.log(`OSINT Suite Online: ${client.user.tag}`);
});

// ================= COMMAND HANDLER =================

client.on("messageCreate", async message => {

    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // OWNER GRANT

    if (command === "grant") {

        if (message.author.id !== OWNER_ID)
            return message.reply("Owner only.");

        const user = message.mentions.users.first();
        if (!user) return message.reply("Mention user.");

        accessList.add(user.id);
        saveAccess();

        return message.reply("Access granted.");
    }

    if (!hasAccess(message.author.id))
        return message.reply("Access Denied.");

    // ================= DISCORD LOOKUP =================

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
            .setTitle("🧠 DISCORD INTELLIGENCE DOSSIER")
            .setColor("DarkRed")
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: "Username", value: user.tag, inline: true },
                { name: "User ID", value: user.id, inline: true },
                { name: "Bot", value: user.bot ? "Yes" : "No", inline: true },
                { name: "Created", value: moment(user.createdAt).format("LLLL") }
            )
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }

    // ================= ROBLOX LOOKUP =================

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
                `https://thumbnails.roblox.com/v1/users/avatar?userIds=${robloxUser.id}&size=420x420&format=Png`
            );

            const avatar = avatarRes.data.data[0].imageUrl;

            const embed = new EmbedBuilder()
                .setTitle("🎮 ROBLOX INTELLIGENCE DOSSIER")
                .setColor("DarkBlue")
                .setThumbnail(avatar)
                .addFields(
                    { name: "Username", value: infoRes.data.name, inline: true },
                    { name: "Display Name", value: infoRes.data.displayName, inline: true },
                    { name: "User ID", value: robloxUser.id.toString(), inline: true },
                    { name: "Bio", value: infoRes.data.description || "No bio" }
                )
                .setTimestamp();

            return message.reply({ embeds: [embed] });

        } catch {
            return message.reply("Roblox scan failed.");
        }
    }

    // ================= IP LOOKUP =================

    if (command === "ip") {

        if (!args[0]) return message.reply("Provide IP.");

        const geo = geoip.lookup(args[0]);

        if (!geo) return message.reply("No data found.");

        const embed = new EmbedBuilder()
            .setTitle("🌍 IP INTELLIGENCE REPORT")
            .setColor("DarkGreen")
            .addFields(
                { name: "Country", value: geo.country || "Unknown" },
                { name: "City", value: geo.city || "Unknown" },
                { name: "Region", value: geo.region || "Unknown" },
                { name: "Timezone", value: geo.timezone || "Unknown" }
            );

        return message.reply({ embeds: [embed] });
    }

    // ================= HELP =================

    if (command === "help") {

        const embed = new EmbedBuilder()
            .setTitle("INTELLIGENCE COMMANDS")
            .setColor("DarkPurple")
            .addFields(
                { name: "*dlookup", value: "Discord scan" },
                { name: "*rlookup", value: "Roblox scan" },
                { name: "*ip", value: "IP scan" },
                { name: "*grant", value: "Owner access" }
            );

        return message.reply({ embeds: [embed] });
    }

});

client.login(TOKEN);
