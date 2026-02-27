const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    PermissionsBitField
} = require("discord.js");

const fetch = require("node-fetch");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ]
});

const PREFIX = "!";

/* ================= PANEL BUILDER ================= */

function panel(title, fields = []) {
    return new EmbedBuilder()
        .setTitle(`🟥 INTELLIGENCE PROPERTY | ${title}`)
        .setColor("#000000")
        .addFields(fields)
        .setTimestamp();
}

/* ================= READY ================= */

client.once("ready", () => {
    console.log(`🟥 FINAL BOT ONLINE | ${client.user.tag}`);
});

/* ================= COMMAND SYSTEM ================= */

const commands = {};

/* =====================================================
   🔹 HELP
===================================================== */

commands.help = async (msg) => {
    const embed = panel("Command List", [
        { name: "Discord", value: "`userinfo avatar banner serverinfo membercount roleinfo permissions joinedat createdat botinfo`" },
        { name: "Roblox", value: "`robloxinfo robloxavatar robloxfriends robloxfollowers robloxfollowing robloxgroups robloxdescription robloxcreated robloxstatus robloxid`" },
        { name: "OSINT", value: "`iplookup geoip dnslookup whois httpheaders redirectcheck domainage reverseip subdomains pinghost`" }
    ]);
    msg.reply({ embeds: [embed] });
};

/* =====================================================
   🔹 DISCORD INTEL
===================================================== */

commands.userinfo = async (msg, args) => {
    let user = msg.mentions.users.first() || msg.author;

    if (args[0]) {
        try { user = await client.users.fetch(args[0]); }
        catch {}
    }

    const member = msg.guild.members.cache.get(user.id);

    const embed = panel("Discord User Profile", [
        { name: "Username", value: user.tag, inline: true },
        { name: "User ID", value: user.id, inline: true },
        { name: "Bot?", value: user.bot ? "Yes" : "No", inline: true },
        { name: "Created", value: `<t:${Math.floor(user.createdTimestamp/1000)}:F>` },
        { name: "Account Age (days)", value: Math.floor((Date.now()-user.createdTimestamp)/86400000).toString(), inline:true },
        { name: "Joined Server", value: member ? `<t:${Math.floor(member.joinedTimestamp/1000)}:F>` : "Not in server" }
    ]).setThumbnail(user.displayAvatarURL({ dynamic:true, size:512 }));

    msg.reply({ embeds: [embed] });
};

commands.avatar = async (msg) => {
    const user = msg.mentions.users.first() || msg.author;
    msg.reply(user.displayAvatarURL({ dynamic:true, size:1024 }));
};

commands.banner = async (msg) => {
    const user = msg.mentions.users.first() || msg.author;
    const fetched = await client.users.fetch(user.id, { force:true });
    if (!fetched.banner) return msg.reply("No banner.");
    msg.reply(`https://cdn.discordapp.com/banners/${user.id}/${fetched.banner}?size=1024`);
};

commands.serverinfo = async (msg) => {
    const g = msg.guild;
    const embed = panel("Server Info", [
        { name:"Name", value:g.name, inline:true },
        { name:"ID", value:g.id, inline:true },
        { name:"Members", value:g.memberCount.toString(), inline:true },
        { name:"Boosts", value:g.premiumSubscriptionCount.toString(), inline:true },
        { name:"Created", value:`<t:${Math.floor(g.createdTimestamp/1000)}:F>` }
    ]).setThumbnail(g.iconURL({ dynamic:true }));

    msg.reply({ embeds:[embed] });
};

commands.membercount = async (msg) => msg.reply(`Members: ${msg.guild.memberCount}`);

commands.roleinfo = async (msg) => {
    const role = msg.mentions.roles.first();
    if (!role) return msg.reply("Mention a role.");
    const embed = panel("Role Info", [
        { name:"Name", value:role.name, inline:true },
        { name:"ID", value:role.id, inline:true },
        { name:"Members", value:role.members.size.toString(), inline:true }
    ]);
    msg.reply({ embeds:[embed] });
};

commands.permissions = async (msg) => {
    const member = msg.mentions.members.first() || msg.member;
    msg.reply(member.permissions.toArray().join(", ").substring(0,1900));
};

commands.joinedat = async (msg) => {
    const member = msg.mentions.members.first() || msg.member;
    msg.reply(`<t:${Math.floor(member.joinedTimestamp/1000)}:F>`);
};

commands.createdat = async (msg) => {
    const user = msg.mentions.users.first() || msg.author;
    msg.reply(`<t:${Math.floor(user.createdTimestamp/1000)}:F>`);
};

commands.botinfo = async (msg) => {
    const embed = panel("Bot Info", [
        { name:"Ping", value:client.ws.ping + "ms", inline:true },
        { name:"Servers", value:client.guilds.cache.size.toString(), inline:true }
    ]);
    msg.reply({ embeds:[embed] });
};

/* =====================================================
   🔹 ROBLOX INTEL
===================================================== */

async function getRobloxId(username) {
    const res = await fetch("https://users.roblox.com/v1/usernames/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames: [username] })
    });
    const data = await res.json();
    if (!data.data.length) return null;
    return data.data[0].id;
}

commands.robloxinfo = async (msg, args) => {
    if (!args[0]) return msg.reply("Provide username.");
    const id = await getRobloxId(args[0]);
    if (!id) return msg.reply("User not found.");

    const info = await fetch(`https://users.roblox.com/v1/users/${id}`).then(r=>r.json());
    const friends = await fetch(`https://friends.roblox.com/v1/users/${id}/friends/count`).then(r=>r.json());
    const followers = await fetch(`https://friends.roblox.com/v1/users/${id}/followers/count`).then(r=>r.json());
    const following = await fetch(`https://friends.roblox.com/v1/users/${id}/followings/count`).then(r=>r.json());
    const groups = await fetch(`https://groups.roblox.com/v2/users/${id}/groups/roles`).then(r=>r.json());

    const embed = panel("Roblox Profile", [
        { name:"Username", value:info.name, inline:true },
        { name:"Display Name", value:info.displayName, inline:true },
        { name:"User ID", value:id.toString(), inline:true },
        { name:"Created", value:new Date(info.created).toDateString() },
        { name:"Friends", value:friends.count.toString(), inline:true },
        { name:"Followers", value:followers.count.toString(), inline:true },
        { name:"Following", value:following.count.toString(), inline:true },
        { name:"Groups", value:groups.data.length.toString(), inline:true }
    ]).setThumbnail(`https://www.roblox.com/headshot-thumbnail/image?userId=${id}&width=420&height=420&format=png`);

    msg.reply({ embeds:[embed] });
};

commands.robloxavatar = async (msg,args)=>{
    if(!args[0]) return msg.reply("Provide username.");
    const id = await getRobloxId(args[0]);
    msg.reply(`https://www.roblox.com/headshot-thumbnail/image?userId=${id}&width=420&height=420&format=png`);
};

commands.robloxfriends = async (msg,args)=>{
    if(!args[0]) return msg.reply("Provide username.");
    const id = await getRobloxId(args[0]);
    const data = await fetch(`https://friends.roblox.com/v1/users/${id}/friends/count`).then(r=>r.json());
    msg.reply(`Friends: ${data.count}`);
};

commands.robloxfollowers = async (msg,args)=>{
    if(!args[0]) return msg.reply("Provide username.");
    const id = await getRobloxId(args[0]);
    const data = await fetch(`https://friends.roblox.com/v1/users/${id}/followers/count`).then(r=>r.json());
    msg.reply(`Followers: ${data.count}`);
};

commands.robloxfollowing = async (msg,args)=>{
    if(!args[0]) return msg.reply("Provide username.");
    const id = await getRobloxId(args[0]);
    const data = await fetch(`https://friends.roblox.com/v1/users/${id}/followings/count`).then(r=>r.json());
    msg.reply(`Following: ${data.count}`);
};

commands.robloxgroups = async (msg,args)=>{
    if(!args[0]) return msg.reply("Provide username.");
    const id = await getRobloxId(args[0]);
    const data = await fetch(`https://groups.roblox.com/v2/users/${id}/groups/roles`).then(r=>r.json());
    msg.reply(`Groups: ${data.data.length}`);
};

commands.robloxdescription = async (msg,args)=>{
    if(!args[0]) return msg.reply("Provide username.");
    const id = await getRobloxId(args[0]);
    const info = await fetch(`https://users.roblox.com/v1/users/${id}`).then(r=>r.json());
    msg.reply(info.description || "No description.");
};

commands.robloxcreated = async (msg,args)=>{
    if(!args[0]) return msg.reply("Provide username.");
    const id = await getRobloxId(args[0]);
    const info = await fetch(`https://users.roblox.com/v1/users/${id}`).then(r=>r.json());
    msg.reply(new Date(info.created).toDateString());
};

commands.robloxstatus = async (msg,args)=>{
    if(!args[0]) return msg.reply("Provide username.");
    const id = await getRobloxId(args[0]);
    const data = await fetch(`https://presence.roblox.com/v1/presence/users`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({userIds:[id]})
    }).then(r=>r.json());
    msg.reply(`Presence Type: ${data.userPresences[0].userPresenceType}`);
};

commands.robloxid = async (msg,args)=>{
    if(!args[0]) return msg.reply("Provide username.");
    const id = await getRobloxId(args[0]);
    msg.reply(`User ID: ${id}`);
};

/* =====================================================
   🔹 OSINT
===================================================== */

commands.iplookup = async (msg,args)=>{
    if(!args[0]) return msg.reply("Provide IP.");
    const data = await fetch(`http://ip-api.com/json/${args[0]}`).then(r=>r.json());
    msg.reply("```json\n"+JSON.stringify(data,null,2)+"\n```");
};

commands.geoip = commands.iplookup;

commands.dnslookup = async (msg,args)=>{
    if(!args[0]) return msg.reply("Provide domain.");
    const data = await fetch(`https://dns.google/resolve?name=${args[0]}`).then(r=>r.json());
    msg.reply("```json\n"+JSON.stringify(data,null,2)+"\n```");
};

commands.whois = async (msg,args)=>{
    if(!args[0]) return msg.reply("Provide domain.");
    const data = await fetch(`https://api.hackertarget.com/whois/?q=${args[0]}`).then(r=>r.text());
    msg.reply("```"+data.substring(0,1900)+"```");
};

commands.httpheaders = async (msg,args)=>{
    if(!args[0]) return msg.reply("Provide URL.");
    const res = await fetch(args[0]);
    msg.reply("```json\n"+JSON.stringify(res.headers.raw(),null,2)+"\n```");
};

commands.redirectcheck = async (msg,args)=>{
    if(!args[0]) return msg.reply("Provide URL.");
    const res = await fetch(args[0],{redirect:"manual"});
    msg.reply(`Status: ${res.status}`);
};

commands.domainage = async (msg,args)=>{
    if(!args[0]) return msg.reply("Provide domain.");
    const data = await fetch(`https://api.hackertarget.com/whois/?q=${args[0]}`).then(r=>r.text());
    msg.reply(data.includes("Creation Date") ? "Creation date found in WHOIS." : "Not found.");
};

commands.reverseip = async (msg,args)=>{
    if(!args[0]) return msg.reply("Provide IP.");
    const data = await fetch(`https://api.hackertarget.com/reverseiplookup/?q=${args[0]}`).then(r=>r.text());
    msg.reply("```"+data.substring(0,1900)+"```");
};

commands.subdomains = async (msg,args)=>{
    if(!args[0]) return msg.reply("Provide domain.");
    const data = await fetch(`https://api.hackertarget.com/hostsearch/?q=${args[0]}`).then(r=>r.text());
    msg.reply("```"+data.substring(0,1900)+"```");
};

commands.pinghost = async (msg,args)=>{
    if(!args[0]) return msg.reply("Provide host.");
    const data = await fetch(`https://api.hackertarget.com/nping/?q=${args[0]}`).then(r=>r.text());
    msg.reply("```"+data.substring(0,1900)+"```");
};

/* ================= HANDLER ================= */

client.on("messageCreate", async (msg)=>{
    if(msg.author.bot) return;
    if(!msg.content.startsWith(PREFIX)) return;

    const args = msg.content.slice(PREFIX.length).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    if(!commands[cmd]) return msg.reply("Unknown command.");

    try {
        await commands[cmd](msg,args);
    } catch(err){
        console.error(err);
        msg.reply("Error executing command.");
    }
});

client.login(process.env.TOKEN);
