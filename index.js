const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const axios = require("axios");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

/* ================= ANTI CRASH ================= */

process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

/* ================= BOT READY ================= */

client.once("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
});

/* ================= DISCORD FIND ================= */

async function findDiscordUser(id, message) {
    try {
        const user = await client.users.fetch(id);

        const embed = new EmbedBuilder()
            .setTitle("🔵 Discord Intelligence Report")
            .setThumbnail(user.displayAvatarURL())
            .setColor("Blue")
            .addFields(
                { name: "Username", value: user.tag, inline: true },
                { name: "User ID", value: user.id, inline: true },
                { name: "Bot Account", value: user.bot ? "Yes" : "No" },
                { name: "Created At", value: user.createdAt.toDateString() }
            );

        message.reply({ embeds: [embed] });

    } catch {
        message.reply("❌ Discord user not found.");
    }
}

/* ================= ROBLOX FIND ================= */

async function findRobloxUser(input, message) {
    try {
        let userId;

        if (!isNaN(input)) {
            userId = input;
        } else {
            const res = await axios.post(
                "https://users.roblox.com/v1/usernames/users",
                {
                    usernames: [input],
                    excludeBannedUsers: false
                }
            );

            if (!res.data.data[0])
                return message.reply("❌ Roblox user not found.");

            userId = res.data.data[0].id;
        }

        const info = (await axios.get(
            `https://users.roblox.com/v1/users/${userId}`
        )).data;

        const avatar = (await axios.get(
            `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png`
        )).data.data[0].imageUrl;

        const createdDate = new Date(info.created);
        const ageDays = Math.floor((Date.now() - createdDate) / 86400000);

        const embed = new EmbedBuilder()
            .setTitle("🟥 Roblox Intelligence Report")
            .setThumbnail(avatar)
            .setColor("Red")
            .addFields(
                { name: "Username", value: info.name, inline: true },
                { name: "Display Name", value: info.displayName, inline: true },
                { name: "User ID", value: info.id.toString(), inline: true },
                { name: "Account Created", value: createdDate.toDateString() },
                { name: "Account Age", value: `${ageDays} days` }
            );

        message.reply({ embeds: [embed] });

    } catch {
        message.reply("❌ Error fetching Roblox data.");
    }
}

/* ================= COMMAND HANDLER ================= */

client.on("messageCreate", async message => {

    if (message.author.bot) return;

    const args = message.content.split(" ");

    if (args[0] === "!find") {
        if (!args[1]) return message.reply("Provide Discord ID.");
        findDiscordUser(args[1], message);
    }

    if (args[0] === "!rfind") {
        if (!args[1]) return message.reply("Provide Roblox username or ID.");
        findRobloxUser(args[1], message);
    }

});

/* ================= LOGIN ================= */

client.login(process.env.TOKEN);
