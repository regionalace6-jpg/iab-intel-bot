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

// ================= SAFE CONFIG =================

const TOKEN = process.env.BOT_TOKEN;
const OWNER_ID = "924501682619052042";
const PREFIX = "*";
const LOG_CHANNEL_ID = "1475519152616898670";

if (!TOKEN) {
    console.error("FATAL ERROR → BOT_TOKEN not found in environment variables");
    process.exit(1);
}

// ================= SAFE CLIENT (AUTO RECOVERY) =================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers
    ],
    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.User
    ],
    rest: {
        timeout: 60000
    }
});

// ================= SAFE ACCESS SYSTEM =================

const ACCESS_FILE = "./access.json";

let accessList = new Set([OWNER_ID]);

try {
    if (fs.existsSync(ACCESS_FILE)) {
        accessList = new Set(JSON.parse(fs.readFileSync(ACCESS_FILE)));
    }
} catch {}

function saveAccess() {
    try {
        fs.writeFileSync(ACCESS_FILE, JSON.stringify([...accessList]));
    } catch {}
}

function hasAccess(id) {
    return accessList.has(id);
}

// ================= SAFE LOGGING =================

async function logAction(text) {

    if (!LOG_CHANNEL_ID) return;

    try {

        const channel = await client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setTitle("INTELLIGENCE LOG")
            .setColor("Gold")
            .setDescription(text)
            .setTimestamp();

        channel.send({ embeds: [embed] }).catch(() => {});

    } catch {}
}

// ================= BOT READY =================

client.once("ready", () => {
    console.log(`✅ Intelligence Suite Online → ${client.user.tag}`);
});

// ================= COMMAND SYSTEM =================

client.on("messageCreate", async message => {

    try {

        if (!message || !message.content) return;
        if (message.author.bot) return;
        if (!message.content.startsWith(PREFIX)) return;

        const args = message.content.slice(PREFIX.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

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
                        { name: "Bot", value: user.bot ? "Yes" : "No" },
                        { name: "Created", value: moment(user.createdAt).format("LLLL") }
                    )
                    .setTimestamp();

                return message.reply({ embeds: [embed] });

            } catch {
                return message.reply("Lookup failed.");
            }
        }

        if (command === "ip") {

            if (!args[0]) return message.reply("Provide IP.");

            try {

                const geo = geoip.lookup(args[0]);
                if (!geo) return message.reply("No data.");

                const embed = new EmbedBuilder()
                    .setTitle("🌍 IP INTELLIGENCE REPORT")
                    .setColor("Green")
                    .addFields(
                        { name: "Country", value: geo.country || "Unknown" },
                        { name: "City", value: geo.city || "Unknown" },
                        { name: "Region", value: geo.region || "Unknown" },
                        { name: "Timezone", value: geo.timezone || "Unknown" }
                    );

                return message.reply({ embeds: [embed] });

            } catch {
                return message.reply("IP scan failed.");
            }
        }

        if (command === "help") {

            const embed = new EmbedBuilder()
                .setTitle("INTELLIGENCE COMMANDS")
                .setColor("Purple")
                .addFields(
                    { name: "*dlookup", value: "Discord scan" },
                    { name: "*ip", value: "IP scan" }
                );

            return message.reply({ embeds: [embed] });
        }

    } catch (err) {
        console.log("Command Error:", err);
    }

});

// ================= AUTO RECONNECT =================

client.on("disconnect", () => {
    console.log("Disconnected → Reconnecting...");
    client.login(TOKEN).catch(() => {});
});

process.on("unhandledRejection", err => {
    console.log("Unhandled Rejection:", err);
});

process.on("uncaughtException", err => {
    console.log("Crash prevented:", err);
});

client.login(TOKEN);
