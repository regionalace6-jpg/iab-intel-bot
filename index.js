const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    Partials
} = require("discord.js");

const axios = require("axios");
const moment = require("moment");
const fs = require("fs");
const http = require("http");

const TOKEN = process.env.TOKEN;
const PREFIX = "*";
const OWNER_ID = "924501682619052042";

/* Keep Alive */
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

/* Team Access */

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
    console.log(`🔥 Final Boss OSINT Online → ${client.user.tag}`);
});

/* Commands */

client.on("messageCreate", async message => {

    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    /* TEAM SYSTEM */

    if (command === "grant") {
        if (message.author.id !== OWNER_ID)
            return message.reply("Owner only.");

        const user = message.mentions.users.first();
        if (!user) return message.reply("Mention user.");

        accessList.add(user.id);
        saveAccess();

        return message.reply("Team access granted ✅");
    }

    if (command === "revoke") {
        if (message.author.id !== OWNER_ID)
            return message.reply("Owner only.");

        const user = message.mentions.users.first();
        if (!user) return message.reply("Mention user.");

        accessList.delete(user.id);
        saveAccess();

        return message.reply("Team access revoked ❌");
    }

    if (!hasAccess(message.author.id))
        return message.reply("Access Denied.");

    /* HELP */

    if (command === "help") {

        const embed = new EmbedBuilder()
            .setTitle("🔥 FINAL BOSS INTELLIGENCE SYSTEM")
            .setColor("Purple")
            .addFields(
                { name: "*dlookup", value: "Discord intel report" },
                { name: "*rlookup", value: "Roblox intel report" },
                { name: "*osint", value: "OSINT tools" },
                { name: "*email", value: "Email OSINT search" },
                { name: "*usersearch", value: "Username OSINT search" }
            );

        return message.reply({ embeds: [embed] });
    }

    /* OSINT TOOLS */

    if (command === "osint") {

        const embed = new EmbedBuilder()
            .setTitle("🌐 OSINT TOOL MENU")
            .setColor("Gold")
            .addFields(
                { name: "Username OSINT", value: "https://namechk.com" },
                { name: "Email OSINT", value: "https://epieos.com" },
                { name: "Social Search", value: "https://whatsmyname.app" },
                { name: "Username Search", value: "https://instantusername.com" }
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
                return message.reply("Provide user.");
            }

            const member = message.guild?.members.cache.get(user.id);

            const embed = new EmbedBuilder()
                .setTitle("🧠 DISCORD BOSS REPORT")
                .setColor("DarkRed")
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: "Username", value: user.tag },
                    { name: "User ID", value: user.id },
                    { name: "Bot", value: user.bot ? "Yes" : "No" },
                    { name: "Created", value: moment(user.createdAt).format("LLLL") },
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
                .setTitle("🎮 ROBLOX BOSS REPORT")
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

    /* EMAIL OSINT */

    if (command === "email") {

        if (!args[0]) return message.reply("Provide email.");

        const embed = new EmbedBuilder()
            .setTitle("📧 EMAIL OSINT")
            .setColor("Green")
            .addFields(
                { name: "Search Email", value: `https://epieos.com/?q=${args[0]}` }
            );

        return message.reply({ embeds: [embed] });
    }

    /* USERNAME SEARCH */

    if (command === "usersearch") {

        if (!args[0]) return message.reply("Provide username.");

        const embed = new EmbedBuilder()
            .setTitle("👤 USERNAME OSINT")
            .setColor("Orange")
            .addFields(
                { name: "Search Username", value: `https://whatsmyname.app/?q=${args[0]}` }
            );

        return message.reply({ embeds: [embed] });
    }

});

client.login(TOKEN);
