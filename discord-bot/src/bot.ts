import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
} from "discord.js";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN!;
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://geoleague.gg";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const commands = [
  new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Get today's GeoLeague challenge link"),
  new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Show today's top scores"),
  new SlashCommandBuilder()
    .setName("streak")
    .setDescription("Check your current streak")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("User to check").setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName("profile")
    .setDescription("View a player's GeoLeague profile")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("User to view").setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Show your rank and ELO rating"),
  new SlashCommandBuilder()
    .setName("challenge")
    .setDescription("Challenge your server to today's daily"),
  new SlashCommandBuilder()
    .setName("server-leaderboard")
    .setDescription("Show this server's all-time top players"),
];

async function registerCommands() {
  const rest = new REST().setToken(DISCORD_TOKEN);
  await rest.put(Routes.applicationCommands(DISCORD_CLIENT_ID), {
    body: commands.map((c) => c.toJSON()),
  });
  console.log("Slash commands registered");
}

async function handleDaily(interaction: ChatInputCommandInteraction) {
  const { data: challenge } = await supabase
    .from("daily_challenges")
    .select("*")
    .eq("date", new Date().toISOString().split("T")[0])
    .single();

  const embed = new EmbedBuilder()
    .setColor(0x8b5cf6)
    .setTitle(`🌍 GeoLeague Daily #${challenge?.challenge_number || "?"}`)
    .setDescription(
      "A new mystery location awaits! Can you pinpoint it on the map?"
    )
    .addFields(
      { name: "Difficulty", value: challenge?.difficulty || "???", inline: true },
      { name: "Category", value: challenge?.category || "???", inline: true }
    )
    .setFooter({ text: "New challenge every day at midnight UTC" })
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel("Play Now")
      .setURL(`${APP_URL}/play`)
      .setStyle(ButtonStyle.Link)
      .setEmoji("🎯")
  );

  await interaction.reply({ embeds: [embed], components: [row] });
}

async function handleLeaderboard(interaction: ChatInputCommandInteraction) {
  const today = new Date().toISOString().split("T")[0];
  const { data: challenge } = await supabase
    .from("daily_challenges")
    .select("id, challenge_number")
    .eq("date", today)
    .single();

  if (!challenge) {
    await interaction.reply({ content: "No challenge found for today.", ephemeral: true });
    return;
  }

  const { data: results } = await supabase
    .from("game_results")
    .select("score, time_ms, user_id, profiles(display_name, username)")
    .eq("challenge_id", challenge.id)
    .order("score", { ascending: false })
    .limit(10);

  if (!results || results.length === 0) {
    await interaction.reply({
      content: "No one has completed today's challenge yet! Be the first.",
      ephemeral: true,
    });
    return;
  }

  const lines = results.map((r: Record<string, unknown>, i: number) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
    const profile = r.profiles as Record<string, string> | null;
    const name = profile?.display_name || profile?.username || "Anonymous";
    const time = ((r.time_ms as number) / 1000).toFixed(1);
    return `${medal} **${name}** — ${r.score} pts _(${time}s)_`;
  });

  const embed = new EmbedBuilder()
    .setColor(0xfbbf24)
    .setTitle(`🏆 Daily #${challenge.challenge_number} Leaderboard`)
    .setDescription(lines.join("\n"))
    .setFooter({ text: `${results.length} players today` })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

async function handleStreak(interaction: ChatInputCommandInteraction) {
  const targetUser = interaction.options.getUser("user") || interaction.user;

  const { data: profile } = await supabase
    .from("profiles")
    .select("current_streak, longest_streak, display_name, total_games")
    .eq("username", targetUser.username)
    .single();

  if (!profile) {
    await interaction.reply({
      content: `${targetUser.username} hasn't played GeoLeague yet!`,
      ephemeral: true,
    });
    return;
  }

  const streakEmoji =
    profile.current_streak >= 30
      ? "👑"
      : profile.current_streak >= 7
        ? "🔥"
        : profile.current_streak >= 3
          ? "🌟"
          : "📊";

  const embed = new EmbedBuilder()
    .setColor(0xf59e0b)
    .setTitle(`${streakEmoji} ${profile.display_name || targetUser.username}'s Streak`)
    .addFields(
      { name: "Current Streak", value: `${profile.current_streak} days`, inline: true },
      { name: "Longest Streak", value: `${profile.longest_streak} days`, inline: true },
      { name: "Total Games", value: String(profile.total_games), inline: true }
    );

  await interaction.reply({ embeds: [embed] });
}

async function handleProfile(interaction: ChatInputCommandInteraction) {
  const targetUser = interaction.options.getUser("user") || interaction.user;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", targetUser.username)
    .single();

  if (!profile) {
    await interaction.reply({
      content: `${targetUser.username} hasn't played GeoLeague yet!`,
      ephemeral: true,
    });
    return;
  }

  const rankLabel =
    profile.elo_rating >= 2400
      ? "Grandmaster"
      : profile.elo_rating >= 2000
        ? "Master"
        : profile.elo_rating >= 1800
          ? "Diamond"
          : profile.elo_rating >= 1600
            ? "Platinum"
            : profile.elo_rating >= 1400
              ? "Gold"
              : profile.elo_rating >= 1200
                ? "Silver"
                : "Bronze";

  const avgScore =
    profile.total_games > 0
      ? Math.round(Number(profile.total_score) / profile.total_games)
      : 0;

  const embed = new EmbedBuilder()
    .setColor(0x8b5cf6)
    .setTitle(`🌍 ${profile.display_name || targetUser.username}`)
    .setThumbnail(profile.avatar_url || targetUser.displayAvatarURL())
    .addFields(
      { name: "Rank", value: `${rankLabel} (${profile.elo_rating} ELO)`, inline: true },
      { name: "Games Played", value: String(profile.total_games), inline: true },
      { name: "Avg Score", value: `${avgScore}/1000`, inline: true },
      { name: "Current Streak", value: `🔥 ${profile.current_streak}`, inline: true },
      { name: "Best Streak", value: `⭐ ${profile.longest_streak}`, inline: true },
      { name: "Total Score", value: String(profile.total_score), inline: true }
    )
    .setFooter({ text: `Playing since ${new Date(profile.created_at).toLocaleDateString()}` });

  await interaction.reply({ embeds: [embed] });
}

async function handleChallenge(interaction: ChatInputCommandInteraction) {
  const { data: challenge } = await supabase
    .from("daily_challenges")
    .select("challenge_number, difficulty, category")
    .eq("date", new Date().toISOString().split("T")[0])
    .single();

  const embed = new EmbedBuilder()
    .setColor(0xef4444)
    .setTitle("⚔️ Server Challenge!")
    .setDescription(
      `**${interaction.user.username}** challenges everyone to today's Daily #${challenge?.challenge_number || "?"}!\n\n` +
      "Who can get the highest score? Play now and post your results!"
    )
    .addFields(
      { name: "Difficulty", value: challenge?.difficulty || "???", inline: true },
      { name: "Category", value: challenge?.category || "???", inline: true }
    )
    .setFooter({ text: "Results are auto-posted when you finish" });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel("Accept Challenge")
      .setURL(`${APP_URL}/play`)
      .setStyle(ButtonStyle.Link)
      .setEmoji("🎯")
  );

  await interaction.reply({ embeds: [embed], components: [row] });
}

async function handleRank(interaction: ChatInputCommandInteraction) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("elo_rating, display_name")
    .eq("username", interaction.user.username)
    .single();

  if (!profile) {
    await interaction.reply({
      content: "You haven't played GeoLeague yet! Use `/daily` to get started.",
      ephemeral: true,
    });
    return;
  }

  const { count } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gt("elo_rating", profile.elo_rating);

  const rank = (count || 0) + 1;

  await interaction.reply({
    content: `🏅 **${profile.display_name || interaction.user.username}** — Rank #${rank} (${profile.elo_rating} ELO)`,
  });
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once("ready", () => {
  console.log(`Bot logged in as ${client.user?.tag}`);
  registerCommands();
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const handlers: Record<string, (i: ChatInputCommandInteraction) => Promise<void>> = {
    daily: handleDaily,
    leaderboard: handleLeaderboard,
    streak: handleStreak,
    profile: handleProfile,
    challenge: handleChallenge,
    rank: handleRank,
    "server-leaderboard": handleLeaderboard,
  };

  const handler = handlers[interaction.commandName];
  if (handler) {
    try {
      await handler(interaction);
    } catch (err) {
      console.error(`Error handling /${interaction.commandName}:`, err);
      const msg = { content: "Something went wrong. Try again later.", ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(msg);
      } else {
        await interaction.reply(msg);
      }
    }
  }
});

client.login(DISCORD_TOKEN);
