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
const PREFIX = "!";

const OWNER_ID = "924501682619052042";

/* KEEP ALIVE (Railway) */

http.createServer((req, res) => {
    res.write("Alive");
    res.end();
}).listen(process.env.PORT || 3000);

/* CLIENT */

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

/* ACCESS SYSTEM */

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

/* READY */

client.on("ready", () => {
    console.log(`Online → ${client.user.tag}`);
});

/* COMMANDS */

client.on("messageCreate", async message => {

    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    /* GRANT */

    if (command === "grant") {

        if (message.author.id !== OWNER_ID)
            return message.reply("Owner only.");

        const user = message.mentions.users.first();
        if (!user) return message.reply("Mention user.");

        accessList.add(user.id);
        saveAccess();

        return message.reply("Team access granted ✅");
    }

    /* REVOKE */

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
            .setTitle("😈 INTELLIGENCE BOT COMMANDS")
            .setColor("Purple")
            .setDescription(`
!dlookup @user / id → Discord intelligence report
!rlookup username / id → Roblox intelligence report
!userinfo → User profile info
!serverinfo → Server info
!avatar → User avatar
!banner → User banner
!osint → OSINT tools
!ip ipaddress → IP geolocation
!ping → Bot latency
!grant @user → Give team access
!revoke @user → Remove team access
`);

        return message.reply({ embeds: [embed] });
    }

    /* PING */

    if (command === "ping") {
        return message.reply(`🏓 Pong! ${client.ws.ping}ms`);
    }

    /* AVATAR */

    if (command === "avatar") {

        let user = message.mentions.users.first()
            || await client.users.fetch(args[0]).catch(() => message.author);

        const embed = new EmbedBuilder()
            .setTitle("🖼️ AVATAR")
            .setImage(user.displayAvatarURL({ size: 1024 }))
            .setColor("Blue");

        return message.reply({ embeds: [embed] });
    }

    /* USERINFO */

    if (command === "userinfo") {

        let user = message.mentions.users.first()
            || await client.users.fetch(args[0]).catch(() => message.author);

        const member = message.guild?.members.cache.get(user.id);

        const embed = new EmbedBuilder()
            .setTitle("👤 USER INTEL REPORT")
            .setColor("Purple")
            .setThumbnail(user.displayAvatarURL())
            .addFields(
                { name: "Username", value: user.tag },
                { name: "User ID", value: user.id },
                { name: "Bot", value: user.bot ? "Yes" : "No" },
                { name: "Created", value: moment(user.createdAt).format("LLLL") }
            );

        if (member) {
            embed.addFields({
                name: "Server Joined",
                value: moment(member.joinedAt).format("LLLL")
            });
        }

        return message.reply({ embeds: [embed] });
    }

    /* SERVERINFO */

    if (command === "serverinfo") {

        const guild = message.guild;

        const embed = new EmbedBuilder()
            .setTitle("🏰 SERVER INTEL REPORT")
            .setColor("Gold")
            .addFields(
                { name: "Server Name", value: guild.name },
                { name: "Members", value: guild.memberCount.toString() },
                { name: "Owner ID", value: guild.ownerId },
                { name: "Created", value: moment(guild.createdAt).format("LLLL") }
            );

        return message.reply({ embeds: [embed] });
    }

    /* OSINT */

    if (command === "osint") {

        const embed = new EmbedBuilder()
            .setTitle("🌐 OSINT GATEWAY")
            .setColor("Gold")
            .addFields(
                { name: "Username Search", value: "https://namechk.com" },
                { name: "Email Search", value: "https://epieos.com" },
                { name: "Social Search", value: "https://whatsmyname.app" }
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
            } else return message.reply("Provide user.");

            const member = message.guild?.members.cache.get(user.id);

            const embed = new EmbedBuilder()
                .setTitle("🧠 DISCORD DOSSIER")
                .setColor("DarkRed")
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: "Username", value: user.tag },
                    { name: "User ID", value: user.id },
                    { name: "Created", value: moment(user.createdAt).format("LLLL") },
                    { name: "Server Joined", value: member ? moment(member.joinedAt).format("LLLL") : "Not in server" },
                    { name: "Profile", value: `https://discord.com/users/${user.id}` }
                );

            return message.reply({ embeds: [embed] });

        } catch {
            return message.reply("Lookup failed.");
        }
    }

    /* ROBLOX LOOKUP */

    if (command === "rlookup") {

        if (!args[0]) return message.reply("Provide username.");

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
                .setTitle("🎮 ROBLOX DOSSIER")
                .setColor("Blue")
                .setThumbnail(avatar)
                .addFields(
                    { name: "Username", value: infoRes.data.name },
                    { name: "Display Name", value: infoRes.data.displayName },
                    { name: "User ID", value: infoRes.data.id.toString() },
                    { name: "Bio", value: infoRes.data.description || "No bio" },
                    { name: "Profile", value: `https://www.roblox.com/users/${robloxUser.id}/profile` },
                    { name: "Created", value: moment(infoRes.data.created).format("LLLL") }
                );

            return message.reply({ embeds: [embed] });

        } catch {
            return message.reply("Roblox lookup failed.");
        }
    }

});

client.login(TOKEN);
