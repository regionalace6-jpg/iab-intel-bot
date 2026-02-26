require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const prefix = "!";

client.once("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async message => {

    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // Roblox Intelligence Command
    if (command === "roblox") {

        const input = args[0];
        if (!input) return message.reply("❌ Provide username or ID");

        try {

            let userId = input;

            // Username → ID
            if (isNaN(input)) {

                const res = await axios.post(
                    "https://users.roblox.com/v1/usernames/users",
                    {
                        usernames: [input],
                        excludeBannedUsers: false
                    }
                );

                if (!res.data.data.length)
                    return message.reply("❌ User not found");

                userId = res.data.data[0].id;
            }

            // Get user profile
            const userRes = await axios.get(
                `https://users.roblox.com/v1/users/${userId}`
            );

            const user = userRes.data;

            message.reply(`
🧠 Intelligence Report
👤 Username: ${user.name}
🆔 ID: ${user.id}
📅 Created: ${user.created}
📦 Description: ${user.description || "No description"}
            `);

        } catch (err) {
            console.log(err);
            message.reply("❌ Error fetching Roblox data");
        }
    }

});

client.login(process.env.TOKEN);
