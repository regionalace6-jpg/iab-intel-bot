// index.js - Advanced Intelligence Bot
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const fetch = (...args) => import("node-fetch").then(({default: fetch}) => fetch(...args));

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const PREFIX = "!";

const commands = {};

// =======================
// PANEL BUILDER
// =======================
function Panel(title, fields = []) {
  return new EmbedBuilder()
    .setTitle(`🟥 INTELLIGENCE PROPERTY | ${title}`)
    .addFields(fields)
    .setColor("#000000")
    .setTimestamp();
}

// =======================
// HELP COMMAND
// =======================
commands.help = async msg => {
  const categories = [
    {name:"[Discord] Commands", start:1, end:25},
    {name:"[Roblox] Commands", start:26, end:50},
    {name:"[OSINT] Commands", start:51, end:75},
    {name:"[Utility] Commands", start:76, end:100}
  ];

  let helpText = "";
  for (const cat of categories) {
    helpText += `**${cat.name}**\n`;
    for (let i=cat.start;i<=cat.end;i++) helpText += `${i}. !${cat.name.split(' ')[0].toLowerCase()}${i-cat.start+1}\n`;
    helpText += "\n";
  }

  msg.reply({embeds:[Panel("Help Commands", [{name:"Commands", value:helpText}])]});
};

// =======================
// DISCORD INFO COMMANDS (1-25)
// =======================

// 1-25 as previously defined
// For brevity, example commands:
commands.userinfo = async (msg, args) => {
  let user;
  try {
    if (msg.mentions.users.first()) user = msg.mentions.users.first();
    else if (args[0]) user = await client.users.fetch(args[0]);
    else user = msg.author;
  } catch { return msg.reply("❌ User not found."); }
  const member = msg.guild?.members.cache.get(user.id);
  const accountAge = Math.floor((Date.now()-user.createdTimestamp)/86400000);
  const embed = Panel(`Discord Userinfo | ${user.tag}`, [
    {name:"Username", value:user.tag, inline:true},
    {name:"User ID", value:user.id, inline:true},
    {name:"Bot?", value:user.bot?"Yes":"No", inline:true},
    {name:"Created", value:`<t:${Math.floor(user.createdTimestamp/1000)}:F>`},
    {name:"Account Age", value:`${accountAge} days`, inline:true},
    {name:"Server Joined", value:member?`<t:${Math.floor(member.joinedTimestamp/1000)}:F>`:"Not in server"}
  ]);
  msg.reply({embeds:[embed]});
};

commands.avatar = async (msg, args) => {
  try {
    const user = msg.mentions.users.first() || (args[0] ? await client.users.fetch(args[0]) : msg.author);
    msg.reply(user.displayAvatarURL({dynamic:true, size:1024}));
  } catch { msg.reply("❌ Could not fetch avatar."); }
};

// ...Other Discord commands 3-25 would be similarly defined, including muted, boosted, hoistedrole, etc.

// =======================
// ROBLOX COMMANDS (26-50)
// =======================
commands.robloxinfo = async (msg, args) => {
  if(!args[0]) return msg.reply("Provide Roblox username or ID");
  try {
    let target = args[0];
    if(isNaN(target)){
      const res = await fetch("https://users.roblox.com/v1/usernames/users", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({usernames:[target]})
      });
      const data = await res.json();
      if(!data.data.length) return msg.reply("User not found");
      target = data.data[0].id;
    }
    const info = await fetch(`https://users.roblox.com/v1/users/${target}`).then(r=>r.json());
    const avatar = `https://www.roblox.com/headshot-thumbnail/image?userId=${target}&width=420&height=420&format=png`;
    const embed = Panel(`Roblox Userinfo | ${info.name}`, [
      {name:"Username", value:info.name, inline:true},
      {name:"Display Name", value:info.displayName || "Unknown", inline:true},
      {name:"Created", value:new Date(info.created).toDateString(), inline:true}
    ]);
    embed.setThumbnail(avatar);
    msg.reply({embeds:[embed]});
  } catch { msg.reply("Roblox lookup failed"); }
};

// ...Other Roblox commands (27-50) follow similar pattern: friends, groups, followers, following, etc.

// =======================
// OSINT COMMANDS (51-75)
// =======================
commands.iplookup = async (msg, args) => {
  if(!args[0]) return msg.reply("Provide IP");
  const data = await fetch(`http://ip-api.com/json/${args[0]}`).then(r=>r.json());
  msg.reply({embeds:[Panel("IP Lookup", [{name:args[0], value:"```json\n"+JSON.stringify(data,null,2)+"\n```"}])]});
};

// ...Other OSINT commands: DNS lookup, WHOIS, username search, email leaks, phone lookup, etc.

// =======================
// UTILITY COMMANDS (76-100)
// =======================
commands.ping = async (msg) => msg.reply(`🏴 Ping: ${client.ws.ping}ms`);
commands.iq = async (msg) => msg.reply(`🧠 IQ: ${Math.floor(Math.random()*100)+1}`);
commands.quote = async (msg) => {
  const quotes = ["Knowledge is power","Data wins silently","Observe before acting"];
  msg.reply("🧠 "+quotes[Math.floor(Math.random()*quotes.length)]);
};

// ...Other Utility commands: flip, dice, uptime, serverstats, random fact, crypto price (public), stock price (public), etc.

// =======================
// MESSAGE HANDLER
// =======================
client.on("messageCreate", async msg => {
  if(msg.author.bot) return;
  if(!msg.content.startsWith(PREFIX)) return;

  const args = msg.content.slice(PREFIX.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();
  try {
    if(commands[cmd]) await commands[cmd](msg, args);
    else msg.reply("❌ Unknown Command");
  } catch(err){
    console.error(err);
    msg.reply("❌ Command execution failed");
  }
});

// =======================
// READY
// =======================
client.once("ready", ()=>console.log(`🟥 INTELLIGENCE PROPERTY ONLINE | ${client.user.tag}`));
client.login(process.env.TOKEN);
