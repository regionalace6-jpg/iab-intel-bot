const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    Partials
} = require("discord.js");

const axios = require("axios");
const moment = require("moment");
const http = require("http");
const fs = require("fs");

const TOKEN = process.env.TOKEN;
const PREFIX = "*";
const OWNER_ID = "924501682619052042";

/* Keep Alive (Railway) */
http.createServer((req, res) => {
    res.write("Alive");
    res.end();
}).listen(process.env.PORT || 3000);

/* Client */

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel, Partials.User, Partials.Message]
});

/* Access System */

const ACCESS_FILE = "./access.json";

let accessList = new Set([OWNER_ID]);

if (fs.existsSync(ACCESS_FILE)) {
    try {
        accessList = new Set(JSON.parse(fs.readFileSync(ACCESS_FILE)));
    } catch {}
}

function saveAccess() {
    fs.writeFileSync(ACCESS_FILE, JSON.stringify([...accessList]));
}

function hasAccess(id) {
    return accessList.has(id);
}

/* Ready */

client.on("ready", () => {
    console.log(`Online → ${client.user.tag}`);
});

/* Commands */

client.on("messageCreate", async message => {

    if (!message.content.startsWith(PREFIX)) return;
    if (message.author.bot) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    /* HELP */

    if (command === "help") {

        const embed = new EmbedBuilder()
            .setTitle("🧠 OSINT INTELLIGENCE SYSTEM")
            .setColor("Purple")
            .addFields(
                { name: "*dlookup", value: "Discord public profile intel" },
                { name: "*rlookup", value: "Roblox public profile intel" },
                { name: "*osint", value: "OSINT tool menu" }
            );

        return message.reply({ embeds: [embed] });
    }

    /* OSINT TOOLS */

    if (command === "osint") {

        const embed = new EmbedBuilder()
            .setTitle("🌐 OSINT TOOLKIT")
            .setColor("Gold")
            .addFields(
                { name: "Discord Lookup", value: "https://discordhub.com/user/search" },
                { name: "Roblox Lookup", value: "https://www.roblox.com/search/users" },
                { name: "Username Search", value: "https://namechk.com" },
                { name: "Email Search", value: "https://epieos.com" }
            );

        return message.reply({ embeds: [embed] });
    }

    /* GRANT */

    if (command === "grant") {

        if (message.author.id !== OWNER_ID)
            return message.reply("Owner only.");

        const user = message.mentions.users.first();
        if (!user) return message.reply("Mention user.");

        accessList.add(user.id);
        saveAccess();

        return message.reply("Access granted ✅");
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
                return message.reply("Provide user.");
            }

            const member = message.guild?.members.cache.get(user.id);

            const flags = user.flags?.toArray()?.join(", ") || "None";

            const embed = new EmbedBuilder()
                .setTitle("🧠 DISCORD INTEL REPORT")
                .setColor("DarkRed")
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: "Username", value: user.tag, inline: true },
                    { name: "User ID", value: user.id, inline: true },
                    { name: "Bot", value: user.bot ? "Yes" : "No", inline: true },
                    { name: "Badges", value: flags },
                    { name: "Created", value: moment(user.createdAt).format("LLLL") },
                    { name: "Server Joined", value: member ? moment(member.joinedAt).format("LLLL") : "Not in server" }
                );

            return message.reply({ embeds: [embed] });

        } catch {
            return message.reply("Discord lookup failed.");
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
                .setTitle("🎮 ROBLOX INTEL REPORT")
                .setColor("Blue")
                .setThumbnail(avatar)
                .addFields(
                    { name: "Username", value: infoRes.data.name },
                    { name: "Display Name", value: infoRes.data.displayName },
                    { name: "User ID", value: robloxUser.id.toString() },
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
