async function handler(m, { conn, command, args }) {
    const chatId = m.chat;
    const subCmd = args[0]?.toLowerCase();

    const menu = `
╭─┈─┈─┈─⟞🕸️⟝─┈─┈─┈─╮
│ *نظام التفعيل والتشغيل*
│
│ *.تفعيل ايقاف_الترحيب*
│ > البوت هيبطل يرحب بالاعضاء
│
│ *.تفعيل تشغيل_الترحيب*
│ > البوت يرحب بالاعضاء
│
│ *.تفعيل تشغيل_الادمن*
│ > البوت يرد على المشرفين فقط
│
│ *.تفعيل ايقاف_الادمن*
│ > البوت يرد على الجميع
│
│ *.تفعيل مطور_فقط*
│ > البوت يتفاعل مع المطورين فقط
│
│ *.تفعيل مطور_عام*
│ > البوت يتفاعل مع الجميع
│
│ *.تفعيل تشغيل_مضاد_الروابط*
│ > البوت يحذف أي رابط
│
│ *.تفعيل ايقاف_مضاد_الروابط*
│ > البوت مايحذفش الروابط
╰─┈─┈─┈─⟞🕸️⟝─┈─┈─┈─╯
`;

    if (!subCmd) return m.reply(menu);

    let result;
    
    switch (subCmd) {
        case 'ايقاف_الترحيب':
            if (!m.isOwner && !m.isAdmin) {
                result = '*❌ هذا الأمر للمشرفين فقط*';
                break;
            }
            global.db.groups[chatId].noWelcome = true;
            result = '*✅ تم تفعيل وضع عدم الترحيب*\n> البوت هيبطل يرحب بالاعضاء';
            break;
            
        case 'تشغيل_الترحيب':
            if (!m.isOwner && !m.isAdmin) {
                result = '*❌ هذا الأمر للمشرفين فقط*';
                break;
            }
            global.db.groups[chatId].noWelcome = false;
            result = '*✅ تم تفعيل وضع الترحيب*\n> البوت يرحب بالاعضاء';
            break;
            
        case 'تشغيل_الادمن':
            if (!m.isOwner && !m.isAdmin) {
                result = '*❌ هذا الأمر للمشرفين فقط*';
                break;
            }
            global.db.groups[chatId].adminOnly = true;
            result = '*✅ تم تفعيل وضع الادمن*\n> البوت سيتفاعل مع المشرفين فقط';
            break;
            
        case 'ايقاف_الادمن':
            if (!m.isOwner && !m.isAdmin) {
                result = '*❌ هذا الأمر للمشرفين فقط*';
                break;
            }
            global.db.groups[chatId].adminOnly = false;
            result = '*✅ تم فك وضع الادمن*\n> البوت سيتفاعل مع جميع الأعضاء';
            break;
            
        case 'مطور_فقط':
            if (!m.isOwner) {
                result = '*❌ هذا الأمر للمطور فقط*';
                break;
            }
            global.db.ownerOnly = true;
            result = '*✅ تم تفعيل وضع المطور فقط*\n> البوت سيتفاعل مع المطورين فقط';
            break;
            
        case 'مطور_عام':
            if (!m.isOwner) {
                result = '*❌ هذا الأمر للمطور فقط*';
                break;
            }
            global.db.ownerOnly = false;
            result = '*✅ تم تفعيل وضع المطور العام*\n> البوت سيتفاعل مع الجميع';
            break;
            
        case 'تشغيل_مضاد_الروابط':
            if (!m.isOwner && !m.isAdmin) {
                result = '*❌ هذا الأمر للمشرفين فقط*';
                break;
            }
            global.db.groups[chatId].antiLink = true;
            result = '*✅ تم تفعيل مضاد الروابط*\n> البوت هيحذف أي رابط';
            break;
            
        case 'ايقاف_مضاد_الروابط':
            if (!m.isOwner && !m.isAdmin) {
                result = '*❌ هذا الأمر للمشرفين فقط*';
                break;
            }
            global.db.groups[chatId].antiLink = false;
            result = '*✅ تم ايقاف مضاد الروابط*\n> البوت مايحذفش الروابط';
            break;
            
        default:
            return m.reply(menu);
    }
    
    if (result) {
        if (result.startsWith('*❌')) return m.reply(result);
        m.reply(result);
    }
};

handler.usage = ['تفعيل'];
handler.category = 'admin';
handler.command = ['تفعيل'];

export default handler;