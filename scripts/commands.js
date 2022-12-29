import { Command } from "./lib/handler";
import config from "./data/config";
import * as Minecraft from "@minecraft/server";
import { lfColor, msToTime, parseTime, tpsColor } from "./util";
import { Database } from "./lib/Database";
import { Menu, PrivateChatMenu, reportMenu, Rules } from "./ui";
import { getScore } from "./lib/getScore";

const world = Minecraft.world;

const help = new Command({
    name: "help",
    description: "Displays help for the command.",
    how: [
        "help",
        "help <page:number>",
        "help <command:string>",
        "help all",
        "help all <page:number>"
    ]
});
help.register();

const version = new Command({
    name: "version",
    description: "Check the version of Unknown Anti-Grief.",
    how: [
        "version"
    ]
});
version.executes((player) => {
    player.runCommandAsync("function version");
});
version.register();

const support = new Command({
    name: "support",
    description: "Displays a link to get support for Unknown Anti-Grief.",
    how: [
        "support"
    ]
});
support.executes((player) => {
    player.runCommandAsync("function support");
});
support.register();

const test = new Command({
    name: "test",
    description: "This command is for developers.",
    how: [
        "test"
    ]
});
test.executes((player) => {
    player.crash = 1;
});
test.register();

const Config = JSON.parse(JSON.stringify(config));
const debug = new Command({
    name: "debug",
    description: "Provides debugging information.",
    how: [
        "debug"
    ]
});
debug.executes((player, args, options) => {
    args = args.join(" ?").split(" ");
    try {
        if (args[0] === "config") {
            if (args[1] === "view") {
                if (!args[2].startsWith("config.")) return player.tell("§r§4[§cUAG§4]§r§c syntax error");
                const conf = args[2].slice(7).split(".");
                let configData = config;
                for (let i in conf) configData = configData[conf[i]];
                let configText = JSON.stringify(configData);
                if (!configText) return player.tell("§r§4[§cUAG§4]§r§c syntax error");
                if(configText.length > 512) 
                    configText = configText.slice(0, -(configText.length - 512)) + ` §r§7(+${configText.length - 512} additional characters)`;
                player.tell(configText);
            } else if (args[1] === "set") {
                if (!args[2].startsWith("config.")) return player.tell("§r§4[§cUAG§4]§r§c syntax error");

                const paths = args[2].slice(7).split('.');
                const objective = paths.pop();
                const path = paths.reduce((p,c) => p[c],config);

                for (let i = 0; i < 3; i++) args.shift();
                args = args.join(" ");
                if (!args) return player.tell("§r§4[§cUAG§4]§r§c syntax error");
                
                path[objective] = JSON.parse(args);
                
            } else if (args[1] === "reset") {
                if (!args[2].startsWith("config.")) return player.tell("§r§4[§cUAG§4]§r§c syntax error");
                const conf = args[2].slice(7);
                eval(`config.${conf} = Config.${conf}`);
            }
        } else if (args[0] === "mode") {
            if (args[1] === "true") player.addTag("uag:debug");
                else if (args[1] === "false") player.removeTag("uag:debug");
                else player.tell("§r§4[§cUAG§4]§r§c syntax error");
        } else player.tell("§r§4[§cUAG§4]§r§c syntax error");
    } catch (e) {
        player.tell(`§r§4[§cUAG§4]§r§c ${e}${e.stack}`);
    }
});
debug.register();

const tshoot = new Command({
    name: "tshoot",
    description: "Resolve server problems.",
    how: [
        "tshoot database"
    ]
});
tshoot.executes((player, args, options) => {
    if (args[0] === "database") {
        player.tell("§r§4[§cUAG§4]§r Delete anti-grief detection logs...");
        new Database("Log").clear();
        player.tell("§r§4[§cUAG§4]§r Deleted anti-grief detection logs.");

        player.tell("§r§4[§cUAG§4]§r Deleting block logging...");
        new Database("BlockLogging").clear();
        player.tell("§r§4[§cUAG§4]§r Block logging has been removed.");
        
        player.tell("§r§4[§cUAG§4]§r Error logs are deleted...");
        new Database("Error").clear();
        player.tell("§r§4[§cUAG§4]§r Error log deleted.");

        player.tell("§r§4[§cUAG§4]§r Deleting reports...");
        new Database("Report").clear();
        player.tell("§r§4[§cUAG§4]§r Report deleted.");

        player.tell("§r§4[§cUAG§4]§r Appeal data is deleted...");
        new Database("Appeal").clear();
        player.tell("§r§4[§cUAG§4]§r Appeal data deleted.");
    }
});
tshoot.register();

const disconnect = new Command({
    name: "disconnect",
    description: "Disconnects the player from the server.",
    how: [
        "disconnect <player:string>",
        "disconnect <player:string> ?r <reason:string>",
        "disconnect <player:string> ?s"
    ]
})
disconnect.playerOption();
disconnect.reasonOption();
disconnect.silentOption();
disconnect.executes((player, args, options) => {
    const member = options.player;
    if (!options.silent) world.say(` \n§l§d${member.name} §bhas been kicked!\n `);
    member.triggerEvent("uag:disconnect");
    for (const p of world.getPlayers({tags:["notify"]})) p.tell(`§r§4[§cUAG§4]§r ${player.name} has crashed ${member.name} (Silent:${options.silent}). Reason: ${options.reason}`);
});
disconnect.register();

const kick = new Command({
    name: "kick",
    description: "Kick the player from the server.",
    how: [
        "kick <player:string>",
        "kick <player:string> ?r <reason:string>",
        "kick <player:string> ?s"
    ]
});
kick.playerOption();
kick.reasonOption();
kick.silentOption();
kick.executes((player, args, options) => {
    const member = options.player;
    if (!options.silent) world.say(` \n§l§d${member.name} §bhas been kicked!\n `);
    player.runCommandAsync(`kick "${member.name}" §r\n§l§4You are kicked from the server§r\n\n§7Kicked by: ${options.silent ? `N/A` : player.name}\nReason: ${options.reason ? options.reason : "No reason given."}`);
    for (const p of world.getPlayers({tags:["notify"]})) p.tell(`§r§4[§cUAG§4]§r ${player.name} has kicked ${member.name} (Silent:${options.silent}). Reason: ${options.reason}`);
});
kick.register();

const ban = new Command({
    name: "ban",
    description: "Ban a player from the server.",
    how: [
        "ban <player:string>",
        "ban <player:string> ?r <reason:string>",
        "ban <player:string> ?t <time:string>",
        "ban <player:string> ?s"
    ]
});
ban.playerOption();
ban.reasonOption();
ban.timeOption();
ban.silentOption();
ban.executes((player, args, options) => {
    const member = options.player;
    member.getTags().forEach(t => {
        t = t.replace(/"/g, "");
        if(t.startsWith("reason:")) member.removeTag(t);
        if(t.startsWith("by:")) member.removeTag(t);
        if(t.startsWith("time:")) member.removeTag(t);
    });
    member.addTag(`reason:${options.reason}`);
    if (!options.silent) member.addTag(`by:${player.name}`);
    if (options.time) member.addTag(`time:${Date.now() + options.time}`);
    member.addTag(`isBanned`);
    if (!options.silent) world.say(` \n§l§d${member.name} §bhas been banned!\n `);
    for (const p of world.getPlayers({tags:["notify"]})) p.tell(`§r§4[§cUAG§4]§r ${player.name} has banned ${member.name} (Silent:${options.silent}). Reason: ${options.reason}`);
});
ban.register();

const crash = new Command({
    name: "crash",
    description: "Crashes the player's Minecraft.",
    how: [
        "crash <player:string>"
    ]
});
crash.playerOption();
crash.executes((player, args, options) => {
    const member = options.player;
    member.crashMinecraft = 1;
});
crash.register();

const unban = new Command({
    name: "unban",
    description: "Register the player on the unban list.",
    how: [
        "unban <player:string> ?add",
        "unban <player:string> ?remove",
        "unban <player:string> ?add ?r <reason:string>",
        "unban <player:string> ?remove ?r <reason:string>",
        "unban ?list"
    ]
});
unban.playerOption({name: true});
unban.reasonOption();
unban.addOption();
unban.removeOption();
unban.otherOption([{name: "list", parameter: "list", getstring: false, enabled: true}]);
unban.executes((player, args, options) => {
    const member = options.player;
    const ServerData = new Database("ServerData");
    if (!ServerData.hasAll("UnbanQueue")) ServerData.set("UnbanQueue", []);
    let unbanQueue = ServerData.get("UnbanQueue");
    if (options.add) {
        if (unbanQueue.includes(member)) return player.tell(`§4[§cUAG§4]§r §c§l${member}§r§c is already queued for an unban.`);
        for (const p of world.getPlayers({tags:["notify"]})) p.tell(`§r§4[§cUAG§4]§r ${player.name} has added §l${member}§r into the unban queue. Reason: ${options.reason}`);
        unbanQueue.push(member);
        ServerData.set("UnbanQueue", unbanQueue);
    } else if (options.remove) {
        if (!unbanQueue.includes(member)) return player.tell(`§r§4[§cUAG§4]§r §c§l${member}§r§c is not found.`);
        for (const p of world.getPlayers({tags:["notify"]})) p.tell(`§r§4[§cUAG§4]§r ${player.name} removed §l${member}§r from the unban queue. Reason: ${options.reason}`);
        unbanQueue = unbanQueue.filter(v => v !== member);
        ServerData.set("UnbanQueue", unbanQueue);
    } else if (options.other.some(v => { if (v.name === "list") return v.value; })) {
        if (unbanQueue.length === 0) return player.tell(`§r§4[§cUAG§4]§r §cNo players added to the unban queue.`);
        player.tell(`§r§4[§cUAG§4]§r §lPlayers added to unban Queue:§r`);
        for (const v of unbanQueue) player.tell(`§7-§r ${v}`);
    }
});
unban.register();

const mute = new Command({
    name: "mute",
    description: "Mute the player.",
    how: [
        "mute <player:string>",
        "mute <player:string> ?r <reason:string>",
        "mute <player:string> ?t <time:string>",
    ]
});
mute.playerOption();
mute.reasonOption();
mute.timeOption();
mute.executes((player, args, options) => {
    const member = options.player;
    const data = {
        by: player.name,
        reason: options.reason,
        time: options.time ? Date.now() + options.time + 100 : null
    };
    member.getTags().forEach(t => { if (t.startsWith("mutedData:")) member.removeTag(t)});
    member.addTag("isMuted");
    member.addTag(`mutedData:${JSON.stringify(data)}`);
    for (const p of world.getPlayers({tags:["notify"]})) p.tell(`§r§4[§cUAG§4]§r ${player.name} muted ${member.name}. Reason: ${options.reason}`);
    if (!data.time) member.tell("§r§4[§cUAG§4]§r You have been muted.");
        else {
            const TIME_DATA = msToTime(Number(data.time - Date.now()));
            let time = "";
            if (TIME_DATA.s > 0) time = `${TIME_DATA.s}second(s) ${time}`;
            if (TIME_DATA.m > 0) time = `${TIME_DATA.m}minute(s) ${time}`;
            if (TIME_DATA.h > 0) time = `${TIME_DATA.h}hour(s) ${time}`;
            if (TIME_DATA.d > 0) time = `${TIME_DATA.d}day(s) ${time}`;
            member.tell(`§r§4[§cUAG§4]§r You have been muted. Mute will be unmuted in ${time}.`);
    }
});
mute.register();

const unmute = new Command({
    name: "unmute",
    description: "Unmute the player.",
    how: [
        "unmute <player:string>",
        "unmute <player:string> ?r <reason:string>"
    ]
});
unmute.playerOption({self: true, high: true});
unmute.reasonOption();
unmute.executes((player, args, options) => {
    const member = options.player;
    if (!member.hasTag("isMuted")) return player.tell(`§r§4[§cUAG§4]§r §c${member.name} is not muted.`);
    member.removeTag("isMuted");
    member.getTags().forEach(t => {if (t.startsWith("mutedData:")) player.removeTag(t)});
    member.tell(`§r§4[§cUAG§4]§r You have been unmuted.`);
    for (const p of world.getPlayers({tags:["notify"]})) p.tell(`§r§4[§cUAG§4]§r ${player.name} unmuted ${member.name}. Reason: ${options.reason}`);
});
unmute.register();

const freeze = new Command({
    name: "freeze",
    description: "Freeze the player.",
    how: [
        "freeze <player:string>",
        "freeze <player:string> ?true",
        "freeze <player:string> ?false",
        "freeze <player:string> ?r <reason:string>"
    ]
});
freeze.playerOption({self: true, high: true});
freeze.reasonOption();
freeze.trueOption();
freeze.falseOption();
freeze.executes((player, args, options) => {
    const member = options.player;
    if (options.true) {
        if (member.hasTag("frozen")) return player.tell(`§r§4[§cUAG§4]§r §c${member.name} has already frozen.`);
        member.addTag("frozen");
        for (const p of world.getPlayers({tags:["notify"]})) p.tell(`§r§4[§cUAG§4]§r ${player.name} froze ${member.name}. Reason: ${options.reason}`);
    } else if (options.false) {
        if (!member.hasTag("frozen")) return player.tell(`§r§4[§cUAG§4]§r §c${member.name} is not frozen.`);
        member.removeTag("frozen");
        member.runCommandAsync("effect @s clear");
        for (const p of world.getPlayers({tags:["notify"]})) p.tell(`§r§4[§cUAG§4]§r ${player.name} unfroze ${member.name}. Reason: ${options.reason}`);
    } else {
        if (member.hasTag("frozen")) {
            member.removeTag("frozen");
            member.runCommandAsync("effect @s clear");
            for (const p of world.getPlayers({tags:["notify"]})) p.tell(`§r§4[§cUAG§4]§r ${player.name} unfroze ${member.name}. Reason: ${options.reason}`);
        } else {
            member.addTag("frozen");
            for (const p of world.getPlayers({tags:["notify"]})) p.tell(`§r§4[§cUAG§4]§r ${player.name} froze ${member.name}. Reason: ${options.reason}`);
        }
    }
});
freeze.register();

const hijack = new Command({
    name: "hijack",
    description: "Hijack the player.",
    how: [
        "hijack <player:string>",
        "hijack"
    ]
});
hijack.playerOption({bypass: [""]});
hijack.executes((player, args, options) => {
    const member = options.player;
    if (member) {
        const x = player.location.x, y = player.location.y, z = player.location.z, dimension = player.dimension.id, rx = player.rotation.x, ry = player.rotation.y;
        let invData = [], container = player.getComponent('inventory').container;
        for (let i = 0; i < container.size; i++) if (container.getItem(i)) invData[i] = container.getItem(i);
        player.triggerEvent("vanish");
        const data = {
            entity: member,
            inventory: invData,
            tp: () => player.teleport(new Minecraft.Location(x, y, z), world.getDimension(dimension), rx, ry, false),
            end: false
        }
        player.hijackData = data;
    } else {
        if (!player.hijackData) return player.tell("§4[§cUAG§4]§r §cYou are not hijacking anyone.");
        player.hijackData.end = true;
    }
});
hijack.register();

const waypoints = new Command({
    name: "waypoints",
    description: "Manage waypoints",
    how: [
        "waypoints 0 0 0 ?add spawn point",
        "waypoints spawn point ?remove",
        "waypoints spawn point ?tp",
        "waypoints ?removeall",
        "waypoints ?list"
    ]
});
waypoints.otherOption([
    { name: "add", parameter: "add", getstring: true, enabled: true },
    { name: "removeall", parameter: "removeall", getstring: false, enabled: true},
    { name: "remove", parameter: "remove", getstring: false, enabled: true },
    { name: "tp", parameter: "tp", getstring: false, enabled: true},
    { name: "list", parameter: "list", getstring: false, enabled: true}
]);
waypoints.executes((player, args, options) => {
    const WayPoints = new Database("WayPoints");
    const object = options.other[0];
    if (typeof WayPoints.get(player.name) !== "object") WayPoints.set(player.name, []);// -123.00
    const data = WayPoints.get(player.name);
    if (!object) return player.tell(`§4[§cUAG§4]§r §cIncorrect syntax.`);
    if (object.name === "add") {
        for (const v of data) if (v.name === object.value) return player.tell(`§4[§cUAG§4]§r §cIts name is already there.`);
        const pos = args[0].replace(/[^0-9-. ]/g, "").split(" ");
        if (pos.length !== 3) return player.tell(`§4[§cUAG§4]§r §cCoordinates should be specified in x/y/z.`);
        if (pos[0].length === 0 || pos[1].length === 0 || pos[2].length === 0) return player.tell(`§4[§cUAG§4]§r §cCoordinates must be numbers.`);
        data.push({name:object.value,pos:{x:Number(pos[0]),y:Number(pos[1]),z:Number(pos[2])}});
        player.tell(`§4[§cUAG§4]§r ${object.value} was added.`);
        if (data.length > 15) data.shift();
        WayPoints.set(player.name, data);
    } else if (object.name === "remove") {
        if (data.filter(v => v.name === args[0]).length === 0) return player.tell(`§4[§cUAG§4]§r §cNo waypoints of that name found.`);
        player.tell(`§4[§cUAG§4]§r ${object.value} was removed.`);
        const data_ = data.filter(v => v.name !== args[0]);
        WayPoints.set(player.name, data_);
    } else if (object.name === "tp") {
        if (!data.find(v => v.name === args[0])) return player.tell(`§4[§cUAG§4]§r §cNo waypoints of that name found.`);
        const pos = data.find(v => v.name === args[0]).pos;
        player.addTag("uag:bypass");
        player.teleport({x: Number(pos.x), y: Number(pos.y), z: Number(pos.z)}, player.dimension, player.rotation.x, player.rotation.y, false);
        player.tell(`§4[§cUAG§4]§r Teleport to ${args[0]} was successful.`);
    } else if (object.name === "removeall") {
        WayPoints.set(player.name, []);
        player.tell(`§4[§cUAG§4]§r All data has been deleted.`);
    } else if (object.name === "list") {
        if (data.length === 0) return player.tell(`§4[§cUAG§4]§r §cThere are no waypoints to list.`);
        player.tell(`§4[§cUAG§4]§r List of your waypoints:`);
        for (const v of data) player.tell(` ${v.name} - ${v.pos.x}/${v.pos.y}/${v.pos.z}`);
    }
});
waypoints.register();

const gamemode = new Command({
    name: "gamemode",
    description: "Change your game mode.",
    how: [
        "gamemode 2",
        "gamemode s",
        "gamemode creative",
        "gamemode v"
    ]
});
gamemode.executes((player, args) => {
    if (args[0] === "0" || args[0] === "s" || args[0] === "survival") {
        player.runCommandAsync("gamemode s");
        player.tell("§r§4[§cUAG§4]§r Your game mode is now survival.");
    } else if (args[0] === "1" || args[0] === "c" || args[0] === "creative") {
        player.runCommandAsync("gamemode c");
        player.tell("§r§4[§cUAG§4]§r Your game mode is now creative.");
    } else if (args[0] === "2" || args[0] === "a" || args[0] === "adventure") {
        player.runCommandAsync("gamemode a");
        player.tell("§r§4[§cUAG§4]§r Your game mode is now adventure.");
    } else if (args[0] === "3" || args[0] === "v" || args[0] === "spectator") {
        player.runCommandAsync("gamemode spectator");
        player.tell("§r§4[§cUAG§4]§r Your game mode is now spectator.");
    } else if (args[0] === "4" || args[0] === "d" || args[0] === "default") {
        player.runCommandAsync("gamemode default");
        player.tell("§r§4[§cUAG§4]§r Your game mode is now default.");
    } else player.tell("§r§4[§cUAG§4]§r §cGame mode is invalid.");
});
gamemode.register();

const gms = new Command({
    name: "gms",
    description: "Make your game mode survival.",
    how: [
        "gms"
    ]
});
gms.executes((player) => {
    player.runCommandAsync("gamemode s");
    player.tell("§r§4[§cUAG§4]§r Your game mode is now survival.");
});
gms.register();

const gma = new Command({
    name: "gma",
    description: "Make your game mode adventure.",
    how: [
        "gma"
    ]
});
gma.executes((player) => {
    player.runCommandAsync("gamemode a");
    player.tell("§r§4[§cUAG§4]§r Your game mode is now adventure.");
});
gma.register();

const gmc = new Command({
    name: "gmc",
    description: "Make your game mode creative.",
    how: [
        "gmc"
    ]
});
gmc.executes((player) => {
    player.runCommandAsync("gamemode c");
    player.tell("§r§4[§cUAG§4]§r Your game mode is now creative.");
});
gmc.register();

const gmv = new Command({
    name: "gmv",
    description: "Make your game mode spectator.",
    how: [
        "gmv"
    ]
});
gmv.executes((player) => {
    player.runCommandAsync("gamemode spectator");
    player.tell("§r§4[§cUAG§4]§r Your game mode is now spectator.");
});
gmv.register();

const invsee = new Command({
    name: "invsee",
    description: "Lists items in inventory.",
    how: ["invsee <player:string>"]
});
invsee.playerOption({self: true, high: true});
invsee.executes((player, args, options) => {
    const member = options.player;
    const container = member.getComponent('inventory').container;
    player.tell(`§r§4[§cUAG§4]§r ${member.name}'s inventory:`);
    for (let i = 0; i < container.size; i++) if (container.getItem(i)) {
        const item = container.getItem(i);
        player.tell(`§r§4[§cUAG§4]§r Slot ${i}: ${item.typeId}:${item.data}${item.nameTag !== undefined ? ` §7(name:§r ${item.nameTag}§r§7)§r` : ""} x${item.amount}`);
    }
});
invsee.register();

const vanish = new Command({
    name: "vanish",
    description: "vanish the player.",
    how: [
        "vanish",
        "vanish ?true",
        "vanish ?false"
    ]
});
vanish.trueOption();
vanish.falseOption();
vanish.executes((player, args, options) => {
    if (options.true) {
        if (player.hasTag("vanish")) return player.tell("§r§4[§cUAG§4]§r §cYou have already vanished.");
        player.runCommandAsync("function tools/vanish");
    } else if (options.false) {
        if (!player.hasTag("vanish")) return player.tell("§r§4[§cUAG§4]§r §cYou are not vanishing.");
        player.runCommandAsync("function tools/vanish");
    } else player.runCommandAsync("function tools/vanish");
});
vanish.register();

const spectatorvanish = new Command({
    name: "spectatorvanish",
    description: "spectator vanish the player.",
    how: [
        "spectatorvanish",
        "spectatorvanish ?true",
        "spectatorvanish ?false"
    ]
});
spectatorvanish.trueOption();
spectatorvanish.falseOption();
spectatorvanish.executes((player, args, options) => {
    if (options.true) {
        if (player.hasTag("spectatorvanish")) return player.tell("§r§4[§cUAG§4]§r §cYou have already spectator vanished.");
        player.runCommandAsync("function tools/spectatorvanish");
    } else if (options.false) {
        if (!player.hasTag("spectatorvanish")) return player.tell("§r§4[§cUAG§4]§r §cYou are not spectator vanishing.");
        player.runCommandAsync("function tools/spectatorvanish");
    } else player.runCommandAsync("function tools/spectatorvanish");
});
spectatorvanish.register();

const credits = new Command({
    name: "credits",
    description: "Show credits.",
    how: [
        "credits"
    ]
});
credits.executes((player) => {
    player.runCommandAsync("function credits");
});
credits.register();

const inspect = new Command({
    name: "inspect",
    description: "Inspect the player.",
    how: [
        "inspect",
        "inspect ?true",
        "inspect ?false"
    ]
});
inspect.trueOption();
inspect.falseOption();
inspect.executes((player, args, options) => {
    if (!config.modules.blocklogging.enabled) {
        player.removeTag("uag:inspect");
        return player.tell("§r§4[§cUAG§4]§r §cBlock logging is not enabled in the configuration, please enable block logging in scripts/data/config.js.");
    }
    if (options.true) {
        if (player.hasTag("uag:inspect")) return player.tell("§r§4[§cUAG§4]§r §cYou are already an inspector.");
        player.runCommandAsync("function tools/inspect");
    } else if (options.false) {
        if (!player.hasTag("vanish")) return player.tell("§r§4[§cUAG§4]§r §cYou are not an inspector.");
        player.runCommandAsync("function tools/inspect");
    } else player.runCommandAsync("function tools/inspect");
});
inspect.register();

const menu = new Command({
    name: "menu",
    description: "Open the Unknown Anti-Grief menu.",
    how: [
        "menu"
    ]
});
menu.executes((player, args) => {
    player.runCommandAsync("gamemode a");
    player.runCommandAsync("damage @s 0 entity_attack");
    if (player.gamemode === 3) player.runCommandAsync("gamemode spectator");
        else player.runCommandAsync(`gamemode ${player.gamemode}`);
    Menu(player);
});
menu.register();

const tag = new Command({
    name: "tag",
    description: "Tag in front of the name.",
    how: [
        "tag <tag:string>",
        "tag"
    ]
});
tag.executes((player, args) => {
    const tags = player.getTags().filter(t => t.startsWith(`!"tag:`));
    for (const t of tags) player.removeTag(t);
    player.nameTag = player.name;

    if (args[0].length > 0) {
        player.addTag(`!"tag:${args[0]}`);
        player.tell(`§4[§cUAG§4]§r Your tag has been set to "${args[0]}".`);
    } else if (tags.length > 0) player.tell(`§4[§cUAG§4]§r Your tag has been reset.`);
        else player.tell(`§4[§cUAG§4]§r §cYou have not set any tags.`);
});
tag.register();

const privatechat = new Command({
    name: "privatechat",
    description: "Manage private chats.",
    how: [
        "privatechat"
    ]
});
privatechat.executes((player) => {
    player.runCommandAsync("gamemode a");
    player.runCommandAsync("damage @s 0 entity_attack");
    if (player.gamemode === 3) player.runCommandAsync("gamemode spectator");
        else player.runCommandAsync(`gamemode ${player.gamemode}`);
    PrivateChatMenu(player);
});
privatechat.register();

const notify = new Command({
    name: "notify",
    description: "Receive anti-grief notifications.",
    how: [
        "notify"
    ]
});
notify.trueOption();
notify.falseOption();
notify.executes((player, args, options) => {
    if (options.true) {
        if (player.hasTag("notify")) return player.tell("§r§4[§cUAG§4]§r §cAlready enabled.");
        player.runCommandAsync("function notify");
    } else if (options.false) {
        if (!player.hasTag("notify")) return player.tell("§r§4[§cUAG§4]§r §cAlready disabled.");
        player.runCommandAsync("function notify");
    } else player.runCommandAsync("function notify");
});
notify.register();

const permission = new Command({
    name: "permission",
    description: "Get Unknown Anti-Grief permission.",
    how: ["permission <password:string>"]
});
permission.executes((player, args) => {
    const password = args.join(" ?") || undefined;
    if (player.permission > 0) {
        player.getTags().forEach(t => { if (t.startsWith(`\"\n\nUAG\nPermission\t§k`) && t.endsWith(`\""`)) player.removeTag(t); });
        player.tell("§r§4[§cUAG§4]§r Removed permissions.")
        for (const p of world.getPlayers({tags:["notify"]})) p.tell(`§r§4[§cUAG§4]§r ${player.name}'s permission level was set to 0.`);
    } else if (password === config.permission.level_1.password) {
        player.addTag(`\"\n\nUAG\nPermission\t§k${config.permission.level_1.tag}\""`);
        player.tell("§r§4[§cUAG§4]§r Permission level 1 given.");
        for (const p of world.getPlayers({tags:["notify"]})) p.tell(`§r§4[§cUAG§4]§r ${player.name}'s permission level was set to 1.`);
    } else if (password === config.permission.level_2.password) {
        player.addTag(`\"\n\nUAG\nPermission\t§k${config.permission.level_2.tag}\""`);
        player.tell("§r§4[§cUAG§4]§r Permission level 2 given.");
        for (const p of world.getPlayers({tags:["notify"]})) p.tell(`§r§4[§cUAG§4]§r ${player.name}'s permission level was set to 2.`);
    } else if (password === config.permission.level_3.password) {
        player.addTag(`\"\n\nUAG\nPermission\t§k${config.permission.level_3.tag}\""`);
        player.tell("§r§4[§cUAG§4]§r Permission level 3 given.");
        for (const p of world.getPlayers({tags:["notify"]})) p.tell(`§r§4[§cUAG§4]§r ${player.name}'s permission level was set to 3.`);
    } else if (password === config.permission.level_4.password) {
        player.addTag(`\"\n\nUAG\nPermission\t§k${config.permission.level_4.tag}\""`);
        player.tell("§r§4[§cUAG§4]§r Permission level 4 given.");
        for (const p of world.getPlayers({tags:["notify"]})) p.tell(`§r§4[§cUAG§4]§r ${player.name}'s permission level was set to 4.`);
    } else if (password === config.permission.level_5.password) {
        player.addTag(`\"\n\nUAG\nPermission\t§k${config.permission.level_5.tag}\""`);
        player.tell("§r§4[§cUAG§4]§r Permission level 5 given.");
        for (const p of world.getPlayers({tags:["notify"]})) p.tell(`§r§4[§cUAG§4]§r ${player.name}'s permission level was set to 5.`);
    } else if (password) player.triggerEvent("uag:disconnect");
});
permission.register();

const report = new Command({
    name: "report",
    description: "Open the reporting screen.",
    how: [
        "report"
    ]
});
report.executes((player) => {
    player.runCommandAsync("gamemode a");
    player.runCommandAsync("damage @s 0 entity_attack");
    if (player.gamemode === 3) player.runCommandAsync("gamemode spectator");
        else player.runCommandAsync(`gamemode ${player.gamemode}`);
    reportMenu(player);
});
report.register();

const votekick = new Command({
    name: "votekick",
    description: "Vote the player out and kick him from the server.",
    how: [
        "votekick <player:string>"
    ]
});
votekick.playerOption({high: true});
votekick.executes((player, args, options) => {
    const member = options.player;
    if (!member.votes) member.votes = [];
    if (!player.votes) player.votes = [];
    if (member.votes.includes(player.name)) return player.tell(`§4[§cUAG§4]§r §cYou have already voted to ${member.name}.`);
    member.votes.push(player.name);
    player.votes.push("\tyourself");
    player.tell(`§4[§cUAG§4]§r You voted to ${member.name}.`);
    let players = 0;
    for (const p of world.getPlayers()) players++;
    for (const p of world.getPlayers({tags:["notify"]})) p.tell(`§r§4[§cUAG§4]§r ${player.name} voted to kick ${member.name}. (${member.votes.length}/${Math.ceil(players * config.modules.votekick.requiredRate)})`);
});
votekick.register();

const rules = new Command({
    name: "rules",
    description: "Check the server rules.",
    how: [
        "rules"
    ]
});
rules.executes((player) => {
    player.runCommandAsync("gamemode a");
    player.runCommandAsync("damage @s 0 entity_attack");
    if (player.gamemode === 3) player.runCommandAsync("gamemode spectator");
        else player.runCommandAsync(`gamemode ${player.gamemode}`);
    Rules(player, false);
});
rules.register();

const tps = new Command({
    name: "tps",
    description: "Displays the server TPS.",
    how: [
        "tps",
        "tps ?shard <shard:number>",
        "tps ?ago <time:string>"
    ]
});
tps.otherOption(
    [
        {name: "shard", parameter: "shard", getstring: true, enabled: true},
        {name: "ago", parameter: "ago", getstring: true, enabled: true}
    ]
);
tps.executes((player, args, options) => {
    if (options.other.length === 1 && options.other[0].name === "shard") {
        if (options.other[0].value.replace(/[^0-9]/g, "").length === 0 || Number(options.other[0].value) < 0 || Number(options.other[0].value) > 99) return player.tell("§r§4[§cUAG§4]§r §cInvalid shard id.")
        player.tell(`§r§4[§cUAG§4]§r TPS: ${tpsColor(player.tpsShard_[Number(options.other[0].value)])}`);
    } else if (options.other.length === 1 && options.other[0].name === "ago") {
        const time = parseTime(options.other[0].value);
        let agoTPS = "NaN";
        for (const v of player.tpsShard)
            if (v.timestamp === Math.floor(Date.now() / 1000) - Math.floor(time / 1000)) agoTPS = v.tps;
        player.tell(`§r§4[§cUAG§4]§r TPS: ${tpsColor(agoTPS)}`);
    } else {
        let one_minute = "NaN";
        let five_minutes = "NaN";
        for (const v of player.tpsShard) {
            if (v.timestamp === Math.floor(Date.now() / 1000) - 60) one_minute = v.tps;
            if (v.timestamp === Math.floor(Date.now() / 1000) - 300) five_minutes = v.tps;
        }
        player.tell("§r§4[§cUAG§4]§r §lThe TPS for this server is as follows.");
        player.tell(`§7Now: ${tpsColor(player.tps)} §8| §71 min ago: ${tpsColor(one_minute)} §8| §75 min ago: ${tpsColor(five_minutes)}`);
        player.tell("§lShards\n----------------------------------------------------------------")
        for (let i = 0; i < 10; i++) {
            let msg = "";
            for (let l = 1; l < 11; l++) {
                const int = i * 10 + l;
                msg += `§7${int < 10 ? `0${int}` : int}: ${tpsColor(player.tpsShard_[int-1], 2)}`
                if (l !== 10) msg += " §8| "
            }
            player.tell(msg);
        }

    }
});
tps.register();

const loadFactor = new Command({
    name: "loadfactor",
    description: "Displays the server load factor.",
    how: [
        "loadfactor",
        "loadfactor ?shard <shard:number>",
        "loadfactor ?ago <time:string>"
    ]
});
loadFactor.otherOption(
    [
        {name: "shard", parameter: "shard", getstring: true, enabled: true},
        {name: "ago", parameter: "ago", getstring: true, enabled: true}
    ]
);
loadFactor.executes((player, args, options) => {
    if (options.other.length === 1 && options.other[0].name === "shard") {
        if (options.other[0].value.replace(/[^0-9]/g, "").length === 0 || Number(options.other[0].value) < 0 || Number(options.other[0].value) > 99) return player.tell("§r§4[§cUAG§4]§r §cInvalid shard id.")
        player.tell(`§r§4[§cUAG§4]§r LF: ${lfColor(player.loadFactorShard_[Number(options.other[0].value)])}`);
    } else if (options.other.length === 1 && options.other[0].name === "ago") {
        const time = parseTime(options.other[0].value);
        let agoTPS = "NaN";
        for (const v of player.loadFactorShard)
            if (v.timestamp === Math.floor(Date.now() / 1000) - Math.floor(time / 1000)) agoTPS = v.loadFactor;
        player.tell(`§r§4[§cUAG§4]§r LF: ${lfColor(agoTPS)}`);
    } else {
        let one_minute = "NaN";
        let five_minutes = "NaN";
        for (const v of player.loadFactorShard) {
            if (v.timestamp === Math.floor(Date.now() / 1000) - 60) one_minute = v.loadFactor;
            if (v.timestamp === Math.floor(Date.now() / 1000) - 300) five_minutes = v.loadFactor;
        }
        player.tell("§r§4[§cUAG§4]§r §lThe load factor for this server is as follows.");
        player.tell(`§7Now: ${lfColor(player.loadFactor)} §8| §71 min ago: ${lfColor(one_minute)} §8| §75 min ago: ${lfColor(five_minutes)}`);
        player.tell("§lShards\n----------------------------------------------------------------")
        for (let i = 0; i < 10; i++) {
            let msg = "";
            for (let l = 1; l < 11; l++) {
                const int = i * 10 + l;
                msg += `§7${int < 10 ? `0${int}` : int}: ${lfColor(player.loadFactorShard_[int-1], 1)}`
                if (l !== 10) msg += " §8| "
            }
            player.tell(msg);
        }

    }
});
loadFactor.register();

const npc = new Command({
    name: "npc",
    description: "Spawn NPC.",
    how: [
        "npc"
    ]
});
npc.executes((player) => {
    player.runCommandAsync("function tools/npc")
});
npc.register();

const clearchat = new Command({
    name: "clearchat",
    description: "Clear chat.",
    how: [ "clearchat" ]
});
clearchat.executes((player) => {
    player.runCommandAsync("function tools/clearchat");
});
clearchat.register();

const suicide = new Command({
    name: "suicide",
    description: "Suicide.",
    how: [ "suicide" ]
});
suicide.executes((player) => {
    player.kill();
});
suicide.register();