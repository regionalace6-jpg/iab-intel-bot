const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const axios = require("axios");

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
// READY EVENT
// =============================
client.once("ready", () => {
    console.log(`✅ Bureau Bot Online as ${client.user.tag}`);
});

// =============================
// MESSAGE HANDLER
// =============================
client.on("messageCreate", async (message) => {
    if (!message.content.startsWith(PREFIX) || message.author.bot) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // =====================================================
    // 🔎 ALT RISK SCAN (Legal Bureau Version)
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
            flags.push("Recently created account");
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
    // 🎮 ROBLOX USER INFO
    // =====================================================
    if (command === "robloxinfo") {
        if (!args[0]) return message.reply("Provide a Roblox username.");

        try {
            const userRes = await axios.post(
                "https://users.roblox.com/v1/usernames/users",
                {
                    usernames: [args[0]],
                    excludeBannedUsers: false
                }
            );

            if (!userRes.data.data.length)
                return message.reply("Roblox user not found.");

            const user = userRes.data.data[0];

            const userInfo = await axios.get(
                `https://users.roblox.com/v1/users/${user.id}`
            );

            const embed = new EmbedBuilder()
                .setTitle("🎮 Roblox User Information")
                .setColor(0x0099ff)
                .addFields(
                    { name: "Username", value: userInfo.data.name, inline: true },
                    { name: "Display Name", value: userInfo.data.displayName, inline: true },
                    { name: "User ID", value: `${userInfo.data.id}`, inline: true },
                    { name: "Created", value: new Date(userInfo.data.created).toDateString() },
                    { name: "Banned", value: `${userInfo.data.isBanned}` }
                );

            return message.reply({ embeds: [embed] });

        } catch (err) {
            return message.reply("Error fetching Roblox data.");
        }
    }

    // =====================================================
    // 👤 DISCORD USER INFO
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
// LOGIN (USES YOUR HOST VARIABLES)
// =============================
client.login(process.env.TOKEN);
