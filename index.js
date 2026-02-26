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

const PREFIX = "*";

/*
=====================================
 PANEL BUILDER
=====================================
*/

function Panel(title, fields = []) {

    return new EmbedBuilder()
        .setTitle(`🟥 INTELLIGENCE PROPERTY | ${title}`)
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
🟥 INTELLIGENCE PROPERTY COMMANDS

USER
*userinfo <id>
*avatar

ROBLOX
*robloxinfo <username or id>
*robloxavatar <id>

OSINT
*iplookup <ip>
*dnslookup <domain>
*domaininfo <domain>

UTILITY
*ping
*iq
*quote
`;

    msg.reply("```" + helpText + "```");
};

/*
=====================================
 BASIC
=====================================
*/

commands.ping = async msg => {
    msg.reply(`🏴 Ping: ${client.ws.ping}ms`);
};

commands.iq = async msg => {
    msg.reply(`🧠 IQ: ${Math.floor(Math.random() * 100) + 1}`);
};

commands.quote = async msg => {

    const quotes = [
        "Intelligence is power",
        "Data is modern warfare",
        "Observe before acting",
        "Knowledge wins silently"
    ];

    msg.reply("🧠 " + quotes[Math.floor(Math.random() * quotes.length)]);
};

/*
=====================================
 DISCORD INTEL
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

    const embed = new EmbedBuilder()
        .setTitle("🟥 Discord Intelligence Profile")
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .addFields([
            { name: "Username", value: user.tag },
            { name: "User ID", value: user.id },
            { name: "Account Age", value: age + " days" }
        ])
        .setColor("#000000");

    msg.reply({ embeds: [embed] });
};

commands.avatar = async msg => {

    let user = msg.mentions.users.first() || msg.author;

    msg.reply(user.displayAvatarURL({ size: 512 }));
};

/*
=====================================
 ROBLOX INTEL
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
                return msg.reply("User not found");

            target = data.data[0].id;
        }

        const info = await fetch(
            `https://users.roblox.com/v1/users/${target}`
        ).then(r => r.json());

        const avatar = `https://www.roblox.com/headshot-thumbnail/image?userId=${target}&width=420&height=420&format=png`;

        const embed = new EmbedBuilder()
            .setTitle("🟥 Roblox Intelligence Profile")
            .setThumbnail(avatar)
            .addFields([
                { name: "Username", value: info.name || "Unknown" },
                { name: "Display Name", value: info.displayName || "Unknown" },
                { name: "Created", value: new Date(info.created).toDateString() }
            ])
            .setColor("#000000");

        msg.reply({ embeds: [embed] });

    } catch {
        msg.reply("Roblox scan failed");
    }
};

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

    if (msg.author.bot) return;
    if (!msg.content.startsWith(PREFIX)) return;

    const args = msg.content.slice(PREFIX.length).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    try {

        if (commands[cmd]) {
            await commands[cmd](msg, args);
        } else {
            msg.reply("Unknown Intelligence Command");
        }

    } catch (err) {
        console.error(err);
        msg.reply("Command execution failed");
    }

});

/*
=====================================
 READY
=====================================
*/

client.once("ready", () => {
    console.log(`🟥 INTELLIGENCE PROPERTY ONLINE | ${client.user.tag}`);
});

client.login(process.env.TOKEN);
