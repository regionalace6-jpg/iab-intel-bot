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
 UI BUILDER
=====================================
*/

function Panel(title, fields = []) {

    return new EmbedBuilder()
        .setTitle(`🟥 INTELLIGENCE CENTER | ${title}`)
        .addFields(fields)
        .setColor("#ff0000")
        .setTimestamp()
        .setFooter({
            text: "Intelligence Bureau Network"
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
 HELP COMMAND (GOATED UI)
=====================================
*/

commands.help = async (msg) => {

    const embed = Panel("Command List", [
        { name: "👤 User Intelligence", value: "!userinfo — Show user profile intelligence" },
        { name: "🎮 Roblox Intelligence", value: "!robloxinfo — Show Roblox profile data" },
        { name: "🌍 Geo Intelligence", value: "!iplookup — Public IP location scan" },
        { name: "🤖 Utility", value: "!ping — Bot latency\n!avatar — Profile picture\n!serverinfo — Server data" },
        { name: "🧠 Analysis", value: "!iq — Intelligence rating\n!aura — Aura rating" }
    ]);

    msg.reply({ embeds: [embed] });
};

/*
=====================================
 PING
=====================================
*/

commands.ping = async (msg) => {
    msg.reply(`🏓 Command Center Latency: ${client.ws.ping}ms`);
};

/*
=====================================
 AVATAR
=====================================
*/

commands.avatar = async (msg) => {

    let user = msg.mentions.users.first() || msg.author;

    msg.reply(
        user.displayAvatarURL({ dynamic: true, size: 512 })
    );
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

    const ageDays = Math.floor(
        (Date.now() - user.createdTimestamp) / 86400000
    );

    const embed = Panel("Subject Intelligence Report", [
        { name: "Username", value: user.tag, inline: true },
        { name: "User ID", value: user.id, inline: true },
        { name: "Account Age", value: `${ageDays} days`, inline: true }
    ]).setThumbnail(user.displayAvatarURL({ dynamic: true }));

    msg.reply({ embeds: [embed] });
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
                return msg.reply("Roblox subject not found");

            target = data.data[0].id;
        }

        const info = await fetch(
            `https://users.roblox.com/v1/users/${target}`
        ).then(r => r.json());

        const embed = Panel("Roblox Subject Profile", [
            { name: "Username", value: info.name || "Unknown" },
            { name: "Display", value: info.displayName || "Unknown" },
            { name: "Created", value: new Date(info.created).toDateString() }
        ]);

        msg.reply({ embeds: [embed] });

    } catch {
        msg.reply("Roblox intelligence scan failed");
    }
};

/*
=====================================
 GEO IP INTEL
=====================================
*/

commands.iplookup = async (msg, args) => {

    if (!args[0])
        return msg.reply("Provide IP");

    try {

        const data = await fetch(
            `https://ipapi.co/${args[0]}/json/`
        ).then(r => r.json());

        const embed = Panel("Geo Intelligence Scan", [
            { name: "City", value: data.city || "Unknown" },
            { name: "Country", value: data.country_name || "Unknown" },
            { name: "ISP", value: data.org || "Unknown" }
        ]);

        msg.reply({ embeds: [embed] });

    } catch {
        msg.reply("Geo scan failed");
    }
};

/*
=====================================
 FUN INTEL
=====================================
*/

commands.iq = async (msg) => {

    const iq = Math.floor(Math.random() * 100) + 1;

    msg.reply(`🧠 Intelligence Rating: ${iq}`);
};

commands.aura = async (msg) => {

    const aura = ["Legendary", "Elite", "Sigma", "Unknown"][Math.floor(Math.random() * 4)];

    msg.reply(`✨ Aura Rating: ${aura}`);
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
 READY
=====================================
*/

client.once("ready", () => {
    console.log(`🟥 INTELLIGENCE CENTER ONLINE | ${client.user.tag}`);
});

client.login(process.env.TOKEN);
