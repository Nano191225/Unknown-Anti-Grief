import * as Minecraft from "@minecraft/server";
import { Database } from "./lib/Database";
import config from "./data/config";
import { getScore } from "./lib/getScore";
//import cache from "./data/cache";

const world = Minecraft.world;
const system = Minecraft.system;


export function parseTime(str) { try {
    // validate that required params are defined
    if (!str) return console.warn(`${new Date()} | ` + "Error: ${str} isnt defined. Did you forget to pass it? (./util.js:216)");

    // parse time values like 12h, 1d, 10m into milliseconds

    // code from github co-pilot, thanks ai!
    const time = str.match(/^(\d+)([smhdw])$/);
    if (time) {
        const [, num, unit] = time;
        const ms = {
            s: 1000,
            m: 60000,
            h: 3600000,
            d: 86400000,
            w: 604800000
        }[unit];
        return ms * num;
    }
    return time;
} catch (e) {
    postError(e);
}}

/**
 * @name flag
 * @param {object} player - The player object
 * @param {string} check - What check ran the function.
 * @param {string} checkType - What sub-check ran the function (ex. a, b ,c).
 * @param {string} hackType - What the hack is considered as (ex. movement, combat, exploit).
 * @param {string} debugName - Name for the debug value.
 * @param {string} debug - Debug info.
 * @param {boolean} shouldTP - Whever to tp the player to itself.
 * @param {object} message - The message object, used to cancel the message.
 * @param {number} slot - Slot to clear an item out.
 * @param {string} punishment - Specify punishiment (ex. disconnect, kick, ban)
 * @param {string} punishmentType - (ex. silent, hacking, griefing)
 * @param {string} reason - Add a reason
 * @param {string} banTime - Set banTime.
 * @param {string} banTime - Set banTime.
 * @example flag(player, "Spammer", "B", "Combat", false, false, false, message, false, kick, false);
 * @remarks Alerts staff if a player is hacking.
 */
export function flag(player, check, checkType, hackType, debugName, debug, shouldTP, message, slot) { try {

    if(!player.firstDetect) player.firstDetect = new Date().getTime();
    if(!player.Detect) player.Detect = 0;
    player.Detect++;

    player.flyABypass = 0;

    if (config.modules.manydetect.enabled && check.toLowerCase() !== "autototem" && check.toLowerCase() !== "spam") player.detectHeat += config.modules.manydetect.heat;
    
    if (message) message.cancel = true;

    if(debug) debug = String(debug).replace(/"|\\/g, "");
    
    if(shouldTP && check !== "Crasher") player.teleport({x: player.location.x, y: player.location.y, z: player.location.z}, world.getDimension("overworld"), 0, 0, false);
        else if(shouldTP && check === "Crasher") {
            player.teleport({x: 30000000, y: 30000000, z: 30000000}, world.getDimension("overworld"), 0, 0, false);
        }

    if (check !== "CommandBlockExploit") player.runCommandAsync(`scoreboard objectives add "${check.toLowerCase()}/${checkType.toUpperCase()}vl" dummy`);
        else player.runCommandAsync(`scoreboard objectives add "cbe/${checkType.toUpperCase()}vl" dummy`);

    if (check !== "CommandBlockExploit") player.runCommandAsync(`scoreboard players add @s "${check.toLowerCase()}/${checkType.toUpperCase()}vl" 1`);
        else player.runCommandAsync(`scoreboard players add @s "cbe/${checkType.toUpperCase()}vl" 1`);
  
    

    if (slot !== false) slot = slot + 0;
    
    if (slot >= 0) {
        if(slot <= 8) player.runCommandAsync(`replaceitem entity @s slot.hotbar ${slot} air 1`);
            else player.runCommandAsync(`replaceitem entity @s slot.inventory ${slot - 9} air 1`);
    }

    const Log = new Database("Log");

    if (!Log.hasAll(player.name)) Log.set(player.name, []);
    let AACL = Log.get(player.name);
    if (!player.log) player.log = [];
    let ACL = player.log;
    if (AACL.length > 256) {
        try { player.runCommandAsync(`tellraw @a[tag=notify] {"rawtext":[{"text":"§4[§cUAG§4]§r ${player.name}'s all-anti-grief log has been deleted because its capacity has exceeded the limit."}]}`) } catch {}
        AACL = [];
    }

    system.run(() => system.run(() => {
        

        if(debug && check != "CommandBlockExploit") for (const p of world.getPlayers({tags:["notify"]})) p.tell(`§r§4[§cUAG§4]§r ${player.name} §chas failed §7(${hackType}) §4${check}/${checkType.toUpperCase()} §7(${debugName}=${debug})§4. VL= ${getScore(player, `${check.toLowerCase()}/${checkType.toUpperCase()}vl`)}`);
            else if (debug) for (const p of world.getPlayers({tags:["notify"]})) p.tell(`§r§4[§cUAG§4]§r ${player.name} §chas failed §7(${hackType}) §4${check}/${checkType.toUpperCase()} §7(${debugName}=${debug})§4. VL= ${getScore(player, `cbe/${checkType.toUpperCase()}vl`)}`);
            else for (const p of world.getPlayers({tags:["notify"]})) p.tell(`§r§4[§cUAG§4]§r ${player.name} §chas failed §7(${hackType}) §4${check}/${checkType.toUpperCase()}. VL= ${getScore(player, `${check.toLowerCase()}/${checkType.toUpperCase()}vl`)}`);
    
        let log;

        if (debug && check != "CommandBlockExploit") {
            log = {
                check: check,
                checkType: checkType,
                debugName: debugName,
                debug: debug,
                vl: getScore(player, `${check.toLowerCase()}/${checkType.toUpperCase()}vl`)
            }
        } else if (debug) {
            log = {
                check: check,
                checkType: checkType,
                debugName: debugName,
                debug: debug,
                vl: getScore(player, `cbe/${checkType.toUpperCase()}vl`)
            }
        } else {
            log = {
                check: check,
                checkType: checkType,
                vl: getScore(player, `${check.toLowerCase()}/${checkType.toUpperCase()}vl`)
            }
        }

        ACL.push(log);
        player.log = ACL;

        if (!player.saveLog) {
            AACL.push(log);
            Log.set(player.name, AACL);
            player.saveLog = true;
        }
        
    
    
        
    
        let checkData = config.modules[check.toLowerCase()][checkType.toUpperCase()].punishment;
        if(!checkData) throw Error(`No valid check data found for ${check}/${checkType}.`);
        const punishment = checkData?.punishment;
        const type = checkData?.type;
        let reason = checkData?.reason;
        let time = checkData?.time;
        const heat = checkData?.heat;
        
    
        if (!reason) reason = "No reason given."
    
        // punishment stuff
        if(punishment == "disconnect") {
            if (type != "silent") player.runCommandAsync(`tellraw @a {"rawtext":[{"text":" \n§l§d${player.name} §bhas been kicked for ${type}!\n "}]}`);
            if (player.permission < 3) player.triggerEvent("uag:disconnect");
    
        } else if(punishment == "kick") {//kick "${member.name}" §r\n§l§cYou are kicked!\n§r\n§eKicked By:§r ${player.name || "N/A"}\n§bReason:§r${reason || " No reason given."}
            if (type != "silent") player.runCommandAsync(`tellraw @a {"rawtext":[{"text":" \n§l§d${player.name} §bhas been kicked for ${type}!\n "}]}`);
            if (player.permission < 4) try { player.runCommandAsync(`kick "${player.name}" §r\n§l§4You are kicked from the server§r\n\n§7Kicked by: Unknown Anti-Grief\nReason: ${reason}`) } catch {}
        
        } else if(punishment == "ban" && new Database("ServerData").get("BanModule")) {
            player.runCommandAsync(`tellraw @a[tag=notify] {"rawtext":[{"text":"§r§4[§cUAG§4]§r "},{"selector":"@s"},{"text":" has been banned by Unknown Anti-Grief for Unfair Advantage. Check: "},{"text":"${check}/${checkType}"}]}`);
    
            let time_number = Number(time.replace(/[^0-9]/g, ''));
            const time_string = time.replace(/[^a-z]/g, '');
    
            time_number *= getScore(player, `${check.toLowerCase()}/${checkType.toUpperCase()}vl`) * getScore(player, `${check.toLowerCase()}/${checkType.toUpperCase()}vl`);
    
            time = parseTime(time_number + time_string);
                    
            player.getTags().forEach(t => {
                t = t.replace(/"/g, "");
                if(t.startsWith("reason:")) player.removeTag(t);
                if(t.startsWith("by:")) player.removeTag(t);
                if(t.startsWith("time:")) player.removeTag(t);
                if(t.startsWith("code:")) {
                    AppealNet("delete", t.slice(5));
                    player.removeTag(t);
                }
            });
            if (type != "silent" && !player.hasTag("isBanned")) player.runCommandAsync(`tellraw @a {"rawtext":[{"text":" \n§l§d${player.name} §bhas been banned for ${type}!\n "}]}`);
    
            player.addTag(`reason:${reason}`);
    
            const code = AppealNet("code");
            AppealNet("save", code, player.name, "Unknown Anti-Grief", reason, time, check, checkType, debugName, debug, false);
            player.addTag(`code:${code}`);
    
            player.addTag(`by:Unknown Anti-Grief`);
            if(time) player.addTag(`time:${new Date().getTime() + time}`);
            system.run(() => system.run(() => player.addTag(`isBanned`)));
        } else if (punishment == "ban" && !new Database("ServerData").get("BanModule")) {
            if (type != "silent") player.runCommandAsync(`tellraw @a {"rawtext":[{"text":" \n§l§d${player.name} §bhas been banned for ${type}!\n "}]}`);
            if (player.permission < 3) player.triggerEvent("uag:disconnect");
        } else if(punishment == "mute") {
            let time_number = Number(time.replace(/[^0-9]/g, ''));
            const time_string = time.replace(/[^a-z]/g, '');
    
            time_number *= getScore(player, `${check.toLowerCase()}/${checkType.toUpperCase()}vl`) * getScore(player, `${check.toLowerCase()}/${checkType.toUpperCase()}vl`);
    
            time = parseTime(time_number + time_string);
                    
            player.getTags().forEach(t => { if (t.startsWith("mutedData:")) player.removeTag(t)});
    
            if (type != "silent" && !player.hasTag("isMuted")) world.say(` \n§l§d${player.name} §bhas been muted for ${type}!\n `);
    
            player.addTag(`reason:${reason}`);
    
            const data = {
                by: "Unknown Anti-Grief",
                reason: reason,
                time: new Date().getTime() + time
            };
            player.addTag("isMuted");
            player.addTag(`mutedData:${JSON.stringify(data)}`);
    
            if (!data.time) player.tell("§r§4[§cUAG§4]§r You have been muted.");
            else {
                const TIME_DATA = msToTime(Number(data.time - Date.now()));
                let time = "";
                if (TIME_DATA.s > 0) time = `${TIME_DATA.s}second(s) ${time}`;
                if (TIME_DATA.m > 0) time = `${TIME_DATA.m}minute(s) ${time}`;
                if (TIME_DATA.h > 0) time = `${TIME_DATA.h}hour(s) ${time}`;
                if (TIME_DATA.d > 0) time = `${TIME_DATA.d}day(s) ${time}`;
                player.tell(`§r§4[§cUAG§4]§r You have been muted. Mute will be unmuted in ${time}.`);
            }
        }
        return;
    }))
    
    return;
} catch (e) {
    postError(e);
}}

/**
 * @name getClosestPlayer
 * @param {Entity} entity - The entity to check
 * @example getClosestPlayer(entity);
 * @remarks Gets the nearest player to an entity.
 * @returns {Player} player - The player that was found
 */
export function getClosestPlayer(entity) { try {
    if(typeof entity !== "object") return TypeError(`Error: entity is type of ${typeof entity}. Expected "object"`);
    const nearestPlayer = [...entity.dimension.getPlayers({
        closest: 1,
        location: new Minecraft.Location(entity.location.x, entity.location.y, entity.location.z)
    })][0];
    return nearestPlayer;
} catch (e) {
    postError(e);
}}

export function AppealNet(type, code, player, bannedby, reason, length, check, checkType, debugName, debug, unban) { try {
    code = `${code}`;
    if (type === "load") {
        const BanDB = new Database("Appeal");
        const DATA = BanDB.get(code);
        return DATA;
    } else if (type === "save") {
        const BanDB = new Database("Appeal");
        const DATA = [ player, bannedby, reason, length, check, checkType, debugName, debug, unban ];
        BanDB.set(code, DATA);
    } else if (type === "has") {
        const BanDB = new Database("Appeal");
        const DATA = BanDB.hasAll(code);
        return DATA;
    } else if (type === "keys") {
        const BanDB = new Database("Appeal");
        let CODE_LIST = [];
        for (const v of BanDB.keysAll()) CODE_LIST.push(v);
        return CODE_LIST;
    } else if (type === "code") {
        const BanDB = new Database("Appeal");
        let CODE_LIST = [];
        for (const v of BanDB.keysAll()) CODE_LIST.push(v);
        let CODEGEN = true;
        let CODE
        while (CODEGEN) {
            CODE = Math.floor( Math.random() * 888888888888 ) + 111111111111;
            if (!CODE_LIST.includes(CODE)) CODEGEN = false;
        }
        return CODE;
    } else if (type === "delete") {
        system.run(() => system.run(() => {
            const BanDB = new Database("Appeal");
            BanDB.delete(code);
        }))
    } else return;
} catch (e) {
    postError(e);
}}

export function msToTime(str) { try {
    if(str > new Date().getTime()) str = str - new Date().getTime();
    const ms = str;
    const w = Math.floor(ms / (1000 * 60 * 60 * 24 * 7));
    const d = Math.floor(ms / (1000 * 60 * 60 * 24));
    const h = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((ms % (1000 * 60)) / 1000);
    return { w: w, d: d, h: h, m: m, s: s };
} catch (e) {
    postError(e);
}}

export function snakeToCamel(str) { try {
    str = str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
    str = str.replace("minecraft", "");
    return str.charAt(0).toLowerCase() + str.slice(1);
} catch (e) {
    postError(e);
}}

export function restoreBlock(block, brokenBlockPermutation, player) { try {
    const droppedItems = block.dimension.getEntities({
        location: new Minecraft.Location(block.x, block.y, block.z),
        minDistance: 0,
        maxDistance: 2,
        type: "item"
    });
    for (const item of droppedItems) item.kill();
    if (brokenBlockPermutation) block.setPermutation(brokenBlockPermutation.clone());
    if (player) {
        player.restoreBlock = {
            block: block,
            brokenBlockPermutation: brokenBlockPermutation
        }
    }
} catch (e) {
    postError(e);
}}

export function tpsColor(tps, toFix) { try {
    let int = Number(tps);
    if (toFix) int = int.toFixed(toFix);
    let returnTps;
    if (int >= 20) returnTps = `§2${int}§r`
        else if (int > 17) returnTps = `§a${int}§r`
        else if (int > 12) returnTps = `§6${int}§r`
        else if (int > 5) returnTps = `§c${int}§r`
        else returnTps = `§4${int}§r`
    return returnTps;
} catch (e) {
    postError(e);
}}

export function lfColor(loadFactor, toFix) { try {
    if (loadFactor === "NaN") return `§4NaN§r`;
    let int = Number(loadFactor);
    if (toFix) int = int.toFixed(toFix);
    let returnLF;
    if (int === "NaN") returnLF = `§4NaN§r`
        else if (int <= 0) returnLF = `§20.0%%§r`
        else if (int < 15) returnLF = `§a${int}%%§r`
        else if (int < 40) returnLF = `§6${int}%%§r`
        else if (int < 75) returnLF = `§c${int}%%§r`
        else returnLF = `§4${int}%%§r`
    return returnLF;
} catch (e) {
    postError(e);
}}

export function postError(e) {
    console.error(e, e.stack);
    const err = {
        read: false,
        time: Date.now(),
        data: {
            message: e.message,
            name: e.name,
            file: e.fileName,
            line: e.lineNumber,
            column: e.columnNumber,
            stack: e.stack
        }
    }
    if (!e.stack) return;
    const ErrorDB = new Database("Error");
    ErrorDB.set(String(Date.now()), err);
}

export function unBanPlayer(player) {
    player.removeTag("isBanned");
    player.getTags().forEach(t => {
        if (t.startsWith("by:")) player.removeTag(t);
        if (t.startsWith("reason:")) player.removeTag(t);
        if (t.startsWith("time:")) player.removeTag(t);
        if (t.startsWith("code:")) player.removeTag(t);
    })
}