const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const fetch = (...args) => import("node-fetch").then(({default: fetch}) => fetch(...args));

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const PREFIX = "!";

// ---------------- HELP COMMAND ----------------
const commands = {};

commands.help = async (msg) => {
  const helpList = [
    // Discord Info
    "!userinfo <ID or mention> - Full Discord info",
    "!avatar <ID or mention> - Shows avatar",
    "!banner <ID or mention> - Shows banner",
    "!joinedat <ID or mention> - Server join date",
    "!createdat <ID or mention> - Account creation date",
    "!botinfo - Bot stats",

    // Roblox Info
    "!robloxinfo <username or ID> - Roblox profile",
    "!robloxavatar <username or ID> - Roblox avatar",
    "!robloxfriends <username or ID> - Friends count",
    "!robloxfollowers <username or ID> - Followers count",
    "!robloxfollowing <username or ID> - Following count",
    "!robloxgroups <username or ID> - Groups count",
    "!robloxcreated <username or ID> - Account creation date",
    "!robloxid <username> - Get Roblox ID",

    // OSINT Tools
    "!iplookup <IP> - IP location info",
    "!dnslookup <domain> - DNS info",
    "!whois <domain> - Domain WHOIS",
    "!httpheaders <URL> - HTTP headers",
    "!redirectcheck <URL> - Redirect chain",
    "!domainage <domain> - Domain age",
    "!reverseip <IP> - Domains on IP",
    "!subdomains <domain> - Subdomains",
    "!pinghost <host> - Check if host is up",
    "!intel <ID or mention> [robloxUsername] - All-in-one panel"
  ];

  const embed = new EmbedBuilder()
    .setTitle("🟥 INTELLIGENCE PROPERTY COMMANDS")
    .setDescription(helpList.map((c, i) => `${i+1}. ${c}`).join("\n"))
    .setColor("#000000")
    .setTimestamp();

  msg.reply({ embeds: [embed] });
};

// ---------------- DISCORD USERINFO ----------------
commands.userinfo = async (msg, args) => {
  let user;
  if(args[0]) {
    try { user = await client.users.fetch(args[0]); } catch { user = msg.author; }
  } else {
    user = msg.mentions.users.first() || msg.author;
  }

  const member = msg.guild.members.cache.get(user.id);
  const accountAge = Math.floor((Date.now() - user.createdTimestamp)/86400000);
  const serverJoinAge = member ? Math.floor((Date.now() - member.joinedTimestamp)/86400000) : "N/A";

  const embed = new EmbedBuilder()
    .setTitle(`🟥 Discord Intelligence Profile | ${user.tag}`)
    .setThumbnail(user.displayAvatarURL({dynamic:true, size:512}))
    .addFields([
      {name:"Username", value:user.tag, inline:true},
      {name:"User ID", value:user.id, inline:true},
      {name:"Bot?", value:user.bot ? "Yes" : "No", inline:true},
      {name:"Account Created", value:`<t:${Math.floor(user.createdTimestamp/1000)}:F>`},
      {name:"Account Age", value:accountAge+" days", inline:true},
      {name:"Server Joined", value: member ? `<t:${Math.floor(member.joinedTimestamp/1000)}:F>` : "N/A"},
      {name:"Server Join Age", value: serverJoinAge+" days", inline:true}
    ])
    .setColor("#000000")
    .setTimestamp();

  msg.reply({ embeds: [embed] });
};

// ---------------- ROBLOX INFO ----------------
async function getRobloxData(username) {
  try {
    let targetId;
    if(isNaN(username)) {
      const res = await fetch("https://users.roblox.com/v1/usernames/users", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({usernames:[username]})
      });
      const data = await res.json();
      if(!data.data.length) return null;
      targetId = data.data[0].id;
    } else {
      targetId = username;
    }

    const info = await fetch(`https://users.roblox.com/v1/users/${targetId}`).then(r=>r.json());
    const avatar = `https://www.roblox.com/headshot-thumbnail/image?userId=${targetId}&width=420&height=420&format=png`;

    const friends = await fetch(`https://friends.roblox.com/v1/users/${targetId}/friends/count`).then(r=>r.json());
    const followers = await fetch(`https://friends.roblox.com/v1/users/${targetId}/followers/count`).then(r=>r.json());
    const following = await fetch(`https://friends.roblox.com/v1/users/${targetId}/followings/count`).then(r=>r.json());
    const groups = await fetch(`https://groups.roblox.com/v2/users/${targetId}/groups/roles`).then(r=>r.json());

    return {
      id: targetId,
      info,
      avatar,
      friends: friends.count,
      followers: followers.count,
      following: following.count,
      groups: groups.data.length
    };
  } catch(e) {
    return null;
  }
}

commands.robloxinfo = async (msg, args) => {
  if(!args[0]) return msg.reply("Provide Roblox username or ID");
  const data = await getRobloxData(args[0]);
  if(!data) return msg.reply("Roblox user not found");

  const embed = new EmbedBuilder()
    .setTitle(`🟥 Roblox Profile | ${data.info.name}`)
    .setThumbnail(data.avatar)
    .addFields([
      {name:"Username", value:data.info.name, inline:true},
      {name:"Display Name", value:data.info.displayName, inline:true},
      {name:"User ID", value:data.id.toString(), inline:true},
      {name:"Friends", value:data.friends.toString(), inline:true},
      {name:"Followers", value:data.followers.toString(), inline:true},
      {name:"Following", value:data.following.toString(), inline:true},
      {name:"Groups", value:data.groups.toString(), inline:true},
      {name:"Created", value:new Date(data.info.created).toDateString(), inline:true}
    ])
    .setColor("#000000")
    .setTimestamp();

  msg.reply({ embeds:[embed] });
};

// ---------------- INTEL PANEL ----------------
commands.intel = async (msg, args) => {
  let user;
  if(args[0]) {
    try { user = await client.users.fetch(args[0]); } catch { user = msg.author; }
  } else {
    user = msg.mentions.users.first() || msg.author;
  }

  const member = msg.guild.members.cache.get(user.id);
  const accountAge = Math.floor((Date.now() - user.createdTimestamp)/86400000);
  const serverJoinAge = member ? Math.floor((Date.now() - member.joinedTimestamp)/86400000) : "N/A";

  let robloxData = null;
  if(args[1]) robloxData = await getRobloxData(args[1]);

  const embed = new EmbedBuilder()
    .setTitle(`🟥 INTELLIGENCE DASHBOARD | ${user.tag}`)
    .setThumbnail(user.displayAvatarURL({dynamic:true, size:512}))
    .setColor("#000000")
    .addFields([
      {name:"Discord Username", value:user.tag, inline:true},
      {name:"User ID", value:user.id, inline:true},
      {name:"Bot?", value:user.bot ? "Yes" : "No", inline:true},
      {name:"Account Created", value:`<t:${Math.floor(user.createdTimestamp/1000)}:F>`},
      {name:"Account Age", value:accountAge+" days", inline:true},
      {name:"Server Joined", value:member ? `<t:${Math.floor(member.joinedTimestamp/1000)}:F>` : "N/A"},
      {name:"Server Join Age", value:serverJoinAge+" days", inline:true},
      {name:"Roblox Username", value: robloxData ? robloxData.info.name : "N/A", inline:true},
      {name:"Display Name", value: robloxData ? robloxData.info.displayName : "N/A", inline:true},
      {name:"Roblox ID", value: robloxData ? robloxData.id.toString() : "N/A", inline:true},
      {name:"Friends", value: robloxData ? robloxData.friends.toString() : "N/A", inline:true},
      {name:"Followers", value: robloxData ? robloxData.followers.toString() : "N/A", inline:true},
      {name:"Following", value: robloxData ? robloxData.following.toString() : "N/A", inline:true},
      {name:"Groups", value: robloxData ? robloxData.groups.toString() : "N/A", inline:true},
      {name:"Roblox Created", value: robloxData ? new Date(robloxData.info.created).toDateString() : "N/A", inline:true}
    ])
    .setImage(robloxData ? robloxData.avatar : null)
    .setTimestamp();

  msg.reply({ embeds:[embed] });
};

// ---------------- MESSAGE HANDLER ----------------
client.on("messageCreate", async msg => {
  if(msg.author.bot) return;
  if(!msg.content.startsWith(PREFIX)) return;

  const args = msg.content.slice(PREFIX.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  if(commands[cmd]) {
    try { await commands[cmd](msg, args); } catch(e){ msg.reply("Command failed"); console.log(e); }
  } else msg.reply("Unknown command. Use !help");
});

// ---------------- READY ----------------
client.once("ready", () => {
  console.log(`🟥 INTELLIGENCE PROPERTY ONLINE | ${client.user.tag}`);
});

client.login(process.env.TOKEN);
