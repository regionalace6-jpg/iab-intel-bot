const {
    Client,
    GatewayIntentBits,
    EmbedBuilder
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
====================================
 RAID MEMORY TRACKER
====================================
*/

let joinTimestamps = [];

/*
====================================
 READY EVENT
====================================
*/

client.once("ready", () => {
    console.log(`🛡 Elite Investigator Online | ${client.user.tag}`);
});

/*
====================================
 JOIN INTELLIGENCE LOGGING
====================================
*/

client.on("guildMemberAdd", async member => {

    const logGuild = client.guilds.cache.get(process.env.LOG_GUILD_ID);
    if (!logGuild) return;

    const logChannel = logGuild.channels.cache.get(process.env.LOG_CHANNEL_ID);
    if (!logChannel) return;

    const accountAgeDays = Math.floor(
        (Date.now() - member.user.createdTimestamp) / 86400000
    );

    joinTimestamps.push(Date.now());
    joinTimestamps = joinTimestamps.filter(t => Date.now() - t < 10000);

    let raidWarning = null;

    if (joinTimestamps.length >= 5) {
        raidWarning = "🚨 Possible raid detected (mass joins)";
    }

    const embed = new EmbedBuilder()
        .setTitle("🛡 Intelligence Entry Report")
        .setColor(0x00ff00)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .addFields(
            { name: "User", value: member.user.tag },
            { name: "User ID", value: member.user.id },
            { name: "Account Age", value: `${accountAgeDays} days` },
            {
                name: "Created",
                value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`
            }
        )
        .setTimestamp();

    if (raidWarning) {
        embed.addFields({ name: "Security Alert", value: raidWarning });
    }

    logChannel.send({ embeds: [embed] });

});

/*
====================================
 COMMAND HANDLER
====================================
*/

client.on("messageCreate", async message => {

    if (!message.content.startsWith(PREFIX) || message.author.bot) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    /*
    -------------------------
    USERINFO
    -------------------------
    */

    if (cmd === "userinfo") {

        let user;

        if (message.mentions.users.first()) {
            user = message.mentions.users.first();
        } else if (args[0]) {
            try {
                user = await client.users.fetch(args[0]);
            } catch {
                return message.reply("User not found");
            }
        } else {
            user = message.author;
        }

        let member = null;

        try {
            member = await message.guild.members.fetch(user.id);
        } catch {}

        const ageDays = Math.floor(
            (Date.now() - user.createdTimestamp) / 86400000
        );

        const embed = new EmbedBuilder()
            .setTitle("👤 User Intelligence")
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: "Username", value: user.tag },
                { name: "User ID", value: user.id },
                { name: "Account Age", value: `${ageDays} days` },
                {
                    name: "Server Status",
                    value: member ? "In Server" : "Not In Server"
                }
            );

        return message.reply({ embeds: [embed] });
    }

    /*
    -------------------------
    ROBLOX INFO
    -------------------------
    */

    if (cmd === "robloxinfo") {

        if (!args[0]) return message.reply("Provide username or ID");

        try {

            let target = args[0];

            if (isNaN(target)) {

                const res = await fetch(
                    "https://users.roblox.com/v1/usernames/users",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            usernames: [target],
                            excludeBannedUsers: false
                        })
                    }
                );

                const data = await res.json();

                if (!data.data.length)
                    return message.reply("Roblox user not found");

                target = data.data[0].id;
            }

            const infoRes = await fetch(
                `https://users.roblox.com/v1/users/${target}`
            );

            const info = await infoRes.json();

            const embed = new EmbedBuilder()
                .setTitle("🎮 Roblox Intelligence")
                .addFields(
                    { name: "Username", value: info.name },
                    { name: "Display Name", value: info.displayName },
                    {
                        name: "Created",
                        value: new Date(info.created).toDateString()
                    },
                    { name: "Banned", value: `${info.isBanned}` }
                );

            return message.reply({ embeds: [embed] });

        } catch {
            message.reply("Roblox lookup failed");
        }
    }

    /*
    -------------------------
    IP LOOKUP
    -------------------------
    */

    if (cmd === "iplookup") {

        if (!args[0]) return message.reply("Provide IP");

        try {

            const res = await fetch(`https://ipapi.co/${args[0]}/json/`);
            const data = await res.json();

            const embed = new EmbedBuilder()
                .setTitle("🌍 Geo Intelligence")
                .addFields(
                    { name: "IP", value: data.ip || "Unknown" },
                    { name: "City", value: data.city || "Unknown" },
                    { name: "Country", value: data.country_name || "Unknown" },
                    { name: "ISP", value: data.org || "Unknown" }
                );

            return message.reply({ embeds: [embed] });

        } catch {
            message.reply("IP lookup failed");
        }
    }

    /*
    -------------------------
    AVATAR
    -------------------------
    */

    if (cmd === "avatar") {

        let user = message.author;

        if (message.mentions.users.first()) {
            user = message.mentions.users.first();
        }

        return message.reply(
            user.displayAvatarURL({ dynamic: true, size: 512 })
        );
    }

});

client.login(process.env.TOKEN);
