const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const fs = require('fs');
const path = require('path');
require("dotenv").config();

// Load environment variables
const TOKEN = "7061792920:AAH0isOht02oYJs6iAZNWQfK85Je9U8zB24";
const PRIVATE_CHANNEL_ID = "-1002186561007";
const PUBLIC_CHANNEL_USERNAME = "@PremLeechub";
const DEBRID_API_URL = "https://debrid-link.com/api/v2";
const DEBRID_API_KEY =
    "0UElitoHO7DuJQ2m8boBGRkpZ9qslbYCP61tXy6YUGPSzdrDUhSwfcYyn92Kv1Rh";
const FAKIR_PIN = "RpDKbcZiNrHWSXgCqSJp";

// Create a bot instance
const bot = new TelegramBot(TOKEN, { polling: true });

// User limits storage
let userLimits = {};

// File path for storing user limits
const USER_LIMITS_FILE = path.join(__dirname, 'user_limits.json');

// Host limits configuration
const hostLimits = {
    "rapidgator.net": { gb: 10, links: 30 },
    "k2s.cc": { gb: 2, links: 30 },
    "elitefile.net": { gb: 1.2, links: 20 },
    "upstore.net": { gb: 2, links: 20 },
    "tezfiles.com": { gb: 4, links: 30 },
    "hitfile.net": { gb: 2.4, links: 30 },
    "ubiqfile.com": { gb: 1, links: 20 },
    "daofile.com": { gb: 1, links: 30 },
    "jumploads.com": { gb: 2, links: 20 },
    "kshared.com": { gb: 2, links: 30 },
    "filenext.com": { gb: 2, links: 30 },
    "ex-load.com": { gb: 2, links: 30 },
    "pixeldrain.com": { gb: Infinity, links: Infinity },
    "filesfly.cc": { gb: 2, links: 20 },
    "drop.download": { gb: Infinity, links: Infinity },
    "nitroflare.com": { gb: 2, links: 30 },
    "turbobit.net": { gb: 5, links: 30 },
    "depositfiles.com": { gb: Infinity, links: Infinity },
    "1fichier.com": { gb: Infinity, links: Infinity },
    "fboom.me": { gb: 2, links: 30 },
    "filejoker.net": { gb: 2, links: 30 },
    "uploadgig.com": { gb: 3, links: 30 },
    "filespace.com": { gb: 5, links: 30 },
    torrent: { gb: Infinity, links: Infinity },
    "katfile.com": { gb: Infinity, links: Infinity },
    "subyshare.com": { gb: 2, links: 30 },
    "extmatrix.com": { gb: 3, links: 30 },
    "wupfile.com": { gb: 10, links: 30 },
    "filefox.cc": { gb: 1, links: 30 },
    "silkfiles.com": { gb: 2, links: 20 },
    "fikper.com": { gb: 10, links: 30 },
    "ddownload.com": { gb: Infinity, links: Infinity },
    "hotlink.cc": { gb: 3, links: 30 },
    "fileland.io": { gb: 5, links: 30 },
    "dailymotion.com": { gb: Infinity, links: Infinity },
    "filedot.to": { gb: 1, links: 30 },
    "rosefile.net": { gb: Infinity, links: Infinity },
    "alfafile.net": { gb: Infinity, links: Infinity },
    "filesmonster.com": { gb: 1, links: 30 },
    "myqloud.org": { gb: 5, links: 30 },
    "mediafire.com": { gb: Infinity, links: Infinity },
    "mixdrop.co": { gb: Infinity, links: Infinity },
    "mega.nz": { gb: Infinity, links: Infinity },
    "hot4share.com": { gb: 5, links: 30 },
    "prefiles.com": { gb: Infinity, links: Infinity },
    "world-files.com": { gb: 2, links: 30 },
    "filefactory.com": { gb: Infinity, links: Infinity },
    "fastbit.cc": { gb: Infinity, links: Infinity },
    "gigapeta.com": { gb: 2, links: 30 },
    "hexload.com": { gb: Infinity, links: Infinity },
    "youtube.com": { gb: Infinity, links: Infinity },
    "isra.cloud": { gb: 5, links: 30 },
    "filecat.net": { gb: Infinity, links: Infinity },
    "usersdrive.com": { gb: Infinity, links: Infinity },
    "worldbytez.com": { gb: Infinity, links: Infinity },
    "filestore.me": { gb: Infinity, links: Infinity },
    "streamtape.com": { gb: Infinity, links: Infinity },
    "flashbit.cc": { gb: Infinity, links: Infinity },
    other: { gb: 10, links: 30 },
};

// Track generated links
let generatedLinks = {};

// File path for storing generated links
const GENERATED_LINKS_FILE = path.join(__dirname, 'generated_links.json');

// Function to save generated links to a file
function saveGeneratedLinks() {
    fs.writeFileSync(GENERATED_LINKS_FILE, JSON.stringify(generatedLinks), 'utf8');
}

// Function to load generated links from a file
function loadGeneratedLinks() {
    try {
        if (fs.existsSync(GENERATED_LINKS_FILE)) {
            const data = fs.readFileSync(GENERATED_LINKS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading generated links:', error);
    }
    return {};
}

// Function to check if a link has already been generated
async function isLinkAlreadyGenerated(originalLink) {
    // First, check in memory
    if (generatedLinks[originalLink]) {
        return true;
    }

    // If not found in memory, check the public channel
    try {
        const messages = await bot.searchMessages(PUBLIC_CHANNEL_USERNAME, originalLink, {
            limit: 1,
            chat_type: 'channel'
        });

        if (messages && messages.length > 0) {
            // If found in the channel, add to memory for future checks
            generatedLinks[originalLink] = 'Found in channel';
            saveGeneratedLinks();
            return true;
        }
    } catch (error) {
        console.error('Error searching messages:', error);
    }

    return false;
}

// Logging function
function log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
}

// Error handling function
function handleError(error) {
    log(`ERROR: ${error.message}`);
}

// Function to check if a user is a member of the private channel
async function isChannelMember(userId) {
    try {
        const chatMember = await bot.getChatMember(PRIVATE_CHANNEL_ID, userId);
        return ["member", "administrator", "creator"].includes(
            chatMember.status,
        );
    } catch (error) {
        handleError(error);
        return false;
    }
}

// Function to generate premium link using Debrid-Link API
async function generatePremiumLinkDebrid(url) {
    try {
        const response = await axios.post(
            `${DEBRID_API_URL}/downloader/add`,
            {
                url: url,
            },
            {
                headers: {
                    Authorization: `Bearer ${DEBRID_API_KEY}`,
                },
            },
        );

        if (response.data && response.data.value) {
            return {
                downloadUrl: response.data.value.downloadUrl || url,
                filename: response.data.value.name || "Unknown",
                size: response.data.value.size || 0,
            };
        } else {
            throw new Error("Invalid response from Debrid-Link API");
        }
    } catch (error) {
        handleError(error);
        throw error;
    }
}

// Function to generate premium link using Fakir API
async function generatePremiumLinkFakir(url) {
    try {
        const generateLink = `https://fakirdebrid.net/api/generate.php?pin=${FAKIR_PIN}&url=${url}`;
        const response = await axios.get(generateLink);
        const jsonData = response.data;
        if (jsonData.status === "success") {
            const apiLink = jsonData.data.apilink;

            // Wait for 1 minute before proceeding
            await new Promise((resolve) => setTimeout(resolve, 60000));

            const transloadResponse = await axios.get(apiLink, {
                timeout: 30000,
            });
            const transloadJson = transloadResponse.data;
            if (transloadJson.status === "success") {
                return {
                    downloadUrl: transloadJson.data.link,
                    filename: transloadJson.data.filename || "Unknown",
                    size: transloadJson.data.filesize || 0,
                };
            } else {
                throw new Error("Send a Link again after 1 Min.");
            }
        } else {
            throw new Error(
                "This Host is temporarily not supported, Please try again later.",
            );
        }
    } catch (error) {
        handleError(error);
        throw error;
    }
}

// Function to shorten a URL using TinyURL API
async function shortenUrl(url) {
    try {
        const response = await axios.get(
            `http://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`,
        );
        return response.data;
    } catch (error) {
        handleError(error);
        return url;
    }
}

// Function to format file size
function formatFileSize(bytes) {
    if (bytes >= 1073741824) {
        return (bytes / 1073741824).toFixed(2) + " GB";
    } else if (bytes >= 1048576) {
        return (bytes / 1048576).toFixed(2) + " MB";
    } else {
        return bytes + " bytes";
    }
}

// Function to get host from URL
function getHostFromUrl(url) {
    try {
        const hostname = new URL(url).hostname;
        return (
            Object.keys(hostLimits).find((host) => hostname.includes(host)) ||
            "other"
        );
    } catch (error) {
        handleError(error);
        return "other";
    }
}

// Function to save user limits to a file
function saveUserLimits() {
    fs.writeFileSync(USER_LIMITS_FILE, JSON.stringify(userLimits), 'utf8');
}

// Function to load user limits from a file
function loadUserLimits() {
    try {
        if (fs.existsSync(USER_LIMITS_FILE)) {
            const data = fs.readFileSync(USER_LIMITS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading user limits:', error);
    }
    return {};
}

// Function to check and update user limits
function checkAndUpdateUserLimits(userId, host, sizeInBytes) {
    const now = new Date();
    const today = now.toDateString();

    if (!userLimits[userId]) {
        userLimits[userId] = {};
    }

    if (!userLimits[userId][today]) {
        userLimits[userId][today] = {};
    }

    if (!userLimits[userId][today][host]) {
        userLimits[userId][today][host] = { gb: 0, links: 0 };
    }

    const userHostLimit = userLimits[userId][today][host];
    const hostLimit = hostLimits[host];
    const sizeInGB = sizeInBytes / (1024 * 1024 * 1024);

    if (
        userHostLimit.gb + sizeInGB > hostLimit.gb ||
        userHostLimit.links + 1 > hostLimit.links
    ) {
        return false;
    }

    userHostLimit.gb += sizeInGB;
    userHostLimit.links += 1;

    // Save the updated user limits
    saveUserLimits();

    return true;
}

// Function to clean up old limits
function cleanupOldLimits() {
    const now = new Date();
    const today = now.toDateString();

    for (const userId in userLimits) {
        for (const date in userLimits[userId]) {
            if (date !== today) {
                delete userLimits[userId][date];
            }
        }
        if (Object.keys(userLimits[userId]).length === 0) {
            delete userLimits[userId];
        }
    }

    // Save the cleaned up user limits
    saveUserLimits();
}

// Handle the /start command
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const isMember = await isChannelMember(userId);

    if (isMember) {
        bot.sendMessage(
            chatId,
            "Welcome! You have access to premium features. Use the following commands:\n\n" +
                "/start - Get started\n" +
                "/about - Learn about our premium features\n" +
                "/supported_hosts - View supported hosts\n" +
                "/generate - Create premium links\n" +
                "/limit - Check your daily limits\n" +
                "/support - Get support",
        );
    } else {
        bot.sendMessage(
            chatId,
            "Welcome! To unlock premium features, please subscribe to our channel with a monthly plan. Enjoy unlimited access for just 5€ per month.",
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "Subscribe",
                                url: "https://t.me/tribute/app?startapp=seXP",
                            },
                            {
                                text: "Demo Group",
                                url: "https://t.me/PremLeechub",
                            },
                        ],
                    ],
                },
            },
        );
    }
});

        // Handle the /about command
        bot.onText(/\/about/, (msg) => {
            const chatId = msg.chat.id;
            bot.sendMessage(
                chatId,
                "Premium features include:\n\n" +
                    "• Access to premium links from 166+ hosts\n" +
                    "• High-speed downloads\n" +
                    "• No ads or waiting time",
            );
        });

        // Handle the /supported_hosts command
        bot.onText(/\/supported_hosts/, (msg) => {
            const chatId = msg.chat.id;
            bot.sendMessage(
                chatId,
                "Supported hosts:\n\n" + "• 85+ File Hosts\n" + "• 110+ Streams",
            );
        });

        // Handle the /generate command (for premium members only)
        bot.onText(/\/generate/, async (msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id;
            const isMember = await isChannelMember(userId);

            if (isMember) {
                bot.sendMessage(
                    chatId,
                    "Please send the link you want to generate a premium link for.",
                );
            } else {
                bot.sendMessage(
                    chatId,
                    "This command is only available for premium members. Please subscribe to access this feature.",
                    {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: "Subscribe Now",
                                        url: "https://t.me/tribute/app?startapp=seXP",
                                    },
                                ],
                            ],
                        },
                    },
                );
            }
        });

        // Handle the /limit command (for premium members only)
        bot.onText(/\/limit/, async (msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id;
            const isMember = await isChannelMember(userId);

            if (isMember) {
                const today = new Date().toDateString();
                const userDailyLimits = userLimits[userId]?.[today] || {};

                let limitMessage = "Your daily limits:\n\n";
                for (const [host, limit] of Object.entries(hostLimits)) {
                    const used = userDailyLimits[host] || { gb: 0, links: 0 };
                    limitMessage += `${host}:\n`;
                    limitMessage += `  ${used.gb.toFixed(2)} / ${limit.gb} GB\n`;
                    limitMessage += `  ${used.links} / ${limit.links} links\n\n`;
                }

                limitMessage +=
                    "Maximum data you can download per host. These limits can increase when we have low server usage or decrease when the host locks our accounts.";

                bot.sendMessage(chatId, limitMessage);
            } else {
                bot.sendMessage(
                    chatId,
                    "This command is only available for premium members.",
                );
            }
        });

        // Handle the /support command
        bot.onText(/\/support/, (msg) => {
            const chatId = msg.chat.id;
            bot.sendMessage(chatId, "For support, please contact: @shahbazjaveid");
        });

        // Modify the message handler to use the new isLinkAlreadyGenerated function
        bot.on("message", async (msg) => {
            if (msg.text && msg.text.startsWith("http")) {
                const chatId = msg.chat.id;
                const userId = msg.from.id;
                const originalLink = msg.text;
                const isMember = await isChannelMember(userId);

                if (isMember) {
                    const alreadyGenerated = await isLinkAlreadyGenerated(originalLink);
                    if (alreadyGenerated) {
                        const confirmMessage = "This link has already been generated. Do you want to generate it again?";
                        bot.sendMessage(chatId, confirmMessage, {
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        { text: "Yes", callback_data: "regenerate_yes" },
                                        { text: "No", callback_data: "regenerate_no" }
                                    ]
                                ]
                            }
                        });

                        // Store the original link for the callback
                        bot.once("callback_query", async (callbackQuery) => {
                            if (callbackQuery.data === "regenerate_yes") {
                                await processLink(chatId, userId, originalLink);
                            } else if (callbackQuery.data === "regenerate_no") {
                                bot.sendMessage(chatId, "Okay, the link won't be regenerated. You can find the existing premium link in the channel.");
                            }
                            bot.answerCallbackQuery(callbackQuery.id);
                        });
                        return;
                    }

                    await processLink(chatId, userId, originalLink);
                } else {
                    bot.sendMessage(
                        chatId,
                        "You need to be a premium member to generate links. Please subscribe to access this feature.",
                        {
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        {
                                            text: "Subscribe Now",
                                            url: "https://t.me/tribute/app?startapp=seXP",
                                        },
                                    ],
                                ],
                            },
                        },
                    );
                }
            }
        });

        // New function to process the link
        async function processLink(chatId, userId, originalLink) {
            try {
                const host = getHostFromUrl(originalLink);
                let premiumLinkData;

                // Try Debrid-Link API first
                try {
                    premiumLinkData = await generatePremiumLinkDebrid(originalLink);
                } catch (debridError) {
                    log("1st server failed, trying to generate a link from second server, wait a few secs..");
                    // If Debrid-Link fails, try Fakir API
                    try {
                        premiumLinkData = await generatePremiumLinkFakir(originalLink);
                    } catch (fakirError) {
                        throw new Error("Sorry, we are unable to generate a premium link at this time.");
                    }
                }

                const { downloadUrl, filename, size } = premiumLinkData;

                if (!checkAndUpdateUserLimits(userId, host, size)) {
                    bot.sendMessage(
                        chatId,
                        `You've reached your daily limit for ${host}. Please try again after 24 hours or use a different host.`,
                    );
                    return;
                }

                const shortenedLink = await shortenUrl(downloadUrl);
                const fileSize = formatFileSize(size);

                const messageText = `<b>Title:</b> ${filename}\n\n<b>Original Link:</b> ${originalLink}\n\n<b>Premium Link:</b> ${shortenedLink}\n\n<b>Size:</b> ${fileSize}`;

                // Message to user
                bot.sendMessage(
                    chatId,
                    "Your link has been successfully processed and forwarded to the public channel.",
                    {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: "View Generated Link",
                                        url: `https://t.me/${PUBLIC_CHANNEL_USERNAME.slice(1)}`,
                                    },
                                ],
                            ],
                        },
                    },
                );

                // Message to private channel (same as user message, without button)
                bot.sendMessage(
                    PRIVATE_CHANNEL_ID,
                    "Your link has been successfully processed and forwarded to the public channel and Do not leave this private channel. If you do, your subscription will be automatically canceled.",
                );

                // Message to public channel with the premium link
                bot.sendMessage(PUBLIC_CHANNEL_USERNAME, messageText, {
                    parse_mode: "HTML",
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "Generate New Link",
                                    url: "https://t.me/PremleechBot",
                                },
                            ],
                        ],
                    },
                });

                // Store both original and generated links
                generatedLinks[originalLink] = shortenedLink;
                saveGeneratedLinks();
            } catch (error) {
                handleError(error);
                let errorMessage = "An error occurred while processing your link. ";
                if (error.response && error.response.data && error.response.data.error) {
                    errorMessage += error.response.data.error;
                } else {
                    errorMessage += "Please try again later or contact support.";
                }
                bot.sendMessage(chatId, errorMessage);
            }
        }

        // Error handling for polling errors
        bot.on("polling_error", (error) => {
            handleError(error);
        });

        // Load user limits when the bot starts
        userLimits = loadUserLimits();

        // Load generated links when the bot starts
        generatedLinks = loadGeneratedLinks();

        // Run cleanup daily
        setInterval(cleanupOldLimits, 24 * 60 * 60 * 1000);

        // Ensure limits and generated links are saved when the bot exits
        process.on('SIGINT', () => {
            saveUserLimits();
            saveGeneratedLinks();
            process.exit();
        });

        log("Bot is running...");