require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder, Partials } = require("discord.js");
const axios = require("axios");
const dns = require("dns").promises;

process.on("unhandledRejection", (err) => {
    console.error("Unhandled Rejection:", err);
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel]
});

const PREFIX = "!";

function Panel(title, fields) {
    return new EmbedBuilder()
        .setColor("#000000")
        .setTitle(`INTELLIGENCE DASHBOARD | ${title}`)
        .addFields(fields)
        .setFooter({ text: "INTELLIGENCE SYSTEM v1.0" })
        .setTimestamp();
}

client.once("ready", () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (msg) => {
    if (!msg.content.startsWith(PREFIX) || msg.author.bot) return;

    const args = msg.content.slice(PREFIX.length).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    // ==========================
    // HELP SYSTEM
    // ==========================

    if (cmd === "help") {
        const category = args[0]?.toLowerCase();

        if (!category) {
            return msg.reply({
                embeds: [Panel("COMMAND DIRECTORY", [
                    { name: "🟦 Discord", value: "`!help discord`", inline: true },
                    { name: "🟩 Roblox", value: "`!help roblox`", inline: true },
                    { name: "🟥 OSINT", value: "`!help osint`", inline: true }
                ])]
            });
        }

        if (category === "discord") {
            return msg.reply({
                embeds: [Panel("DISCORD COMMANDS", [
                    { name: "!user <id>", value: "Global Discord user lookup" },
                    { name: "!avatar <id>", value: "Fetch user avatar" },
                    { name: "!server", value: "Server statistics" }
                ])]
            });
        }

        if (category === "roblox") {
            return msg.reply({
                embeds: [Panel("ROBLOX COMMANDS", [
                    { name: "!roblox <username/id>", value: "Full Roblox profile (avatar + badges)" }
                ])]
            });
        }

        if (category === "osint") {
            return msg.reply({
                embeds: [Panel("OSINT COMMANDS", [
                    { name: "!ip <ip>", value: "IP Geolocation" },
                    { name: "!dns <domain>", value: "DNS Records" },
                    { name: "!domain <domain>", value: "WHOIS Lookup" }
                ])]
            });
        }
    }

    // ==========================
    // DISCORD USER INTEL
    // ==========================

    if (cmd === "user") {
        const id = args[0];
        if (!id) return msg.reply("Provide a user ID.");

        try {
            const user = await client.users.fetch(id);

            const embed = Panel("DISCORD USER INTEL", [
                { name: "Username", value: user.tag },
                { name: "User ID", value: user.id },
                { name: "Created", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>` }
            ]).setThumbnail(user.displayAvatarURL({ size: 512 }));

            return msg.reply({ embeds: [embed] });

        } catch {
            return msg.reply("User not found.");
        }
    }

    // ==========================
    // DISCORD AVATAR
    // ==========================

    if (cmd === "avatar") {
        const id = args[0];
        if (!id) return msg.reply("Provide user ID.");

        try {
            const user = await client.users.fetch(id);
            return msg.reply(user.displayAvatarURL({ size: 1024 }));
        } catch {
            return msg.reply("User not found.");
        }
    }

    // ==========================
    // SERVER INFO
    // ==========================

    if (cmd === "server") {
        const embed = Panel("SERVER INTEL", [
            { name: "Server Name", value: msg.guild.name },
            { name: "Members", value: msg.guild.memberCount.toString() },
            { name: "Created", value: `<t:${Math.floor(msg.guild.createdTimestamp / 1000)}:F>` }
        ]);

        return msg.reply({ embeds: [embed] });
    }

    // ==========================
    // ROBLOX INTEL
    // ==========================

    if (cmd === "roblox") {
        const input = args[0];
        if (!input) return msg.reply("Provide username or ID.");

        try {
            let userId;

            if (isNaN(input)) {
                const res = await axios.post(
                    "https://users.roblox.com/v1/usernames/users",
                    { usernames: [input], excludeBannedUsers: false }
                );

                if (!res.data.data.length) {
                    return msg.reply("Roblox user not found.");
                }

                userId = res.data.data[0].id;
            } else {
                userId = input;
            }

            const userInfo = await axios.get(
                `https://users.roblox.com/v1/users/${userId}`
            );

            const avatar = await axios.get(
                `https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=420x420&format=Png&isCircular=false`
            );

            const badges = await axios.get(
                `https://badges.roblox.com/v1/users/${userId}/badges?limit=5`
            );

            const badgeList = badges.data.data.length
                ? badges.data.data.map(b => `• ${b.name}`).join("\n")
                : "No public badges";

            const embed = Panel("ROBLOX INTEL", [
                { name: "Username", value: userInfo.data.name, inline: true },
                { name: "User ID", value: userId.toString(), inline: true },
                { name: "Display Name", value: userInfo.data.displayName || "None" },
                { name: "Description", value: userInfo.data.description || "None" },
                { name: "Top Badges", value: badgeList }
            ]).setThumbnail(avatar.data.data?.[0]?.imageUrl || null);

            return msg.reply({ embeds: [embed] });

        } catch (err) {
            console.error(err);
            return msg.reply("Roblox lookup failed.");
        }
    }

    // ==========================
    // IP LOOKUP
    // ==========================

    if (cmd === "ip") {
        const ip = args[0];
        if (!ip) return msg.reply("Provide IP.");

        try {
            const res = await axios.get(`http://ip-api.com/json/${ip}`);
            const data = res.data;

            const embed = Panel("IP INTEL", [
                { name: "IP", value: data.query || "Unknown" },
                { name: "Country", value: data.country || "Unknown" },
                { name: "City", value: data.city || "Unknown" },
                { name: "ISP", value: data.isp || "Unknown" }
            ]);

            return msg.reply({ embeds: [embed] });

        } catch {
            return msg.reply("IP lookup failed.");
        }
    }

    // ==========================
    // DNS LOOKUP
    // ==========================

    if (cmd === "dns") {
        const domain = args[0];
        if (!domain) return msg.reply("Provide domain.");

        try {
            const records = await dns.resolve(domain);
            return msg.reply("DNS Records:\n" + records.join("\n"));
        } catch {
            return msg.reply("DNS lookup failed.");
        }
    }

    // ==========================
    // DOMAIN LOOKUP (FREE API)
    // ==========================

    if (cmd === "domain") {
        const domain = args[0];
        if (!domain) return msg.reply("Provide domain.");

        try {
            const res = await axios.get(`https://api.whois.vu/?q=${domain}`);
            const data = res.data;

            const embed = Panel("DOMAIN INTEL", [
                { name: "Domain", value: domain },
                { name: "Registrar", value: data.registrar || "Unknown" },
                { name: "Created", value: data.created || "Unknown" },
                { name: "Expires", value: data.expires || "Unknown" },
                { name: "Country", value: data.country || "Unknown" }
            ]);

            return msg.reply({ embeds: [embed] });

        } catch (err) {
            console.error(err);
            return msg.reply("Domain lookup failed.");
        }
    }

});

client.login(process.env.TOKEN);
