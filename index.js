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

// ==============================
// READY
// ==============================

client.once("ready", () => {
    console.log(`🛡 Intelligence Bureau Online | ${client.user.tag}`);
});

// ==============================
// LOGGING SYSTEM
// ==============================

client.on("guildMemberAdd", async member => {
    const logGuild = client.guilds.cache.get(process.env.LOG_GUILD_ID);
    if (!logGuild) return;

    const logChannel = logGuild.channels.cache.get(process.env.LOG_CHANNEL_ID);
    if (!logChannel) return;

    const daysOld = Math.floor(
        (Date.now() - member.user.createdTimestamp) / 86400000
    );

    const embed = new EmbedBuilder()
        .setTitle("🟢 New Member Entry")
        .setColor(0x00ff00)
        .addFields(
            { name: "User", value: member.user.tag },
            { name: "Account Age", value: `${daysOld} days` }
        );

    logChannel.send({ embeds: [embed] });
});

// ==============================
// COMMAND SYSTEM
// ==============================

client.on("messageCreate", async message => {

    if (!message.content.startsWith(PREFIX) || message.author.bot) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // =============================
    // USER INFO
    // =============================

    if (command === "userinfo") {

        const member =
            message.mentions.members.first() ||
            message.guild.members.cache.get(args[0]) ||
            message.member;

        const daysOld = Math.floor(
            (Date.now() - member.user.createdTimestamp) / 86400000
        );

        const embed = new EmbedBuilder()
            .setTitle("👤 Intelligence Report")
            .setColor(0x5865F2)
            .addFields(
                { name: "Username", value: member.user.tag },
                { name: "User ID", value: member.user.id },
                { name: "Account Age", value: `${daysOld} days` },
                { name: "Joined Server", value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>` }
            )
            .setThumbnail(member.user.displayAvatarURL());

        return message.reply({ embeds: [embed] });
    }

    // =============================
    // WHOIS STYLE LOOKUP
    // =============================

    if (command === "whois") {

        const userId = args[0];

        if (!userId)
            return message.reply("Provide user ID.");

        try {

            const user = await client.users.fetch(userId);

            const embed = new EmbedBuilder()
                .setTitle("🧠 WHOIS Intelligence")
                .addFields(
                    { name: "Username", value: user.tag },
                    { name: "ID", value: user.id },
                    { name: "Bot", value: `${user.bot}` }
                );

            return message.reply({ embeds: [embed] });

        } catch {
            message.reply("User not found.");
        }
    }

    // =============================
    // ROBLOX INFO
    // =============================

    if (command === "robloxinfo") {

        if (!args[0]) return message.reply("Provide username or ID.");

        try {

            let userId = args[0];

            if (isNaN(userId)) {

                const res = await fetch(
                    "https://users.roblox.com/v1/usernames/users",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            usernames: [args[0]],
                            excludeBannedUsers: false
                        })
                    }
                );

                const data = await res.json();

                if (!data.data.length)
                    return message.reply("Roblox user not found.");

                userId = data.data[0].id;
            }

            const infoRes = await fetch(
                `https://users.roblox.com/v1/users/${userId}`
            );

            const info = await infoRes.json();

            const embed = new EmbedBuilder()
                .setTitle("🎮 Roblox Intelligence Report")
                .addFields(
                    { name: "Username", value: info.name },
                    { name: "Display Name", value: info.displayName },
                    { name: "Created", value: new Date(info.created).toDateString() },
                    { name: "Banned", value: `${info.isBanned}` }
                );

            return message.reply({ embeds: [embed] });

        } catch {
            message.reply("Roblox lookup failed.");
        }
    }

    // =============================
    // IP LOOKUP (PUBLIC ONLY)
    // =============================

    if (command === "iplookup") {

        if (!args[0]) return message.reply("Provide IP.");

        try {

            const res = await fetch(`https://ipapi.co/${args[0]}/json/`);
            const data = await res.json();

            const embed = new EmbedBuilder()
                .setTitle("🌍 IP Intelligence")
                .addFields(
                    { name: "IP", value: data.ip || "Unknown" },
                    { name: "City", value: data.city || "Unknown" },
                    { name: "Country", value: data.country_name || "Unknown" },
                    { name: "ISP", value: data.org || "Unknown" }
                );

            return message.reply({ embeds: [embed] });

        } catch {
            message.reply("IP lookup failed.");
        }
    }

    // =============================
    // RISK SCANNER
    // =============================

    if (command === "riskcheck") {

        const member =
            message.mentions.members.first() ||
            message.guild.members.cache.get(args[0]);

        if (!member)
            return message.reply("Mention or provide user ID.");

        let riskScore = 0;
        let flags = [];

        const accountAgeDays = Math.floor(
            (Date.now() - member.user.createdTimestamp) / 86400000
        );

        if (accountAgeDays < 7) {
            riskScore += 40;
            flags.push("Very new account");
        }

        if (/temp|test|alt|123/i.test(member.user.username)) {
            riskScore += 20;
            flags.push("Suspicious username");
        }

        const embed = new EmbedBuilder()
            .setTitle("⚠️ Risk Analysis")
            .setColor(riskScore > 50 ? 0xff0000 : 0x00ff00)
            .addFields(
                { name: "User", value: member.user.tag },
                { name: "Risk Score", value: `${riskScore}/100` },
                { name: "Flags", value: flags.join("\n") || "None" }
            );

        return message.reply({ embeds: [embed] });
    }

    // =============================
    // AVATAR
    // =============================

    if (command === "avatar") {

        const user =
            message.mentions.users.first() ||
            client.users.cache.get(args[0]) ||
            message.author;

        return message.reply(
            user.displayAvatarURL({ dynamic: true, size: 512 })
        );
    }

});

client.login(process.env.TOKEN);
