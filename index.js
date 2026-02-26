const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  REST,
  Routes,
  SlashCommandBuilder
} = require('discord.js');

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

const commands = [
  new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Get Discord user info')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Select a user')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('roblox')
    .setDescription('Get advanced Roblox user info')
    .addStringOption(option =>
      option.setName('username')
        .setDescription('Roblox username')
        .setRequired(true)
    )
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('Registering slash commands...');
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log('Slash commands registered.');
  } catch (error) {
    console.error(error);
  }
})();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // ================= DISCORD USERINFO =================
  if (interaction.commandName === 'userinfo') {
    const user = interaction.options.getUser('user') || interaction.user;
    const member = await interaction.guild.members.fetch(user.id);

    const badges = user.flags?.toArray() || [];
    const badgeList = badges.length > 0 ? badges.join(', ') : 'Hidden / None';

    const roles = member.roles.cache
      .filter(role => role.id !== interaction.guild.id)
      .map(role => role.toString())
      .join(', ') || 'None';

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL({ dynamic: true }) })
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 512 }))
      .addFields(
        { name: 'User ID', value: user.id, inline: true },
        { name: 'Bot?', value: user.bot ? 'Yes' : 'No', inline: true },
        { name: 'Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>` },
        { name: 'Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>` },
        { name: 'Nickname', value: member.nickname || 'None', inline: true },
        { name: 'Badges', value: badgeList },
        { name: `Roles (${member.roles.cache.size - 1})`, value: roles }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }

  // ================= ADVANCED ROBLOX =================
  if (interaction.commandName === 'roblox') {

    const username = interaction.options.getString('username');

    try {
      await interaction.deferReply();

      // Get User ID
      const userRes = await fetch('https://users.roblox.com/v1/usernames/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: [username], excludeBannedUsers: false })
      });

      const userData = await userRes.json();
      if (!userData.data || !userData.data[0]) {
        return interaction.editReply('User not found.');
      }

      const robloxUser = userData.data[0];

      // Profile
      const profile = await (await fetch(`https://users.roblox.com/v1/users/${robloxUser.id}`)).json();

      // Followers
      const followers = await (await fetch(`https://friends.roblox.com/v1/users/${robloxUser.id}/followers/count`)).json();

      // Following
      const following = await (await fetch(`https://friends.roblox.com/v1/users/${robloxUser.id}/followings/count`)).json();

      // Friends
      const friends = await (await fetch(`https://friends.roblox.com/v1/users/${robloxUser.id}/friends/count`)).json();

      // Presence
      const presenceRes = await fetch('https://presence.roblox.com/v1/presence/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: [robloxUser.id] })
      });
      const presenceData = await presenceRes.json();

      const presenceType = presenceData.userPresences[0]?.userPresenceType;

      let status = "Offline";
      if (presenceType === 1) status = "Online";
      if (presenceType === 2) status = "In Game";

      // Avatar
      const avatarRes = await fetch(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${robloxUser.id}&size=420x420&format=Png&isCircular=false`);
      const avatarData = await avatarRes.json();
      const avatarUrl = avatarData.data[0].imageUrl;

      const embed = new EmbedBuilder()
        .setColor(0x00A2FF)
        .setAuthor({ name: `${profile.displayName} (@${profile.name})` })
        .setThumbnail(avatarUrl)
        .addFields(
          { name: 'User ID', value: profile.id.toString(), inline: true },
          { name: 'Status', value: status, inline: true },
          { name: 'Account Created', value: new Date(profile.created).toDateString() },
          { name: 'Followers', value: followers.count.toString(), inline: true },
          { name: 'Following', value: following.count.toString(), inline: true },
          { name: 'Friends', value: friends.count.toString(), inline: true },
          { name: 'Description', value: profile.description || 'No description.' }
        )
        .setURL(`https://www.roblox.com/users/${profile.id}/profile`)
        .setFooter({ text: 'Advanced Roblox Lookup' })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });

    } catch (err) {
      console.error(err);
      return interaction.editReply('Error fetching Roblox data.');
    }
  }
});

client.login(TOKEN);
