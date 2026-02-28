const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    Partials
} = require("discord.js");

const axios = require("axios");
const moment = require("moment");

const fs = require("fs");

// ================= CONFIG =================

const TOKEN = process.env.BOT_TOKEN;
const OWNER_ID = "924501682619052042";
const PREFIX = "*";

const LOG_CHANNEL_ID = "1475519152616898670";

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

// ================= SAFE LOGGING =================

async function logAction(text) {

    if (!LOG_CHANNEL_ID) return;

    try {
        const channel = await client.channels.fetch(LOG_CHANNEL_ID);
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setTitle("INTELLIGENCE LOG")
            .setColor("Gold")
            .setDescription(text)
            .setTimestamp();

        channel.send({ embeds: [embed] }).catch(() => {});
    } catch {}
}

// ================= READY =================

client.once("ready", () => {
    console.log(`OSINT Suite Online → ${client.user.tag}`);
});

// ================= COMMAND HANDLER =================

client.on("messageCreate", async message => {

    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // OWNER ACCESS GRANT

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

        try {

            if (message.mentions.users.first()) {
                user = message.mentions.users.first();
            } else {
                user = await client.users.fetch(args[0]);
            }

            const embed = new EmbedBuilder()
                .setTitle("🧠 DISCORD INTELLIGENCE REPORT")
                .setColor("DarkRed")
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: "Username", value: user.tag, inline: true },
                    { name: "User ID", value: user.id, inline: true },
                    { name: "Bot", value: user.bot ? "Yes" : "No", inline: true },
                    { name: "Created", value: moment(user.createdAt).format("LLLL") }
                )
                .setTimestamp();

            await logAction(`Discord scan → ${user.tag}`);

            return message.reply({ embeds: [embed] });

        } catch {
            return message.reply("Lookup failed.");
        }
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
                .setTitle("🎮 ROBLOX INTELLIGENCE REPORT")
                .setColor("Blue")
                .setThumbnail(avatar)
                .addFields(
                    { name: "Username", value: infoRes.data.name, inline: true },
                    { name: "Display Name", value: infoRes.data.displayName, inline: true },
                    { name: "User ID", value: robloxUser.id.toString(), inline: true },
                    { name: "Bio", value: infoRes.data.description || "No bio" }
                )
                .setTimestamp();

            await logAction(`Roblox scan → ${infoRes.data.name}`);

            return message.reply({ embeds: [embed] });

        } catch {
            return message.reply("Roblox lookup failed.");
        }
    }

    // ================= HELP =================

    if (command === "help") {

        const embed = new EmbedBuilder()
            .setTitle("INTELLIGENCE COMMANDS")
            .setColor("Purple")
            .addFields(
                { name: "*dlookup", value: "Discord scan" },
                { name: "*rlookup", value: "Roblox scan" },
                { name: "*grant", value: "Owner access" }
            );

        return message.reply({ embeds: [embed] });
    }

});

client.login(TOKEN);
