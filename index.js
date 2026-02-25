const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const fetch = require("node-fetch");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const PREFIX = "!";
const GROUP_ID = 35060991; // Your Roblox group ID
const links = {}; // Stored in memory (resets if bot restarts)

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
    if (!message.content.startsWith(PREFIX) || message.author.bot) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // =========================
    // ROBLOX LOOKUP
    // =========================
    if (command === "roblox") {
        const input = args[0];
        if (!input) return message.reply("Provide Roblox username or ID.");

        try {
            let userId;

            if (!isNaN(input)) {
                userId = input;
            } else {
                const userRes = await fetch("https://users.roblox.com/v1/usernames/users", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        usernames: [input],
                        excludeBannedUsers: false
                    })
                });

                const data = await userRes.json();
                if (!data.data.length) return message.reply("User not found.");
                userId = data.data[0].id;
            }

            const profileRes = await fetch(`https://users.roblox.com/v1/users/${userId}`);
            const userData = await profileRes.json();

            const avatarRes = await fetch(
                `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false`
            );
            const avatarData = await avatarRes.json();
            const avatarUrl = avatarData.data?.[0]?.imageUrl;

            const createdDate = new Date(userData.created);
            const now = new Date();
            const accountAge = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));

            // Group Rank
            let groupRank = "Not in group";
            try {
                const groupRes = await fetch(
                    `https://groups.roblox.com/v2/users/${userId}/groups/roles`
                );
                if (groupRes.ok) {
                    const groupData = await groupRes.json();
                    const group = groupData.data.find(g => g.group.id === GROUP_ID);
                    if (group) groupRank = group.role.name;
                }
            } catch {}

            const embed = new EmbedBuilder()
                .setTitle(userData.name)
                .setURL(`https://www.roblox.com/users/${userId}/profile`)
                .setThumbnail(avatarUrl)
                .addFields(
                    { name: "Display Name", value: userData.displayName || "None", inline: true },
                    { name: "User ID", value: userId.toString(), inline: true },
                    { name: "Account Age", value: `${accountAge} days`, inline: true },
                    { name: "IAB Rank", value: groupRank, inline: true }
                )
                .setColor(0x2b2d31);

            message.reply({ embeds: [embed] });

        } catch (err) {
            console.log(err);
            message.reply("Error fetching data.");
        }
    }

    // =========================
    // VERIFY (Memory Only)
    // =========================
    if (command === "verify") {
        const username = args[0];
        if (!username) return message.reply("Provide Roblox username.");

        try {
            const userRes = await fetch("https://users.roblox.com/v1/usernames/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    usernames: [username],
                    excludeBannedUsers: false
                })
            });

            const data = await userRes.json();
            if (!data.data.length) return message.reply("User not found.");

            links[message.author.id] = {
                robloxName: username,
                robloxId: data.data[0].id
            };

            message.reply(`Linked to ${username} (memory only).`);

        } catch {
            message.reply("Verification failed.");
        }
    }

    // =========================
    // WHOIS
    // =========================
    if (command === "whois") {
        const user = message.mentions.users.first();
        if (!user) return message.reply("Mention a user.");

        const data = links[user.id];
        if (!data) return message.reply("No Roblox linked.");

        message.reply(
            `Discord: ${user.tag}\nRoblox: ${data.robloxName}\nRoblox ID: ${data.robloxId}`
        );
    }
});

client.login("MTQ3NjIwODY2NDA5NTIzMjE1MQ.GCHq88.iwUiNDNtBgPRiGEccJ8it0TI37_5wksCqyEYVQ");
