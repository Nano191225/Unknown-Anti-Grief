import * as Minecraft from "@minecraft/server";
import * as MinecraftUI from "@minecraft/server-ui";
import config from "./data/config";
import cache from "./data/cache";
import { flag, snakeToCamel, msToTime, AppealNet, getClosestPlayer, restoreBlock, parseTime, tpsColor, lfColor, postError } from "./util";
import { Database } from "./lib/Database";
import { EntityQueryOptions } from "./lib/EntityQueryOptions";
import { native } from "./lib/nativeStringify";
import { tickEvent } from "./lib/TickEvent";
import { getScore } from "./lib/getScore";

const world = Minecraft.world;
const system = Minecraft.system;

export function Menu(player) { try {
    const ControlMenu = new MinecraftUI.ActionFormData()
    .title(`§l§cUnknown Anti-Grief`)
    .button(`§lPlayer Options`, "textures/ui/FriendsDiversity.png")
    .button(`§lServer Options`, "textures/ui/servers.png")
    .button(`§lLogging Options`, "textures/ui/book_frame.png")
    .button(`§lAppeal Options`, "textures/ui/world_glyph_color_2x.png")
    .button(`§lReport Options`, "textures/ui/Feedback.png")
    .button(`§lError Options`, "textures/ui/ErrorGlyph.png")
    .button("§l§cClose", "textures/ui/redX1.png")
    .show(player).then((response) => {
        if (response.cancelationReason === "userBusy") MenuBack(player);
        if (response.selection === 0) PlayerOptions(player);
        if (response.selection === 1) ServerOptions(player);
        if (response.selection === 2) LogOptions(player);
        if (response.selection === 3) AppealOptions(player);
        if (response.selection === 4) ReportOptions(player);
        if (response.selection === 5) ErrorOptions(player);
        if (response.selection === 6) return;
    });
} catch (e) {
    postError(e);
}}

const MenuBack = (player) => Menu(player);

function PlayerOptions(player) { try {
    let playerIcons = [
        "textures/ui/icon_alex.png",
        "textures/ui/icon_steve.png",
    ];
    let PlayerList = [];
    const PlayerOptions = new MinecraftUI.ActionFormData()
        .title("§lPlayer Options")
    
    for(let plr of world.getPlayers()) {
        PlayerOptions.button(`§l${plr.name}`, playerIcons[Math.floor(Math.random() * playerIcons.length)]);
        PlayerList.push(plr);
    }
    PlayerOptions.button(`§lReload`, "textures/ui/refresh_hover.png");
    PlayerOptions.button(`§lBack`, `textures/ui/arrow_left.png`);
    PlayerOptions.button("§l§cClose", "textures/ui/redX1.png");

    PlayerOptions.show(player).then((response) => {
        if(PlayerList.length > response.selection) PlayerOptionsSelected(player, PlayerList[response.selection]);
            else if(PlayerList.length == response.selection) PlayerOptionsBack(player);
            else if(PlayerList.length + 1 == response.selection) Menu(player);
            else return;
    });
} catch (e) {
    postError(e);
}}

const PlayerOptionsBack = (player) => PlayerOptions(player);

function PlayerOptionsSelected(player, member) { try {
    const PlayerOptionsSelected = new MinecraftUI.ActionFormData()
    .title(`§lPlayer Options`)
    .button(`§l${member.name}`, "textures/ui/Feedback.png")
    .button(`§lPlayer Info`, "textures/ui/feedIcon.png")
    if (player.permission > member.permission) {
        PlayerOptionsSelected
        .button(`§lPunishment`, "textures/ui/anvil_icon.png")
        .button(`§lClear EnderChest`, "textures/blocks/ender_chest_front.png")
        .button(`§lDisconnect Player`, "textures/ui/hammer_l.png")
        if(!member.hasTag("flying")) PlayerOptionsSelected.button(`§lEnable Fly Mode`, `textures/ui/levitation_effect.png`);
            else PlayerOptionsSelected.button(`§lDisable Fly Mode`, `textures/ui/levitation_effect.png`);
        if(!member.hasTag("frozen")) PlayerOptionsSelected.button(`§lFreeze Player`, `textures/ui/icon_winter.png`);
            else PlayerOptionsSelected.button(`§lUnfreeze Player`, `textures/ui/icon_winter.png`);
        if(!member.hasTag("isMuted")) PlayerOptionsSelected.button(`§lMute Player`, `textures/ui/mute_on.png`);
            else PlayerOptionsSelected.button(`§lUnmute Player`, `textures/ui/mute_off.png`);
        PlayerOptionsSelected.button(`§lSet Player Permission`, `textures/ui/op.png`);
        if(!member.hasTag("vanish")) PlayerOptionsSelected.button(`§lVanish Player`, `textures/ui/invisibility_effect.png`);
            else PlayerOptionsSelected.button(`§lUnvanish Player`, `textures/ui/invisibility_effect.png`);
        PlayerOptionsSelected
        .button(`§lTeleport`, "textures/ui/arrow.png")
        .button(`§lSwitch Gamemode`, "textures/ui/op.png")
    }
    PlayerOptionsSelected
    .button(`§lView AntiGrief Logs`, "textures/ui/book_frame.png")
    .button(`§lBack`, `textures/ui/arrow_left.png`)
    .button(`§l§cClose`, `textures/ui/redX1.png`)
    .show(player).then((response) => {
        if (player.permission > member.permission) {
            if (response.selection === 0) PlayerOptions(player, member);
            if (response.selection === 1) PlayerOptionsSelectedInfo(player, member);
            if (response.selection === 2) PlayerOptionsSelectedPunishment(player, member);
            if (response.selection === 3) PlayerOptionsSelectedEcwipe(player, member);
            if (response.selection === 4) PlayerOptionsSelectedKick(player, member);
            if (response.selection === 5) PlayerOptionsSelectedFly(player, member);
            if (response.selection === 6) PlayerOptionsSelectedFreeze(player, member);
            if (response.selection === 7) PlayerOptionsSelectedMute(player, member);
            if (response.selection === 8) PlayerOptionsSelectedPermission(player, member);
            if (response.selection === 9) PlayerOptionsSelectedVanish(player, member);
            if (response.selection === 10) PlayerOptionsSelectedTeleport(player, member);
            if (response.selection === 11) PlayerOptionsSelectedGamemode(player, member);
            if (response.selection === 12) PlayerOptionsSelectedACL(player, member);
            if (response.selection === 13) PlayerOptions(player);
            if (response.selection === 14) return;
        } else {
            if (response.selection === 0) PlayerOptions(player, member);
            if (response.selection === 1) PlayerOptionsSelectedInfo(player, member);
            if (response.selection === 2) PlayerOptionsSelectedACL(player, member);
            if (response.selection === 3) PlayerOptions(player);
            if (response.selection === 4) return;
        }
        
    });
} catch (e) {
    postError(e);
}}

function PlayerOptionsSelectedInfo(player, member) { try {
    const PlayerOptionsSelectedInfo = new MinecraftUI.ActionFormData()
    .title(`§lPlayer Info`)
    .body(`§7Name:§r ${member.name}\n§7User ID:§r ${Math.abs(member.id)}\n§7Login ID:§r ${member.loginId}\n§7Pos:§r ${Math.floor(member.location.x)} ${Math.floor(member.location.y)} ${Math.floor(member.location.z)}\n§7Dimension:§r ${(member.dimension.id).replace("minecraft:", "")}\n§7Permission:§r Level-${member.permission}\n§7Muted:§r ${member.hasTag("isMuted") ? `§2true§r` : `§4false§r`}\n§7Frozen:§r ${member.hasTag("frozen") ? `§2true§r` : `§4false§r`}\n§7Vanished:§r ${member.hasTag("vanish") ? `§2true§r` : `§4false§r`}\n§7Flying:§r ${member.hasTag("flying") ? `§2true§r` : `§4false§r`}`)
    .button(`§lBack`, `textures/ui/arrow_left.png`)
    .button("§l§cClose", "textures/ui/redX1.png")
    .show(player).then((response) => {
        if (response.selection === 0) PlayerOptionsSelected(player, member);
        if (response.selection === 1) return;
    });
} catch (e) {
    postError(e);
}}

function PlayerOptionsSelectedPunishment(player, member) { try {
    const PlayerOptionsSelectedPunishment = new MinecraftUI.ActionFormData()
    .title(`§lPlayer Punishment`)
    .button(`§lCrash`, "textures/ui/icon_summer.png")
    .button(`§lKick`, "textures/ui/hammer_l.png")
    .button(`§lBan`, "textures/ui/friend_glyph_desaturated.png")
    .button(`§lGrief Detection`, "textures/ui/ErrorGlyph.png")
    .button(`§lBack`, `textures/ui/arrow_left.png`)
    .button("§l§cClose", "textures/ui/redX1.png")
    .show(player).then((response) => {
        if (response.selection === 0) PlayerOptionsSelectedPunishmentActionCrash(player, member);
        if (response.selection === 1) PlayerOptionsSelectedPunishmentActionKick(player, member);
        if (response.selection === 2) PlayerOptionsSelectedPunishmentActionBan(player, member);
        if (response.selection === 3) PlayerOptionsSelectedPunishmentActionGriefDetection(player, member);
        if (response.selection === 4) PlayerOptionsSelected(player, member);
        if (response.selection === 5) return;
    });
} catch (e) {
    postError(e);
}}

function PlayerOptionsSelectedPunishmentActionCrash(player, member) { try {
    const PlayerOptionsSelectedPunishmentActionCrash = new MinecraftUI.ModalFormData()
    .title(`§lPlayer Punishment§r§8 (Crash)`)
    .textField(`Reason`, `Enter here.`)
    .toggle("Silent")
    .show(player).then((response) => {
        if (response?.canceled) PlayerOptionsSelectedPunishment(player, member);
        if (!response.formValues[1]) world.say(` \n§l§d${member.name} §bhas been kicked!\n `);
        for (const p of world.getPlayers()) if (p.hasTag("notify")) p.tell(`§r§4[§cUAG§4]§r ${player.name} has crashed ${member.name} (Silent:${response.formValues[1]}). Reason: ${response.formValues[0]}`);
        member.triggerEvent("uag:disconnect");
    });
} catch (e) {
    postError(e);
}}

function PlayerOptionsSelectedPunishmentActionKick(player, member) { try {
    const PlayerOptionsSelectedPunishmentActionKick = new MinecraftUI.ModalFormData()
    .title(`§lPlayer Punishment§r§8 (Kick)`)
    .textField(`Reason`, `Enter here.`)
    .toggle("Silent")
    .show(player).then((response) => {
        if (response?.canceled) PlayerOptionsSelectedPunishment(player, member);
        if (!response.formValues[1]) world.say(` \n§l§d${member.name} §bhas been kicked!\n `);
        player.runCommandAsync(`kick "${member.name}" §r\n§l§4You are kicked from the server§r\n\n§7Kicked by: ${response.formValues[1] ? `N/A` : player.name}\nReason: ${response.formValues[0].length > 0 ? response.formValues[0] : "No reason given."}`);
        for (const p of world.getPlayers()) if (p.hasTag("notify")) p.tell(`§r§4[§cUAG§4]§r ${player.name} has kicked ${member.name} (Silent:${response.formValues[1]}). Reason: ${response.formValues[0]}`);
    });
} catch (e) {
    postError(e);
}}

function PlayerOptionsSelectedPunishmentActionBan(player, member) { try {
    const PlayerOptionsSelectedPunishmentActionBan = new MinecraftUI.ModalFormData()
    .title(`§lPlayer Punishment§r§8 (Ban)`)
    .textField(`Reason`, "")
    .textField(`Time`, "ex: 7d")
    .toggle("Silent")
    .show(player).then((response) => {
        if (response?.canceled) PlayerOptionsSelectedPunishment(player, member);
        const time = parseTime(response.formValues[1]);
        member.getTags().forEach(t => {
            t = t.replace(/"/g, "");
            if(t.startsWith("reason:")) member.removeTag(t);
            if(t.startsWith("by:")) member.removeTag(t);
            if(t.startsWith("time:")) member.removeTag(t);
        });
        member.addTag(`reason:${response.formValues[0]}`);
        member.addTag(`by:${player.name}`);
        if (time) member.addTag(`time:${Date.now() + time}`);
        member.addTag(`isBanned`);
        if (!response.formValues[2]) world.say(` \n§l§d${member.name} §bhas been banned!\n `);
        for (const p of world.getPlayers()) if (p.hasTag("notify")) p.tell(`§r§4[§cUAG§4]§r ${player.name} has banned ${member.name} (Silent:${response.formValues[2]}). Reason: ${response.formValues[0]}`);
    });
} catch (e) {
    postError(e);
}}

function PlayerOptionsSelectedPunishmentActionGriefDetection(player, member) { try {
    const PlayerOptionsSelectedPunishmentActionGriefDetection = new MinecraftUI.ModalFormData()
    .title(`§lPlayer Punishment§r§8 (GriefDetection)`)
    .textField(`Check`, "ex: AutoClicker, Killaura")
    .textField(`CheckType`, "ex: A, B")
    .textField(`HackType`, "ex: Combat, Exploit")
    .textField(`DebugName`, "ex: Item, Block")
    .textField(`Debug`, "ex: minecraft:bee_hive")
    .textField(`ShouldTP`, "ex: true, 20")
    .slider(`Slot`, 0, 35, 1)
    .show(player).then((response) => {
        if (response?.canceled) PlayerOptionsSelectedPunishment(player, member);
        const v = response.formValues;
        flag(member, v[0], v[1], v[2], v[3], v[4], v[5], false, v[6]);
    });
} catch (e) {
    postError(e);
}}

function PlayerOptionsSelectedEcwipe(player, member) { try {
    member.runCommandAsync(`function tools/ecwipe`);
    const PlayerOptionsSelectedEcwipe = new MinecraftUI.MessageFormData()
    .title(`§lResult`)
    .body(`${member.name}'s enderchest is now cleared!`)
    .button1(`§lBack`)
    .button2(`§l§cClose`)
    .show(player).then((response) => {
        if (response.selection === 0) return;
        if (response.selection === 1) PlayerOptionsSelected(player, member);
    });
} catch (e) {
    postError(e);
}}

function PlayerOptionsSelectedKick(player, member) { try {
    member.triggerEvent(`uag:disconnect`);
    const PlayerOptionsSelectedKick = new MinecraftUI.MessageFormData()
    .title(`§lResult`)
    .body(`Kicked ${member.name}!`)
    .button1(`§lBack`)
    .button2(`§l§cClose`)
    .show(player).then((response) => {
        if (response.selection === 0) return;
        if (response.selection === 1) PlayerOptions(player, member);
    });
} catch (e) {
    postError(e);
}}

function PlayerOptionsSelectedFly(player, member) { try {
    member.runCommandAsync(`function tools/fly`);
    const PlayerOptionsSelectedFly = new MinecraftUI.MessageFormData()
    .title(`§lResult`)
    if (!member.hasTag(`flying`)) PlayerOptionsSelectedFly.body(`${member.name}'s fly mode is now enabled.`)
        else PlayerOptionsSelectedFly.body(`${member.name}'s fly mode has been disabled.`)
    PlayerOptionsSelectedFly
    .button1(`§lBack`)
    .button2(`§l§cClose`)
    .show(player).then((response) => {
        if (response.selection === 0) return;
        if (response.selection === 1) PlayerOptionsSelected(player, member);
    });
} catch (e) {
    postError(e);
}}

function PlayerOptionsSelectedFreeze(player, member) { try {
    member.runCommandAsync(`function tools/freeze`);
    const PlayerOptionsSelectedFreeze = new MinecraftUI.MessageFormData()
    .title(`§lResult`)
    if (member.hasTag(`frozen`)) PlayerOptionsSelectedFreeze.body(`${member.name} was frozen.`)
        else PlayerOptionsSelectedFreeze.body(`${member.name}'s freeze was lifted.`)
    PlayerOptionsSelectedFreeze
    .button1(`§lBack`)
    .button2(`§l§cClose`)
    .show(player).then((response) => {
        if (response.selection === 0) return;
        if (response.selection === 1) PlayerOptionsSelected(player, member);
    });
} catch (e) {
    postError(e);
}}

function PlayerOptionsSelectedMute(player, member) { try {
    member.runCommandAsync(`function tools/mute`);
    const PlayerOptionsSelectedMute = new MinecraftUI.MessageFormData()
    .title(`§lResult`)
    if (!member.hasTag(`isMuted`)) PlayerOptionsSelectedMute.body(`${member.name} is now muted.`)
        else PlayerOptionsSelectedMute.body(`${member.name}'s mute has been unmuted.`)
    PlayerOptionsSelectedMute
    .button1(`§lBack`)
    .button2(`§l§cClose`)
    .show(player).then((response) => {
        if (response.selection === 0) return;
        if (response.selection === 1) PlayerOptionsSelected(player, member);
    });
} catch (e) {
    postError(e);
}}

function PlayerOptionsSelectedPermission(player, member) { try {
    const PlayerOptionsSelectedPermission = new MinecraftUI.ModalFormData()
    .title("PLayer Permission")
    .slider("Level", 0, player.permission -1, 1, member.permission)
    .show(player).then(response => {
        if (response?.canceled) return;
        member.getTags().forEach(t => { if (t.startsWith(`\"\n\nUAG\nPermission\t§k`) && t.endsWith(`\""`)) member.removeTag(t); });
        if (response.formValues[0] === 0) {
            member.tell("§r§4[§cUAG§4]§r Removed permissions.")
            for (const p of world.getPlayers()) if (p.hasTag("notify")) p.tell(`§r§4[§cUAG§4]§r ${player.name} has set ${member.name}'s permission level to 0.`);
        } else if (response.formValues[0] === 1) {
            member.addTag(`\"\n\nUAG\nPermission\t§k${config.permission.level_1.tag}\""`);
            member.tell("§r§4[§cUAG§4]§r Permission level 1 given.");
            for (const p of world.getPlayers()) if (p.hasTag("notify")) p.tell(`§r§4[§cUAG§4]§r ${player.name} has set ${member.name}'s permission level to 1.`);
        } else if (response.formValues[0] === 2) {
            member.addTag(`\"\n\nUAG\nPermission\t§k${config.permission.level_2.tag}\""`);
            member.tell("§r§4[§cUAG§4]§r Permission level 2 given.");
            for (const p of world.getPlayers()) if (p.hasTag("notify")) p.tell(`§r§4[§cUAG§4]§r ${player.name} has set ${member.name}'s permission level to 2.`);
        } else if (response.formValues[0] === 3) {
            member.addTag(`\"\n\nUAG\nPermission\t§k${config.permission.level_3.tag}\""`);
            member.tell("§r§4[§cUAG§4]§r Permission level 3 given.");
            for (const p of world.getPlayers()) if (p.hasTag("notify")) p.tell(`§r§4[§cUAG§4]§r ${player.name} has set ${member.name}'s permission level to 3.`);
        } else if (response.formValues[0] === 4) {
            member.addTag(`\"\n\nUAG\nPermission\t§k${config.permission.level_4.tag}\""`);
            member.tell("§r§4[§cUAG§4]§r Permission level 4 given.");
            for (const p of world.getPlayers()) if (p.hasTag("notify")) p.tell(`§r§4[§cUAG§4]§r ${player.name} has set ${member.name}'s permission level to 4.`);
        } else if (response.formValues[0] === 5) {
            member.addTag(`\"\n\nUAG\nPermission\t§k${config.permission.level_5.tag}\""`);
            member.tell("§r§4[§cUAG§4]§r Permission level 5 given.");
            for (const p of world.getPlayers()) if (p.hasTag("notify")) p.tell(`§r§4[§cUAG§4]§r ${player.name} has set ${member.name}'s permission level to 5.`);
        }
        const PlayerOptionsSelectedPermissionR = new MinecraftUI.MessageFormData()
        .title(`§lResult`)
        .body(`${member.name}'s permission level was set to ${response.formValues[0]}.`)
        .button1(`§lBack`)
        .button2(`§l§cClose`)
        .show(player).then((response) => {
            if (response.selection === 0) return;
            if (response.selection === 1) PlayerOptionsSelected(player, member);
        });
    });
} catch (e) {
    postError(e);
}}

function PlayerOptionsSelectedVanish(player, member) { try {
    member.runCommand(`function tools/vanish`);
    const PlayerOptionsSelectedVanish = new MinecraftUI.MessageFormData()
    .title(`§lResult`)
    if (member.hasTag(`vanish`)) PlayerOptionsSelectedVanish.body(`${member.name} is now vanished.`)
        else PlayerOptionsSelectedVanish.body(`${member.name}'s vanish has been unvanished.`)
    PlayerOptionsSelectedVanish
    .button1(`§lBack`)
    .button2(`§l§cClose`)
    .show(player).then((response) => {
        if (response.selection === 0) return;
        if (response.selection === 1) PlayerOptionsSelected(player, member);
    });
} catch (e) {
    postError(e);
}}

function PlayerOptionsSelectedTeleport(player, member) { try {
    const PlayerOptionsSelectedTeleport = new MinecraftUI.ActionFormData()
    .title("§lPlayer Teleport")
    .button(`§lTeleport To`, "textures/ui/arrow.png")
    .button(`§lTeleport Here`, "textures/ui/arrow_down.png")
    .button(`§lBack`, `textures/ui/arrow_left.png`)
    .button("§l§cClose", "textures/ui/redX1.png")
    .show(player).then((response) => {
        if (response.selection === 0) player.runCommandAsync(`tp @s "${member.name}"`);
        if (response.selection === 1) player.runCommandAsync(`tp "${member.name}" @s`);
        if (response.selection === 1) PlayerOptionsSelected(player, member);
        if (response.selection === 2) PlayerOptionsSelected(player, member);
        if (response.selection === 3) return;
    });
} catch (e) {
    postError(e);
}}

function PlayerOptionsSelectedGamemode(player, member) { try {
    const PlayerOptionsSelectedGamemode = new MinecraftUI.ActionFormData()
    .title("§lPlayer Gamemode")
    .button(`§lGamemode Creative`, "textures/ui/op.png")
    .button(`§lGamemode Survival`, "textures/ui/permissions_member_star.png")
    .button(`§lGamemode Adventure`, "textures/ui/permissions_visitor_hand.png")
    .button(`§lGamemode Spectator`, "textures/ui/friend_glyph_desaturated.png")
    .button(`§lBack`, `textures/ui/arrow_left.png`)
    .button("§l§cClose", "textures/ui/redX1.png")
    .show(player).then((response) => {
        if (response.selection === 0) member.runCommand(`gamemode 1`);
        if (response.selection === 1) member.runCommand(`gamemode 0`);
        if (response.selection === 2) member.runCommand(`gamemode 2`);
        if (response.selection === 3) member.runCommand(`gamemode spectator`);
        if (response.selection === 4) PlayerOptionsSelected(player, member);
        if (response.selection === 5) return;
        if (response.selection <= 3) PlayerOptionsSelectedGamemodeBack(player, member);
    });
} catch (e) {
    postError(e);
}}

const PlayerOptionsSelectedGamemodeBack = (player, member) => PlayerOptionsSelectedGamemode(player, member);

function PlayerOptionsSelectedACL(player, member) { try {
    const PlayerOptionsSelectedACLSelect = new MinecraftUI.ActionFormData()
    .title(`§lPlayer AntiGriefLog`)
    .button(`§lAll Time`, "textures/ui/clock.png")
    .button(`§lAfter logging in`, "textures/ui/clock.png")
    .button(`§lBack`, `textures/ui/arrow_left.png`)
    .button("§l§cClose", "textures/ui/redX1.png")
    .show(player).then((response) => {
        if (response.selection === 0) PlayerOptionsSelectedACLAllTime(player, member);
        if (response.selection === 1) PlayerOptionsSelectedACLAfterLoggingIn(player, member);
        if (response.selection === 2) PlayerOptionsSelected(player, member);
        if (response.selection === 3) return;
        
    });
} catch (e) {
    postError(e);
}}

function PlayerOptionsSelectedACLAllTime(player, member) { try {
    const AllAntiGriefLog = new Database("Log");
    const AACL = AllAntiGriefLog.get(member.name);
    let Log = "";
    for (let i = 0; i < AACL.length; i++) {
        Log += `\n§r§7${i}:§r ${AACL[i].check}/${AACL[i].checkType}${AACL[i].debugName ? ` (${AACL[i].debugName}=${AACL[i].debug})` : ""}. VL=${AACL[i].vl}`;
    }
    const PlayerOptionsSelectedACLAllTime = new MinecraftUI.ActionFormData()
    .title(`§lAntiGriefLog §8(All Time)`)
    .body(`${member.name}'s log is being shown.${Log}`)
    .button(`§lReset Log`, "textures/ui/refresh_light.png")
    .button(`§lBack`, `textures/ui/arrow_left.png`)
    .button("§l§cClose", "textures/ui/redX1.png")
    .show(player).then((response) => {
        if (response.selection === 0) AllAntiGriefLog.set(member.name, []);
        if (response.selection === 0) PlayerOptionsSelectedACLAllTimeBack(player, member);
        if (response.selection === 1) PlayerOptionsSelectedACL(player, member);
        if (response.selection === 2) return;
    });
} catch (e) {
    postError(e);
}}

const PlayerOptionsSelectedACLAllTimeBack = (player, member) => system.run(() => system.run(() => PlayerOptionsSelectedACLAllTime(player, member)));

function PlayerOptionsSelectedACLAfterLoggingIn(player, member) { try {
    const ACL = player.log;
    let Log = "";
    for (let i = 0; i < ACL.length; i++) {
        Log += `\n§r§7${i}:§r ${ACL[i].check}/${ACL[i].checkType}${ACL[i].debugName ? ` (${ACL[i].debugName}=${ACL[i].debug})` : ""}. VL=${ACL[i].vl}`;
    }
    const PlayerOptionsSelectedACLSelectAfterLoggingIn = new MinecraftUI.ActionFormData()
    .title(`§lAntiGriefLog §8(After logging in)`)
    .body(`${member.name}'s log is being shown.${Log}`)
    .button(`§lReset Log`, "textures/ui/refresh_light.png")
    .button(`§lBack`, `textures/ui/arrow_left.png`)
    .button("§l§cClose", "textures/ui/redX1.png")
    .show(player).then((response) => {
        if (response.selection === 0) player.log = [];
        if (response.selection === 0) PlayerOptionsSelectedACLAfterLoggingInBack(player, member);
        if (response.selection === 1) PlayerOptionsSelectedACL(player, member);
        if (response.selection === 2) return;
    });
} catch (e) {
    postError(e);
}}

const PlayerOptionsSelectedACLAfterLoggingInBack = (player, member) => PlayerOptionsSelectedACLAfterLoggingIn(player, member);

function ServerOptions(player) { try {
    const ServerOptions = new MinecraftUI.ActionFormData()
    .title(`§lServer Options`)
    .button(`§lServer Info`, "textures/ui/magnifyingGlass.png")
    .button(`§lWhitelist Mode`, "textures/ui/dressing_room_skins.png")
    .button(`§lBan Module`, "textures/ui/smithing_icon.png")
    .button(`§lUnbanQueue`, "textures/ui/feedIcon.png")
    .button(`§lServer Close`, "textures/ui/ErrorGlyph.png")
    .button(`§lBack`, `textures/ui/arrow_left.png`)
    .button(`§l§cClose`, `textures/ui/redX1.png`)
    .show(player).then((response) => {
        if (response.selection === 0) ServerOptionsServerInfo(player);
        if (response.selection === 1) ServerOptionsWhitelistMode(player);
        if (response.selection === 2) ServerOptionsBanModule(player);
        if (response.selection === 3) ServerOptionsUnbanQueue(player);
        if (response.selection === 4) ServerOptionsServerClose(player);
        if (response.selection === 5) Menu(player);
        if (response.selection === 6) return;
    });
} catch (e) {
    postError(e);
}}

function ServerOptionsServerInfo(player) { try {
    let Players = "";
    for(const plr of world.getPlayers()) {
        Players += `\n §7-§r ${plr.name}`
    }
    let TPS_one_minute = "NaN";
    let TPS_five_minutes = "NaN";
    for (const v of player.tpsShard) {
        if (v.timestamp === Math.floor(Date.now() / 1000) - 60) TPS_one_minute = v.tps;
        if (v.timestamp === Math.floor(Date.now() / 1000) - 300) TPS_five_minutes = v.tps;
    }
    let LF_one_minute = "NaN";
    let LF_five_minutes = "NaN";
    for (const v of player.loadFactorShard) {
        if (v.timestamp === Math.floor(Date.now() / 1000) - 60) LF_one_minute = v.loadFactor;
        if (v.timestamp === Math.floor(Date.now() / 1000) - 300) LF_five_minutes = v.loadFactor;
    }
    const ServerData = new Database("ServerData");
    const ServerOptionsServerInfo = new MinecraftUI.ActionFormData()
    .title(`§lServer Info`)
    .body(`§7Now Players:§r ${[...world.getPlayers()].length}${Players}\n§7TPS:§r ${tpsColor(player.tps)} §8| §71 min ago: ${tpsColor(TPS_one_minute)} §8| §75 min ago: ${tpsColor(TPS_five_minutes)}\n§7LF:§r ${lfColor(player.loadFactor)} §8| §71 min ago: ${lfColor(LF_one_minute)} §8| §75 min ago: ${lfColor(LF_five_minutes)}\n§7Whitelist Mode:§r ${ServerData.get("WhiteListMode") ? `§2true§r` : `§4false§r`}\n§7Ban Module:§r ${ServerData.get("BanModule") ? `§2true§r` : `§4false§r`}`)
    .button(`§lBack`, `textures/ui/arrow_left.png`)
    .button(`§l§cClose`, `textures/ui/redX1.png`)
    .show(player).then((response) => {
        if (response.selection === 0) ServerOptions(player);
        if (response.selection === 1) return;
    });
} catch (e) {
    postError(e);
}}

function ServerOptionsWhitelistMode(player) { try {
    const ServerData = new Database("ServerData")
    let WhiteListMode = ServerData.get("WhiteListMode");
    const ServerOptionsWhitelistMode = new MinecraftUI.ActionFormData()
    .title(`§lWhitelist Mode`)
    .body(`§lNow:§r ${WhiteListMode ? "§2enable": "§4disable"}`)
    .button(`§l§2Enable`, "textures/ui/toggle_on.png")
    .button(`§l§4Disable`, "textures/ui/toggle_off.png")
    .button(`§lBack`, `textures/ui/arrow_left.png`)
    .button(`§l§cClose`, `textures/ui/redX1.png`)
    .show(player).then((response) => {
        if (response.selection === 0) {
            ServerData.set(`WhiteListMode`, true);
            for (const p of world.getPlayers()) if (!config.modules.whitelist.users.includes(p.name)) p.WhiteListKick = true;
        }
        if (response.selection === 1) ServerData.set(`WhiteListMode`, false);
        if (response.selection <= 1) ServerOptionsWhitelistModeBack(player);
        if (response.selection === 2) ServerOptions(player);
        if (response.selection === 3) return;
    });
} catch (e) {
    postError(e);
}}

const ServerOptionsWhitelistModeBack = (player) => system.run(() => system.run(() => ServerOptionsWhitelistMode(player)));

function ServerOptionsBanModule(player) { try {
    const ServerData = new Database("ServerData");
    let BanModule = ServerData.get("BanModule");
    const ServerOptionsBanModule = new MinecraftUI.ActionFormData()
    .title(`§lBan Module`)
    .body(`§lNow:§r ${BanModule ? "§2enable": "§4disable"}`)
    .button(`§l§2Enable`, "textures/ui/toggle_on.png")
    .button(`§l§4Disable`, "textures/ui/toggle_off.png")
    .button(`§lBack`, `textures/ui/arrow_left.png`)
    .button(`§l§cClose`, `textures/ui/redX1.png`)
    .show(player).then((response) => {
        if (response.selection === 0) ServerData.set(`BanModule`, true)
        if (response.selection === 1) ServerData.set(`BanModule`, false)
        if (response.selection <= 1) ServerOptionsBanModuleBack(player)
        if (response.selection === 2) ServerOptions(player);
        if (response.selection === 3) return;
    });
} catch (e) {
    postError(e);
}}

const ServerOptionsBanModuleBack = (player) => system.run(() => system.run(() => ServerOptionsBanModule(player)));

function ServerOptionsUnbanQueue(player) { try {
    const ServerOptionsUnbanQueue = new MinecraftUI.ActionFormData()
    .title(`§lUnban Queue`)
    .button(`§lAdd`, "textures/ui/plus.png")
    .button(`§lRemove`, "textures/ui/minus.png")
    .button(`§lList`, "textures/ui/feedIcon.png")
    .button(`§lBack`, `textures/ui/arrow_left.png`)
    .button(`§l§cClose`, `textures/ui/redX1.png`)
    .show(player).then((response) => {
        const ServerData = new Database("ServerData");
        if (response.selection === 0) {
            const ServerOptionsUnbanQueueAdd = new MinecraftUI.ModalFormData()
            .title(`§lUnban Queue §8(Add)`)
            .textField(`GamerTag`, "")
            .show(player).then((response) => {
                if (response?.canceled) ServerOptionsUnbanQueueBack(player);
                let unbanQueue = ServerData.get("UnbanQueue");
                if (unbanQueue.includes(response.formValues[0])) {
                    const PlayerOptionsSelectedVanishOwnerError = new MinecraftUI.MessageFormData()
                    .title(`§l§cError`)
                    .body(`${response.formValues[0]} has already added to Unban Queue.`)
                    .button1(`§lBack`)
                    .button2(`§l§cClose`)
                    .show(player).then((response) => {
                        if (response.selection === 0) return;
                        if (response.selection === 1) ServerOptionsUnbanQueueBack(player);
                        return;
                    });
                } else {
                    unbanQueue.push(response.formValues[0]);
                    ServerData.set("UnbanQueue", unbanQueue);
                    const PlayerOptionsSelectedVanishOwnerError = new MinecraftUI.MessageFormData()
                    .title(`§l§2Success`)
                    .body(`${response.formValues[0]} was added to Unban Queue.`)
                    .button1(`§lBack`)
                    .button2(`§l§cClose`)
                    .show(player).then((response) => {
                        if (response.selection === 0) return;
                        if (response.selection === 1) ServerOptionsUnbanQueueBack(player);
                        return;
                    });
                }
            });
        }
        if (response.selection === 1) {
            let UnbanQueueList = ServerData.get("UnbanQueue");
            let UnbanQueue = [ `§lUse text field` ];
            for (let i = 0; i < UnbanQueueList.length; i++) UnbanQueue.push(UnbanQueueList[i]);
            const ServerOptionsUnbanQueueRemove = new MinecraftUI.ModalFormData()
            .title(`§lUnban Queue §8(Remove)`)
            .dropdown(`Select GamerTag`, UnbanQueue)
            .textField(`GamerTag`, "")
            .show(player).then((response) => {
                if (response?.canceled) ServerOptionsUnbanQueueBack(player);
                if (response.formValues[0] != 0) {
                    UnbanQueueList = UnbanQueueList.filter(p => p !== UnbanQueue[response.formValues[0]]);
                    ServerData.set("UnbanQueue", UnbanQueueList);
                    const ServerOptionsUnbanQueueRemoveSuccess = new MinecraftUI.MessageFormData()
                    .title(`§l§2Success`)
                    .body(`${UnbanQueue[response.formValues[0]]} removed from Unban Queue.`)
                    .button1(`§lBack`)
                    .button2(`§l§cClose`)
                    .show(player).then((response) => {
                        if (response.selection === 0) return;
                        if (response.selection === 1) ServerOptionsUnbanQueueBack(player);
                        return;
                    });
                } else if (response.formValues[1] === "") {
                    const ServerOptionsUnbanQueueRemoveError = new MinecraftUI.MessageFormData()
                    .title(`§l§cError`)
                    .body(`Someone must be designated.`)
                    .button1(`§lBack`)
                    .button2(`§l§cClose`)
                    .show(player).then((response) => {
                        if (response.selection === 0) return;
                        if (response.selection === 1) ServerOptionsUnbanQueueBack(player);
                        return;
                    });
                } else if (!UnbanQueueList.includes(response.formValues[1])) {
                    const ServerOptionsUnbanQueueRemoveError = new MinecraftUI.MessageFormData()
                    .title(`§l§cError`)
                    .body(`${response.formValues[1]} could not be found.`)
                    .button1(`§lBack`)
                    .button2(`§l§cClose`)
                    .show(player).then((response) => {
                        if (response.selection === 0) return;
                        if (response.selection === 1) ServerOptionsUnbanQueueBack(player);
                        return;
                    });
                } else {
                    UnbanQueueList = UnbanQueueList.filter(p => p !== response.formValues[1]);
                    ServerData.set("UnbanQueue", UnbanQueueList);
                    const ServerOptionsUnbanQueueRemoveSuccess = new MinecraftUI.MessageFormData()
                    .title(`§l§2Success`)
                    .body(`${response.formValues[1]} removed from Unban Queue.`)
                    .button1(`§lBack`)
                    .button2(`§l§cClose`)
                    .show(player).then((response) => {
                        if (response.selection === 0) return;
                        if (response.selection === 1) ServerOptionsUnbanQueueBack(player);
                        return;
                    });
                }
            });
        }
        if (response.selection === 2) {
            let UnbanQueueList = ServerData.get("UnbanQueue");
            let UnbanQueue = `§lPlayers added to Unban Queue:§r`;
            for (let i = 0; i < UnbanQueueList.length; i++) UnbanQueue += `\n §7-§r ${UnbanQueueList[i]}`;
            const ServerOptionsUnbanQueueList = new MinecraftUI.ActionFormData()
            .title(`§lUnban Queue §8(List)`)
            .body(UnbanQueue)
            .button(`§lBack`, `textures/ui/arrow_left.png`)
            .button(`§l§cClose`, `textures/ui/redX1.png`)
            .show(player).then((response) => {
                if (response.selection === 0) ServerOptionsUnbanQueueBack(player);
                if (response.selection === 1) return;
            });
        }
        if (response.selection === 3) ServerOptions(player);
        if (response.selection === 4) return;
    })
} catch (e) {
    postError(e);
}}

const ServerOptionsUnbanQueueBack = (player) => ServerOptionsUnbanQueue(player);

function ServerOptionsServerClose(player) { try {
    const ServerOptionsServerClose = new MinecraftUI.ActionFormData()
    .title(`§lServer close`)
    .button(`§l§4Close the server`, "textures/ui/ErrorGlyph_small_hover.png")
    .button(`§lBack`, `textures/ui/arrow_left.png`)
    .button(`§l§cClose`, `textures/ui/redX1.png`)
    .show(player).then((response) => {
        if (response.selection === 0) player.serverClose = true;
        if (response.selection === 1) ServerOptions(player);
        if (response.selection === 2) return;
    });
} catch (e) {
    postError(e);
}}

function LogOptions(player) { try {
    const AllAntiGriefLog = new Database("Log");
    let playerIcons = [
        "textures/ui/icon_alex.png",
        "textures/ui/icon_steve.png",
    ];
    let PlayerList = [];
    const LogOptions = new MinecraftUI.ActionFormData()
    .title("§lAntiGrief Logging")
    .button(`§lSearch Player`, "textures/ui/magnifyingGlass.png")

    for(let plr of AllAntiGriefLog.keysAll()) {
        if (AllAntiGriefLog.get(plr).length > 0) {
            LogOptions.button(`§l${plr}\n${AllAntiGriefLog.get(plr).length} logs`, playerIcons[Math.floor(Math.random() * playerIcons.length)]);
            PlayerList.push(plr);
        }
    }
    LogOptions
    .button(`§lBack`, `textures/ui/arrow_left.png`)
    .button("§l§cClose", "textures/ui/redX1.png")
    .show(player).then((response) => {
        if (response.selection === 0) LogOptionsSearch(player);
            else if(PlayerList.length > response.selection-1) LogOptionsShow(player, PlayerList[response.selection-1]);
            else if(PlayerList.length+1== response.selection) Menu(player);
            else if(PlayerList.length+2 == response.selection) return;
    });
} catch (e) {
    postError(e);
}}

function LogOptionsSearch(player) { try {
    const LogOptionsSearch = new MinecraftUI.ModalFormData()
    .title(`§lSearch Player`)
    .textField(`PlayerName`, "")
    .show(player).then((response) => {
        if (response?.canceled) LogOptions(player);
        if (response.formValues[0]) LogOptionsShow(player, response.formValues[0]);
            else LogOptionsSearchBack(player);
    });
} catch (e) {
    postError(e);
}}

const LogOptionsSearchBack = (player) => LogOptionsSearch(player);

function LogOptionsShow(player, name) { try {
    const AllAntiGriefLog = new Database("Log");
    if (!AllAntiGriefLog.hasAll(name)) {
        const LogOptionsShowERR = new MinecraftUI.MessageFormData()
        .title(`§l§4Error`)
        .body(`\n\n§cThe player was not found in the all-anti-grief log database.`)
        .button1(`§lBack`)
        .button2(`§l§cClose`)
        .show(player).then((response) => {
            if (response.selection === 0) return;
            if (response.selection === 1) LogOptionsSearch(player);
        });
    }
    let AACL = AllAntiGriefLog.get(name);
    let Log = "";
    for (let i = 0; i < AACL.length; i++) Log += `\n§r§7${i}:§r ${AACL[i].check}/${AACL[i].checkType}${AACL[i].debugName ? ` (${AACL[i].debugName}=${AACL[i].debug})` : ""}. VL=${AACL[i].vl}`;
    const LogOptionsShow = new MinecraftUI.ActionFormData()
    .title(`§lAntiGriefLogging §8(Selected §o${name}§r§8)`)
    .body(`${name}'s log is being shown.${Log}`)
    .button(`§lReset Log`, "textures/ui/refresh_light.png")
    .button(`§lBack`, `textures/ui/arrow_left.png`)
    .button("§l§cClose", "textures/ui/redX1.png")
    .show(player).then((response) => {
        if (response.selection === 0) {
            AllAntiGriefLog.set(name, []);
            LogOptionsShowBack(player, name);
        }
        if (response.selection === 1) LogOptions(player);
        if (response.selection === 2) return;
    });
} catch (e) {
    postError(e);
}}

const LogOptionsShowBack = (player, name) => system.run(() => system.run(() => LogOptionsShow(player, name)));

function AppealOptions(player) { try {
    const Appeal = new Database("Appeal");
    let playerIcons = [
        "textures/ui/icon_alex.png",
        "textures/ui/icon_steve.png",
    ];
    let CodeList = [];
    const AppealOptions = new MinecraftUI.ActionFormData()
    .title("§lAppeal Options")
    .button(`§lSearch`, "textures/ui/magnifyingGlass.png")
    
    for(let plr of Appeal.keysAll()) {
        AppealOptions.button(`§l${plr}§r\n§l${Appeal.get(plr)[0]}§r`, playerIcons[Math.floor(Math.random() * playerIcons.length)]);
        CodeList.push(plr);
    }
    AppealOptions
    .button(`§lBack`, `textures/ui/arrow_left.png`)
    .button("§l§cClose", "textures/ui/redX1.png")
    .show(player).then((response) => {
        if (response.selection === 0) AppealOptionsSearch(player);
            else if(CodeList.length > response.selection-1) AppealOptionsShow(player, CodeList[response.selection-1]);
            else if(CodeList.length+1 === response.selection) Menu(player);
            else if(CodeList.length+2 === response.selection) return;
    });
} catch (e) {
    postError(e);
}}

function AppealOptionsSearch(player) { try {
    const AppealOptionsSearch = new MinecraftUI.ModalFormData()
    .title(`§lSearch`)
    .textField(`Code`, `Enter here.`)
    .show(player).then((response) => {
        if (response?.canceled) AppealOptions(player);
        if (response.formValues[0]) AppealOptionsShow(player, response.formValues[0]);
            else AppealOptionsSearchBack(player);
    });
} catch (e) {
    postError(e);
}}

const AppealOptionsSearchBack = (player) => AppealOptionsSearch(player);

function AppealOptionsShow(player, code) { try {
    let AppealData = AppealNet("load", code);
    if (!AppealNet("has", code)) {
        const AppealOptionsShowERR = new MinecraftUI.MessageFormData()
        .title(`§l§4Error`)
        .body(`\n\n§cThe code was not found in the ban database.`)
        .button1(`§lBack`)
        .button2(`§l§cClose`)
        .show(player).then((response) => {
            if (response.selection === 0) return;
            if (response.selection === 1) AppealOptionsSearch(player);
        })
    }

    let TIME = null;
    if (AppealData[3]) {
        TIME = msToTime(Number(AppealData[3]));
        TIME = `${TIME.d} day(s), ${TIME.h} hour(s), ${TIME.m} minute(s), ${TIME.s} second(s)`;
    }
    const AppealOptionsShow = new MinecraftUI.ActionFormData()
    .title(`§lAppeal §8(${code})`)
    .body(`§7Code: §r${code}\n\n§7Player: §r${AppealData[0]}\n§7Banned by: §r${AppealData[1]}\n§7Reason: §r${AppealData[2]}\n§7Length: §r${TIME}\n\n${AppealData[4] ? `§7Check: §r ${AppealData[4]}/${AppealData[5]}` : ""} ${AppealData[6] ? `(${AppealData[6]}=${AppealData[7]})` : ""}\n\n§7Unban: §r${AppealData[8]}`)
    .button(`§lUnban`, "textures/ui/refresh_light.png")
    .button(`§lDelete`, "textures/ui/trash_light.png")
    .button(`§lBack`, `textures/ui/arrow_left.png`)
    .button("§l§cClose", "textures/ui/redX1.png")
    .show(player).then((response) => {
        if (response.selection === 0) {
            if (AppealData[8]) AppealData[8] = false;
                else AppealData[8] = true;
            AppealNet("save", code, AppealData[0], AppealData[1], AppealData[2], AppealData[3], AppealData[4], AppealData[5], AppealData[6], AppealData[7], AppealData[8]);
            AppealOptionsShowBack(player, code);
        }
        if (response.selection === 1) {
            AppealNet("delete", code);
            system.run(() => system.run(() => system.run(() => system.run(() => AppealOptions(player, code)))));
        }
        if (response.selection === 2) AppealOptions(player);
        if (response.selection === 3) return;
    });
} catch (e) {
    postError(e);
}}

const AppealOptionsShowBack = (player, code) => system.run(() => system.run(() => AppealOptionsShow(player, code)));

function ReportOptions(player) { try {
    const ReportData = new Database("Report");
    let playerIcons = [
        "textures/ui/icon_alex.png",
        "textures/ui/icon_steve.png",
    ];
    let ReportList = [];
    const ReportOptions = new MinecraftUI.ActionFormData()
    .title("§lReport Options")

    for(const data_ of ReportData.keysAll()) {
        const data = ReportData.get(data_)
        if (!data.read) {
            const date = `${new Date(data.time).getFullYear()}-${new Date(data.time).getMonth()+1}-${new Date(data.time).getDate()} ${new Date(data.time).getHours() < 10 ? `0${new Date(data.time).getHours()}` : new Date(data.time).getHours()}:${new Date(data.time).getMinutes() < 10 ? `0${new Date(data.time).getMinutes()}` : new Date(data.time).getMinutes()}`
            ReportOptions.button(`§l§0${date} §r§c*§l\n§8${data.data.by} §7>> §8${data.data.to}`, playerIcons[Math.floor(Math.random() * playerIcons.length)]);
            ReportList.push(data_);
        }
    }
    for(const data_ of ReportData.keysAll()) {
        const data = ReportData.get(data_)
        if (data.read) {
            const date = `${new Date(data.time).getFullYear()}-${new Date(data.time).getMonth()+1}-${new Date(data.time).getDate()} ${new Date(data.time).getHours() < 10 ? `0${new Date(data.time).getHours()}` : new Date(data.time).getHours()}:${new Date(data.time).getMinutes() < 10 ? `0${new Date(data.time).getMinutes()}` : new Date(data.time).getMinutes()}`
            ReportOptions.button(`§l${date}\n§8${data.data.by} §7>> §8${data.data.to}`, playerIcons[Math.floor(Math.random() * playerIcons.length)]);
            ReportList.push(data_);
        }
    }
    ReportOptions
    .button(`§lBack`, `textures/ui/arrow_left.png`)
    .button("§l§cClose", "textures/ui/redX1.png")
    .show(player).then((response) => {
        if(ReportList.length > response.selection) ReportOptionsShow(player, ReportList[response.selection]);
            else if(ReportList.length === response.selection) Menu(player);
            else if(ReportList.length+1 === response.selection) return;
    });
} catch (e) {
    postError(e);
}}

function ReportOptionsShow(player, key) { try {
    let ReportData_ = new Database("Report").get(String(key));
    ReportData_.read = true;
    new Database("Report").set(String(key), ReportData_);
    const ReportData = new Database("Report").get(String(key));
    const date = `${new Date(ReportData.time).getFullYear()}-${new Date(ReportData.time).getMonth()+1}-${new Date(ReportData.time).getDate()} ${new Date(ReportData.time).getHours() < 10 ? `0${new Date(ReportData.time).getHours()}` : new Date(ReportData.time).getHours()}:${new Date(ReportData.time).getMinutes() < 10 ? `0${new Date(ReportData.time).getMinutes()}` : new Date(ReportData.time).getMinutes()}`
    let inTheServer = false;
    for (const pl of world.getPlayers()) if (pl.name.toLowerCase() === ReportData.data.to.toLowerCase()) inTheServer = pl; 
    const ReportOptionsShow = new MinecraftUI.ActionFormData()
    .title(`§lReport Options`)
    .body(` \n§lTime:§r ${date}\n§lCategory:§r ${ReportData.data.category}§r\n§lPlayer:§r ${ReportData.data.to}§r\n§lReason:§r ${ReportData.data.why}§r\n§lDetails:§r ${ReportData.data.details}§r\n§lWhere:§r ${ReportData.data.where}§r\n§lReported by:§r ${ReportData.data.by}§r\n `);
    if (inTheServer && player.permission > inTheServer.permission) ReportOptionsShow.button(`§lGo to Player Punishment`, "textures/ui/anvil_icon.png");
    ReportOptionsShow
    .button(`§lDelete`, `textures/ui/trash_light.png`)
    .button(`§lBack`, `textures/ui/arrow_left.png`)
    .button("§l§cClose", "textures/ui/redX1.png")
    .show(player).then((response) => {
        if (inTheServer && player.permission > inTheServer.permission) {
            if (response.selection === 0) PlayerOptionsSelectedPunishment(player, inTheServer);
            if (response.selection === 1) new Database("Report").delete(String(key));
            if (response.selection === 1 || response.selection === 2) system.run(() => system.run(() => ReportOptions(player)));
        } else {
            if (response.selection === 0) new Database("Report").delete(String(key));
            if (response.selection === 0 || response.selection === 1) system.run(() => system.run(() => ReportOptions(player)));
        }
    });
} catch (e) {
    postError(e);
}}

function ErrorOptions(player) { try {
    const ErrorData = new Database("Error");
    let playerIcons = [
        "textures/ui/icon_alex.png",
        "textures/ui/icon_steve.png",
    ];
    let ErrorList = [];
    const ErrorOptions = new MinecraftUI.ActionFormData()
    .title("§lError Options")

    for(const data_ of ErrorData.keysAll()) {
        const data = ErrorData.get(data_)
        if (!data.read) {
            const date = `${new Date(data.time).getFullYear()}-${new Date(data.time).getMonth()+1}-${new Date(data.time).getDate()} ${new Date(data.time).getHours() < 10 ? `0${new Date(data.time).getHours()}` : new Date(data.time).getHours()}:${new Date(data.time).getMinutes() < 10 ? `0${new Date(data.time).getMinutes()}` : new Date(data.time).getMinutes()}`
            ErrorOptions.button(`§l§0${date} §r§c*§l\n§8${data.data.name}`, playerIcons[Math.floor(Math.random() * playerIcons.length)]);
            ErrorList.push(data_);
        }
    }
    for(const data_ of ErrorData.keysAll()) {
        const data = ErrorData.get(data_)
        if (data.read) {
            const date = `${new Date(data.time).getFullYear()}-${new Date(data.time).getMonth()+1}-${new Date(data.time).getDate()} ${new Date(data.time).getHours() < 10 ? `0${new Date(data.time).getHours()}` : new Date(data.time).getHours()}:${new Date(data.time).getMinutes() < 10 ? `0${new Date(data.time).getMinutes()}` : new Date(data.time).getMinutes()}`
            ErrorOptions.button(`§l${date}\n§8${data.data.name}`, playerIcons[Math.floor(Math.random() * playerIcons.length)]);
            ErrorList.push(data_);
        }
    }
    ErrorOptions
    .button(`§lBack`, `textures/ui/arrow_left.png`)
    .button("§l§cClose", "textures/ui/redX1.png")
    .show(player).then((response) => {
        if(ErrorList.length > response.selection) ErrorOptionsShow(player, ErrorList[response.selection]);
            else if(ErrorList.length === response.selection) Menu(player);
            else if(ErrorList.length+1 === response.selection) return;
    });
} catch (e) {
    postError(e);
}}

function ErrorOptionsShow(player, key) { try {
    let ErrorData_ = new Database("Error").get(String(key));
    ErrorData_.read = true;
    new Database("Error").set(String(key), ErrorData_);
    const ErrorData = new Database("Error").get(String(key));
    const date = `${new Date(ErrorData.time).getFullYear()}-${new Date(ErrorData.time).getMonth()+1}-${new Date(ErrorData.time).getDate()} ${new Date(ErrorData.time).getHours() < 10 ? `0${new Date(ErrorData.time).getHours()}` : new Date(ErrorData.time).getHours()}:${new Date(ErrorData.time).getMinutes() < 10 ? `0${new Date(ErrorData.time).getMinutes()}` : new Date(ErrorData.time).getMinutes()}`
    const ErrorOptionsShow = new MinecraftUI.ActionFormData()
    .title(`§lError Options`)
    .body(` \n§lTime:§r ${date}\n§lMessage:§r ${ErrorData.data.message}§r\n§lName:§r ${ErrorData.data.name}§r\n§lFile:§r ${ErrorData.data.file}§r\n§lLine:§r ${ErrorData.data.line}§r\n§lColumn:§r ${ErrorData.data.column}§r\n§lStack:§r ${ErrorData.data.stack}§r\n `)
    .button(`§lDelete`, `textures/ui/trash_light.png`)
    .button(`§lBack`, `textures/ui/arrow_left.png`)
    .button("§l§cClose", "textures/ui/redX1.png")
    .show(player).then((response) => {
        if (response.selection === 0) new Database("Error").delete(String(key));
        if (response.selection <= 1) system.run(() => system.run(() => ErrorOptions(player))) 
    });
} catch (e) {
    postError(e);
}}

export function reportMenu(player) { try {
    let playerIcons = [
        "textures/ui/icon_alex.png",
        "textures/ui/icon_steve.png",
    ];
    
    const reportMenu = new MinecraftUI.ActionFormData()
    .title("§lReport")
    .body(`Specify player to report.`);

    let playerList = [];
    for(let plr of world.getPlayers()) {
        reportMenu.button(`§l${plr.name}`, playerIcons[Math.floor(Math.random() * playerIcons.length)]);
        playerList.push(plr);
    }
    reportMenu.button("§l§cClose", "textures/ui/redX1.png");

    reportMenu.show(player).then((response) => {
        if (response.cancelationReason === "userBusy") reportMenuBack(player);
        if (playerList.length > response.selection) ReportMenuSelected(player, playerList[response.selection]);
            else return;
    });
} catch (e) {
    postError(e);
}}

const reportMenuBack = (player) => reportMenu(player);

function ReportMenuSelected(player, member) { try {
    if (player.name === member.name) return ReportMenuSelectedYourself(player);
    const ReportMenuSelected = new MinecraftUI.ActionFormData()
    .title(`§lReport`)
    .body(`Selected Player: ${member.name}`)
    .button(`§lChat message`)
    .button(`§lPlayer skin`)
    .button(`§lGameplay`)
    .button(`§lIngame build`)
    .button(`§lOther`)
    .button(`§lBack`, `textures/ui/arrow_left.png`)
    .button("§l§cClose", "textures/ui/redX1.png")
    .show(player).then((response) => {
        if (response.selection === 0) ReportMenuSelectedPlayer(player, member, "Chat message");
        if (response.selection === 1) ReportMenuSelectedPlayer(player, member, "Player skin");
        if (response.selection === 2) ReportMenuSelectedPlayer(player, member, "Gameplay");
        if (response.selection === 3) ReportMenuSelectedPlayer(player, member, "Ingame build");
        if (response.selection === 4) ReportMenuSelectedPlayer(player, member, "Other");
        if (response.selection === 5) reportMenu(player);
        if (response.selection === 6) return;
    });
} catch (e) {
    postError(e);
}}

function ReportMenuSelectedPlayer(player, member, Category, reportData_) { try {
    const ReportMenuSelectedPlayer = new MinecraftUI.ModalFormData()
    .title(`§l§8Report`)
    .textField(`Why are you reporting ${member.name}? §c*`, reportData_ && reportData_.why.length === 0 ? "§cYou will need to enter." : "", reportData_ && reportData_.why ? reportData_.why : "")
    .textField(`Enter Text Here`, "", reportData_ && reportData_.details ? reportData_.details : "")
    .textField("Where did you observe the bad behavior? §c*\n§7Please let us know where the incident took place.\nThis will help us in researching your case.", reportData_ && reportData_.where.length === 0 ? "§cYou will need to enter." : "", reportData_ && reportData_.where ? reportData_.where : "")
    .show(player).then(response => {
        if (response.canceled) return;
        const reportData = {
            category: Category,
            why: response.formValues[0],
            details: response.formValues[1],
            where: response.formValues[2],
            by: player.name,
            to: member.name
        }
        if (response.formValues[0].length === 0 || response.formValues[2].length === 0) ReportMenuSelectedPlayerBack(player, member, Category, reportData);
            else ReportMenuResultCheck(player, reportData);
    });
} catch (e) {
    postError(e);
}}

const ReportMenuSelectedPlayerBack = (player, member, Category, reportData) => ReportMenuSelectedPlayer(player, member, Category, reportData);

function ReportMenuSelectedYourself(player) { try {
    const ReportMenuSelectedYourself = new MinecraftUI.MessageFormData()
    .title(`§l§cError`)
    .body(`You cannot report yourself.`)
    .button1(`§lGot it`)
    .button2(`§l§cClose`)
    .show(player).then((response) => {
        if (response.selection === 0) return;
        if (response.selection === 1) reportMenu(player);
    })
} catch (e) {
    postError(e);
}}

function ReportMenuResultCheck(player, reportData){ try {
    const ReportMenuResultCheck = new MinecraftUI.ActionFormData()
    .title(`§lReport`)
    .body(` \n§lCategory:§r ${reportData.category}§r\n\n§lPlayer:§r ${reportData.to}§r\n\n§lReason:§r ${reportData.why}§r\n\n§lDetails:§r ${reportData.details}§r\n\n§lWhere:§r ${reportData.where}§r\n\n§lReported by:§r ${reportData.by}§r\n `)
    .button(`§lSubmit`)
    .button(`§lCancel`)
    .show(player).then((response) => {
        if (response.selection === 0) ReportMenuResult(player, reportData);
        if (response.selection === 1) return;
    });
} catch (e) {
    postError(e);
}}

function ReportMenuResult(player, reportData){ try {
    const reportDataSaveToDatabase = {
        read: false,
        time: Date.now(),
        data: reportData
    }
    const ReportDB = new Database("Report")
    ReportDB.set(String(Date.now()), reportDataSaveToDatabase);
    for (const p of world.getPlayers()) if (p.hasTag("notify")) p.tell(`§r§4[§cUAG§4]§r ${reportData.by} reported ${reportData.to}. Reason: ${reportData.why}`);
    const ReportMenuResult = new MinecraftUI.ActionFormData()
    .title(`§lReport`)
    .body(` \n\n§l§aYour report was a success!§r\n\n\n§lCategory:§r ${reportData.category}§r\n\n§lPlayer:§r ${reportData.to}§r\n\n§lReason:§r ${reportData.why}§r\n\n§lDetails:§r ${reportData.details}§r\n\n§lWhere:§r ${reportData.where}§r\n\n§lReported by:§r ${reportData.by}§r\n `)
    .button(`§l§cClose`, "textures/ui/redX1.png")
    .show(player).then((response) => {
        if (response.selection === 0) return;
    });
} catch (e) {
    postError(e);
}}

export function PrivateChatMenu (player) { try {
    const PrivateChatMenu = new MinecraftUI.ActionFormData()
    .title("§lPrivateChat")
    .button("Create")
    .button("Manage")
    if (!getScore(player, "privatechat")) PrivateChatMenu.button("Join");
        else PrivateChatMenu.button("Leave");
    PrivateChatMenu.button(`§l§cClose`, "textures/ui/redX1.png")
    .show(player).then(response => {
        if (response.canceled && response.cancelationReason === "userBusy") return PrivateChatMenuBack(player);
        if (response.selection === 0) PrivateChatMenuCreate(player);
        if (response.selection === 1) PrivateChatMenuManage(player);
        if (response.selection === 2) {
            if (!getScore(player, "privatechat")) PrivateChatMenuJoin(player);
                else PrivateChatMenuLeave(player);
        }
    });
} catch (e) {
    postError(e);
}}

const PrivateChatMenuBack = (player) => PrivateChatMenu(player);

function PrivateChatMenuCreate (player, data) { try {
    const PrivateChatMenuCreate = new MinecraftUI.ModalFormData()
    .title("§lPrivateChat")
    .textField("Private chat name", data && data[0].length === 0 ? "§cYou will need to enter." : "", data && data[0] ? data[0] : "")
    .textField("password", "", data && data[1] ? data[1] : "")
    .show(player).then(response => {
        if (response.canceled) return PrivateChatMenu(player);
        if (response.formValues[0].length === 0) return PrivateChatMenuCreateBack(player, response.formValues);
        const PrivateChat = new Database("PrivateChat");
        const id = Math.floor( Math.random() * 888888 ) + 111111;
        if (PrivateChat.hasAll(String(id))) return player.tell(`§4[§cUAG§4]§r §cAn error has occurred. Please try again.`);
        const data = {
            id: id,
            name: response.formValues[0],
            pass: response.formValues[1],
            owner: player.name
        }
        PrivateChat.set(String(id), data);
        player.tell(`§4[§cUAG§4]§r Created private chat "${data.name}". (id: ${id}, password: ${data.pass.replace(/[^ ]/g, "*")})`);
        player.runCommandAsync(`scoreboard players set @s privatechat ${id}`);
    });
} catch (e) {
    postError(e);
}}

const PrivateChatMenuCreateBack = (player, data) => PrivateChatMenuCreate(player, data);

function PrivateChatMenuManage(player) { try {
    const PrivateChatMenuManage = new MinecraftUI.ActionFormData()
    .title("§lPrivateChat")
    let ids = [];
    const PrivateChat = new Database("PrivateChat");
    for (const v of PrivateChat.keysAll()) {
        const data = PrivateChat.get(v);
        if (data.owner === player.name) {
            PrivateChatMenuManage.button(`${data.id}\n${data.name}`);
            ids.push(v);
        }
    }
    PrivateChatMenuManage
    .button("§lBack", "textures/ui/arrow_left.png")
    .button("§l§cClose", "textures/ui/redX1.png")
    .show(player).then(response => {
        if (response.selection === ids.length) return PrivateChatMenu(player);
        if (!response.canceled) PrivateChatMenuManageId(player, ids[response.selection]);

    });
} catch (e) {
    postError(e);
}}

function PrivateChatMenuManageId(player, id) { try {
    const PrivateChatMenuManageId = new MinecraftUI.ActionFormData()
    .title("§lPrivateChat")
    .button("Rename")
    .button("Change password")
    .button("Delete")
    .button("§lBack", "textures/ui/arrow_left.png")
    .button("§l§cClose", "textures/ui/redX1.png")
    .show(player).then(response => {
        if (response.selection === 0) PrivateChatMenuManageIdRename(player, id);
        if (response.selection === 1) PrivateChatMenuManageIdPass(player, id);
        if (response.selection === 2) PrivateChatMenuManageIdDelete(player, id);
        if (response.selection === 3) PrivateChatMenuManage(player);
    });
} catch (e) {
    postError(e);
}}

function PrivateChatMenuManageIdRename(player, id) { try {
    const PrivateChat = new Database("PrivateChat");
    const data = PrivateChat.get(String(id));
    const PrivateChatMenuManageIdRename = new MinecraftUI.ModalFormData()
    .title("§lPrivateChat")
    .textField("name", "", data.name)
    .show(player).then(response => {
        if (response.canceled) return PrivateChatMenuManageId(player, id);
        player.tell(`§4[§cUAG§4]§r Private chat name changed from "${data.name}" to "${response.formValues[0]}". (id: ${id})`);
        data.name = response.formValues[0]
        PrivateChat.set(String(id), data);
    });
} catch (e) {
    postError(e);
}}

function PrivateChatMenuManageIdPass(player, id, miss) { try {
    const PrivateChat = new Database("PrivateChat");
    const data = PrivateChat.get(String(id));
    const PrivateChatMenuManageIdPass = new MinecraftUI.ModalFormData()
    .title("§lPrivateChat")
    .textField("old password", miss ? "§cThe password is different." : "")
    .textField("new password", "")
    .show(player).then(response => {
        if (response.canceled) return PrivateChatMenuManageId(player, id);
        if (response.formValues[0] !== data.pass) return PrivateChatMenuManageIdPassBack(player, id, true);
        player.tell(`§4[§cUAG§4]§r The password for the private chat "${data.name}" has been changed from "${data.pass}" to "${response.formValues[1].replace(/[^ ]/g, "*")}". (id: ${id})`);
        data.pass = response.formValues[1]
        PrivateChat.set(String(id), data);
    });
} catch (e) {
    postError(e);
}}

const PrivateChatMenuManageIdPassBack = (player, id, miss) => PrivateChatMenuManageIdPass(player, id, miss);

function PrivateChatMenuManageIdDelete(player, id, miss) { try {
    const PrivateChat = new Database("PrivateChat");
    const data = PrivateChat.get(String(id));
    const PrivateChatMenuManageIdDelete = new MinecraftUI.ModalFormData()
    .title("§lPrivateChat")
    .textField("password", miss ? "§cThe password is different." : "")
    .show(player).then(response => {
        if (response.canceled) return PrivateChatMenuManageId(player, id);
        if (response.formValues[0] !== data.pass) return PrivateChatMenuManageIdDeleteBack(player, id, true);
        player.tell(`§4[§cUAG§4]§r "${data.name}" was deleted. (id: ${id})`);
        PrivateChat.delete(String(id));
    });
} catch (e) {
    postError(e);
}}

const PrivateChatMenuManageIdDeleteBack = (player, id, miss) => PrivateChatMenuManageIdDelete(player, id, miss);

function PrivateChatMenuJoin(player, miss) {
    const PrivateChat = new Database("PrivateChat");
    const PrivateChatMenuJoin = new MinecraftUI.ModalFormData()
    .title("§lPrivateChat")
    .textField("id", miss ? "§cThe id or password is different." : "")
    .textField("password", miss ? "§cThe id or password is different." : "")
    .show(player).then(response => {
        if (!PrivateChat.hasAll(String(response.formValues[0]))) return PrivateChatMenuJoinBack(player, true);
        if (PrivateChat.get(String(response.formValues[0])).pass === response.formValues[1]) {
            player.runCommandAsync(`scoreboard players set @s privatechat ${response.formValues[0]}`);
            player.tell(`§4[§cUAG§4]§r Joined the private chat "${PrivateChat.get(String(response.formValues[0])).name}". (id: ${response.formValues[0]})`);
        } else PrivateChatMenuJoinBack(player, true);
    });
}

const PrivateChatMenuJoinBack = (player, miss) => PrivateChatMenuJoin(player, miss);

function PrivateChatMenuLeave(player) {
    const PrivateChat = new Database("PrivateChat");
    player.tell(`§4[§cUAG§4]§r Left the private chat${PrivateChat.hasAll(String(getScore(player, "privatechat"))) ? ` "${PrivateChat.get(String(getScore(player, "privatechat"))).name}"` : ""}. (id: ${getScore(player, "privatechat")})`);
    player.runCommandAsync("scoreboard players reset @s privatechat");
}

export function Welcome(player) { try {
    let texts = `Welcome to ${config.welcome.serverName}.`;
    texts += "\n\nUnknown Anti-Grief is installed on this server.";
    texts += "\nGriefing on this server will be punished.";
    texts += "\nPlease deactivate the use of griefs by restarting Minecraft or by other means.";
    texts += `\nYou can check the help for the command with ${config.commands.prefix}help.`;
    texts += "\n§lSupport: §ohttps://discord.gg/QF3n85dr4P";
    texts += "\n§lDownload: §ohttps://github.com/191225/Unknown-Anti-Grief";

    const Welcome = new MinecraftUI.ActionFormData()
    .title("§l§cUnknown Anti-Grief")
    .body(`${texts}`)
    .button("§lOkay")
    .show(player).then((response) => {
        if (response.canceled) {
            WelcomeBack(player);
            return;
        }
        if (response.selection === 0 && config.welcome.rules.enabled) Rules(player, true);
    });
    
} catch (e) {
    postError(e);
}}

const WelcomeBack = (player) => Welcome(player);

export function Rules(player, agree) { try {
    let texts = "Server Rules:";
    for (const text of config.welcome.rules.texts) texts += `\n${text}`;

    const Rules = new MinecraftUI.ActionFormData()
    .title("§lRules")
    .body(`${texts}`);
    if (agree) { Rules
        .button("§l§2Agree")
        .button("§l§4Disagree");
    } else Rules.button(`§l§cClose`, "textures/ui/redX1.png");
    Rules.show(player).then((response) => {
        if (response.canceled) {
            RulesBack(player, agree);
            return;
        }
        if (response.selection === 1) player.triggerEvent("uag:disconnect");
    });
    
} catch (e) {
    postError(e);
}}

const RulesBack = (player) => Rules(player);