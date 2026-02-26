const {
    Client,
    GatewayIntentBits,
    EmbedBuilder
} = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

/*
=====================================
 COMMAND PREFIX STYLE
=====================================
*/

const PREFIX = "CommandsOptic.";

/*
=====================================
 UI BUILDER
=====================================
*/

function OpticPanel(title, fields = [], desc = "") {

    return new EmbedBuilder()
        .setTitle(`🟥 COMMANDS OPTIC | ${title}`)
        .setDescription(desc)
        .addFields(fields)
        .setColor("#000000")
        .setTimestamp();
}

/*
=====================================
 COMMANDS
=====================================
*/

const commands = {};

/*
=====================================
 HELP
=====================================
*/

commands.help = async msg => {

    const helpText = `
🟥 COMMANDS OPTIC NETWORK

CommandsOptic.help
CommandsOptic.ping
CommandsOptic.userinfo <user>
CommandsOptic.robloxinfo <username/ID>
CommandsOptic.robloxavatar <ID>

🌍 OSINT
CommandsOptic.iplookup <IP>
CommandsOptic.dnslookup <domain>
CommandsOptic.domaininfo <domain>
CommandsOptic.geoip <IP>

👤 DISCORD
CommandsOptic.lookup <UserID>

🤖 FUN
CommandsOptic.quote
CommandsOptic.iq
`;

    msg.reply("```" + helpText + "```");
};

/*
=====================================
 BASIC
=====================================
*/

commands.ping = async msg => {
    msg.reply(`🏴 Latency: ${client.ws.ping}ms`);
};

commands.iq = async msg => {
    msg.reply(`🧠 IQ Score: ${Math.floor(Math.random() * 100) + 1}`);
};

commands.quote = async msg => {

    const quotes = [
        "Data is power",
        "Observe before acting",
        "Intelligence > Force",
        "Knowledge is survival"
    ];

    msg.reply("🧠 " + quotes[Math.floor(Math.random() * quotes.length)]);
};

/*
=====================================
 USER INTEL
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

    const embed = OpticPanel(
        "User Intelligence",
        [
            { name: "Username", value: user.tag, inline: true },
            { name: "User ID", value: user.id, inline: true },
            { name: "Account Age", value: age + " days", inline: true }
        ]
    );

    msg.reply({ embeds: [embed] });
};

/*
=====================================
 ROBLOX INTEL
=====================================
*/

commands.robloxinfo = async (msg, args) => {

    if (!args[0]) return msg.reply("Provide Roblox username");

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
                return msg.reply("User not found");

            target = data.data[0].id;
        }

        const info = await fetch(
            `https://users.roblox.com/v1/users/${target}`
        ).then(r => r.json());

        const embed = OpticPanel(
            "Roblox Intelligence",
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
 OSINT TOOLS
=====================================
*/

commands.iplookup = async (msg, args) => {

    if (!args[0]) return msg.reply("Provide IP");

    const data = await fetch(
        `http://ip-api.com/json/${args[0]}`
    ).then(r => r.json());

    msg.reply("```json\n" + JSON.stringify(data, null, 2) + "\n```");
};

commands.dnslookup = async (msg, args) => {

    if (!args[0]) return msg.reply("Provide domain");

    const data = await fetch(
        `https://dns.google/resolve?name=${args[0]}`
    ).then(r => r.json());

    msg.reply("```json\n" + JSON.stringify(data, null, 2) + "\n```");
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
    console.log(`🟥 COMMANDS OPTIC ONLINE | ${client.user.tag}`);
});

client.login(process.env.TOKEN);
