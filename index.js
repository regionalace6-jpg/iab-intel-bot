const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const PREFIX = "!";

/*
=====================================
 COMMAND CENTER UI BUILDER
=====================================
*/

function Dossier(title, description, fields = []) {

    return new EmbedBuilder()
        .setTitle(`🟥 FBI COMMAND CENTER | ${title}`)
        .setDescription(description || "Intelligence Report")
        .addFields(fields)
        .setColor("#ff0000")
        .setTimestamp()
        .setFooter({
            text: "Federal Intelligence Bureau System"
        });
}

/*
=====================================
 COMMAND DATABASE
=====================================
*/

const commands = {};

/*
=====================================
 HELP COMMAND (COMMAND CENTER DASHBOARD)
=====================================
*/

commands.help = async (msg) => {

    const embed = Dossier(
        "Command Control Dashboard",
        "Active Intelligence Modules",
        [
            { name: "👤 User Intelligence", value: "!userinfo | !avatar" },
            { name: "🎮 Roblox Intelligence", value: "!robloxinfo" },
            { name: "🌍 OSINT Tools", value: "!iplookup" },
            { name: "🤖 System", value: "!ping | !serverinfo" }
        ]
    );

    msg.reply({ embeds: [embed] });
};

/*
=====================================
 PING
=====================================
*/

commands.ping = async (msg) => {
    msg.reply(`🟥 Command Center Latency: ${client.ws.ping}ms`);
};

/*
=====================================
 USER DOSSIER
=====================================
*/

commands.userinfo = async (msg, args) => {

    let user = msg.mentions.users.first() || msg.author;

    if (args[0]) {
        try {
            user = await client.users.fetch(args[0]);
        } catch {}
    }

    const ageDays = Math.floor(
        (Date.now() - user.createdTimestamp) / 86400000
    );

    const embed = Dossier(
        "Subject Dossier",
        "",
        [
            { name: "Subject", value: user.tag, inline: true },
            { name: "ID", value: user.id, inline: true },
            { name: "Account Age", value: `${ageDays} days`, inline: true }
        ]
    ).setThumbnail(user.displayAvatarURL({ dynamic: true }));

    msg.reply({ embeds: [embed] });
};

/*
=====================================
 ROBLOX DOSSIER
=====================================
*/

commands.robloxinfo = async (msg, args) => {

    if (!args[0])
        return msg.reply("Provide Roblox username or ID");

    try {

        let target = args[0];

        if (isNaN(target)) {

            const res = await fetch(
                "https://users.roblox.com/v1/usernames/users",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        usernames: [target]
                    })
                }
            );

            const data = await res.json();

            if (!data.data.length)
                return msg.reply("Subject not found");

            target = data.data[0].id;
        }

        const info = await fetch(
            `https://users.roblox.com/v1/users/${target}`
        ).then(r => r.json());

        const embed = Dossier(
            "Roblox Subject Profile",
            "",
            [
                { name: "Username", value: info.name || "Unknown" },
                { name: "Display", value: info.displayName || "Unknown" },
                { name: "Created", value: new Date(info.created).toDateString() }
            ]
        );

        msg.reply({ embeds: [embed] });

    } catch {
        msg.reply("Roblox intelligence failure");
    }
};

/*
=====================================
 GEO INTEL IP SCAN
=====================================
*/

commands.iplookup = async (msg, args) => {

    if (!args[0])
        return msg.reply("Provide IP");

    try {

        const data = await fetch(
            `https://ipapi.co/${args[0]}/json/`
        ).then(r => r.json());

        const embed = Dossier(
            "Geo Intelligence Scan",
            "",
            [
                { name: "City", value: data.city || "Unknown" },
                { name: "Country", value: data.country_name || "Unknown" },
                { name: "ISP", value: data.org || "Unknown" }
            ]
        );

        msg.reply({ embeds: [embed] });

    } catch {
        msg.reply("Geo scan failed");
    }
};

/*
=====================================
 MESSAGE HANDLER
=====================================
*/

client.on("messageCreate", async msg => {

    if (!msg.content.startsWith(PREFIX) || msg.author.bot) return;

    const args = msg.content.slice(PREFIX.length).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    if (commands[cmd]) {
        try {
            await commands[cmd](msg, args);
        } catch {
            msg.reply("Command execution error.");
        }
    }

});

/*
=====================================
 READY EVENT
=====================================
*/

client.once("ready", () => {
    console.log(`🟥 INTELLIGENCE COMMAND CENTER ONLINE | ${client.user.tag}`);
});

client.login(process.env.TOKEN);
