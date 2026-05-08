// Discord Bot for PerfectCFW Server Management
const { Client, GatewayIntentBits, Collection, Events, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Bot Configuration
const BOT_CONFIG = {
    token: process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE',
    clientId: process.env.CLIENT_ID || '1496988349762900029',
    guildId: process.env.GUILD_ID || 'YOUR_SERVER_ID_HERE',
    prefix: '!',
    ownerId: '1494445191665549312'
};

// Initialize Discord Client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Data storage
let serverStats = {
    onlinePlayers: 0,
    totalMembers: 0,
    applications: [],
    vehicles: [],
    announcements: []
};

// Load data from file
function loadData() {
    try {
        const data = fs.readFileSync('./server_data.json', 'utf8');
        serverStats = JSON.parse(data);
    } catch (error) {
        console.log('No existing data found, starting fresh');
        saveData();
    }
}

// Save data to file
function saveData() {
    fs.writeFileSync('./server_data.json', JSON.stringify(serverStats, null, 2));
}

// Bot ready event
client.once(Events.ClientReady, async () => {
    console.log(`Bot logged in as ${client.user.tag}!`);
    loadData();
    updateServerStats();
    
    // Set bot status
    client.user.setActivity(`𝐏𝐞𝐫𝐟𝐞𝐜𝐭 𝐂𝐅𝐖 Server | ${serverStats.onlinePlayers} Players Online`, {
        type: 'WATCHING'
    });
});

// Message event
client.on(Events.MessageCreate, async (message) => {
    // Ignore bot messages
    if (message.author.bot) return;
    
    // Check if message is from server owner
    if (message.author.id !== BOT_CONFIG.ownerId) {
        return message.reply('هذا الأمر متاح للمالك فقط!');
    }
    
    // Handle commands
    if (!message.content.startsWith(BOT_CONFIG.prefix)) return;
    
    const args = message.content.slice(BOT_CONFIG.prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    
    switch (command) {
        case 'stats':
            await showStats(message);
            break;
        case 'applications':
            await showApplications(message);
            break;
        case 'accept':
            await acceptApplication(message, args);
            break;
        case 'reject':
            await rejectApplication(message, args);
            break;
        case 'addvehicle':
            await addVehicle(message, args);
            break;
        case 'announce':
            await makeAnnouncement(message, args);
            break;
        case 'online':
            await updateOnlineCount(message, args);
            break;
        case 'help':
            await showHelp(message);
            break;
        default:
            await message.reply('الأمر غير معروف! استخدم `!help` لعرض الأوامر.');
    }
});

// Show server statistics
async function showStats(message) {
    const embed = new EmbedBuilder()
        .setColor('#9333ea')
        .setTitle('📊 إحصائيات سيرفر 𝐏𝐞𝐫𝐟𝐞𝐜𝐭 𝐂𝐅𝐖')
        .addFields(
            { name: '👥 اللاعبين المتصلين', value: `${serverStats.onlinePlayers} لاعب`, inline: true },
            { name: '👥 إجمالي الأعضاء', value: `${serverStats.totalMembers} عضو`, inline: true },
            { name: '📝 عدد التقديمات', value: `${serverStats.applications.length} تقديم`, inline: true },
            { name: '🚗 عدد السيارات', value: `${serverStats.vehicles.length} سيارة`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: '𝐏𝐞𝐫𝐟𝐞𝐜𝐭 𝐂𝐅𝐖 Bot', iconURL: client.user.displayAvatarURL() });
    
    await message.reply({ embeds: [embed] });
}

// Show applications
async function showApplications(message) {
    if (serverStats.applications.length === 0) {
        return message.reply('لا توجد تقديمات حالياً.');
    }
    
    const embed = new EmbedBuilder()
        .setColor('#9333ea')
        .setTitle('📝 التقديمات المعلقة')
        .setDescription(`عدد التقديمات: ${serverStats.applications.length}`)
        .setTimestamp();
    
    serverStats.applications.forEach((app, index) => {
        embed.addFields({
            name: `#${index + 1} ${app.name}`,
            value: `**النوع:** ${app.type}\n**التاريخ:** ${app.date}\n**الحالة:** ${app.status}`,
            inline: false
        });
    });
    
    await message.reply({ embeds: [embed] });
}

// Accept application
async function acceptApplication(message, args) {
    if (args.length === 0) {
        return message.reply('الاستخدام: `!accept <رقم التقديم>`');
    }
    
    const appId = parseInt(args[0]);
    if (isNaN(appId) || appId < 1 || appId > serverStats.applications.length) {
        return message.reply('رقم تقديم غير صحيح!');
    }
    
    const app = serverStats.applications[appId - 1];
    app.status = 'مقبول';
    app.reviewedBy = message.author.tag;
    app.reviewDate = new Date().toISOString();
    
    saveData();
    
    const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('✅ تم قبول التقديم')
        .setDescription(`تم قبول تقديم **${app.name}** بنجاح!`)
        .addFields(
            { name: 'المتقدم', value: app.name, inline: true },
            { name: 'النوع', value: app.type, inline: true },
            { name: 'تم المراجعة بواسطة', value: message.author.tag, inline: true }
        )
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}

// Reject application
async function rejectApplication(message, args) {
    if (args.length === 0) {
        return message.reply('الاستخدام: `!reject <رقم التقديم> <السبب>`');
    }
    
    const appId = parseInt(args[0]);
    const reason = args.slice(1).join(' ') || 'لا يوجد سبب';
    
    if (isNaN(appId) || appId < 1 || appId > serverStats.applications.length) {
        return message.reply('رقم تقديم غير صحيح!');
    }
    
    const app = serverStats.applications[appId - 1];
    app.status = 'مرفوض';
    app.reviewedBy = message.author.tag;
    app.reviewDate = new Date().toISOString();
    app.rejectionReason = reason;
    
    saveData();
    
    const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ تم رفض التقديم')
        .setDescription(`تم رفض تقديم **${app.name}**`)
        .addFields(
            { name: 'المتقدم', value: app.name, inline: true },
            { name: 'السبب', value: reason, inline: true },
            { name: 'تم المراجعة بواسطة', value: message.author.tag, inline: true }
        )
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}

// Add vehicle
async function addVehicle(message, args) {
    if (args.length < 3) {
        return message.reply('الاستخدام: `!addvehicle <الاسم> <السعر> <الوصف>`');
    }
    
    const vehicle = {
        id: serverStats.vehicles.length + 1,
        name: args[0],
        price: args[1],
        description: args.slice(2).join(' '),
        addedBy: message.author.tag,
        addedDate: new Date().toISOString()
    };
    
    serverStats.vehicles.push(vehicle);
    saveData();
    
    const embed = new EmbedBuilder()
        .setColor('#9333ea')
        .setTitle('🚗 تم إضافة سيارة')
        .setDescription(`تمت إضافة سيارة **${vehicle.name}** للمتجر`)
        .addFields(
            { name: 'الاسم', value: vehicle.name, inline: true },
            { name: 'السعر', value: vehicle.price, inline: true },
            { name: 'الوصف', value: vehicle.description, inline: true }
        )
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}

// Make announcement
async function makeAnnouncement(message, args) {
    if (args.length === 0) {
        return message.reply('الاستخدام: `!announce <الرسالة>`');
    }
    
    const announcement = {
        id: serverStats.announcements.length + 1,
        message: args.join(' '),
        author: message.author.tag,
        date: new Date().toISOString()
    };
    
    serverStats.announcements.unshift(announcement);
    saveData();
    
    const embed = new EmbedBuilder()
        .setColor('#ff9900')
        .setTitle('📢 إعلان جديد')
        .setDescription(announcement.message)
        .setFooter({ text: `بواسطة: ${message.author.tag}` })
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
    
    // Send announcement to a specific channel (you'll need to set the channel ID)
    // const announcementChannel = client.channels.cache.get('YOUR_ANNOUNCEMENT_CHANNEL_ID');
    // if (announcementChannel) {
    //     await announcementChannel.send({ embeds: [embed] });
    // }
}

// Update online count
async function updateOnlineCount(message, args) {
    if (args.length === 0) {
        return message.reply('الاستخدام: `!online <عدد اللاعبين>`');
    }
    
    const count = parseInt(args[0]);
    if (isNaN(count) || count < 0) {
        return message.reply('عدد اللاعبين غير صحيح!');
    }
    
    serverStats.onlinePlayers = count;
    saveData();
    
    // Update bot status
    client.user.setActivity(`𝐏𝐞𝐫𝐟𝐞𝐜𝐭 𝐂𝐅𝐖 Server | ${count} Players Online`, {
        type: 'WATCHING'
    });
    
    await message.reply(`✅ تم تحديث عدد اللاعبين المتصلين إلى: ${count}`);
}

// Show help
async function showHelp(message) {
    const embed = new EmbedBuilder()
        .setColor('#9333ea')
        .setTitle('🤖 أوامر بوت 𝐏𝐞𝐫𝐟𝐞𝐜𝐭 𝐂𝐅𝐖')
        .setDescription('جميع الأوامر متاحة للمالك فقط')
        .addFields(
            { name: '`!stats`', value: 'عرض إحصائيات السيرفر', inline: false },
            { name: '`!applications`', value: 'عرض قائمة التقديمات', inline: false },
            { name: '`!accept <رقم>`', value: 'قبول تقديم', inline: false },
            { name: '`!reject <رقم> <السبب>`', value: 'رفض تقديم مع سبب', inline: false },
            { name: '`!addvehicle <اسم> <السعر> <الوصف>`', value: 'إضافة سيارة للمتجر', inline: false },
            { name: '`!announce <الرسالة>`', value: 'إرسال إعلان', inline: false },
            { name: '`!online <عدد>`', value: 'تحديث عدد اللاعبين', inline: false },
            { name: '`!help`', value: 'عرض هذه المساعدة', inline: false }
        )
        .setFooter({ text: '𝐏𝐞𝐫𝐟𝐞𝐜𝐭 𝐂𝐅𝐖 Bot v1.0' })
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}

// Update server stats
async function updateServerStats() {
    try {
        const guild = client.guilds.cache.get(BOT_CONFIG.guildId);
        if (guild) {
            serverStats.totalMembers = guild.memberCount;
            saveData();
        }
    } catch (error) {
        console.log('Error updating server stats:', error);
    }
}

// Error handling
client.on('error', (error) => {
    console.error('Discord bot error:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
});

// Login bot
client.login(BOT_CONFIG.token).catch(console.error);
