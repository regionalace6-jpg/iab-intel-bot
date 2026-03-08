const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const axios = require("axios");

const PREFIX = "!";
const OWNER_ID = process.env.OWNER_ID;

let TEAM = [OWNER_ID];

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ]
});

client.once("clientReady", () => {
  console.log(`Online → ${client.user.tag}`);
});

/* SIMPLE OFFLINE AI */

function aiResponse(question) {

  question = question.toLowerCase();

  if (question.includes("hello") || question.includes("hi"))
    return "Greetings Lord Optic. How may I assist you today?";

  if (question.includes("commands"))
    return "Lord Optic, use !help to see all available commands.";

  if (question.includes("who are you"))
    return "I am your intelligence assistant bot, Lord Optic.";

  if (question.includes("roblox"))
    return "Lord Optic, you can lookup Roblox users using !rlookup username.";

  return "Lord Optic, I am still learning. Try using !help to explore my commands.";
}

client.on("messageCreate", async (message) => {

  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  /* HELP */

  if (command === "help") {

    const embed = new EmbedBuilder()
    .setTitle("Intelligence Bot Commands")
    .setColor("Red")
    .setDescription(`
!help → command list

!ping → latency
!botinfo → bot stats

!avatar [user]
!banner [user]

!dlookup [user/id]
!rlookup [username]

!usersearch [username]
!scan [username]

!ask [question]

!grant @user
!revoke @user
!team
`);

    return message.reply({ embeds: [embed] });
  }

  /* PING */

  if (command === "ping")
    return message.reply(`Pong: ${client.ws.ping}ms`);

  /* BOT INFO */

  if (command === "botinfo") {

    const embed = new EmbedBuilder()
    .setTitle("Bot Info")
    .addFields(
      { name: "Servers", value: `${client.guilds.cache.size}`, inline: true },
      { name: "Users", value: `${client.users.cache.size}`, inline: true },
      { name: "Ping", value: `${client.ws.ping}ms`, inline: true }
    );

    return message.reply({ embeds: [embed] });
  }

  /* AVATAR */

  if (command === "avatar") {

    const user = message.mentions.users.first() || message.author;

    const embed = new EmbedBuilder()
    .setTitle(`${user.username}'s Avatar`)
    .setImage(user.displayAvatarURL({ size: 1024 }));

    return message.reply({ embeds: [embed] });
  }

  /* BANNER */

  if (command === "banner") {

    const user = message.mentions.users.first() || message.author;

    const fetched = await client.users.fetch(user.id, { force: true });

    if (!fetched.banner)
      return message.reply("No banner found.");

    const embed = new EmbedBuilder()
    .setTitle(`${fetched.username}'s Banner`)
    .setImage(fetched.bannerURL({ size: 1024 }));

    return message.reply({ embeds: [embed] });
  }

  /* DISCORD LOOKUP */

  if (command === "dlookup") {

    let user;

    if (message.mentions.users.first())
      user = message.mentions.users.first();
    else if (args[0])
      user = await client.users.fetch(args[0]).catch(() => null);
    else
      user = message.author;

    if (!user)
      return message.reply("User not found.");

    const embed = new EmbedBuilder()
    .setTitle("Discord Lookup")
    .setThumbnail(user.displayAvatarURL())
    .addFields(
      { name: "Username", value: user.tag, inline: true },
      { name: "ID", value: user.id, inline: true },
      { name: "Bot", value: `${user.bot}`, inline: true },
      { name: "Created", value: `<t:${Math.floor(user.createdTimestamp/1000)}:R>`, inline: true }
    );

    return message.reply({ embeds: [embed] });
  }

  /* ROBLOX LOOKUP */

  if (command === "rlookup") {

    if (!args[0])
      return message.reply("Provide a Roblox username.");

    try {

      const res = await axios.post(
        "https://users.roblox.com/v1/usernames/users",
        { usernames:[args[0]] }
      );

      const user = res.data.data[0];

      if (!user)
        return message.reply("User not found.");

      const avatar = await axios.get(
        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=420x420&format=Png`
      );

      const embed = new EmbedBuilder()
      .setTitle("Roblox Lookup")
      .setThumbnail(avatar.data.data[0].imageUrl)
      .addFields(
        { name:"Username", value:user.name, inline:true },
        { name:"Display Name", value:user.displayName, inline:true },
        { name:"User ID", value:`${user.id}`, inline:true }
      );

      return message.reply({ embeds:[embed] });

    } catch {

      return message.reply("Roblox lookup failed.");

    }
  }

  /* USERNAME SCAN */

  if (command === "scan" || command === "usersearch") {

    if (!args[0])
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
      `https://soundcloud.com/${u}`,
      `https://medium.com/@${u}`,
      `https://steamcommunity.com/id/${u}`,
      `https://dev.to/${u}`
    ];

    const embed = new EmbedBuilder()
    .setTitle("Username OSINT Scan")
    .setDescription(sites.join("\n"))
    .setColor("Orange");

    return message.reply({ embeds:[embed] });
  }

  /* OFFLINE AI */

  if (command === "ask") {

    const question = args.join(" ");

    if (!question)
      return message.reply("Ask something, Lord Optic.");

    const response = aiResponse(question);

    return message.reply(response);
  }

  /* TEAM SYSTEM */

  if (command === "grant") {

    if (message.author.id !== OWNER_ID)
      return message.reply("Owner only.");

    const user = message.mentions.users.first();

    TEAM.push(user.id);

    return message.reply(`${user.tag} added to the team.`);
  }

  if (command === "revoke") {

    if (message.author.id !== OWNER_ID)
      return message.reply("Owner only.");

    const user = message.mentions.users.first();

    TEAM = TEAM.filter(id => id !== user.id);

    return message.reply(`${user.tag} removed.`);
  }

  if (command === "team") {

    const list = TEAM.map(id => `<@${id}>`).join("\n");

    const embed = new EmbedBuilder()
    .setTitle("Bot Team")
    .setDescription(list);

    return message.reply({ embeds:[embed] });
  }

});

client.login(process.env.TOKEN);
