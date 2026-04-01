const mess = {
  game: {
    isPlaying:
      "⚠️ _A game is currently in progress._ Type *give up* to end the game.",
    isGroup: "⚠️ _Games can only be played in a group_",
    isStop: "⚠️ _Game feature is disabled in this group_",
  },
  general: {
    isOwner: "⚠️ _This command is for Bot Owners only._",
    isPremium: "⚠️ _This command is for premium users only._",
    isAdmin: "⚠️ _This command is for Admins only_",
    isGroup: "⚠️ _This command can only be used in a group_",
    limit:
      "⚠️ _Your limit has run out_ \n\n_Type *.claim* to get more limit_ _Or 💎 Subscribe to Premium Membership for unlimited usage_",
    success: "✅ _Success_",
    isBlocked: "⚠️ _You are currently blocked from using this bot_",
    isBaned: "⚠️ _You are currently banned in this group_",
    fiturBlocked: "⚠️ _This feature is currently banned in this group_",
  },
  action: {
    grub_open: "✅ Group successfully opened",
    grub_close: "✅ Group successfully closed",
    user_kick: "✅ _Successfully removed participant from group._",
    mute: "_Group has been successfully muted. All commands will be disabled except to reactivate by typing_ *.unmute*.",
    unmute: "_Group has been successfully unmuted. All commands are active again._",
    resetgc: "_Group link has been reset_",
  },
  handler: {
    // leave empty if not using notification = ''
    badword_warning:
      "⚠️ _*BADWORD DETECTED*_ (@detectword)\n\n@sender _has been warned_ (@warning/@totalwarning)",
    badword_block:
      "⛔ @sender _Has been blocked for repeatedly sending *BADWORD*. (@detectword) Contact the owner if you have questions._",
    antiedit: "⚠️ _*ANTI EDIT DETECTED*_\n\n_Previous Message_ : @oldMessage",
    antidelete:
      "⚠️ _*ANTI DELETE DETECTED*_\n\n_Sender_ : @sender \n_Previous Message_ : @text",
    antispamchat:
      "⚠️ @sender _Don't spam, this is warning #@warning of @totalwarning._",
    antispamchat2:
      "⛔ @sender _Has been blocked for repeatedly spamming. Contact the owner if you have questions._",
    antivirtex: "⚠️ @sender _Detected Sending Virtex._",
    antitagsw: "⚠️ @sender _Detected Tag SW in this group_",
    antibot: "⚠️ @sender _Detected as a Bot_",
    afk: "🚫 *Don't tag them!*\n\n❏ _@sender is AFK since *@duration*_@reason",
    afk_message: "🕊️ @sender has returned from AFK since _*@duration*_.@reason",
    sewa_notif: "⚠️ _*Warning!*_\n\n_Bot Rental Expires:_ @date",
    sewa_out: `❌ _*Bot Rental Period Has Expired*_\n_Bot will leave automatically_\n\nThank you for using the autoresbot rental service.\n\n*Owner Number*\nwa.me/@ownernumber`,
  },
  game_handler: {
    menyerah:
      "Too bad, you gave up!\nAnswer: @answer\n\nWant to play? Type *@command*",
    waktu_habis: "⏳ Time's up! The answer was: @answer",
    tebak_angka:
      "🎉 Congratulations! Your guess is correct. You earned @prize Money.",
    tebak_bendera:
      "🎉 Congratulations! Your guess is correct. You earned @prize Money.",
    tebak_gambar:
      "🎉 Congratulations! Your guess is correct. You earned @prize Money.",
    tebak_hewan:
      "🎉 Congratulations! Your guess is correct. You earned @prize Money.",
    tebak_kalimat:
      "🎉 Congratulations! Your guess is correct. You earned @prize Money.",
    tebak_kata:
      "🎉 Congratulations! Your guess is correct. You earned @prize Money.",
    tebak_lagu:
      "🎉 Congratulations! Your guess is correct. You earned @prize Money.",
    tebak_lirik:
      "🎉 Congratulations! Your guess is correct. You earned @prize Money.",
  },
};

// Variable
global.group = {};
global.group.variable = `
☍ @name
☍ @date
☍ @day
☍ @desc
☍ @group
☍ @greeting
☍ @size
☍ @time`;

export default mess;
