const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const dns = require('dns').promises;

const PREFIX = "!";
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Prevent silent crashes
process.on("unhandledRejection", (err) => {
    console.error("Unhandled Rejection:", err);
});

process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
});

client.once("ready", () => {
    console.log(`🧠 INTELLIGENCE DASHBOARD Online as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
    if (!message.content.startsWith(PREFIX) || message.author.bot) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift()?.toLowerCase();

    try {

        // ================= HELP =================
        if (command === "help") {
            const embed = new EmbedBuilder()
                .setTitle("🧠 INTELLIGENCE DASHBOARD")
                .setColor("DarkButNotBlack")
                .addFields(
                    { name: "Roblox", value: "`!rbxuser <name>` `!rbxid <id>` `!rbxavatar <id>` `!rbxbadges <id>` `!rbxfriends <id>`" },
                    { name: "Discord", value: "`!duser <id>` `!dinfo <id>` `!davatar <id>` `!dcreated <id>` `!dbanner`" },
                    { name: "IP / Domain", value: "`!iplookup <ip>` `!dnslookup <domain>` `!mxlookup <domain>` `!geoip <ip>`" },
                    { name: "Email", value: "`!emailinfo <email>` `!emaildomain <email>`" }
                );

            return message.reply({ embeds: [embed] });
        }

        // ================= ROBLOX =================

        if (command === "rbxuser") {
            if (!args[0]) return message.reply("Provide username.");

            const res = await axios.post(
                "https://users.roblox.com/v1/usernames/users",
                { usernames: [args[0]] }
            );

            if (!res.data.data.length)
                return message.reply("User not found.");

            return message.reply(`User ID: ${res.data.data[0].id}`);
        }

        if (command === "rbxid") {
            if (!args[0]) return message.reply("Provide user ID.");

            const res = await axios.get(
                `https://users.roblox.com/v1/users/${args[0]}`
            );

            return message.reply(`Username: ${res.data.name}`);
        }

        if (command === "rbxavatar") {
            if (!args[0]) return message.reply("Provide user ID.");

            const res = await axios.get(
                `https://thumbnails.roblox.com/v1/users/avatar?userIds=${args[0]}&size=420x420&format=Png`
            );

            if (!res.data.data.length)
                return message.reply("Avatar not found.");

            return message.reply(res.data.data[0].imageUrl);
        }

        if (command === "rbxbadges") {
            if (!args[0]) return message.reply("Provide user ID.");

            const res = await axios.get(
                `https://badges.roblox.com/v1/users/${args[0]}/badges?limit=5`
            );

            return message.reply(`Badges Found: ${res.data.data.length}`);
        }

        if (command === "rbxfriends") {
            if (!args[0]) return message.reply("Provide user ID.");

            const res = await axios.get(
                `https://friends.roblox.com/v1/users/${args[0]}/friends/count`
            );

            return message.reply(`Friends: ${res.data.count}`);
        }

        // ================= DISCORD =================

        if (command === "duser") {
            if (!args[0]) return message.reply("Provide Discord ID.");

            const user = await client.users.fetch(args[0]).catch(() => null);
            if (!user) return message.reply("User not found.");

            return message.reply(`Username: ${user.tag}`);
        }

        if (command === "dinfo") {
            if (!args[0]) return message.reply("Provide Discord ID.");

            const user = await client.users.fetch(args[0]).catch(() => null);
            if (!user) return message.reply("User not found.");

            return message.reply(`Created: ${user.createdAt}`);
        }

        if (command === "davatar") {
            if (!args[0]) return message.reply("Provide Discord ID.");

            const user = await client.users.fetch(args[0]).catch(() => null);
            if (!user) return message.reply("User not found.");

            return message.reply(user.displayAvatarURL({ dynamic: true }));
        }

        if (command === "dcreated") {
            if (!args[0]) return message.reply("Provide Discord ID.");

            const user = await client.users.fetch(args[0]).catch(() => null);
            if (!user) return message.reply("User not found.");

            return message.reply(
                `Account Created: ${user.createdAt.toDateString()}`
            );
        }

        if (command === "dbanner") {
            return message.reply("Enable privileged intents to access banners.");
        }

        // ================= IP / DOMAIN =================

        if (command === "iplookup" || command === "geoip") {
            if (!args[0]) return message.reply("Provide IP address.");

            const res = await axios.get(
                `http://ip-api.com/json/${args[0]}`
            );

            if (res.data.status !== "success")
                return message.reply("Invalid IP address.");

            return message.reply(
                `Country: ${res.data.country}\nCity: ${res.data.city}\nISP: ${res.data.isp}`
            );
        }

        if (command === "dnslookup") {
            if (!args[0]) return message.reply("Provide domain.");

            const result = await dns.lookup(args[0]);
            return message.reply(`IP Address: ${result.address}`);
        }

        if (command === "mxlookup") {
            if (!args[0]) return message.reply("Provide domain.");

            const records = await dns.resolveMx(args[0]);

            if (!records.length)
                return message.reply("No MX records found.");

            const formatted = records
                .map(r => `Priority: ${r.priority} | ${r.exchange}`)
                .join("\n");

            return message.reply(`MX Records:\n${formatted}`);
        }

        // ================= EMAIL =================

        if (command === "emailinfo") {
            if (!args[0] || !args[0].includes("@"))
                return message.reply("Provide valid email.");

            const domain = args[0].split("@")[1];
            return message.reply(`Domain: ${domain}`);
        }

        if (command === "emaildomain") {
            if (!args[0] || !args[0].includes("@"))
                return message.reply("Provide valid email.");

            return message.reply(args[0].split("@")[1]);
        }

    } catch (err) {
        console.error("Command Error:", err);
        return message.reply("Command failed. Check input.");
    }
});

client.login(process.env.TOKEN);
