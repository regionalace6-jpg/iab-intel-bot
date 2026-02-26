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
 INTELLIGENCE PROPERTY UI
=====================================
*/

function IntelPanel(title, fields = [], desc = "") {

    return new EmbedBuilder()
        .setTitle(`🟥 INTELLIGENCE PROPERTY | ${title}`)
        .setDescription(desc)
        .addFields(fields)
        .setColor("#000000")
        .setTimestamp();
}

/*
=====================================
 COMMAND DATABASE
=====================================
*/

const commands = {};

/*
=====================================
 HELP COMMAND
=====================================
*/

commands.help = async msg => {

    const helpText = `
🟥 INTELLIGENCE PROPERTY COMMANDS

USER
*userinfo <userID>
*avatar

ROBLOX
*robloxinfo <username>
*robloxavatar <ID>

OSINT
*iplookup <IP>
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
    msg.reply(`🏴 Intelligence Ping: ${client.ws.ping}ms`);
};

commands.iq = async msg => {
    msg.reply(`🧠 Intelligence Score: ${Math.floor(Math.random() * 100) + 1}`);
};

commands.quote = async msg => {

    const quotes = [
        "Intelligence is power",
        "Observe before acting",
        "Data wins wars",
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

    const embed = IntelPanel(
        "User Intelligence",
        [
            { name: "Username", value: user.tag },
            { name: "User ID", value: user.id },
            { name: "Account Age", value: age + " days" }
        ]
    );

    msg.reply({ embeds: [embed] });
};

commands.avatar = async msg => {

    let user = msg.mentions.users.first() || msg.author;

    msg.reply(user.displayAvatarURL({ dynamic: true, size: 512 }));
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
                return msg.reply("Roblox user not found");

            target = data.data[0].id;
        }

        const info = await fetch(
            `https://users.roblox.com/v1/users/${target}`
        ).then(r => r.json());

        const embed = IntelPanel(
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

commands.robloxavatar = async (msg, args) => {

    if (!args[0]) return msg.reply("Provide Roblox ID");

    msg.reply(
        `https://www.roblox.com/headshot-thumbnail/image?userId=${args[0]}&width=420&height=420&format=png`
    );
};

/*
=====================================
 OSINT NETWORK
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

client.once("ready", () => {
    console.log(`🟥 INTELLIGENCE PROPERTY ACTIVE | ${client.user.tag}`);
});

client.login(process.env.TOKEN);
