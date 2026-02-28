const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    Partials
} = require("discord.js");

const axios = require("axios");
const moment = require("moment");
const http = require("http");

const TOKEN = process.env.TOKEN;
const PREFIX = "*";

/* Railway / Hosting Keep Alive */
http.createServer((req, res) => {
    res.write("Bot Alive");
    res.end();
}).listen(process.env.PORT || 3000);

if (!TOKEN) {
    console.log("TOKEN missing");
    process.exit(1);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers
    ],
    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.User
    ]
});

client.on("ready", () => {
    console.log(`Online → ${client.user.tag}`);
});

/* ================= COMMANDS ================= */

client.on("messageCreate", async message => {

    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    /* HELP */

    if (command === "help") {

        const embed = new EmbedBuilder()
            .setTitle("🧠 BOT COMMANDS")
            .setColor("Purple")
            .addFields(
                { name: "*dlookup @user", value: "Discord public profile" },
                { name: "*rlookup username", value: "Roblox public profile" }
            );

        return message.reply({ embeds: [embed] });
    }

    /* DISCORD LOOKUP */

    if (command === "dlookup") {

        try {

            let user;

            if (message.mentions.users.first()) {
                user = message.mentions.users.first();
            } else if (args[0]) {
                user = await client.users.fetch(args[0]);
            } else {
                return message.reply("Provide user mention or ID.");
            }

            const member = message.guild?.members.cache.get(user.id);

            const embed = new EmbedBuilder()
                .setTitle("🧠 DISCORD PUBLIC PROFILE")
                .setColor("DarkRed")
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: "Username", value: user.tag, inline: true },
                    { name: "User ID", value: user.id, inline: true },
                    { name: "Created At", value: moment(user.createdAt).format("LLLL") },
                    { name: "Server Joined", value: member ? moment(member.joinedAt).format("LLLL") : "Not in server" }
                );

            return message.reply({ embeds: [embed] });

        } catch {
            return message.reply("Lookup failed.");
        }
    }

    /* ROBLOX LOOKUP */

    if (command === "rlookup") {

        if (!args[0]) return message.reply("Provide Roblox username.");

        try {

            const userRes = await axios.post(
                "https://users.roblox.com/v1/usernames/users",
                { usernames: [args[0]] }
            );

            const robloxUser = userRes.data.data[0];
            if (!robloxUser) return message.reply("User not found.");

            const infoRes = await axios.get(
                `https://users.roblox.com/v1/users/${robloxUser.id}`
            );

            const avatarRes = await axios.get(
                `https://thumbnails.roblox.com/v1/users/avatar?userIds=${robloxUser.id}&size=420x420&format=Png`
            );

            const avatar = avatarRes.data.data[0].imageUrl;

            const embed = new EmbedBuilder()
                .setTitle("🎮 ROBLOX PUBLIC PROFILE")
                .setColor("Blue")
                .setThumbnail(avatar)
                .addFields(
                    { name: "Username", value: infoRes.data.name, inline: true },
                    { name: "Display Name", value: infoRes.data.displayName, inline: true },
                    { name: "User ID", value: robloxUser.id.toString(), inline: true },
                    { name: "Bio", value: infoRes.data.description || "No bio" },
                    { name: "Created", value: moment(infoRes.data.created).format("LLLL") }
                );

            return message.reply({ embeds: [embed] });

        } catch {
            return message.reply("Roblox lookup failed.");
        }
    }

});

client.login(TOKEN);
