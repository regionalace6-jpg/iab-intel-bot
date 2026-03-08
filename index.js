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

/* SIMPLE AI */

function aiResponse(msg){

msg = msg.toLowerCase();

if(msg.includes("hello") || msg.includes("hi"))
return "Greetings Lord Optic.";

if(msg.includes("commands"))
return "Lord Optic, use !help to see my commands.";

if(msg.includes("who are you"))
return "I am your intelligence assistant bot, Lord Optic.";

if(msg.includes("help"))
return "Lord Optic, try !help.";

return "Understood Lord Optic.";
}

client.on("messageCreate", async (message) => {

if(message.author.bot) return;

/* AUTO AI (DM OR MENTION) */

if(
message.channel.type === 1 ||
message.mentions.has(client.user)
){

if(!message.content.startsWith(PREFIX)){

const reply = aiResponse(message.content);
return message.reply(reply);

}

}

/* COMMAND SYSTEM */

if(!message.content.startsWith(PREFIX)) return;

const args = message.content.slice(PREFIX.length).trim().split(/ +/);
const command = args.shift().toLowerCase();

/* HELP */

if(command === "help"){

const embed = new EmbedBuilder()

.setTitle("🧠 Intelligence Bot")

.setDescription(`
!help → command list

!ping → latency
!botinfo → bot stats

!avatar
!banner

!dlookup
!rlookup

!scan
!usersearch

!ask
`)

.setColor("Red");

return message.reply({embeds:[embed]});
}

/* PING */

if(command === "ping"){
return message.reply(`Pong ${client.ws.ping}ms`);
}

/* BOT INFO */

if(command === "botinfo"){

const embed = new EmbedBuilder()

.setTitle("Bot Statistics")

.addFields(
{name:"Servers",value:`${client.guilds.cache.size}`,inline:true},
{name:"Users",value:`${client.users.cache.size}`,inline:true},
{name:"Ping",value:`${client.ws.ping}ms`,inline:true}
)

.setColor("Blue");

return message.reply({embeds:[embed]});
}

/* AVATAR */

if(command === "avatar"){

const user = message.mentions.users.first() || message.author;

const embed = new EmbedBuilder()

.setTitle(`${user.username}'s Avatar`)

.setImage(user.displayAvatarURL({size:1024}));

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

.setTitle("Discord User Lookup")

.setThumbnail(user.displayAvatarURL())

.addFields(
{name:"Username",value:user.tag,inline:true},
{name:"User ID",value:user.id,inline:true},
{name:"Bot",value:`${user.bot}`,inline:true},
{name:"Created",value:`<t:${Math.floor(user.createdTimestamp/1000)}:R>`,inline:true}
)

.setColor("Purple");

return message.reply({embeds:[embed]});
}

/* ROBLOX LOOKUP */

if(command === "rlookup"){

if(!args[0])
return message.reply("Provide Roblox username.");

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

.setTitle("Roblox Profile")

.setURL(`https://www.roblox.com/users/${user.id}/profile`)

.setThumbnail(avatar.data.data[0].imageUrl)

.addFields(
{name:"Username",value:user.name,inline:true},
{name:"Display Name",value:user.displayName,inline:true},
{name:"User ID",value:`${user.id}`,inline:true}
)

.setColor("Green");

return message.reply({embeds:[embed]});

}catch{

return message.reply("Roblox lookup failed.");

}

}

/* USERNAME SCAN */

if(command === "scan" || command === "usersearch"){

if(!args[0])
return message.reply("Provide username.");

const u = args[0];

const sites = [

`https://github.com/${u}`,
`https://twitter.com/${u}`,
`https://reddit.com/u/${u}`,
`https://instagram.com/${u}`,
`https://twitch.tv/${u}`,
`https://youtube.com/@${u}`,
`https://tiktok.com/@${u}`,
`https://pinterest.com/${u}`,
`https://soundcloud.com/${u}`

];

const embed = new EmbedBuilder()

.setTitle("Username OSINT Scan")

.setDescription(sites.join("\n"))

.setColor("Orange");

return message.reply({embeds:[embed]});
}

/* AI COMMAND */

if(command === "ask"){

const question = args.join(" ");

if(!question)
return message.reply("Ask something Lord Optic.");

return message.reply(aiResponse(question));
}

});

client.login(process.env.TOKEN);
