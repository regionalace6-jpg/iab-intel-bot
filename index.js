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
 INTELLIGENCE UI BUILDER
=====================================
*/

function IntelligencePanel(title, fields = [], description = "") {

    return new EmbedBuilder()
        .setTitle(`🟥 INTELLIGENCE BUREAU | ${title}`)
        .setDescription(description)
        .addFields(fields)
        .setColor("#000000") // FULL INTELLIGENCE BLACK THEME
        .setTimestamp()
        .setFooter({
            text: "Elite Intelligence Bureau Network"
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
 HELP MENU
=====================================
*/

commands.help = async (msg) => {

    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId("help_menu")
            .setPlaceholder("Select Intelligence Category")
            .addOptions([
                { label: "👤 User Intelligence", value: "user" },
                { label: "🎮 Roblox Intelligence", value: "roblox" },
                { label: "🌍 OSINT Tools", value: "osint" },
                { label: "🤖 Utilities", value: "util" }
            ])
    );

    const embed = IntelligencePanel(
        "Command Center",
        [],
        "Select intelligence category below"
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
                response = IntelligencePanel("User Intelligence", [
                    { name: "Commands", value: "!userinfo | !avatar" }
                ]);
                break;

            case "roblox":
                response = IntelligencePanel("Roblox Intelligence", [
                    { name: "Commands", value: "!robloxinfo" }
                ]);
                break;

            case "osint":
                response = IntelligencePanel("OSINT Network", [
                    { name: "Commands", value: "!iplookup | !dnslookup | !weather" }
                ]);
                break;

            case "util":
                response = IntelligencePanel("Utilities", [
                    { name: "Commands", value: "!ping | !iq | !help" }
                ]);
                break;
        }

        interaction.update({
            embeds: [response],
            components: [menu]
        });

    });
};

/*
=====================================
 BASIC COMMANDS
=====================================
*/

commands.ping = async msg => {
    msg.reply(`🏓 Intelligence Latency: ${client.ws.ping}ms`);
};

commands.avatar = async msg => {

    let user = msg.mentions.users.first() || msg.author;

    msg.reply(user.displayAvatarURL({ dynamic: true, size: 512 }));
};

commands.iq = async msg => {
    msg.reply(`🧠 Intelligence Rating: ${Math.floor(Math.random() * 100) + 1}`);
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

    const ageDays = Math.floor(
        (Date.now() - user.createdTimestamp) / 86400000
    );

    const embed = IntelligencePanel("Subject Profile", [
        { name: "Username", value: user.tag, inline: true },
        { name: "ID", value: user.id, inline: true },
        { name: "Account Age", value: `${ageDays} days`, inline: true }
    ]);

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
                return msg.reply("Roblox subject not found");

            target = data.data[0].id;
        }

        const info = await fetch(
            `https://users.roblox.com/v1/users/${target}`
        ).then(r => r.json());

        const embed = IntelligencePanel("Roblox Profile", [
            { name: "Username", value: info.name || "Unknown" },
            { name: "Display", value: info.displayName || "Unknown" },
            { name: "Created", value: new Date(info.created).toDateString() }
        ]);

        msg.reply({ embeds: [embed] });

    } catch {
        msg.reply("Roblox scan failed");
    }
};

/*
=====================================
 OSINT NETWORK TOOLS
=====================================
*/

commands.iplookup = async (msg, args) => {

    if (!args[0]) return msg.reply("Provide IP");

    try {

        const data = await fetch(
            `http://ip-api.com/json/${args[0]}`
        ).then(r => r.json());

        const embed = IntelligencePanel("Geo Intelligence", [
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

        const embed = IntelligencePanel("DNS Intelligence", [
            { name: "Domain", value: args[0] },
            { name: "Records", value: records.substring(0, 1000) }
        ]);

        msg.reply({ embeds: [embed] });

    } catch {
        msg.reply("DNS scan failed");
    }
};

commands.weather = async (msg, args) => {

    if (!args[0]) return msg.reply("Provide city");

    try {

        const data = await fetch(
            `https://wttr.in/${args[0]}?format=j1`
        ).then(r => r.json());

        const current = data.current_condition[0];

        const embed = IntelligencePanel("Weather Intelligence", [
            { name: "Temperature", value: current.temp_C + "°C" },
            { name: "Humidity", value: current.humidity + "%" }
        ]);

        msg.reply({ embeds: [embed] });

    } catch {
        msg.reply("Weather scan failed");
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
            msg.reply("Command error");
        }
    }

});

client.once("ready", () => {
    console.log(`🟥 Intelligence Bureau Online | ${client.user.tag}`);
});

client.login(process.env.TOKEN);
