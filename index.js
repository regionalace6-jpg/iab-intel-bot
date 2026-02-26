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
================================
 RAID DETECTION MEMORY SYSTEM
================================
*/

let joinTimestamps = [];

/*
================================
 READY
================================
*/

client.once("ready", () => {
    console.log(`🛡 Supreme Bureau Online | ${client.user.tag}`);
});

/*
================================
 INTELLIGENCE JOIN MONITOR
================================
*/

client.on("guildMemberAdd", async member => {

    const logGuild = client.guilds.cache.get(process.env.LOG_GUILD_ID);
    if (!logGuild) return;

    const logChannel = logGuild.channels.cache.get(process.env.LOG_CHANNEL_ID);
    if (!logChannel) return;

    try {

        const now = Date.now();

        // Raid detection memory
        joinTimestamps.push(now);

        // Remove old joins (10 sec window)
        joinTimestamps = joinTimestamps.filter(t => now - t < 10000);

        let raidWarning = null;

        if (joinTimestamps.length >= 5) {
            raidWarning = "🚨 RAID DETECTED — Mass joins in 10 seconds!";
        }

        const accountAgeDays = Math.floor(
            (now - member.user.createdTimestamp) / 86400000
        );

        const joinDate = `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`;
        const createdDate = `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`;

        let riskScore = 0;
        let flags = [];

        if (accountAgeDays < 7) {
            riskScore += 40;
            flags.push("Very New Account");
        }

        if (accountAgeDays < 30) {
            riskScore += 20;
            flags.push("New Account");
        }

        if (/temp|test|alt|123|user/i.test(member.user.username)) {
            riskScore += 20;
            flags.push("Suspicious Username Pattern");
        }

        if (!member.user.avatar) {
            riskScore += 10;
            flags.push("Default Avatar");
        }

        const embed = new EmbedBuilder()
            .setTitle("🛡 Supreme Bureau Intelligence Entry")
            .setColor(riskScore > 50 ? 0xff0000 : 0x00ff00)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: "User", value: member.user.tag },
                { name: "User ID", value: member.user.id },
                { name: "Join Date", value: joinDate },
                { name: "Account Created", value: createdDate },
                { name: "Account Age", value: `${accountAgeDays} days` },
                { name: "Risk Score", value: `${riskScore}/100` },
                { name: "Flags", value: flags.join("\n") || "None" }
            )
            .setTimestamp();

        if (raidWarning) {
            embed.addFields({ name: "🚨 Security Alert", value: raidWarning });
        }

        await logChannel.send({ embeds: [embed] });

    } catch (err) {
        console.log("Intelligence system error:", err);
    }

});

/*
================================
 COMMAND SYSTEM
================================
*/

client.on("messageCreate", async message => {

    if (!message.content.startsWith(PREFIX) || message.author.bot) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // USERINFO GLOBAL
    if (command === "userinfo") {

        let user =
            message.mentions.users.first() ||
            client.users.cache.get(args[0]) ||
            message.author;

        try {

            user = await client.users.fetch(user.id);

            let member = null;

            try {
                member = await message.guild.members.fetch(user.id);
            } catch {
                member = null;
            }

            const daysOld = Math.floor(
                (Date.now() - user.createdTimestamp) / 86400000
            );

            const embed = new EmbedBuilder()
                .setTitle("👤 Bureau User Intelligence")
                .setColor(0x5865F2)
                .addFields(
                    { name: "Username", value: user.tag },
                    { name: "User ID", value: user.id },
                    { name: "Account Age", value: `${daysOld} days` },
                    {
                        name: "Server Status",
                        value: member ? "Member of server" : "Not in server"
                    }
                )
                .setThumbnail(user.displayAvatarURL({ dynamic: true }));

            return message.reply({ embeds: [embed] });

        } catch {
            message.reply("User not found.");
        }
    }

    // ROBLOX LOOKUP
    if (command === "robloxinfo") {

        if (!args[0]) return message.reply("Provide Roblox username or ID.");

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
                .setTitle("🎮 Roblox Intelligence")
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

    // IP LOOKUP
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

});

client.login(process.env.TOKEN);
