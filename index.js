const { Client, GatewayIntentBits } = require('discord.js');
const noblox = require('noblox.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const prefix = "!";

client.once("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "roblox") {
        const userId = interaction.options.getString("id");

        try {
            const user = await noblox.getUserInfo(Number(userId));

            await interaction.reply({
                content: `👤 Username: **${user.username}**
🆔 User ID: **${user.id}**
📅 Join Date: **${user.joinDate}**
📦 Description: ${user.blurb || "No description"}`,
            });

        } catch (err) {
            await interaction.reply("❌ Invalid Roblox ID.");
        }
    }
});

client.login(process.env.TOKEN);
