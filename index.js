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

// =============================
// READY
// =============================
client.once("ready", () => {
    console.log(`🛡 Bureau Bot Online as ${client.user.tag}`);
});

// =============================
// AUTO ALT RISK ALERT ON JOIN
// =============================
client.on("guildMemberAdd", async (member) => {
    const accountAgeDays = Math.floor(
        (Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24)
    );

    if (accountAgeDays < 7) {
        const channel = member.guild.systemChannel;
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setTitle("⚠️ New Account Alert")
            .setColor(0xff0000)
            .setDescription(`${member.user.tag} joined with a VERY new account.`)
            .addFields(
                { name: "Account Age", value: `${accountAgeDays} days` }
            );

        channel.send({ embeds: [embed] });
    }
});

// =============================
// COMMAND HANDLER
// =============================
client.on("messageCreate", async (message) => {
    if (!message.content.startsWith(PREFIX) || message.author.bot) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // =====================================================
    // 🔎 ALT RISK SCAN
    // =====================================================
    if (command === "altscan") {
        const member = message.mentions.members.first();
        if (!member) return message.reply("Mention a user to scan.");

        const accountAgeDays = Math.floor(
            (Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24)
        );

        const joinAgeDays = Math.floor(
            (Date.now() - member.joinedTimestamp) / (1000 * 60 * 60 * 24)
        );

        let riskScore = 0;
        let flags = [];

        if (accountAgeDays < 7) {
            riskScore += 40;
            flags.push("Very new account");
        }

        if (accountAgeDays < 30) {
            riskScore += 20;
            flags.push("Recently created");
        }

        if (/alt|test|temp|123/i.test(member.user.username)) {
            riskScore += 20;
            flags.push("Suspicious username pattern");
        }

        if (joinAgeDays === 0) {
            riskScore += 20;
            flags.push("Joined today");
        }

        let riskLevel = "Low";
        if (riskScore >= 60) riskLevel = "High";
        else if (riskScore >= 30) riskLevel = "Medium";

        const embed = new EmbedBuilder()
            .setTitle("🛡 Bureau Alt Risk Analysis")
            .setColor(
                riskLevel === "High" ? 0xff0000 :
                riskLevel === "Medium" ? 0xff9900 :
                0x00ff00
            )
            .addFields(
                { name: "User", value: member.user.tag, inline: true },
                { name: "Account Age", value: `${accountAgeDays} days`, inline: true },
                { name: "Joined Server", value: `${joinAgeDays} days ago`, inline: true },
                { name: "Risk Score", value: `${riskScore}/100`, inline: true },
                { name: "Risk Level", value: riskLevel, inline: true },
                { name: "Flags", value: flags.length ? flags.join("\n") : "None detected" }
            )
            .setThumbnail(member.user.displayAvatarURL());

        return message.reply({ embeds: [embed] });
    }

    // =====================================================
    // 🎮 ROBLOX USER INFO (NATIVE FETCH)
    // =====================================================
    if (command === "robloxinfo") {
        if (!args[0]) return message.reply("Provide a Roblox username.");

        try {
            const userRes = await fetch(
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

            const userData = await userRes.json();
            if (!userData.data.length)
                return message.reply("Roblox user not found.");

            const user = userData.data[0];

            const userInfoRes = await fetch(
                `https://users.roblox.com/v1/users/${user.id}`
            );

            const userInfo = await userInfoRes.json();

            const embed = new EmbedBuilder()
                .setTitle("🎮 Roblox User Information")
                .setColor(0x0099ff)
                .addFields(
                    { name: "Username", value: userInfo.name, inline: true },
                    { name: "Display Name", value: userInfo.displayName, inline: true },
                    { name: "User ID", value: `${userInfo.id}`, inline: true },
                    { name: "Created", value: new Date(userInfo.created).toDateString() },
                    { name: "Banned", value: `${userInfo.isBanned}` }
                );

            return message.reply({ embeds: [embed] });

        } catch (err) {
            console.error(err);
            return message.reply("Error fetching Roblox data.");
        }
    }

    // =====================================================
    // 👤 USER INFO
    // =====================================================
    if (command === "userinfo") {
        const member = message.mentions.members.first() || message.member;

        const embed = new EmbedBuilder()
            .setTitle("👤 Discord User Information")
            .setColor(0x5865F2)
            .addFields(
                { name: "Username", value: member.user.tag, inline: true },
                { name: "User ID", value: member.user.id, inline: true },
                { name: "Account Created", value: new Date(member.user.createdTimestamp).toDateString() },
                { name: "Joined Server", value: new Date(member.joinedTimestamp).toDateString() },
                { name: "Roles", value: member.roles.cache.map(r => r.name).join(", ") }
            )
            .setThumbnail(member.user.displayAvatarURL());

        return message.reply({ embeds: [embed] });
    }

    // =====================================================
    // 🏢 SERVER INFO
    // =====================================================
    if (command === "serverinfo") {
        const guild = message.guild;

        const embed = new EmbedBuilder()
            .setTitle("🏢 Server Information")
            .setColor(0x00ffff)
            .addFields(
                { name: "Server Name", value: guild.name, inline: true },
                { name: "Server ID", value: guild.id, inline: true },
                { name: "Owner", value: `<@${guild.ownerId}>`, inline: true },
                { name: "Member Count", value: `${guild.memberCount}`, inline: true },
                { name: "Created On", value: new Date(guild.createdTimestamp).toDateString() }
            );

        return message.reply({ embeds: [embed] });
    }
});

// =============================
// LOGIN (USES YOUR HOST TOKEN VARIABLE)
// =============================
client.login(process.env.TOKEN);
