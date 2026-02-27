const {
    Client,
    GatewayIntentBits,
    EmbedBuilder
} = require("discord.js");

const fetch = (...args) =>
    import("node-fetch").then(({ default: fetch }) => fetch(...args));

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ]
});

const PREFIX = "!";
const TOKEN = process.env.TOKEN;

/* ===============================
   PANEL BUILDER
=============================== */

function Panel(title, fields = [], thumbnail = null) {
    const embed = new EmbedBuilder()
        .setTitle(`🟥 INTELLIGENCE DASHBOARD | ${title}`)
        .setColor("#000000")
        .addFields(fields)
        .setTimestamp();

    if (thumbnail) embed.setThumbnail(thumbnail);
    return embed;
}

/* ===============================
   READY
=============================== */

client.once("ready", () => {
    console.log(`🟥 INTELLIGENCE DASHBOARD ONLINE | ${client.user.tag}`);
});

/* ===============================
   MESSAGE HANDLER
=============================== */

client.on("messageCreate", async (msg) => {
    if (msg.author.bot) return;
    if (!msg.content.startsWith(PREFIX)) return;

    const args = msg.content.slice(PREFIX.length).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    try {

/* ===============================
   DISCORD COMMANDS (1-10)
=============================== */

if (cmd === "user") {
    let user = msg.mentions.users.first();

    if (!user && args[0]) {
        try {
            user = await client.users.fetch(args[0]); // GLOBAL SEARCH
        } catch {
            return msg.reply("User not found.");
        }
    }

    if (!user) user = msg.author;

    const member = msg.guild.members.cache.get(user.id);

    const embed = Panel(
        "DISCORD USER INTEL",
        [
            { name: "Tag", value: user.tag, inline: true },
            { name: "ID", value: user.id, inline: true },
            { name: "Created", value: `<t:${Math.floor(user.createdTimestamp/1000)}:F>` },
            { name: "Bot?", value: user.bot ? "Yes" : "No", inline: true },
            { name: "Server Joined", value: member ? `<t:${Math.floor(member.joinedTimestamp/1000)}:F>` : "Not in this server" }
        ],
        user.displayAvatarURL({ dynamic: true, size: 512 })
    );

    return msg.reply({ embeds: [embed] });
}

if (cmd === "server") {
    const g = msg.guild;

    return msg.reply({
        embeds: [Panel("SERVER INTEL", [
            { name: "Name", value: g.name },
            { name: "Members", value: g.memberCount.toString(), inline: true },
            { name: "Roles", value: g.roles.cache.size.toString(), inline: true },
            { name: "Created", value: `<t:${Math.floor(g.createdTimestamp/1000)}:F>` }
        ])]
    });
}

if (cmd === "roles") {
    const roles = msg.guild.roles.cache
        .sort((a, b) => b.position - a.position)
        .map(r => r.name)
        .slice(0, 20)
        .join(", ");

    return msg.reply({ embeds: [Panel("ROLE HIERARCHY", [
        { name: "Top Roles", value: roles || "None" }
    ])]});
}

if (cmd === "bot") {
    return msg.reply({
        embeds: [Panel("BOT STATS", [
            { name: "Latency", value: client.ws.ping + "ms", inline: true },
            { name: "Servers", value: client.guilds.cache.size.toString(), inline: true },
            { name: "Uptime", value: Math.floor(process.uptime()) + "s" }
        ])]
    });
}

if (cmd === "avatar") {
    const user = msg.mentions.users.first() || msg.author;
    return msg.reply(user.displayAvatarURL({ size: 1024, dynamic: true }));
}

/* ===============================
   ROBLOX COMMANDS (11-20)
=============================== */

if (cmd === "roblox") {

    if (!args[0]) return msg.reply("Provide username or ID.");

    let id = args[0];

    if (isNaN(id)) {
        const res = await fetch("https://users.roblox.com/v1/usernames/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usernames: [id] })
        }).then(r => r.json());

        if (!res.data.length) return msg.reply("User not found.");
        id = res.data[0].id;
    }

    const info = await fetch(`https://users.roblox.com/v1/users/${id}`)
        .then(r => r.json());

    const avatar = `https://www.roblox.com/headshot-thumbnail/image?userId=${id}&width=420&height=420&format=png`;

    return msg.reply({
        embeds: [Panel("ROBLOX PROFILE", [
            { name: "Username", value: info.name },
            { name: "Display Name", value: info.displayName },
            { name: "Created", value: new Date(info.created).toDateString() }
        ], avatar)]
    });
}

/* ===============================
   OSINT COMMANDS (21-30)
=============================== */

if (cmd === "ip") {
    if (!args[0]) return msg.reply("Provide IP.");
    const data = await fetch(`http://ip-api.com/json/${args[0]}`).then(r => r.json());

    return msg.reply({
        embeds: [Panel("IP ANALYSIS", [
            { name: "Country", value: data.country || "N/A", inline: true },
            { name: "Region", value: data.regionName || "N/A", inline: true },
            { name: "ISP", value: data.isp || "N/A" },
            { name: "Proxy", value: data.proxy ? "Yes" : "No", inline: true },
            { name: "Hosting", value: data.hosting ? "Yes" : "No", inline: true }
        ])]
    });
}

if (cmd === "dns") {
    if (!args[0]) return msg.reply("Provide domain.");
    const data = await fetch(`https://dns.google/resolve?name=${args[0]}`)
        .then(r => r.json());

    return msg.reply("```json\n" + JSON.stringify(data.Answer || {}, null, 2) + "\n```");
}

if (cmd === "domain") {
    if (!args[0]) return msg.reply("Provide domain.");
    const data = await fetch(`https://api.hackertarget.com/whois/?q=${args[0]}`)
        .then(r => r.text());

    return msg.reply("```\n" + data.substring(0, 1800) + "\n```");
}

if (cmd === "rdap") {
    if (!args[0]) return msg.reply("Provide domain.");
    const data = await fetch(`https://rdap.org/domain/${args[0]}`)
        .then(r => r.json());

    return msg.reply("```json\n" + JSON.stringify(data, null, 2).substring(0,1800) + "\n```");
}

if (cmd === "help") {
    return msg.reply("```INTELLIGENCE DASHBOARD v3\n\nDISCORD: !user !server !roles !bot !avatar\nROBLOX: !roblox\nOSINT: !ip !dns !domain !rdap\n```");
}

    } catch (err) {
        console.error(err);
        msg.reply("Command execution failed.");
    }
});

client.login(TOKEN);
