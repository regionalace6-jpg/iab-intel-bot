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
==============================
 UI BUILDER
==============================
*/

function IntelPanel(title, desc = "", fields = []) {

    return new EmbedBuilder()
        .setTitle(`🟥 INTELLIGENCE BUREAU | ${title}`)
        .setDescription(desc)
        .addFields(fields)
        .setColor("#000000")
        .setTimestamp()
        .setFooter({ text: "OPT Intelligence Network" });
}

/*
==============================
 COMMANDS
==============================
*/

const commands = {};

/* ---------- HELP MENU ---------- */

commands.help = async (msg) => {

    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId("help_menu")
            .setPlaceholder("Select Intelligence Category")
            .addOptions([
                { label: "👤 User Intel", value: "user" },
                { label: "🎮 Roblox Intel", value: "roblox" },
                { label: "🌍 OSINT Tools", value: "osint" },
                { label: "🤖 Utility", value: "util" }
            ])
    );

    const embed = IntelPanel(
        "OPT Intelligence Command Center",
        "Select category below"
    );

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
                response = IntelPanel("User Intelligence",
                    "",
                    [
                        { name: "Commands", value: "Buserinfo | Bavatar" }
                    ]);
                break;

            case "roblox":
                response = IntelPanel("Roblox Intelligence",
                    "",
                    [
                        { name: "Commands", value: "Brobloxinfo" }
                    ]);
                break;

            case "osint":
                response = IntelPanel("OSINT Intelligence",
                    "",
                    [
                        { name: "Commands", value: "Biplookup | Bdnslookup | Bweather" }
                    ]);
                break;

            case "util":
                response = IntelPanel("Utilities",
                    "",
                    [
                        { name: "Commands", value: "Bping | Bhelp | Biq" }
                    ]);
                break;
        }

        interaction.update({
            embeds: [response],
            components: [menu]
        });

    });
};

/* ---------- BASIC ---------- */

commands.ping = async msg => {
    msg.reply(`🏴 Intelligence Latency: ${client.ws.ping}ms`);
};

commands.avatar = async msg => {

    let user = msg.mentions.users.first() || msg.author;

    msg.reply(user.displayAvatarURL({ dynamic: true, size: 512 }));
};

commands.iq = async msg => {
    msg.reply(`🧠 Intelligence Rating: ${Math.floor(Math.random() * 100) + 1}`);
};

/* ---------- USER INTEL ---------- */

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

    const embed = IntelPanel("Subject Profile",
        "",
        [
            { name: "Username", value: user.tag, inline: true },
            { name: "ID", value: user.id, inline: true },
            { name: "Account Age", value: `${age} days`, inline: true }
        ]);

    msg.reply({ embeds: [embed] });
};

/* ---------- ROBLOX INTEL ---------- */

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

        const embed = IntelPanel("Roblox Profile",
            "",
            [
                { name: "Username", value: info.name || "Unknown" },
                { name: "Display", value: info.displayName || "Unknown" },
                { name: "Created", value: new Date(info.created).toDateString() }
            ]);

        msg.reply({ embeds: [embed] });

    } catch {
        msg.reply("Roblox scan failed");
    }
};

/* ---------- OSINT ---------- */

commands.iplookup = async (msg, args) => {

    if (!args[0]) return msg.reply("Provide IP");

    try {

        const data = await fetch(
            `http://ip-api.com/json/${args[0]}`
        ).then(r => r.json());

        const embed = IntelPanel("Geo Intelligence",
            "",
            [
                { name: "Country", value: data.country || "Unknown" },
                { name: "Region", value: data.regionName || "Unknown" },
                { name: "City", value: data.city || "Unknown" },
                { name: "ISP", value: data.isp || "Unknown" }
            ]);

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

/* ---------- MESSAGE HANDLER ---------- */

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
