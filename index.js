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

/* Railway Keep Alive */

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

client.on("ready", () => {
    console.log(`🔥 SUPER ELITE INTEL ONLINE → ${client.user.tag}`);
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
            .setTitle("🔥 SUPER ELITE INTELLIGENCE BOT")
            .setColor("Purple")
            .setDescription(`
**Commands Explained**

!help → Shows this menu  

!dlookup @user / ID → Shows Discord public profile intelligence  
Includes:
• Username  
• User ID  
• Account creation time  
• Server join time  
• Avatar  

!rlookup username / ID → Roblox public profile intelligence  
Includes:
• Username  
• Display Name  
• User ID  
• Bio  
• Creation time  

!osint → Shows OSINT search tools  

!ip ipaddress → Shows geolocation info
`);

        return message.reply({ embeds: [embed] });
    }

    /* OSINT */

    if (command === "osint") {

        const embed = new EmbedBuilder()
            .setTitle("🌐 OSINT TOOL MENU")
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
            } else {
                return message.reply("Mention user or provide ID.");
            }

            const member = message.guild?.members.cache.get(user.id);

            const embed = new EmbedBuilder()
                .setTitle("🧠 DISCORD INTELLIGENCE REPORT")
                .setColor("DarkRed")
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: "Username", value: user.tag },
                    { name: "User ID", value: user.id },
                    { name: "Bot Account", value: user.bot ? "Yes" : "No" },
                    { name: "Created At", value: moment(user.createdAt).format("LLLL") },
                    { name: "Server Joined", value: member ? moment(member.joinedAt).format("LLLL") : "Not in server" }
                );

            return message.reply({ embeds: [embed] });

        } catch {
            return message.reply("Discord lookup failed.");
        }
    }

    /* ROBLOX LOOKUP */

    if (command === "rlookup") {

        if (!args[0]) return message.reply("Provide Roblox username or ID.");

        try {

            let url;

            if (!isNaN(args[0])) {
                url = `https://users.roblox.com/v1/users/${args[0]}`;
            } else {
                const userRes = await axios.post(
                    "https://users.roblox.com/v1/usernames/users",
                    { usernames: [args[0]] }
                );

                const robloxUser = userRes.data.data[0];
                if (!robloxUser) return message.reply("User not found.");

                url = `https://users.roblox.com/v1/users/${robloxUser.id}`;
            }

            const infoRes = await axios.get(url);

            const avatarRes = await axios.get(
                `https://thumbnails.roblox.com/v1/users/avatar?userIds=${infoRes.data.id}&size=420x420&format=Png`
            );

            const avatar = avatarRes.data.data[0].imageUrl;

            const embed = new EmbedBuilder()
                .setTitle("🎮 ROBLOX INTELLIGENCE REPORT")
                .setColor("Blue")
                .setThumbnail(avatar)
                .addFields(
                    { name: "Username", value: infoRes.data.name },
                    { name: "Display Name", value: infoRes.data.displayName },
                    { name: "User ID", value: infoRes.data.id.toString() },
                    { name: "Bio", value: infoRes.data.description || "No bio" },
                    { name: "Created", value: moment(infoRes.data.created).format("LLLL") }
                );

            return message.reply({ embeds: [embed] });

        } catch {
            return message.reply("Roblox lookup failed.");
        }
    }

    /* IP */

    if (command === "ip") {

        if (!args[0]) return message.reply("Provide IP.");

        try {

            const geo = await axios.get(`http://ip-api.com/json/${args[0]}`);

            const data = geo.data;

            const embed = new EmbedBuilder()
                .setTitle("🌍 IP GEO INTEL")
                .setColor("Green")
                .addFields(
                    { name: "Country", value: data.country },
                    { name: "Region", value: data.regionName },
                    { name: "City", value: data.city },
                    { name: "ISP", value: data.isp }
                );

            return message.reply({ embeds: [embed] });

        } catch {
            return message.reply("IP lookup failed.");
        }
    }

});

client.login(TOKEN);
