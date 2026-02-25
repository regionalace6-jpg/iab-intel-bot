const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

require("http").createServer((req, res) => res.end("Bot running")).listen(3000);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const prefix = "!";

client.once("clientReady", () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command !== "roblox") return;

    const input = args[0];
    if (!input) return message.reply("❌ Provide a Roblox username or ID.");

    try {
        let userId = input;

        // Convert username to ID
        if (isNaN(input)) {
            const usernameRes = await fetch("https://users.roblox.com/v1/usernames/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    usernames: [input],
                    excludeBannedUsers: false
                })
            });

            const usernameData = await usernameRes.json();
            if (!usernameData.data || !usernameData.data.length)
                return message.reply("❌ Username not found.");

            userId = usernameData.data[0].id;
        }

        // Get user info
        const userRes = await fetch(`https://users.roblox.com/v1/users/${userId}`);
        const user = await userRes.json();

        if (!user || !user.id)
            return message.reply("❌ Invalid Roblox user.");

        // Get avatar
        let avatarUrl = null;
        try {
            const avatarRes = await fetch(
                `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false`
            );
            const avatarData = await avatarRes.json();
            avatarUrl = avatarData?.data?.[0]?.imageUrl || null;
        } catch {}

        // Get badges safely
        let badgeList = "No badges";
        try {
            const badgesRes = await fetch(
                `https://badges.roblox.com/v1/users/${userId}/badges?limit=5&sortOrder=Desc`
            );

            if (badgesRes.ok) {
                const badgesData = await badgesRes.json();
                if (badgesData && Array.isArray(badgesData.data) && badgesData.data.length > 0) {
                    badgeList = badgesData.data.map(b => b.name).join(", ");
                }
            }
        } catch {}

        const embed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle(`${user.name}'s Roblox Profile`)
            .setDescription(user.description || "No description")
            .addFields(
                { name: "User ID", value: `${user.id}`, inline: true },
                { name: "Created", value: new Date(user.created).toDateString(), inline: true },
                { name: "Latest Badges", value: badgeList }
            )
            .setFooter({ text: "IAB Intelligence System" });

        if (avatarUrl) embed.setThumbnail(avatarUrl);

        message.reply({ embeds: [embed] });

    } catch (err) {
        console.log("MAIN ERROR:", err);
        message.reply("❌ Error fetching Roblox data.");
    }
});

client.login(process.env.TOKEN);
