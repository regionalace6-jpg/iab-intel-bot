const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const dns = require('dns').promises;

const PREFIX = "!";
const cooldown = new Set();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

client.once("ready", () => {
    console.log(`🖤 BLACK OPS INTELLIGENCE Online as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
    if (!message.content.startsWith(PREFIX) || message.author.bot) return;

    // Cooldown system (3 sec)
    if (cooldown.has(message.author.id))
        return message.reply("⏳ Slow down.");

    cooldown.add(message.author.id);
    setTimeout(() => cooldown.delete(message.author.id), 3000);

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift()?.toLowerCase();

    try {

        // ================= HELP =================
        if (command === "help") {
            const embed = new EmbedBuilder()
                .setTitle("🖤 BLACK OPS INTELLIGENCE")
                .setColor("#0f0f0f")
                .setDescription("Advanced Intelligence & OSINT System")
                .addFields(
                    { name: "Roblox", value: "`!rbxuser <username>`" },
                    { name: "Discord", value: "`!duser <id>`" },
                    { name: "IP", value: "`!iplookup <ip>`" },
                    { name: "Domain", value: "`!domain <domain>`" },
                    { name: "Email", value: "`!email <email>`" }
                );

            return message.reply({ embeds: [embed] });
        }

        // ================= ROBLOX BLACK OPS =================
        if (command === "rbxuser") {
            if (!args[0]) return message.reply("Provide username.");

            const userRes = await axios.post(
                "https://users.roblox.com/v1/usernames/users",
                { usernames: [args[0]] }
            );

            if (!userRes.data.data.length)
                return message.reply("User not found.");

            const userId = userRes.data.data[0].id;

            const [profile, friends, followers, badges, avatar] = await Promise.all([
                axios.get(`https://users.roblox.com/v1/users/${userId}`),
                axios.get(`https://friends.roblox.com/v1/users/${userId}/friends/count`),
                axios.get(`https://friends.roblox.com/v1/users/${userId}/followers/count`),
                axios.get(`https://badges.roblox.com/v1/users/${userId}/badges?limit=100`),
                axios.get(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=420x420&format=Png`)
            ]);

            const embed = new EmbedBuilder()
                .setTitle("🎮 ROBLOX BLACK OPS INTEL")
                .setColor("#111111")
                .setThumbnail(avatar.data.data[0].imageUrl)
                .addFields(
                    { name: "Username", value: profile.data.name, inline: true },
                    { name: "Display", value: profile.data.displayName, inline: true },
                    { name: "User ID", value: userId.toString(), inline: true },
                    { name: "Friends", value: friends.data.count.toString(), inline: true },
                    { name: "Followers", value: followers.data.count.toString(), inline: true },
                    { name: "Badges", value: badges.data.data.length.toString(), inline: true },
                    { name: "Created", value: new Date(profile.data.created).toLocaleString(), inline: false }
                )
                .setFooter({ text: "BLACK OPS INTELLIGENCE SYSTEM" });

            return message.reply({ embeds: [embed] });
        }

        // ================= DISCORD BLACK OPS =================
        if (command === "duser") {
            if (!args[0]) return message.reply("Provide Discord ID.");

            const user = await client.users.fetch(args[0], { force: true }).catch(() => null);
            if (!user) return message.reply("User not found.");

            const fullUser = await user.fetch();

            const embed = new EmbedBuilder()
                .setTitle("💬 DISCORD BLACK OPS INTEL")
                .setColor("#111111")
                .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 512 }))
                .addFields(
                    { name: "Tag", value: user.tag, inline: true },
                    { name: "User ID", value: user.id, inline: true },
                    { name: "Bot", value: user.bot ? "Yes" : "No", inline: true },
                    { name: "Created", value: user.createdAt.toLocaleString(), inline: false }
                )
                .setFooter({ text: "BLACK OPS INTELLIGENCE SYSTEM" });

            if (fullUser.banner)
                embed.setImage(user.bannerURL({ size: 1024 }));

            return message.reply({ embeds: [embed] });
        }

        // ================= IP BLACK OPS =================
        if (command === "iplookup") {
            if (!args[0]) return message.reply("Provide IP.");

            const res = await axios.get(`http://ip-api.com/json/${args[0]}?fields=66846719`);

            if (res.data.status !== "success")
                return message.reply("Invalid IP.");

            const embed = new EmbedBuilder()
                .setTitle("🌍 IP BLACK OPS INTEL")
                .setColor("#111111")
                .addFields(
                    { name: "IP", value: res.data.query, inline: true },
                    { name: "Country", value: res.data.country, inline: true },
                    { name: "City", value: res.data.city, inline: true },
                    { name: "ISP", value: res.data.isp, inline: true },
                    { name: "Hosting", value: res.data.hosting ? "Yes" : "No", inline: true },
                    { name: "Proxy/VPN", value: res.data.proxy ? "Yes" : "No", inline: true },
                    { name: "Timezone", value: res.data.timezone, inline: true }
                )
                .setFooter({ text: "BLACK OPS INTELLIGENCE SYSTEM" });

            return message.reply({ embeds: [embed] });
        }

        // ================= DOMAIN BLACK OPS =================
        if (command === "domain") {
            if (!args[0]) return message.reply("Provide domain.");

            const lookup = await dns.lookup(args[0]);
            const mx = await dns.resolveMx(args[0]).catch(() => []);

            const embed = new EmbedBuilder()
                .setTitle("🌐 DOMAIN BLACK OPS INTEL")
                .setColor("#111111")
                .addFields(
                    { name: "Domain", value: args[0], inline: true },
                    { name: "IP", value: lookup.address, inline: true },
                    { name: "MX Records", value: mx.length ? mx.map(m => m.exchange).join("\n") : "None", inline: false }
                )
                .setFooter({ text: "BLACK OPS INTELLIGENCE SYSTEM" });

            return message.reply({ embeds: [embed] });
        }

        // ================= EMAIL BLACK OPS =================
        if (command === "email") {
            if (!args[0] || !args[0].includes("@"))
                return message.reply("Provide valid email.");

            const email = args[0];
            const domain = email.split("@")[1];

            const lookup = await dns.lookup(domain).catch(() => null);
            const mx = await dns.resolveMx(domain).catch(() => []);

            const embed = new EmbedBuilder()
                .setTitle("📧 EMAIL BLACK OPS INTEL")
                .setColor("#111111")
                .addFields(
                    { name: "Email", value: email, inline: false },
                    { name: "Domain", value: domain, inline: true },
                    { name: "Domain IP", value: lookup ? lookup.address : "Unknown", inline: true },
                    { name: "MX Records", value: mx.length ? mx.map(m => m.exchange).join("\n") : "None", inline: false }
                )
                .setFooter({ text: "BLACK OPS INTELLIGENCE SYSTEM" });

            return message.reply({ embeds: [embed] });
        }

    } catch (err) {
        console.error(err);
        message.reply("⚠ Intelligence retrieval failed.");
    }
});

client.login(process.env.TOKEN);
