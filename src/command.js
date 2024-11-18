require("dotenv").config();
const { REST, Routes, ApplicationCommandOptionType } = require("discord.js");

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
    name: "price-list",
    description: "set price threshold",
    options: [
      {
        name: "set_alert",
        type: 3,
        description: "Solana wallet address",
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
