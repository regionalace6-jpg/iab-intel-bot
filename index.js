const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder
} = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const PREFIX = "B";

/*
=====================================
 UI BUILDER
=====================================
*/

function OPTPanel(title, desc = "", fields = []) {

    return new EmbedBuilder()
        .setTitle(`🟥 OPT INTELLIGENCE | ${title}`)
        .setDescription(desc)
        .addFields(fields)
        .setColor("#000000")
        .setTimestamp()
        .setFooter({ text: "OPT Intelligence Network" });
}

/*
=====================================
 COMMAND SYSTEM
=====================================
*/

const commands = {};

/*
=====================================
 HELP COMMAND (FULL COMMAND LIST)
=====================================
*/

commands.help = async (msg) => {

    const embed = OPTPanel(
        "Command List",
        "OPT Intelligence Bureau Commands"
    ).addFields([

        { name: "👤 User Intelligence", value: "Buserinfo | Bavatar" },

        { name: "🎮 Roblox Intelligence", value: "Brobloxinfo | Brobloxavatar" },

        { name: "🌍 OSINT Tools", value: "Biplookup | Bgeoip | Bdnslookup | Bdomaininfo" },

        { name: "🤖 Utility", value: "Bping | Biq | Bhelp" }

    ]);

    msg.reply({ embeds: [embed] });
};

/*
=====================================
 BASIC COMMANDS
=====================================
*/

commands.ping = async msg => {
    msg.reply(`🏴 OPT Latency: ${client.ws.ping}ms`);
};

commands.avatar = async msg => {

    let user = msg.mentions.users.first() || msg.author;

    msg.reply(user.displayAvatarURL({ dynamic: true, size: 512 }));
};

commands.iq = async msg => {
    msg.reply(`🧠 Intelligence Score: ${Math.floor(Math.random() * 100) + 1}`);
};

/*
=====================================
 USER INTELLIGENCE
=====================================
*/

commands.userinfo = async (msg, args) => {

    let user = msg.mentions.users.first() || msg.author;

    if (args[0]) {
        try {
            user = await client.users.fetch(args[0]);
        } catch {}
    }

    const age = Math.floor(
        (Date.now() - user.createdTimestamp) / 86400000
    );

    const embed = OPTPanel(
        "User Intelligence",
        "",
        [
            { name: "Username", value: user.tag, inline: true },
            { name: "User ID", value: user.id, inline: true },
            { name: "Account Age", value: `${age} days`, inline: true }
        ]
    );

    msg.reply({ embeds: [embed] });
};

/*
=====================================
 ROBLOX INTELLIGENCE
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
                return msg.reply("Roblox user not found");

            target = data.data[0].id;
        }

        const info = await fetch(
            `https://users.roblox.com/v1/users/${target}`
        ).then(r => r.json());

        const embed = OPTPanel(
            "Roblox Intelligence",
            "",
            [
                { name: "Username", value: info.name || "Unknown" },
                { name: "Display", value: info.displayName || "Unknown" },
                { name: "Created", value: new Date(info.created).toDateString() }
            ]
        );

        msg.reply({ embeds: [embed] });

    } catch {
        msg.reply("Roblox scan failed");
    }
};

/*
=====================================
 ROBLOX AVATAR
=====================================
*/

commands.robloxavatar = async (msg, args) => {

    if (!args[0]) return msg.reply("Provide Roblox ID");

    msg.reply(
        `https://www.roblox.com/headshot-thumbnail/image?userId=${args[0]}&width=420&height=420&format=png`
    );
};

/*
=====================================
 OSINT TOOLS
=====================================
*/

commands.iplookup = async (msg, args) => {

    if (!args[0]) return msg.reply("Provide IP");

    try {

        const data = await fetch(
            `http://ip-api.com/json/${args[0]}`
        ).then(r => r.json());

        const embed = OPTPanel(
            "Geo Intelligence",
            "",
            [
                { name: "Country", value: data.country || "Unknown" },
                { name: "City", value: data.city || "Unknown" },
                { name: "Region", value: data.regionName || "Unknown" },
                { name: "ISP", value: data.isp || "Unknown" }
            ]
        );

        msg.reply({ embeds: [embed] });

    } catch {
        msg.reply("IP scan failed");
    }
};

commands.dnslookup = async (msg, args) => {

    if (!args[0]) return msg.reply("Provide domain");

    try {

        const data = await fetch(
            `https://dns.google/resolve?name=${args[0]}`
        ).then(r => r.json());

        const records = data.Answer?.map(r => r.data).join("\n") || "No records";

        msg.reply("```\n" + records.substring(0, 1800) + "\n```");

    } catch {
        msg.reply("DNS scan failed");
    }
};

commands.domaininfo = async (msg, args) => {

    if (!args[0]) return msg.reply("Provide domain");

    const data = await fetch(
        `https://api.hackertarget.com/whois/?q=${args[0]}`
    ).then(r => r.text());

    msg.reply("```\n" + data.substring(0, 1800) + "\n```");
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
            msg.reply("Command error");
        }
    }

});

client.once("ready", () => {
    console.log(`🟥 OPT Intelligence Online | ${client.user.tag}`);
});

client.login(process.env.TOKEN);
