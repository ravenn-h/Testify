let user = async (m, { args, command, text, conn }) => {
    if (!text && !m.mentionedJid[0]) return m.reply("اكتب الرقم أو اعمل منشن مع الأمر");

    let targetNumber = "";

    if (m.mentionedJid[0]) {
        targetNumber = m.mentionedJid[0].split('@')[0];
    } else if (text) {
        targetNumber = text.replace(/[^0-9]/g, '');
    }

    if (!targetNumber) {
        return m.reply("اكتب الرقم صح");
    }

    try {
        const groupMetadata = await conn.groupMetadata(m.chat);
        let participant = groupMetadata.participants.find(
            p => p.id === targetNumber + "@s.whatsapp.net" || 
                 p.id.split('@')[0] === targetNumber ||
                 p.phoneNumber === targetNumber
        );

        if (!participant) {
            return m.reply(`الرقم ${targetNumber} لازم يبقي الجروب`);
        }

        const user = {
            name: m.name || "Owner",
            jid: participant.phoneNumber,
            lid: participant.id
        };
        
        m.reply(JSON.stringify(user, null, 2));

    } catch (err) {
        m.reply(err.message);
    }
};

user.command = ['لمطور','id'];
export default user;