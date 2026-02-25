const { Client, GatewayIntentBits } = require('discord.js');
const noblox = require('noblox.js');

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
        const userId = args[0];
        if (!userId) return message.reply("❌ Provide a Roblox user ID.");

        try {
            const user = await noblox.getUserInfo(Number(userId));

            message.reply(
                `👤 Username: **${user.username}**
🆔 User ID: **${user.id}**
📅 Join Date: **${user.joinDate}**
📦 Description: ${user.blurb || "No description"}`
            );
        } catch (err) {
            message.reply("❌ Invalid Roblox ID.");
        }
    }
});

client.login(process.env.TOKEN);
