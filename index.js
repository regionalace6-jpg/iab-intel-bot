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

const PREFIX = "!";

/*
=====================================
 UI BUILDER
=====================================
*/

function Panel(title, fields = []) {

    return new EmbedBuilder()
        .setTitle(`🟥 INTELLIGENCE NETWORK | ${title}`)
        .addFields(fields)
        .setColor("Red")
        .setTimestamp()
        .setFooter({
            text: "Bureau Intelligence Network"
        });
}

/*
=====================================
 RAID MEMORY ANALYTICS
=====================================
*/

let joinMemory = [];

/*
=====================================
 COMMANDS
=====================================
*/

const commands = {};

/* -------- HELP MENU -------- */

commands.help = async (msg) => {

    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId("help_menu")
            .setPlaceholder("Select Intelligence Category")
            .addOptions([
                { label: "👤 User Intel", value: "user" },
                { label: "🎮 Roblox Intel", value: "roblox" },
                { label: "🌍 OSINT Tools", value: "osint" },
                { label: "🤖 Utilities", value: "util" }
            ])
    );

    const embed = Panel("Command Network", [
        { name: "System", value: "Select category below" }
    ]);

    const sent = await msg.reply({
        embeds: [embed],
        components: [menu]
    });

    const collector = sent.createMessageComponentCollector({
        time: 60000
    });

    collector.on("collect", async interaction => {

        if (interaction.user.id !== msg.author.id)
            return interaction.reply({
                content: "Not your menu",
                ephemeral: true
            });

        let response;

        switch (interaction.values[0]) {

            case "user":
                response = Panel("User Intelligence", [
                    { name: "Commands", value: "!userinfo | !avatar" }
                ]);
                break;

            case "roblox":
                response = Panel("Roblox Intelligence", [
                    { name: "Commands", value: "!robloxinfo" }
                ]);
                break;

            case "osint":
                response = Panel("OSINT Tools", [
                    { name: "Commands", value: "!iplookup" }
                ]);
                break;

            case "util":
                response = Panel("Utilities", [
                    { name: "Commands", value: "!ping | !help" }
                ]);
                break;
        }

        interaction.update({
            embeds: [response],
            components: [menu]
        });

    });

};

/* -------- PING -------- */

commands.ping = async (msg) => {
    msg.reply(`🏓 ${client.ws.ping}ms`);
};

/* -------- AVATAR -------- */

commands.avatar = async (msg) => {

    let user = msg.mentions.users.first() || msg.author;

    msg.reply(
        user.displayAvatarURL({ dynamic: true, size: 512 })
    );
};

/* -------- USER INFO -------- */

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

    const embed = Panel("Subject Profile", [
        { name: "Username", value: user.tag, inline: true },
        { name: "ID", value: user.id, inline: true },
        { name: "Account Age", value: `${ageDays} days`, inline: true }
    ]).setThumbnail(user.displayAvatarURL({ dynamic: true }));

    msg.reply({ embeds: [embed] });
};

/* -------- ROBLOX INFO -------- */

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

        const embed = Panel("Roblox Profile", [
            { name: "Username", value: info.name || "Unknown" },
            { name: "Display", value: info.displayName || "Unknown" },
            { name: "Created", value: new Date(info.created).toDateString() }
        ]);

        msg.reply({ embeds: [embed] });

    } catch {
        msg.reply("Roblox scan failed");
    }
};

/* -------- IP LOOKUP (BEST VERSION) -------- */

commands.iplookup = async (msg, args) => {

    if (!args[0])
        return msg.reply("Provide IP");

    try {

        const data = await fetch(
            `http://ip-api.com/json/${args[0]}`
        ).then(r => r.json());

        const embed = Panel("Geo Intelligence", [
            { name: "Country", value: data.country || "Unknown", inline: true },
            { name: "Region", value: data.regionName || "Unknown", inline: true },
            { name: "City", value: data.city || "Unknown", inline: true },
            { name: "ISP", value: data.isp || "Unknown", inline: true },
            { name: "Org", value: data.org || "Unknown", inline: true }
        ]);

        msg.reply({ embeds: [embed] });

    } catch {
        msg.reply("IP scan failed");
    }
};

/* -------- FUN -------- */

commands.iq = async (msg) => {
    msg.reply(`🧠 Intelligence Rating: ${Math.floor(Math.random() * 100) + 1}`);
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
            msg.reply("Command error.");
        }
    }

});

/*
=====================================
 JOIN INTEL ANALYTICS
=====================================
*/

client.on("guildMemberAdd", member => {

    joinMemory.push(Date.now());

    joinMemory = joinMemory.filter(
        t => Date.now() - t < 10000
    );

    if (joinMemory.length >= 5) {
        console.log("🚨 Possible raid activity detected");
    }

});

client.once("ready", () => {
    console.log(`🟥 Bureau Level 10 Online | ${client.user.tag}`);
});

client.login(process.env.TOKEN);
