import * as Minecraft from "@minecraft/server";
import config from "./data/config";
import cache from "./data/cache";
import { flag, snakeToCamel, msToTime, AppealNet, getClosestPlayer, restoreBlock, postError, unBanPlayer } from "./util";
import { Database } from "./lib/Database";
import { EntityQueryOptions } from "./lib/EntityQueryOptions";
import { native } from "./lib/nativeStringify";
import { tickEvent } from "./lib/TickEvent";
import { getScore } from "./lib/getScore";
import { Gban } from "./data/Gban";

import "./commands";
import { Menu, reportMenu, Welcome } from "./ui";

const world = Minecraft.world;

const ServerData = new Database(`ServerData`);
const NO_SPEED_CHECK_TIME = 2500;
const NO_SPEED_CHECK_TIME_LONG = 10000;
const NO_SPEED_CHECK_TIME_DEAD = 1000;

Minecraft.system.events.beforeWatchdogTerminate.subscribe(beforeWatchdogTerminate => { try {
    if (config.disableAllModule) return;
    beforeWatchdogTerminate.cancel = true;
} catch (e) {
    postError(e);
} });

tickEvent.subscribe("main", ({ currentTick, deltaTime, tps }) => { try {
    if (config.disableAllModule) return;
    cache.tpsShard.push(tps);
    if (cache.tpsShard.length > 100) cache.tpsShard.shift();
    const loadFactor = Math.round(((100 - (tps) * 5) * 10)) / 10;
    cache.loadFactorShard.push(loadFactor);
    if (cache.loadFactorShard.length > 100) cache.loadFactorShard.shift();

    if (config.websocket) {
        world.getDimension("overworld").runCommandAsync(`scoreboard players set tps websocket ${tps * 100}`);
        world.getDimension("overworld").runCommandAsync(`scoreboard players set loadfactor websocket ${loadFactor * 100}`);
    }

    for (const player of world.getPlayers()) {
        player.currentTick = currentTick;
        if (loadFactor >= 0) player.loadFactor = loadFactor;
            else player.loadFactor = 0;
        // player.tell(`TPS: ${Math.round((1/(deltaTime/1000))*10)/10}`)
        if (!player.tpsShard_) player.tpsShard_ = [];
        if (!player.tpsShard) player.tpsShard = [];
        if (!player.loadFactorShard) player.loadFactorShard = [];
        player.tpsShard_ = cache.tpsShard;
        if (player.tpsShard.length === 0 || player.tpsShard[player.tpsShard.length-1].timestamp !== Math.floor(Date.now() / 1000)) player.tpsShard.push({timestamp: Math.floor(Date.now() / 1000), tps: tps});
        player.loadFactorShard_ = cache.loadFactorShard;
        if (player.loadFactorShard.length === 0 || player.loadFactorShard[player.loadFactorShard.length-1].timestamp !== Math.floor(Date.now() / 1000)) player.loadFactorShard.push({timestamp: Math.floor(Date.now() / 1000), loadFactor: loadFactor});
        player.tps = tps;
        player.gamemode = getScore(player, "gamemode");
        
        player.permission = 0;
        if (player.hasTag(`\"\n\nUAG\nPermission\t§k${config.permission.level_1.tag}\""`)) player.permission = 1;
        if (player.hasTag(`\"\n\nUAG\nPermission\t§k${config.permission.level_2.tag}\""`)) player.permission = 2;
        if (player.hasTag(`\"\n\nUAG\nPermission\t§k${config.permission.level_3.tag}\""`)) player.permission = 3;
        if (player.hasTag(`\"\n\nUAG\nPermission\t§k${config.permission.level_4.tag}\""`)) player.permission = 4;
        if (player.hasTag(`\"\n\nUAG\nPermission\t§k${config.permission.level_5.tag}\""`)) player.permission = 5;

        if (config.modules.ophack.A.enabled && currentTick > 1 && player.permission < config.permission.setOpLevel && player.permission === player.lastPermission && player.isOp()) {
            flag(player, "OpHack", "A", "Exploit");
            player.setOp(false);
        } else player.lastPermission = player.permission;
        // if (currentTick < 10) world.say(String(currentTick))

        if (player.permission >= config.permission.setOpLevel && currentTick % 100 === 0 && !player.isOp()) player.setOp(true);
            else if (player.permission < config.permission.setOpLevel && player.isOp()) player.setOp(false);

        if (!player.hasTag("uag:systemPermission") && player.isOp()) player.addTag("uag:systemPermission");
            else if (player.hasTag("uag:systemPermission") && !player.isOp()) player.removeTag("uag:systemPermission");

        if (player.hasTag("uag:menu")) {
            if (player.permission >= config.commands.menu.permission) Menu(player);
            player.removeTag("uag:menu");
        }

        if (player.hasTag("uag:report")) {
            reportMenu(player);
            player.removeTag("uag:report");
        }
        
        const tags = player.getTags().find(t => t.startsWith(`!"tag:`));
        if (tags && !player.nameTag.startsWith(`[${tags.slice(6)}] `)) {
            player.nameTag = player.name;
            player.nameTag = `[${tags.slice(6)}] ${player.nameTag}`;
        }
        player.nameTag = player.nameTag.replace(/"|\\/g, "");

        if (player.loaded) cache.loaded = true;
        if (!cache.loaded) {
            if (player.hasTag("notify")) player.tell("§4[§cUAG§4]§r Unknown Anti-Grief has been loaded.");
            player.tell("§l§c             Unknown Anti-Grief");
            player.tell("§l§4------------------------------------");
            player.tell("Unknown Anti-Grief is installed on this server.");
            player.tell("Griefing on this server will be punished.");
            player.tell("Please deactivate the use of griefs by restarting Minecraft or by other means.");
            player.tell(`You can check the help for the command with ${config.commands.prefix}help.`);
            player.tell("§lSupport: §ohttps://discord.gg/QF3n85dr4P");
            player.loginId = Math.floor(Date.now()/1000) + Math.abs(player.id);
            player.loaded = true;
        }

        if (player.serverClose) cache.close = true;

        if (cache.close) player.runCommandAsync(`kick "${player.name}" §r\nserver closed`);
            
        /**
         * script playground
         */
        

        if (player.crashMinecraft) {
            if (player.crashMinecraft <= 3) player.tell((JSON.stringify(config)).replace(/[^ ]/g, "§l§o§a§k#§r"));
            if (player.crashMinecraft > 50) player.triggerEvent("uag:disconnect");
            player.crashMinecraft++;
        }

        // player.tell(String(player.isOp()))

        // for (const value of player.getComponents()) {
        //     player.tell(String(value.typeId))
        // }
        /**
         * 
         */
        
        
        if (player.joinEvent) {
            let foundName;
            player.getTags().forEach(t => {
                if(t.startsWith("\"name:\n")) {
                    const ServerData = new Database("ServerData");
                    if (!ServerData.hasAll("UnbanQueue")) ServerData.set("UnbanQueue", []);
                    let unbanQueue = ServerData.get("UnbanQueue");
                    if (unbanQueue.includes(player.name)) {
                        player.removeTag(t);
                        unbanQueue = unbanQueue.filter(p => p !== player.name);
                        ServerData.set("UnbanQueue", unbanQueue);
                        for (const p of world.getPlayers({tags:["notify"]})) p.tell(`§r§4[§cUAG§4]§r ${player.name}'s default name has been changed by UnbanQueue.`);
                    } else foundName = t.replace("\"name:\n", "");
                }
            });
            if(!foundName) player.addTag(`"name:\n${player.name}`);
                else if(foundName !== player.name) {
                    player.namespoofC = true;
                    player.oldName = foundName;
            }
            player.loginId = Number(String(Date.now()).split(8)) * Number(String(player.id).split(8));
            player.tell("§l§c             Unknown Anti-Grief");
            player.tell("§l§4------------------------------------");
            player.tell("Unknown Anti-Grief is installed on this server. ");
            player.tell("Griefing on this server will be punished.");
            player.tell("Please deactivate the use of griefs by restarting Minecraft or by other means.");
            player.tell(`You can check the help for the command with ${config.commands.prefix}help.`);
            player.tell("§lSupport: §ohttps://discord.gg/QF3n85dr4P");
            Welcome(player);
            player.joinEvent = false;
        }

        if (player.isGlobalBanned) {
            player.getTags().forEach(t => {
                t = t.replace(/"/g, "");
                if(t.startsWith("reason:")) player.removeTag(t);
                if(t.startsWith("by:")) player.removeTag(t);
                if(t.startsWith("time:")) player.removeTag(t);
            });
            player.addTag(`reason:${player.isGlobalBanned} (Gban)`);
            player.addTag(`by:Unknown Anti-Grief`);
            player.addTag(`isBanned`);
            world.say(` \n§l§d${player.name} §bhas been banned!\n `);
            for (const p of world.getPlayers({tags:["notify"]})) p.tell(`§r§4[§cUAG§4]§r ${player.name} has been banned. Reason: ${player.isGlobalBanned} (Gban)`);
            player.isGlobalBanned = false;
        }

        if (player.WhiteListKick) {
            for (const p of world.getPlayers({tags:["notify"]})) p.tell(`§r§4[§cUAG§4]§r ${player.name} was disconnected from the server because the whitelist is active.`);
            player.runCommandAsync(`kick "${player.name}" §r\n§l§4You are kicked from the server§r\n\n§7Kicked by: Unknown Anti-Grief\nReason: You are not whitelisted.`);
            player.WhiteListKick = false;
        }
    
        if (player.log == undefined) player.log = [];
        
        if (player.hasTag(`isBanned`)) {
            const ServerData = new Database(`ServerData`);
            // unBanPlayer(player);
            const tags = {
                by: player.getTags().find(t => t.startsWith("by:"))?.slice(3) || false,
                reason: player.getTags().find(t => t.startsWith("reason:"))?.slice(7) || false,
                time: player.getTags().find(t => t.startsWith("time:"))?.slice(5) || false,
                code: player.getTags().find(t => t.startsWith("code:"))?.slice(5) || false
            }

            if (!ServerData.hasAll("UnbanQueue")) ServerData.set("UnbanQueue", []);
            let unbanQueue = ServerData.get("UnbanQueue");
            
            if (player.hasTag(`isBanned`) && unbanQueue.includes(player.name)) {
                unBanPlayer(player);
                unbanQueue = unbanQueue.filter(p => p !== player.name);
                ServerData.set("UnbanQueue", unbanQueue);
                AppealNet("delete", tags.code);
                for (const p of world.getPlayers({tags:["notify"]})) p.tell(`§r§4[§cUAG§4]§r ${player.name} was unbanned because he was added to UnbanQueue.`);
            }            
            
            if (player.hasTag(`isBanned`) && tags.code && AppealNet("has", tags.code)) {
                let AppealData = AppealNet("load", tags.code);
                if (AppealData[8] === true) {
                    unBanPlayer(player);
                    AppealNet("delete", tags.code);
                    for (const p of world.getPlayers({tags:["notify"]})) p.tell(`§r§4[§cUAG§4]§r ${player.name} was unbanned because ban was set to be removed from the code.`);
                }
            } else if (player.hasTag(`isBanned`)) {
                tags.code = AppealNet("code");
                AppealNet("save", tags.code, player.name, tags.by, tags.reason, tags.time, false, false, false, false, false);
                player.addTag(`code:${tags.code}`);
            }

            if(player.hasTag(`isBanned`) && tags.time) {
                if(tags.time < Date.now()) {
                    unBanPlayer(player);
                    AppealNet("delete", tags.code);
                    for (const p of world.getPlayers({tags:["notify"]})) p.tell(`§r§4[§cUAG§4]§r ${player.name} has been unbanned because the ban period has expired.`);
                }
                tags.time = msToTime(Number(tags.time));
                tags.time = `${tags.time.d} days, ${tags.time.h} hours`;
            }

            const BanModule = ServerData.get("BanModule");
            if (player.hasTag(`isBanned`) && player.permission === 5) {
                unBanPlayer(player);
                AppealNet("delete", tags.code);
                for (const p of world.getPlayers({tags:["notify"]})) p.tell(`§r§4[§cUAG§4]§r ${player.name} was unbanned because he is the owner.`);
            } else if (player.hasTag(`isBanned`) && BanModule) {
                if (player.permission < 3) player.runCommandAsync(`kick "${player.name}" §r§l§4You are banned from the server\n§r§7Banned By: ${tags.by || "N/A"}§r§7\nReason: ${tags.reason || "N/A"}§r§7\nLength: ${tags.time || "Permanent"}§r§7\nAppeal at ${tags.reason.endsWith(" (Gban)") ? "discord.gg/QF3n85dr4P" : config.appeallink} (code: ${tags.code || "N/A"})`);
                    else {
                        unBanPlayer(player);
                        AppealNet("delete", tags.code);
                        if (player.permission !== 5) player.triggerEvent("uag:disconnect");
                }
            } else if (player.hasTag(`isBanned`) && player.permission < 3) {
                unBanPlayer(player);
                AppealNet("delete", tags.code);
                player.triggerEvent("uag:disconnect");
            } else if (player.hasTag(`isBanned`)) {
                unBanPlayer(player);
                AppealNet("delete", tags.code);
            }
        }

        if (config.modules.votekick.enabled && currentTick % 600 === 0) {
            if (!player.votes) player.votes = [];
            let votes = [];
            let players = 0;
            for (const pl of player.votes) {
                if (pl !== "\tyourself") {
                    for (const p of world.getPlayers()) {
                        if (pl === p.name) votes.push(p.name);
                        players++;
                    }
                } else votes.push("\tyourself");
            }
            player.votes = votes;
            const Flag = votes.length / players;
            if (typeof Flag === "number" && Flag >= config.modules.votekick.requiredRate) {
                world.say(` \n§l§d${player.name} §bhas been kicked by vote!\n `);
                player.runCommandAsync(`kick "${player.name}" §r\n§l§4You are kicked from the server§r\n\n§7Kicked by: Unknown Anti-Grief\nReason: vote of kick`);
            }
        }

        if (player.hasTag("isMuted") && currentTick % 20 === 0) {
            const Data = player.getTags().find(t => t.startsWith("mutedData:"))?.slice(10);
            if (Data) {
                const data = JSON.parse(Data);
                if (data.time < Date.now() && data.time) {
                    player.removeTag("isMuted");
                    player.getTags().forEach(t => {if (t.startsWith("mutedData:")) player.removeTag(t)});
                    player.tell(`§r§4[§cUAG§4]§r You have been unmuted.`);
                }
            }
        }
        
        if (config.modules.worldborder.enabled && config.modules.worldborder.max > 10) {
            if (currentTick % 20 === 0) {
                if (Math.abs(Math.floor(player.location.x)) > config.modules.worldborder.max) {
                    if (Math.abs(Math.floor(player.location.x)) - config.modules.worldborder.max <= 2147483647) {
                        player.runCommandAsync(`damage @s ${Math.floor((Math.abs(Math.floor(player.location.x)) - config.modules.worldborder.max) / 3)}`);
                        player.addEffect(Minecraft.MinecraftEffectTypes.slowness, 60, Math.floor((Math.abs(Math.floor(player.location.x)) - config.modules.worldborder.max) / 5), false);
                    } else player.kill();
                } else if (Math.abs(Math.floor(player.location.z)) > config.modules.worldborder.max) {
                    if (Math.abs(Math.floor(player.location.z)) - config.modules.worldborder.max <= 2147483647) {
                        player.runCommandAsync(`damage @s ${Math.floor((Math.abs(Math.floor(player.location.z)) - config.modules.worldborder.max) / 3)}`);
                        player.addEffect(Minecraft.MinecraftEffectTypes.slowness, 60, Math.floor((Math.abs(Math.floor(player.location.z)) - config.modules.worldborder.max) / 5), false);
                    } else player.kill();
                    
                }
                if (Math.abs(Math.floor(player.location.x)) <= (config.modules.worldborder.max - 30)) player.runCommandAsync("fog @s remove uag:worldBorder");
                if (Math.abs(Math.floor(player.location.z)) <= (config.modules.worldborder.max - 30)) player.runCommandAsync("fog @s remove uag:worldBorder");
            }
            if (Math.abs(Math.floor(player.location.x)) > (config.modules.worldborder.max - 30)) player.runCommandAsync("fog @s push minecraft:fog_hell uag:worldBorder");
            if (Math.abs(Math.floor(player.location.z)) > (config.modules.worldborder.max - 30)) player.runCommandAsync("fog @s push minecraft:fog_hell uag:worldBorder");
            if (Math.abs(Math.floor(player.location.x)) > (config.modules.worldborder.max)) player.addEffect(Minecraft.MinecraftEffectTypes.darkness, 60, 255, false);
            if (Math.abs(Math.floor(player.location.z)) > (config.modules.worldborder.max)) player.addEffect(Minecraft.MinecraftEffectTypes.darkness, 60, 255, false);
        }

        if (config.modules.afk.enabled && player.permission < 3 && currentTick % 20 === 0) {
            const second = Math.floor((Date.now() - player.lastMove) / 1000);
            if (second === 0) {
                player.afkNotify = [];
                player.afkNotify_ = [];
            }
            if (second > config.modules.afk.time) {
                world.say(` \n§l§d${player.name} §bhas been kicked for AFK!\n `);
                player.triggerEvent("uag:disconnect");
                player.lastMove = Date.now();
            }
            for (let i = 2; i <= config.modules.afk.warn + 1; i++) {
                if (second > 0 && second >= config.modules.afk.time - (config.modules.afk.time / i) && !player.afkNotify[config.modules.afk.time - second] && !player.afkNotify_[i]) {
                    player.tell(`§4[§cUAG§4]§r AFK disconnects you from the server after ${(config.modules.afk.time - second)} seconds.`);
                    player.afkNotify[config.modules.afk.time - second] = true;
                    player.afkNotify_[i] = true;
                }
            }
        }

        if (player.hijackData) {
            const member = player.hijackData.entity;
            let isInServer = false;
            try { for (const p of world.getPlayers()) if (member.id === p.id) isInServer = true; } catch {}
            if (isInServer && !player.hijackData.end) {
                player.triggerEvent("vanish");
                // member.runCommandAsync("playanimation @s animation.creeper.swelling swelling 1");
                player.addEffect(Minecraft.MinecraftEffectTypes.invisibility, 10, 0, false);
                player.teleport(member.location, member.dimension, member.rotation.x, member.rotation.y, false);
                const container = player.getComponent('inventory').container;
                const memberContainer = member.getComponent('inventory').container;
                player.selectedSlot = member.selectedSlot;
                for (let i = 0; i < memberContainer.size; i++) if (memberContainer.getItem(i)) {
                    container.setItem(i, memberContainer.getItem(i));
                } else {
                    if(i <= 8) player.runCommandAsync(`replaceitem entity @s slot.hotbar ${i} air 1`);
                        else player.runCommandAsync(`replaceitem entity @s slot.inventory ${i - 9} air 1`);
                }
            } else {
                if (!player.hijackData.end) player.tell(`§4[§cUAG§4]§r §cNo hijacking player found.`);
                    else player.tell(`§4[§cUAG§4]§r Hijack mode is exited.`);
                player.hijackData.tp();
                const inventory = player.hijackData.inventory;
                const container = player.getComponent('inventory').container;
                for (let i = 0; i < container.size; i++) {
                    if (inventory[i]) container.setItem(i, inventory[i]);
                        else {
                            if(i <= 8) player.runCommandAsync(`replaceitem entity @s slot.hotbar ${i} air 1`);
                                else player.runCommandAsync(`replaceitem entity @s slot.inventory ${i - 9} air 1`);
                        }
                }
                player.triggerEvent("unvanish");
                player.hijackData = false;
            }
        }

        if (config.debug && player.hasTag("uag:debug")) {
            let DEBUG_VIEW_ENTITY = null;
            player.getEntitiesFromViewVector().forEach(entity => { DEBUG_VIEW_ENTITY = entity.nameTag || entity.typeId })
            let DEBUG_VIEW_BLOCK = null;
            try { DEBUG_VIEW_BLOCK = player.getBlockFromViewVector().type.id } catch {}
            player.runCommandAsync(`title @s actionbar §lDEBUGMODE§r is §l§aENABLE§r  §7[${player.name}]\n§lx§r§7${player.location.x.toFixed(2)} §ly§r§7${player.location.y.toFixed(2)} §lz§r§7${player.location.z.toFixed(2)} §lrx§r§7${player.rotation.x.toFixed(2)} §lry§r§7${player.rotation.y.toFixed(2)}\n§lvx§r§7${player.velocity.x.toFixed(2)} §lvy§r§7${player.velocity.y.toFixed(2)} §lvz§r§7${player.velocity.z.toFixed(2)} §lTPS§r§7 ${tps.toFixed(2)} §lLF§r§7 ${player.loadFactor}%\n§lvectorX§r§7${player.viewVector.x.toFixed(2)} §lvectorY§r§7${player.viewVector.y.toFixed(2)} §lvectorZ§r§7${player.viewVector.z.toFixed(2)}\n§lVE§r§7 ${DEBUG_VIEW_ENTITY} §lVB§r§7 ${DEBUG_VIEW_BLOCK}`);
        }
        
        if (config.modules.badpackets[1].enabled) {
            if (player.rotation.x > 90) flag(player, "BadPackets", "1", "Exploit", "Rotation", player.rotation.x, true);
            if (player.rotation.x < -90) flag(player, "BadPackets", "1", "Exploit", "Rotation", player.rotation.x, true);
            if (player.rotation.y > 180) flag(player, "BadPackets", "1", "Exploit", "Rotation", player.rotation.y, true);
            if (player.rotation.y < -180) flag(player, "BadPackets", "1", "Exploit", "Rotation", player.rotation.y, true);
        }
        
        if (config.modules.badpackets[4].enabled) {
            if(player.selectedSlot < 0 || player.selectedSlot > 8) {
                flag(player, "BadPackets", "4", "Exploit", "SelectedSlot", player.selectedSlot);
                player.selectedSlot = 0;
            }
        }

        if (player.Badpackets5 && config.modules.badpackets[5].enabled) flag(player, "BadPackets", "5", "Exploit", "NameLength", player.name.length);
        
        if(config.modules.morepackets[1].enabled && player.Detect > 0 && new Date().getTime() - player.firstDetect > config.modules.morepackets[1].checkTimeAfter) {
            player.Detect = player.Detect / ((new Date().getTime() - player.firstDetect) / 1000);
            if(player.Detect > config.modules.morepackets[1].maxDetect) flag(player, "MorePackets", "1", "Exploit");
                else if(player.lastDetect && player.Detect.toFixed(2) === player.lastDetect.toFixed(2) && player.Detect > 1) flag(player, "MorePackets", "1", "Exploit");
                else if (player.lastDetect) {
                    const cps_result = player.Detect.toFixed(2) - player.lastDetect.toFixed(2);
                    if(Math.abs(cps_result) < config.modules.morepackets[1].maxAccuracy && player.Detect > 1) flag(player, "MorePackets", "1", "Exploit");
                }
            player.lastDetect = player.Detect;
            player.firstDetect = false;
            player.Detect = 0;
        }
        
        if (config.modules.morepackets[3].enabled) {
            if(player.blocksBroken > config.modules.morepackets[3].minblocksBroken && player.blocksBroken < config.modules.morepackets[3].maxblocksBroken) {
                if (player.gamemode !== 1) flag(player, "MorePackets", "3", "Exploit", "BlocksBroken", player.BadPacketsBroken);
            }
        }

        if (config.modules.morepackets[6].enabled) {
            if (player.closestArrows >= config.modules.morepackets[6].maxArrows) flag(player, "MorePackets", "6", "Exploit", "Arrows", player.closestArrows);
            player.closestArrows = 0;
        }
        
        if (config.modules.crasher.A.enabled && (Math.abs(player.location.x) > 30000000 || Math.abs(player.location.y) > 30000000 || Math.abs(player.location.z) > 30000000)) 
            flag(player, "Crasher", "A", "Exploit", "xPos", `${Math.floor(player.location.x)},yPos=${Math.floor(player.location.y)},zPos=${Math.floor(player.location.z)}`, true);
        
        if (config.modules.nuker.A.enabled && player.blocksBroken >= config.modules.nuker.A.maxBlocksBroken) flag(player, "Nuker", "A", "Break", "BlocksBroken", player.blocksBroken, 10);

        if (config.modules.grief.D.enabled && currentTick % 2 === 0) {
            if (player.gamemode === 0) {
                if (player.permission < config.modules.grief.D.permission.survival) {
                    flag(player, "Grief", "D", "Exploit", "Gamemode", "survival");
                    player.runCommandAsync("gamemode a");
                    player.runCommandAsync("clear");
                }
            }
            if (player.gamemode === 1) {
                if (player.permission < config.modules.grief.D.permission.creative) {
                    flag(player, "Grief", "D", "Exploit", "Gamemode", "creative");
                    player.runCommandAsync("gamemode a");
                    player.runCommandAsync("clear");
                }
            }
            if (player.gamemode === 3) {
                if (player.permission < config.modules.grief.D.permission.spectator) {
                    flag(player, "Grief", "D", "Exploit", "Gamemode", "spectator");
                    player.runCommandAsync("gamemode a");
                    player.runCommandAsync("clear");
                }
            }
        }

        const container = player.getComponent('inventory').container;

        
        let checkItemTimeInv = Date.now();
        const checkInvMin = config.modules.checktype === "slot" ? player.selectedSlot : 0;
        const checkInvMax = config.modules.checktype === "slot" ? player.selectedSlot + 1 : container.size;
        if (config.modules.checktype !== "none") for (let i = checkInvMin; i < checkInvMax; i++) if (container.getItem(i)) {

            let checkItemTime;
            if (config.modules.morepackets[5].enabled) checkItemTime = Date.now();

            const item = container.getItem(i);

            let itemType = Minecraft.ItemTypes.get(item.typeId);
            if (typeof itemType === "undefined") itemType = Minecraft.ItemTypes.get("minecraft:book");

            if(config.modules.resetItemData.enabled && config.modules.resetItemData.items.includes(item.typeId)) {
                const item2 = new Minecraft.ItemStack(itemType, item.amount, item.data);
                container.setItem(i, item2);
            }

            if (config.modules.crasher.C.enabled && item.typeId === "minecraft:arrow" && item.data > 43)
                flag(player, "Crasher", "C", "Exploit", "Item", `${item.typeId},Data=${item.data}`, false, false, i);
            if (config.modules.commandblockexploit.H.enabled && config.list.cbe_items.includes(item.typeId))
                flag(player, "CommandBlockExploit", "H", "Exploit", "Item", item.typeId, false, false, i);
            if (config.modules.illegalitems.C.enabled) {
                if (item.amount > config.list.item_max_stack[item.typeId]) flag(player, "IllegalItems", "C", "Exploit", "Stack", item.amount, false, false, i);
                    else if (item.amount > 64) flag(player, "IllegalItems", "C", "Exploit", "Stack", item.amount, false, false, i);
            }
            if(config.modules.illegalitems.D.enabled && config.list.items_very_illegal.includes(item.typeId))
                flag(player, "IllegalItems", "D", "Exploit", "Item", item.typeId, false, false, i);
            if(config.modules.illegalitems.F.enabled && item.nameTag?.length > 32)
                flag(player, "IllegalItems", "F", "Exploit", "Name", `${item.nameTag},Length=${item.nameTag.length}`, false, false, i);
            if (config.modules.grief.A.enabled && config.modules.grief.A.item.includes(item.typeId))
                flag(player, "Grief", "A", "Exploit", "Item", item.typeId, false, false, i);
            let itemEnchants = item.getComponent("enchantments").enchantments;
            let flagEnchants = [];
            let allEnchants = [];
            let protection_types = [];

            

            if (config.modules.badenchants.A.enabled || config.modules.badenchants.B.enabled ||
                config.modules.badenchants.C.enabled || config.modules.badenchants.D.enabled ||
                config.modules.badenchants.E.enabled || config.modules.badenchants.F.enabled) {
                const itemEnchants = item.getComponent("enchantments").enchantments;

                const item2 = new Minecraft.ItemStack(itemType, 1, item.data);
                const item2Enchants = item2.getComponent("enchantments").enchantments;
                const enchantments = [];
                
                const loopIterator = (iterator) => {
                    const iteratorResult = iterator.next();
                    if(iteratorResult.done === true) return;
                    const enchantData = iteratorResult.value;

                    if (config.modules.badenchants.A.enabled) {
                        const maxLevel = config.modules.badenchants.A.levelExclusions[enchantData.type.id];
                        if(maxLevel) {
                            if(enchantData.level > maxLevel) flag(player, "BadEnchants", "A", "Exploit", "Enchant", `minecraft:${enchantData.type.id},Level=${enchantData.level}`, false, false, i);
                        } else if(enchantData.level > enchantData.type.maxLevel)
                            flag(player, "BadEnchants", "A", "Exploit", "Enchant", `minecraft:${enchantData.type.id},Level=${enchantData.level}`, false, false, i);
                    }

                    if (config.modules.badenchants.B.enabled && enchantData.level < 1)
                        flag(player, "BadEnchants", "B", "Exploit", "Enchant", `minecraft:${enchantData.type.id},Level=${enchantData.level}`, false, false, i);

                    if (config.modules.badenchants.C.enabled) {
                        let Flag = true;
                        for (const v of config.modules.badenchants.C.allowItems) 
                            if (v.id === item.typeId && v.nameTag === item?.nameTag && v.enchant === enchantData.type.id && v.level === enchantData.level) Flag = false;

                        if(!item2Enchants.canAddEnchantment(new Minecraft.Enchantment(enchantData.type, 1)) && Flag) 
                            flag(player, "BadEnchants", "C", "Exploit", "Item", `${item.typeId},Enchant=minecraft:${enchantData.type.id},Level=${enchantData.level}`, false, false, i);
                    }

                    if (config.modules.badenchants.E.enabled && enchantData.type.id.toLowerCase().endsWith("protection"))
                        protection_types.push(enchantData.type.id);

                    if (config.modules.badenchants.F.enabled && config.modules.badenchants.F.flagEnchants[item.typeId.split("_")[1]]?.includes(enchantData.type.id))
                        flagEnchants.push(enchantData.type.id);

                    if (config.modules.badenchants.F.enabled) allEnchants.push(enchantData.type.id);

                    loopIterator(iterator);
                };
                loopIterator(itemEnchants[Symbol.iterator]());
            }

            if (config.modules.badenchants.D.enabled && item.getLore().length) {
                if (!config.modules.badenchants.D.exclusions.includes(String(item.getLore())))
                    flag(player, "BadEnchants", "D", "Exploit", "Lore", item.getLore(), false, false, i);
            }

            if (config.modules.badenchants.E.enabled && protection_types.length > config.modules.badenchants.E.maxProtectionTypes) 
                flag(player, "BadEnchants", "E", "Exploit", "ProtectionTypes", String(protection_types), false, false, i);

            if (config.modules.badenchants.F.enabled) {
                if (flagEnchants.length > 1 && item.typeId !== "trident")
                    flag(player, "BadEnchants", "F", "Exploit", "Enchants", String(flagEnchants), false, false, i);
                if (item.typeId.endsWith("_axe") && allEnchants.includes("fortune") && allEnchants.includes("silkTouch"))
                    flag(player, "BadEnchants", "F", "Exploit", "Enchants", String(flagEnchants), false, false, i);
                if (item.typeId === "trident" && flagEnchants.includes("riptide") && flagEnchants.length > 2)
                    flag(player, "BadEnchants", "F", "Exploit", "Enchants", String(flagEnchants), false, false, i);
            }

            if (config.modules.morepackets[5].enabled) {
                const time = Date.now() - checkItemTime;
                if (time > config.modules.morepackets[5].slot) 
                    flag(player, "MorePackets", "5", "Exploit", "Slot", `${i},ms=${time}`, false, false, i);
            }
        }

        if (config.modules.morepackets[5].enabled && checkItemTimeInv > config.modules.morepackets[5].inventory) {
            checkItemTimeInv = Date.now() - checkItemTimeInv;
            if (checkItemTimeInv > config.modules.morepackets[5].inventory) {
                flag(player, "MorePackets", "5", "Exploit", "Slot", `Inventory,ms=${checkItemTimeInv}`, false, false);
                player.runCommandAsync("clear");
            }
        }

        if (config.modules.namespoof.A.enabled && player.namespoofA) flag(player, "NameSpoof", "A", "Exploit", "NameLength", player.name.length);
        if (config.modules.namespoof.B.enabled && player.namespoofB) flag(player, "NameSpoof", "B", "Exploit");
        if (config.modules.namespoof.C.enabled && player.namespoofC) flag(player, "Namespoof", "C", "Exploit", "oldName", player.oldName);

        if (config.modules.spam.A.enabled && player.chatCount > 0 && new Date().getTime() - player.firstChat > config.modules.spam.A.checkTimeAfter) {
            player.chatCount = player.chatCount / ((new Date().getTime() - player.firstChat) / 1000);
            if(player.chatCount > config.modules.spam.A.maxChat) flag(player, "Spam", "A", "Misc", "ChatPerSecond", player.chatCount, false, false, false);
            player.firstChat = false;
            player.chatCount = 0;
        }

        player.blocksBroken = 0;
        if (player.restoreBlock) {
            restoreBlock(player.restoreBlock.block, player.restoreBlock.brokenBlockPermutation);
            player.restoreBlock = false;
        }
        player.lastTick = Date.now();
        
        if (config.modules.sanctuary.enabled) {
            for (const v of config.modules.sanctuary.data) {
                if (
                    v.enabled &&
                    player.location.x >= v.pos.start.x && player.location.y >= v.pos.start.y && player.location.z >= v.pos.start.z &&
                    player.location.x <= v.pos.end.x && player.location.y <= v.pos.end.y && player.location.z <= v.pos.end.z &&
                    player.permission < v.whitelist.permission && !v.whitelist.players.includes(player.name) && !v.whitelist.tag.some(tag => player.hasTag(tag))
                ) {
                    if (v.type.kill) player.kill();
                    if (v.type.killDropItem && player.hasTag("left")) {
                        const droppedItems = player.dimension.getEntities({
                            location: player.location,
                            minDistance: 0,
                            maxDistance: 2,
                            type: "item"
                        });
                        for (const item of droppedItems) item.kill();
                    }
                    if (v.type.actionbar) player.onScreenDisplay.setActionBar(`You are in ${v.name}.\nThis area is protected by Unknown Anti-Grief.`);
                    if (v.type.farmland) {
                        const pos1 = new Minecraft.BlockLocation(player.location.x + 1, player.location.y + 1, player.location.z + 1);
                        const pos2 = new Minecraft.BlockLocation(player.location.x - 1, player.location.y - 2, player.location.z - 1);
                        let blocksBetween;
                        let farmlandFlag;
                        try {
                            blocksBetween = pos1.blocksBetween(pos2);
                            farmlandFlag = blocksBetween.some((Block) => player.dimension.getBlock(Block).type.id === "minecraft:farmland");
                        } catch {}
                        if (farmlandFlag) player.addEffect(Minecraft.MinecraftEffectTypes.slowFalling, 20, 0, false);
                    }
                }
            }
        }
    }
} catch (e) {
    postError(e);
} });

world.events.beforeChat.subscribe(chat => { try {
    if (config.disableAllModule) return;
    const player = chat.sender;
    let msg = chat.message;
    if (config.modules.badpackets[2].enabled && msg.length > 512 || msg.length < 1) 
        flag(player, "BadPackets", "2", "Exploit", "MessageLength", msg.length, false, chat);

    if (player.hasTag("isMuted")) {
        chat.cancel = true;
        let Data;
        player.getTags().forEach(t => {if (t.startsWith("mutedData:")) Data = t.slice(10)});
        if (!Data) return player.tell("§r§4[§cUAG§4]§r §cYou have been muted.");
        const data = JSON.parse(Data);
        if (!data.time) return player.tell("§r§4[§cUAG§4]§r §cYou have been muted.");
        const TIME_DATA = msToTime(Number(data.time - Date.now()));
        let time = "";
        if (TIME_DATA.s > 0) time = `${TIME_DATA.s}second(s) ${time}`;
        if (TIME_DATA.m > 0) time = `${TIME_DATA.m}minute(s) ${time}`;
        if (TIME_DATA.h > 0) time = `${TIME_DATA.h}hour(s) ${time}`;
        if (TIME_DATA.d > 0) time = `${TIME_DATA.d}day(s) ${time}`;
        player.tell(`§r§4[§cUAG§4]§r §cYou have been muted. Mute will be unmuted in ${time}.`);
        return;
    }

    if (!msg.startsWith(config.commands.prefix)) {
        if (config.modules.spam.A.enabled) {
            if(!player.firstChat) player.firstChat = new Date().getTime();
            if(!player.chatCount) player.chatCount = 0;
            player.chatCount++;
        }
        
        if (config.modules.spam.B.enabled) {
            if (player.AfterChat === msg) player.DuplicateCount++;
            else player.DuplicateCount = 0;
                if (player.DuplicateCount >= 3) flag(player, "Spam", "B", "Misc", false, false, false, chat);
            player.AfterChat = msg;
        }
        
        if (config.modules.spam.C.enabled && msg.length > 100) {
            player.runCommandAsync(`tell @s Your message is too long! (${msg.length}>100)`);
            flag(player, "Spam", "C", "Misc", false, false, false, chat);
        }

        if (config.modules.spam.D.enabled) {
            if (player.spamHeat > config.modules.spam.D.flagHeat) flag(player, "Spam", "D", "Misc", "Heat", player.spamHeat, false, chat);
            player.spamHeat += config.modules.spam.D.heat;
        }
        
    }

    if (config.modules.disablecolorchat.enabled) msg = `§r${msg.replace(/§./g, "")}`;
    if (config.modules.chatfilter.enabled) {
        const filterText = msg.replace(/[1-9!?_\-() ]/g, "").toLowerCase();
        const isBad = config.modules.chatfilter.text.some(text => filterText.includes(text.toLowerCase()));
        if (isBad) {
            player.runCommandAsync(`tell @s Contains words that cannot be sent.`);
            chat.cancel = true;
        }
    }

    let duplicated = false;
    if (config.modules.duplicatecharacter.enabled) {
        const duplicate = msg.split("");
        for (let i = 0; i < duplicate.length; i++) {
            let Flag = 0;
            for (let int = 0; int < config.modules.duplicatecharacter.characters; int++) if (duplicate[i] === duplicate[i+int+1]) Flag++;
            if (Flag >= config.modules.duplicatecharacter.characters && typeof duplicate[i] === "string") duplicate[i] = "";
        }
        if (msg !== duplicate.join("")) duplicated = true;
        msg = duplicate.join("");
    }

    let openChat = false;
    if (getScore(player, "privatechat") && !chat.cancel && !msg.startsWith("§r#") && !msg.startsWith("#")) {
        const PrivateChat = new Database("PrivateChat");
        if (PrivateChat.hasAll(String(getScore(player, "privatechat")))) {
            for (const p of world.getPlayers()) if (getScore(p, "privatechat") === getScore(player, "privatechat")) p.tell(`§7[${PrivateChat.get(String(getScore(player, "privatechat"))).name}§r§7]§r <${player.nameTag}> ${msg}`);
            chat.cancel = true;
        } else {
            player.runCommandAsync("scoreboard players reset @s privatechat");
            player.tell(`§4[§cUAG§4]§r §cLeft private chat because private chat could not be found. (id: ${getScore(player, "privatechat")})`);
        }
        return;
    } else if (msg.startsWith("§r#") || msg.startsWith("#")) {
        openChat = true;
        msg = msg.replace("#", "");
    }

    if (config.websocket) {
        if (!chat.cancel) player.runCommandAsync(`tellraw @a {"rawtext":[{"translate":"chat.type.text","with":["${player.nameTag}","${msg.replace(/"/g, "")}"]}]}`);
        chat.cancel = true;
    }

    if (!chat.cancel && player.nameTag.startsWith("[")) {
        world.say(`<${player.nameTag}> ${msg}`);
        chat.cancel = true;
    }

    if (!chat.cancel && (openChat || duplicated)) {
        world.say(`<${player.nameTag}> ${msg}`);
        chat.cancel = true;
    }
    chat.massage = msg;
} catch (e) {
    postError(e);
} });

const blockLoggingDatabaseDB_0 = new Database("BlockLogging");
const blockLoggingDatabaseDB_1 = new Map();

world.events.blockBreak.subscribe(blockBreak => { try {
    if (config.disableAllModule) return;
    const { player, block, brokenBlockPermutation, dimension } = blockBreak;
    const { x, y, z } = block.location;

    if (player.lastBreak && Date.now() - player.lastBreak > 10 && Date.now() - player.lastTick < (1 / (player.tps / 1000)) * 3 && player.blocksBroken <= config.modules.nuker.A.maxBlocksBroken) player.blocksBroken = 0;
    player.lastBreak = Date.now();

    player.blocksBroken++;
    if (player.blocksBroken === 1) {
        player.blockBrokenData = {
            block: block,
            brokenBlockPermutation: brokenBlockPermutation
        }
    }
    if(player.blocksBroken > config.modules.morepackets[3].minblocksBroken || player.blocksBroken > config.modules.nuker.A.maxBlocksBroken) {
        restoreBlock(player.blockBrokenData.block, player.blockBrokenData.brokenBlockPermutation);
        restoreBlock(block, brokenBlockPermutation, player);
    }

    if (player.blocksBroken > 1) return;

    if (config.modules.fireinteract.A.enabled && config.modules.fireinteract.A.fires.includes(brokenBlockPermutation.type.id) && player.blocksBroken === 1) {
        restoreBlock(block, brokenBlockPermutation, player);
        flag(player, "FireInteract", "A", "Break", "Block", brokenBlockPermutation.type.id);
    }

    if(config.modules.liquidinteract.A.enabled && config.modules.liquidinteract.A.liquids.includes(brokenBlockPermutation.type.id) && player.blocksBroken === 1) {
        restoreBlock(block, brokenBlockPermutation, player);
        flag(player, "Liquid", "A", "Break", "Block", brokenBlockPermutation.type.id);
    }

    if (config.modules.sanctuary.enabled) {
        for (const v of config.modules.sanctuary.data) {
            if (
                v.enabled &&
                x >= v.pos.start.x && y >= v.pos.start.y && z >= v.pos.start.z &&
                x <= v.pos.end.x && y <= v.pos.end.y && z <= v.pos.end.z &&
                player.permission < v.whitelist.permission && !v.whitelist.players.includes(player.name) && !v.whitelist.tag.some(tag => player.hasTag(tag))
            ) if (v.type.restoreBreakBlock) restoreBlock(block, brokenBlockPermutation, player);
        }
    }
    
    if (config.modules.blocklogging.enabled && player.blocksBroken === 1) {
        const Pos = `${x} ${y} ${z}`;
        let blockLoggingDatabase = [];
        if (config.modules.blocklogging.type === 0) blockLoggingDatabase[Pos] = blockLoggingDatabaseDB_0.get(Pos) || undefined;
        if (config.modules.blocklogging.type === 1) blockLoggingDatabase[Pos] = blockLoggingDatabaseDB_1.get(Pos) || undefined;
        if (player.hasTag(`uag:inspect`) && player.blocksBroken === 1) {
            
            block.setPermutation(brokenBlockPermutation);
            player.tell(`---- §cUnknown §4Anti-Grief§r ----- §7(x${x}/y${y}/z${z})`);
            if (blockLoggingDatabase[Pos] === undefined) return player.tell(` No data`);
            for (let db of blockLoggingDatabase[Pos]) {
                const TIME_DATA = msToTime(Number(Date.now() - (db.time * 1000)));
                let TIME = " ";
                if (TIME_DATA.s > 0) TIME = `${TIME_DATA.s}s${TIME}`;
                if (TIME_DATA.m > 0) TIME = `${TIME_DATA.m}m${TIME}`;
                if (TIME_DATA.h > 0) TIME = `${TIME_DATA.h}h${TIME}`;
                if (TIME_DATA.d > 0) TIME = `${TIME_DATA.d}d${TIME}`;
                player.tell(` §7${TIME}ago - §c${db.user}§r ${db.type === 0 ? "removed" : "placed"} §4${db.block}`);
            }
        } else if (player.blocksBroken === 1) {
            if (config.modules.blocklogging.type === 0) blockLoggingDatabase[Pos] = blockLoggingDatabaseDB_0.get(Pos) || undefined;
            if (config.modules.blocklogging.type === 1) blockLoggingDatabase[Pos] = blockLoggingDatabaseDB_1.get(Pos) || undefined;
            const DATA = {
                type: 0,
                block: brokenBlockPermutation.type.id,
                user: player.name || player.id || null,
                time: Math.floor( Date.now() / 1000 )
            };
            if (blockLoggingDatabase[Pos] === undefined || blockLoggingDatabase[Pos].length > config.modules.blocklogging.maxData) blockLoggingDatabase[Pos] = [];
            blockLoggingDatabase[Pos].push(DATA);
            if (config.modules.blocklogging.type === 0) blockLoggingDatabaseDB_0.set(Pos, blockLoggingDatabase[Pos]);
            if (config.modules.blocklogging.type === 1) blockLoggingDatabaseDB_1.set(Pos, blockLoggingDatabase[Pos]);
        }
    }    
} catch (e) {
    postError(e);
} });

let blockTimer = new Map();

world.events.blockPlace.subscribe(blockPlace => { try {
    if (config.disableAllModule) return;
    const { player, block, dimension } = blockPlace;
    const { x, y, z } = block;
    const { x: x1, y: y1, z: z1 } = player.location;

    const blockId = block.typeId;

    if(config.modules.crasher.D.enabled && block.typeId.includes("sign")) {
        Minecraft.system.run(() => {
            const text = block.getComponent("sign").text;

            if(text.length >= config.modules.crasher.D.length) {
                flag(player, "Crasher", "D", "Exploit", "TextLength", text.length, false, false, player.selectedSlot);
                block.setType(Minecraft.MinecraftBlockTypes.air);
            }
        });
    }

    if(config.modules.illegalitems.G.enabled && !(player.gamemode === 1 && player.getComponent('inventory').container.getItem(player.selectedSlot).getLore()[0] === "(+DATA)") || player.getComponent('inventory').container.getItem(player.selectedSlot).getLore().length === 0) {
        try {
            const container = block.getComponent("inventory").container;

            let startNumber = 0;
            let didFindItems = false;
            const emptySlots = container.emptySlotsCount;
            if(container.size > 27) startNumber = container.size / 2;
        
            for(let i = startNumber; i < container.size; i++) {
                const item = container.getItem(i);
                if(typeof item === "undefined") continue;
                container.setItem(i, new Minecraft.ItemStack(Minecraft.MinecraftItemTypes.dirt, 0, 0));
                didFindItems = true;
            }
    
            if(didFindItems) {
                flag(player, "IllegalItems", "G", "Exploit", "containerBlock", `${blockId},totalSlots=${container.size},emptySlots=${emptySlots}`, false, false, player.selectedSlot);
                block.setType(Minecraft.MinecraftBlockTypes.air);
                restoreBlock(block);
            }
        } catch {}
        
    }

    if(config.modules.commandblockexploit.F.enabled) {
        const pos1 = new Minecraft.BlockLocation(block.location.x + 2, block.location.y + 2, block.location.z + 2);
        const pos2 = new Minecraft.BlockLocation(block.location.x - 2, block.location.y - 2, block.location.z - 2);

        let foundCBE = false;
        pos1.blocksBetween(pos2).some((block) => {
            const blockType = player.dimension.getBlock(block);
            if (!config.list.cbe_items.includes(blockType.typeId)) return;

            blockType.setType(Minecraft.MinecraftBlockTypes.air);
            foundCBE = true;
        });

        if(foundCBE)
            player.dimension
                .getBlock(new Minecraft.BlockLocation(block.location.x, block.location.y, block.location.z))
                .setType(Minecraft.MinecraftBlockTypes.air);
    }

    if (config.modules.sanctuary.enabled) {
        for (const v of config.modules.sanctuary.data) {
            if (
                v.enabled &&
                x >= v.pos.start.x && y >= v.pos.start.y && z >= v.pos.start.z &&
                x <= v.pos.end.x && y <= v.pos.end.y && z <= v.pos.end.z &&
                player.permission < v.whitelist.permission && !v.whitelist.players.includes(player.name) && !v.whitelist.tag.some(tag => player.hasTag(tag))
            ) {
                if (v.type.removePlaceBlock) {
                    block.setType(Minecraft.MinecraftBlockTypes.air);
                    restoreBlock(block);
                }
            }
        }
    }
    
    if (config.modules.blocklogging.enabled) {
        const Pos = `${x} ${y} ${z}`;
        let blockLoggingDatabase = [];
        if (config.modules.blocklogging.type === 0) blockLoggingDatabase[Pos] = blockLoggingDatabaseDB_0.get(Pos) || undefined;
        if (config.modules.blocklogging.type === 1) blockLoggingDatabase[Pos] = blockLoggingDatabaseDB_1.get(Pos) || undefined;
        if (player.hasTag(`uag:inspect`)) {
            
            blockPlace.dimension.getBlock(new Minecraft.BlockLocation(x, y, z)).setType(Minecraft.MinecraftBlockTypes.air);
            player.tell(`---- §cUnknown §4Anti-Grief§r ----- §7(x${x}/y${y}/z${z})`);
            if (blockLoggingDatabase[Pos] === undefined) return player.tell(` No data`);
            for (let db of blockLoggingDatabase[Pos]) {
                const TIME_DATA = msToTime(Number(Date.now() - (db.time * 1000)));
                let TIME = " ";
                if (TIME_DATA.s > 0) TIME = `${TIME_DATA.s}s${TIME}`;
                if (TIME_DATA.m > 0) TIME = `${TIME_DATA.m}m${TIME}`;
                if (TIME_DATA.h > 0) TIME = `${TIME_DATA.h}h${TIME}`;
                if (TIME_DATA.d > 0) TIME = `${TIME_DATA.d}d${TIME}`;
                player.tell(` §7${TIME}ago - §c${db.user}§r ${db.type === 0 ? "removed" : "placed"} §4${db.block}"}]}`);
            }
            
        } else {
            if (config.modules.blocklogging.type === 0) blockLoggingDatabase[Pos] = blockLoggingDatabaseDB_0.get(Pos) || undefined;
            if (config.modules.blocklogging.type === 1) blockLoggingDatabase[Pos] = blockLoggingDatabaseDB_1.get(Pos) || undefined;
            const DATA = {
                type: 1,
                block: blockId,
                user: player.name || player.id || null,
                time: Math.floor( Date.now() / 1000 )
            };
            if (blockLoggingDatabase[Pos] === undefined || blockLoggingDatabase[Pos].length > config.modules.blocklogging.maxData) blockLoggingDatabase[Pos] = [];
            blockLoggingDatabase[Pos].push(DATA);
            if (config.modules.blocklogging.type === 0) blockLoggingDatabaseDB_0.set(Pos, blockLoggingDatabase[Pos]);
            if (config.modules.blocklogging.type === 1) blockLoggingDatabaseDB_1.set(Pos, blockLoggingDatabase[Pos]);
        }
    }

    player.lastPlace = Date.now();
} catch (e) {
    postError(e);
} });


world.events.entityHit.subscribe(entityHit => { try {
    if (config.disableAllModule) return;
    const { entity: player, hitEntity: entity, hitBlock: block } = entityHit;

    if(player.typeId !== "minecraft:player" && !entity) return;

    if(config.modules.badpackets[3].enabled && entity === player) flag(player, "BadPackets", "3", "Exploit");

} catch (e) {
    postError(e);
}});

world.events.playerJoin.subscribe(playerJoin => { try {
    if (config.disableAllModule) return;
    const player = playerJoin.player;
    if (player.name.includes(`"`)) player.triggerEvent("uag:disconnect");
    player.nameTag = player.name.replace(/"|\\/g, "").replace(/§./g, "");
    if(config.modules.badpackets[5].enabled && player.nameTag.length > 30) player.Badpackets5 = true;
    player.runCommandAsync(`tellraw @a[tag=notify] {"rawtext":[{"text":"§r§4[§cUAG§4]§r §7${player.name} is trying to connect. (${player.location.x.toFixed(0)}, ${player.location.y.toFixed(0)}, ${player.location.z.toFixed(0)})"}]}`);
    
    if(config.modules.namespoof.A.enabled && player.name.endsWith(')') && (player.name.length > 19 || player.name.length < 6)) player.namespoofA = true;
    if(config.modules.namespoof.A.enabled && !player.name.endsWith(')') && (player.name.length > 16 || player.name.length < 6)) player.namespoofA = true;

    if (config.modules.namespoof.B.enabled && config.modules.namespoof.B.regex.test(player.name)) player.namespoofB = true;
    
    const Log = new Database("Log");
    player.log = [];
    if (!Log.hasAll(player.name)) Log.set(player.name, []);
    if (config.modules.globalban.enabled && !config.modules.whitelist.users.includes(player.name))
        for (const v of Gban) if (v.name === player.name) player.isGlobalBanned = v.reason;


    const ServerData = new Database("ServerData");
    if (ServerData.get("WhiteListMode") && !config.modules.whitelist.users.includes(player.name)) player.WhiteListKick = true;
    player.joinEvent = true;
    
    if (!ServerData.hasAll("WhiteListMode")) ServerData.set("WhiteListMode", false);
    if (!ServerData.hasAll("BanModule")) ServerData.set("BanModule", false);
} catch (e) {
    postError(e);
} });

world.events.playerLeave.subscribe(playerLeave => { try {
    if (config.disableAllModule) return;
    let player = playerLeave.playerName;
    world.getDimension(`overworld`).runCommandAsync(`tellraw @a[tag=notify] {"rawtext":[{"text":"§r§4[§cUAG§4]§r §7${player} disconnected from the server."}]}`);
} catch (e) {
    postError(e);
} });

world.events.beforeItemUseOn.subscribe(beforeItemUseOn => { try {
    if (config.disableAllModule) return;
    const { source: player, item, blockLocation } = beforeItemUseOn;
    if(config.modules.commandblockexploit.F.enabled) {

        if(config.list.cbe_items.includes(item.typeId)) {
            flag(player, "CommandBlockExploit", "F", "Exploit", "Block", item.typeId, false, false, player.selectedSlot);
            beforeItemUseOn.cancel = true;
        }

        const block = player.dimension.getBlock(blockLocation);
        if(config.list.cbe_items.includes(block.typeId)) {
            flag(player, "CommandBlockExploit", "F", "Exploit", "Block", `${block.typeId},Item=${item.typeId}`, false, false, player.selectedSlot);
            beforeItemUseOn.cancel = true;
        }
    }
    if(config.modules.illegalitems.E.enabled) {
        if(player.permission < 1) {
            if(config.list.items_semi_illegal && config.list.items_semi_illegal.includes(item.typeId)) {
                if (player.gamemode !== 1) {
                    flag(player, "IllegalItems", "E", "Exploit", "Block", item.typeId, false, false, player.selectedSlot);
                    beforeItemUseOn.cancel = true;
                }
            }
            if(config.modules.illegalitems.E.element && item.typeId.startsWith("minecraft:element_")) {
                if (player.gamemode !== 1) {
                    flag(player, "IllegalItems", "E", "Exploit", "Block", item.typeId, false, false, player.selectedSlot);
                    beforeItemUseOn.cancel = true;
                }
            }
            if(config.modules.illegalitems.E.egg && item.typeId.endsWith("_spawn_egg")) {
                if (player.gamemode !== 1) {
                    flag(player, "IllegalItems", "E", "Exploit", "Block", item.typeId, false, false, player.selectedSlot);
                    beforeItemUseOn.cancel = true;
                }
            }
        }

        if(config.list.items_very_illegal && config.list.items_very_illegal.includes(item.typeId)) {
            flag(player, "IllegalItems", "E", "Exploit", "Item", item.typeId, false, false, player.selectedSlot);
            beforeItemUseOn.cancel = true;
        }    
    }
    if (config.modules.grief.B.enabled && config.modules.grief.B.item.includes(item.typeId)) {
        flag(player, "Grief", "B", "Exploit", "Item", item.typeId, false, false, player.selectedSlot);
        beforeItemUseOn.cancel = true;
    }

    const { x, y, z } = beforeItemUseOn.blockLocation;

    if (config.modules.sanctuary.enabled) {
        for (const v of config.modules.sanctuary.data) {
            if (
                v.enabled && v.type.cancelItemUseOn &&
                x >= v.pos.start.x && y >= v.pos.start.y && z >= v.pos.start.z &&
                x <= v.pos.end.x && y <= v.pos.end.y && z <= v.pos.end.z &&
                player.permission < v.whitelist.permission && !v.whitelist.players.includes(player.name) && !v.whitelist.tag.some(tag => player.hasTag(tag))
            ) beforeItemUseOn.cancel = true;
        }
    }
    
} catch (e) {
    postError(e);
} });

world.events.entityCreate.subscribe(entityCreate => { try {
    if (config.disableAllModule) return;

    
    
    const entity = entityCreate.entity;

    if (config.modules.commandblockexploit.G.enabled) {
        if(config.modules.commandblockexploit.G.entities.includes(entity.typeId.toLowerCase())) {
            flag(getClosestPlayer(entity), "CommandBlockExploit", "G", "Exploit", "Entity", entity.typeId);
            entity.kill();
        }
        if(config.modules.commandblockexploit.G.npc && entity.typeId === "minecraft:npc") {
            Minecraft.system.run(() => {
                if(!entity.hasTag("uag:bypassNPC")) {
                    flag(getClosestPlayer(entity), "CommandBlockExploit", "G", "Exploit", "Entity", entity.typeId);
                    entity.kill();
                    entity.triggerEvent("uag:despawn");
                }
            });
        }
    }

    if(config.modules.illegalitems.H.enabled === true && config.modules.illegalitems.H.entities.includes(entity.typeId) && !entity.hasTag("didCheck")) {
        entity.addTag("didCheck");
        Minecraft.system.run(() => {
            const player = getClosestPlayer(entity);
            const container = entity.getComponent("inventory").container;

            if(container.size !== container.emptySlotsCount) {
                for(let i = 0; i < container.size; i++) {
                    container.setItem(i, new Minecraft.ItemStack(Minecraft.MinecraftItemTypes.dirt, 0, 0));
                }

                flag(player, "IllegalItems", "H", "Exploit", "totalSlots", `${container.size},emptySlots=${container.emptySlotsCount}`, false, false, player.selectedSlot);
                entity.kill();
            }
        });
    }

    if (config.modules.morepackets[6].enabled && entity.typeId === "minecraft:arrow") {
        
        const pl = getClosestPlayer(entity);
        pl.closestArrows++;
    }

    if (config.modules.grief.C.enabled && config.modules.grief.C.entities.includes(entity.typeId)) {
        flag(getClosestPlayer(entity), "Grief", "C", "Exploit", "Entity", entity.typeId);
        entity.kill();
    }
    
    if(entity.typeId === "minecraft:item") { try {
        const item = entity.getComponent("item").itemStack;

        if(config.modules.crasher.B.enabled && item.typeId === "minecraft:arrow" && item.data > 43) {
            flag(getClosestPlayer(entity), "Crasher", "B", "Exploit", "Item", `${item.typeId},Data=${item.data}`, false, false, getClosestPlayer(entity).selectedSlot);
            entity.kill();
        }

        if(config.modules.illegalitems.B.enabled) {
            if(config.list.items_very_illegal.includes(item.typeId) || config.list.items_semi_illegal.includes(item.typeId) || config.list.cbe_items.includes(item.typeId)) {
                flag(getClosestPlayer(entity), "IllegalItems", "B", "Exploit", "Item", item.typeId, false, false, getClosestPlayer(entity).selectedSlot);
                entity.kill();
            }
                
        }
    } catch {}}

    if (config.modules.sanctuary.enabled) {
        const { x, y, z } = entity.location;
        for (const v of config.modules.sanctuary.data) {
            if (
                v.enabled && entity.typeId !== "minecraft:player" &&
                x >= v.pos.start.x && y >= v.pos.start.y && z >= v.pos.start.z &&
                x <= v.pos.end.x && y <= v.pos.end.y && z <= v.pos.end.z
            ) {
                if (entity.typeId === "minecraft:item" && v.type.killDropItem) {
                    const player = getClosestPlayer(entity);
                    if (player?.permission < v.whitelist.permission && !v.whitelist.players.includes(player.name) && !v.whitelist.tag.some(tag => player.hasTag(tag))) entity.kill();
                } else if (v.type.killEntity) entity.teleport({x: x, y: -64, z: z}, 0, 0, false);
            }
        }
    }

} catch (e) {
    postError(e);
} });

world.events.beforePistonActivate.subscribe(beforePistonActivate => { try {
    if (config.disableAllModule) return;
    const { block, isExpanding } = beforePistonActivate;
    // world.say(String(isExpanding));
    const { x, y, z } = block.location;
    if (config.modules.sanctuary.enabled) {
        for (const v of config.modules.sanctuary.data) {
            if (v.enabled && v.type.cancelPistonActivate) {
                if (x >= v.pos.start.x -13 && x < v.pos.start.x) beforePistonActivate.cancel = true;
                if (x <= v.pos.end.x +13 && x > v.pos.end.x) beforePistonActivate.cancel = true;
                if (y >= v.pos.start.y -13 && y < v.pos.start.y) beforePistonActivate.cancel = true;
                if (y <= v.pos.end.y +13 && y > v.pos.end.y) beforePistonActivate.cancel = true;
                if (z >= v.pos.start.z -13 && z < v.pos.start.z) beforePistonActivate.cancel = true;
                if (z <= v.pos.end.z +13 && z > v.pos.end.z) beforePistonActivate.cancel = true;
            }
            
        }
    }
} catch (e) {
    postError(e);
} });

world.events.beforeExplosion.subscribe(event => { try {
    if (config.disableAllModule) return;
    const { impactedBlocks } = event;
    if (config.modules.sanctuary.enabled) {
        for (const v of config.modules.sanctuary.data) {
            if (v.enabled && v.type.cancelExplosion) {
                const isSanctuary = impactedBlocks.some(loc => {
                    const { x, y, z } = loc;
                    return x >= v.pos.start.x && y >= v.pos.start.y && z >= v.pos.start.z && x <= v.pos.end.x && y <= v.pos.end.y && z <= v.pos.end.z;
                })
                if (isSanctuary) event.cancel = true;
            }
            
        }
    }
} catch (e) {
    postError(e);
} });