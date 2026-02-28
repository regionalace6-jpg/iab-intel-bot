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
const PREFIX = "!";

/* Keep Alive */

http.createServer((req, res) => {
    res.write("Alive");
    res.end();
}).listen(process.env.PORT || 3000);

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

client.on("ready", () => {
    console.log(`😈 NIGHTMARE INTEL ONLINE → ${client.user.tag}`);
});

/* COMMANDS */

client.on("messageCreate", async message => {

    if (!message.content.startsWith(PREFIX)) return;
    if (message.author.bot) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    /* HELP */

    if (command === "help") {

        const embed = new EmbedBuilder()
            .setTitle("😈 NIGHTMARE INTELLIGENCE SYSTEM")
            .setColor("Red")
            .setDescription(`
Commands:

!dlookup → Discord intelligence report  
!rlookup → Roblox intelligence report  
!osint → Intelligence search portals  
!profile → Developer profile style report
`);

        return message.reply({ embeds: [embed] });
    }

    /* OSINT */

    if (command === "osint") {

        const embed = new EmbedBuilder()
            .setTitle("🌐 NIGHTMARE OSINT GATEWAY")
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
                .setTitle("😈 DISCORD DOSSIER REPORT")
                .setColor("DarkRed")
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: "Username", value: user.tag },
                    { name: "User ID", value: user.id },
                    { name: "Created", value: moment(user.createdAt).format("LLLL") },
                    { name: "Server Joined", value: member ? moment(member.joinedAt).format("LLLL") : "Not in server" },
                    { name: "Public Profile", value: `https://discord.com/users/${user.id}` }
                )
                .setFooter({ text: "Public Intelligence Report" });

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
                .setTitle("🎮 ROBLOX DOSSIER REPORT")
                .setColor("Blue")
                .setThumbnail(avatar)
                .addFields(
                    { name: "Username", value: infoRes.data.name },
                    { name: "Display Name", value: infoRes.data.displayName },
                    { name: "User ID", value: robloxUser.id.toString() },
                    { name: "Bio", value: infoRes.data.description || "No bio" },
                    { name: "Profile Link", value: `https://www.roblox.com/users/${robloxUser.id}/profile` },
                    { name: "Created", value: moment(infoRes.data.created).format("LLLL") }
                );

            return message.reply({ embeds: [embed] });

        } catch {
            return message.reply("Roblox lookup failed.");
        }
    }

});

client.login(TOKEN);
