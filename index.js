require("dotenv").config();
const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    Partials 
} = require("discord.js");

const axios = require("axios");
const dns = require("dns").promises;
const whois = require("whois-json");

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
        .setColor("#0a0a0a")
        .setTitle(`INTELLIGENCE DASHBOARD | ${title}`)
        .addFields(fields)
        .setFooter({ text: "INTELLIGENCE SYSTEM v1.0" })
        .setTimestamp();
}

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
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
                    { name: "🟥 OSINT", value: "`!help osint`", inline: true },
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
    // DISCORD GLOBAL USER LOOKUP
    // ==========================

    if (cmd === "user") {
        const id = args[0];
        if (!id) return msg.reply("Provide a user ID.");

        try {
            const user = await client.users.fetch(id);

            const embed = Panel("DISCORD USER INTEL", [
                { name: "Username", value: `${user.tag}` },
                { name: "User ID", value: user.id },
                { name: "Account Created", value: `<t:${Math.floor(user.createdTimestamp/1000)}:F>` }
            ]).setThumbnail(user.displayAvatarURL({ size: 512 }));

            msg.reply({ embeds: [embed] });

        } catch {
            msg.reply("User not found.");
        }
    }

    // ==========================
    // ROBLOX INTEL
    // ==========================

    if (cmd === "roblox") {
        const input = args[0];
        if (!input) return msg.reply("Provide username or ID.");

        try {
            let userId = input;

            if (isNaN(input)) {
                const res = await axios.post(
                    "https://users.roblox.com/v1/usernames/users",
                    { usernames: [input] }
                );
                userId = res.data.data[0].id;
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
                { name: "Display Name", value: userInfo.data.displayName },
                { name: "Description", value: userInfo.data.description || "None" },
                { name: "Top Badges", value: badgeList }
            ])
                .setThumbnail(avatar.data.data[0].imageUrl);

            msg.reply({ embeds: [embed] });

        } catch {
            msg.reply("Roblox user not found.");
        }
    }

    // ==========================
    // IP LOOKUP (Free API)
    // ==========================

    if (cmd === "ip") {
        const ip = args[0];
        if (!ip) return msg.reply("Provide IP.");

        try {
            const res = await axios.get(`http://ip-api.com/json/${ip}`);
            const data = res.data;

            const embed = Panel("IP INTEL", [
                { name: "IP", value: data.query },
                { name: "Country", value: data.country },
                { name: "City", value: data.city },
                { name: "ISP", value: data.isp }
            ]);

            msg.reply({ embeds: [embed] });
        } catch {
            msg.reply("IP lookup failed.");
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
            msg.reply(`DNS Records:\n${records.join("\n")}`);
        } catch {
            msg.reply("DNS lookup failed.");
        }
    }

    // ==========================
    // DOMAIN WHOIS
    // ==========================

    if (cmd === "domain") {
        const domain = args[0];
        if (!domain) return msg.reply("Provide domain.");

        try {
            const data = await whois(domain);

            const embed = Panel("WHOIS INTEL", [
                { name: "Domain", value: domain },
                { name: "Registrar", value: data.registrar || "Unknown" },
                { name: "Created", value: data.creationDate || "Unknown" },
                { name: "Expires", value: data.registrarRegistrationExpirationDate || "Unknown" }
            ]);

            msg.reply({ embeds: [embed] });

        } catch {
            msg.reply("WHOIS failed.");
        }
    }

});

client.login(process.env.TOKEN);
