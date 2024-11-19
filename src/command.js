import dotenv from "dotenv/config";
import { REST, Routes, EmbedBuilder } from "discord.js";
import { db } from "./database.js";
import { tokenPrices } from "./priceTracker.js";

const commands = [
  {
    name: "connect-wallet",
    description: "Integration with wallet providers",
    options: [
      {
        name: "wallet_address",
        type: 3,
        description: "Solana wallet address",
        required: true,
      },
    ],
  },
  {
    name: "price-list-and-set-alert",
    description: "select action",
    options: [
      {
        name: "price-options",
        type: 3,
        description: "Solana wallet address",
        choices: [
          {
            name: "price-list",
            value: "price-list",
          },
          {
            name: "set-alert",
            value: "set-alert",
          },
        ],
        required: true,
      },
    ],
  },
];

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUID_ID
      ),
      { body: commands }
    );
    console.log("slash command registered");
  } catch (error) {
    console.error(error);
  }
})();

async function handleSetAlert(message, args) {
  if (args.length !== 4) {
    await message.reply("Usage: /set-alert <token> <price> <above/below>");
    return;
  }

  const token = args[1].toLowerCase();
  const price = parseFloat(args[2]);
  const direction = args[3].toLowerCase();

  if (!tokenPrices.has(token)) {
    await message.reply(
      "Invalid token. Available tokens: bitcoin, ethereum, solana, cardano"
    );
    return;
  }

  if (isNaN(price) || price <= 0) {
    await message.reply("Please provide a valid price");
    return;
  }

  if (!["above", "below"].includes(direction)) {
    await message.reply('Direction must be either "above" or "below"');
    return;
  }

  db.run(
    `INSERT INTO price_alerts (user_id, token_id, target_price, above_threshold)
     VALUES (?, ?, ?, ?)`,
    [message.author.id, token, price, direction === "above" ? 1 : 0],
    (err) => {
      if (err) {
        console.error("Error setting alert:", err);
        message.reply("Error setting price alert");
        return;
      }
      message.reply(
        `Alert set for ${token.toUpperCase()} ${direction} $${price}`
      );
    }
  );
}

async function handlePriceList(message) {
  const embed = new EmbedBuilder()
    .setTitle("Current Token Prices")
    .setColor("#0099ff")
    .setTimestamp();

  for (const [token, price] of tokenPrices) {
    embed.addFields({
      name: token.toUpperCase(),
      value: `$${price.toFixed(2)}`,
    });
  }

  await message.reply({ embeds: [embed] });
}
async function handleMyAlerts(message) {
  db.all(
    "SELECT * FROM price_alerts WHERE user_id = ? AND triggered = 0",
    [message.author.id],
    async (err, alerts) => {
      if (err) {
        console.error("Error fetching alerts:", err);
        await message.reply("Error fetching your alerts");
        return;
      }

      if (alerts.length === 0) {
        await message.reply("You have no active price alerts");
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle("Your Active Price Alerts")
        .setColor("#0099ff")
        .setTimestamp();

      for (const alert of alerts) {
        embed.addFields({
          name: `${alert.token_id.toUpperCase()} ${
            alert.above_threshold ? "above" : "below"
          } $${alert.target_price}`,
          value: "\u200b",
        });
      }

      await message.reply({ embeds: [embed] });
    }
  );
}

export { handleSetAlert, handlePriceList, handleMyAlerts };
