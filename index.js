const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const axios = require("axios");

const PREFIX = "!";
const OWNER_ID = process.env.OWNER_ID;

let TEAM = [OWNER_ID];

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once("clientReady", () => {
  console.log(`Online → ${client.user.tag}`);
});

/* SIMPLE OFFLINE AI */

function aiResponse(msg) {

msg = msg.toLowerCase();

if(msg.includes("hello") || msg.includes("hi"))
return "Greetings Lord Optic. How may I assist you?";

if(msg.includes("commands"))
return "Lord Optic, use **!help** to see my command list.";

if(msg.includes("who are you"))
return "I am your intelligence assistant bot, Lord Optic.";

if(msg.includes("roblox"))
return "Lord Optic, use **!rlookup username** to inspect a Roblox account.";

return "Understood, Lord Optic.";
}

client.on("messageCreate", async (message) => {

if(message.author.bot) return;

/* AUTO REPLY IF DM OR MENTION */

if(
message.channel.type === 1 ||
message.mentions.has(client.user)
){
if(!message.content.startsWith(PREFIX)){
return message.reply(aiResponse(message.content));
}
}

/* COMMAND SYSTEM */

if(!message.content.startsWith(PREFIX)) return;

const args = message.content.slice(PREFIX.length).trim().split(/ +/);
const command = args.shift().toLowerCase();

/* HELP */

if(command === "help"){

const embed = new EmbedBuilder()

.setTitle("🧠 Intelligence Bot Command List")

.setColor("Red")

.setDescription(`
**Core**
!help → show command list  
!ping → bot latency  
!botinfo → bot statistics  

**Profile Tools**
!avatar [@user] → view avatar  
!banner [@user] → view banner  

**Intelligence**
!dlookup [@user/id] → Discord account lookup  
!rlookup [username] → Roblox profile lookup  

**OSINT**
!scan [username] → scan username across sites  

**AI**
!ask [question] → talk to bot  

**Admin**
!grant @user → add team member  
!revoke @user → remove team member  
!team → show team list
`);

return message.reply({embeds:[embed]});
}

/* PING */

if(command === "ping"){
return message.reply(`🏓 Pong → ${client.ws.ping}ms`);
}

/* BOT INFO */

if(command === "botinfo"){

const embed = new EmbedBuilder()

.setTitle("Bot Statistics")

.setColor("Blue")

.addFields(
{name:"Servers",value:`${client.guilds.cache.size}`,inline:true},
{name:"Users",value:`${client.users.cache.size}`,inline:true},
{name:"Ping",value:`${client.ws.ping}ms`,inline:true}
);

return message.reply({embeds:[embed]});
}

/* AVATAR */

if(command === "avatar"){

const user = message.mentions.users.first() || message.author;

const embed = new EmbedBuilder()

.setTitle(`${user.username}'s Avatar`)

.setImage(user.displayAvatarURL({size:1024}))

.setColor("Purple");

return message.reply({embeds:[embed]});
}

/* BANNER */

if(command === "banner"){

const user = message.mentions.users.first() || message.author;

const fetched = await client.users.fetch(user.id,{force:true});

if(!fetched.banner)
return message.reply("No banner found.");

const embed = new EmbedBuilder()

.setTitle(`${fetched.username}'s Banner`)

.setImage(fetched.bannerURL({size:1024}));

return message.reply({embeds:[embed]});
}

/* DISCORD LOOKUP */

if(command === "dlookup"){

let user;

if(message.mentions.users.first())
user = message.mentions.users.first();

else if(args[0])
user = await client.users.fetch(args[0]).catch(()=>null);

else
user = message.author;

if(!user)
return message.reply("User not found.");

const embed = new EmbedBuilder()

.setTitle("🔎 Discord User Lookup")

.setThumbnail(user.displayAvatarURL())

.setColor("Purple")

.addFields(
{name:"Username",value:user.tag,inline:true},
{name:"User ID",value:user.id,inline:true},
{name:"Bot",value:`${user.bot}`,inline:true},
{name:"Account Created",value:`<t:${Math.floor(user.createdTimestamp/1000)}:R>`,inline:true}
);

return message.reply({embeds:[embed]});
}

/* ROBLOX LOOKUP */

if(command === "rlookup"){

if(!args[0])
return message.reply("Provide a Roblox username.");

try{

const res = await axios.post(
"https://users.roblox.com/v1/usernames/users",
{usernames:[args[0]]}
);

const user = res.data.data[0];

if(!user)
return message.reply("User not found.");

const avatar = await axios.get(
`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=420x420&format=Png`
);

const embed = new EmbedBuilder()

.setTitle("🎮 Roblox Profile")

.setURL(`https://www.roblox.com/users/${user.id}/profile`)

.setThumbnail(avatar.data.data[0].imageUrl)

.setColor("Green")

.addFields(
{name:"Username",value:user.name,inline:true},
{name:"Display Name",value:user.displayName,inline:true},
{name:"User ID",value:`${user.id}`,inline:true}
);

return message.reply({embeds:[embed]});

}catch{

return message.reply("Roblox lookup failed.");

}

}

/* USERNAME SCAN */

if(command === "scan"){

if(!args[0])
return message.reply("Provide username.");

const u = args[0];

const sites=[

`https://github.com/${u}`,
`https://twitter.com/${u}`,
`https://reddit.com/u/${u}`,
`https://instagram.com/${u}`,
`https://twitch.tv/${u}`,
`https://youtube.com/@${u}`,
`https://tiktok.com/@${u}`,
`https://pinterest.com/${u}`,
`https://soundcloud.com/${u}`,
`https://steamcommunity.com/id/${u}`

];

const embed=new EmbedBuilder()

.setTitle("🌐 Username OSINT Scan")

.setColor("Orange")

.setDescription(sites.join("\n"));

return message.reply({embeds:[embed]});
}

/* ASK */

if(command === "ask"){

const question=args.join(" ");

if(!question)
return message.reply("Ask something, Lord Optic.");

return message.reply(aiResponse(question));
}

/* TEAM SYSTEM */

if(command === "grant"){

if(message.author.id!==OWNER_ID)
return message.reply("Owner only.");

const user=message.mentions.users.first();

if(!user)
return message.reply("Mention a user.");

TEAM.push(user.id);

return message.reply(`${user.tag} added to the team.`);
}

if(command === "revoke"){

if(message.author.id!==OWNER_ID)
return message.reply("Owner only.");

const user=message.mentions.users.first();

TEAM=TEAM.filter(id=>id!==user.id);

return message.reply(`${user.tag} removed from team.`);
}

if(command==="team"){

const list=TEAM.map(id=>`<@${id}>`).join("\n");

const embed=new EmbedBuilder()

.setTitle("👑 Bot Team")

.setColor("Yellow")

.setDescription(list);

return message.reply({embeds:[embed]});
}

});

client.login(process.env.TOKEN);
