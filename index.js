const { Client, GatewayIntentBits } = require('discord.js');

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

client.on("messageCreate", async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === "roblox") {
        const input = args[0];
        if (!input) return message.reply("❌ Provide a Roblox username or ID.");

        try {
            let userId = input;

            // If username, convert to ID
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

                if (!usernameData.data.length)
                    return message.reply("❌ Username not found.");

                userId = usernameData.data[0].id;
            }

            // Get user info
            const userRes = await fetch(`https://users.roblox.com/v1/users/${userId}`);
            const user = await userRes.json();

            if (!user.id)
                return message.reply("❌ Invalid Roblox ID.");

            message.reply(
                `👤 Username: **${user.name}**
🆔 User ID: **${user.id}**
📅 Created: **${user.created}**
📦 Description: ${user.description || "No description"}`
            );

        } catch (err) {
            message.reply("❌ Error fetching Roblox data.");
        }
    }
});

client.login(process.env.TOKEN);
