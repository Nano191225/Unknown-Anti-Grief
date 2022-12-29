import * as Minecraft from "@minecraft/server";
// import * as Minecraft from "mojang-minecraft";
import config from "../data/config";
import { parseTime, postError } from "../util";

const world = Minecraft.world;

const RegisteredCommand = [];
export class Command {
    constructor(data) {

        this.commandData = {
            name: data.name,
            description: data.description,
            permission: config.commands[data.name].permission,
            aliases: config.commands[data.name].aliases,
            how: data.how,
            callback: null,
            options: {
                player: {
                    enabled: false,
                    canUseSelf: false,
                    canUseHighLevelPlayer: false,
                    useName: false,
                    bypassText: false
                },
                reason: false,
                time: false,
                silent: false,
                set: false,
                add: false,
                remove: false,
                true: false,
                false: false,
                OTHER: {
                    enabled: false,
                    options: []
                }
            }
        }
    }

    executes(callback) { try {
        this.commandData.callback = callback;
    } catch (e) {
        postError(e);
    }}

    playerOption(data) { try {
        this.commandData.options.player.enabled = true;
        if (data?.self) this.commandData.options.player.canUseSelf = data.self;
        if (data?.high) this.commandData.options.player.canUseHighLevelPlayer = data.high;
        if (data?.name) this.commandData.options.player.useName = data.name;
        if (data?.bypass) this.commandData.options.player.bypassText = data.bypass;
    } catch (e) {
        postError(e);
    }}
    
    reasonOption() { try {
        this.commandData.options.reason = true;
    } catch (e) {
        postError(e);
    }}

    timeOption() { try {
        this.commandData.options.time = true;
    } catch (e) {
        postError(e);
    }}

    silentOption() { try {
        this.commandData.options.silent = true;
    } catch (e) {
        postError(e);
    }}

    setOption() { try {
        this.commandData.options.set = true;
    } catch (e) {
        postError(e);
    }}

    addOption() { try {
        this.commandData.options.add = true;
    } catch (e) {
        postError(e);
    }}

    removeOption() { try {
        this.commandData.options.remove = true;
    } catch (e) {
        postError(e);
    }}

    trueOption() { try {
        this.commandData.options.true = true;
    } catch (e) {
        postError(e);
    }}

    falseOption() { try {
        this.commandData.options.false = true;
    } catch (e) {
        postError(e);
    }}

    /**
     * @name otherOptions
     * @param {String} name
     * @param {String} parameter
     * @param {Boolean} getstring
     * @param {Boolean} enabled 
     * @returns 
     */
    otherOption(data) { try {
        if (!data) return;
        this.commandData.options.OTHER.enabled = true;
        for (const v of data) {
            const Data = {
                name: v.name,
                parameter: v.parameter,
                getstring: v.getstring,
                enabled: v.enabled
            }
            this.commandData.options.OTHER.options.push(Data);
        }
    } catch (e) {
        postError(e);
    }}

    register() { try {
        if (!config.commands[this.commandData.name].enabled) return;
        RegisteredCommand.push(this.commandData);
        if (config.debug) console.warn(`${this.commandData.name} command is registered.`);
    } catch (e) {
        postError(e);
    }}
}

world.events.beforeChat.subscribe(chat => { try {
    if (config.disableAllModule) return;
    const { sender: player, message: msg } = chat;
    if (!msg.startsWith(config.commands.prefix)) return;
    
    chat.cancel = true;
    let args = chat.message.slice(config.commands.prefix.length).split(/ +/);
    const commandName = args.shift().toLowerCase();
    if (config.debug) console.warn(`${new Date()} | ${player.name} used the command: ${config.commands.prefix}${commandName} ${args.join(" ")}`);
    if (commandName === "help" || config.commands.help.aliases?.includes(commandName)) {
        let helpPage;
        helpPage = Number(args[0]);
        let canUseCommand = [];
        for (const v of RegisteredCommand) if (player.permission >= v.permission) canUseCommand.push(v);
        if (helpPage || args[0] === undefined) {
            if (helpPage > Math.ceil(canUseCommand.length / 5)) helpPage = Math.ceil(canUseCommand.length / 5);
            if (args[0] === undefined || helpPage < 1) helpPage = 1;
            player.tell(`§c--- Showing help page ${helpPage} of ${Math.ceil(canUseCommand.length / 5)} (${config.commands.prefix}help <page>) ---`);
            const minPage = helpPage * 5 - 5;
            let maxPage = helpPage * 5;
            if (canUseCommand.length <= helpPage * 5) maxPage = canUseCommand.length;
            for (let i = minPage; i < maxPage; i++) player.tell(` ${config.commands.prefix}${canUseCommand[i].name} - ${canUseCommand[i].description}`);
        } else if (args[0] === "all") {
            let helpPage;
            helpPage = Number(args[1]);
            if (helpPage || args[1] === undefined) {
                if (helpPage > Math.ceil(RegisteredCommand.length / 5)) helpPage = Math.ceil(RegisteredCommand.length / 5);
                if (args[1] === undefined || helpPage < 1) helpPage = 1;
                player.tell(`§c--- Showing help page ${helpPage} of ${Math.ceil(RegisteredCommand.length / 5)} (${config.commands.prefix}help <page>) ---`);
                const minPage = helpPage * 5 - 5;
                let maxPage = helpPage * 5;
                if (RegisteredCommand.length <= helpPage * 5) maxPage = RegisteredCommand.length;
                for (let i = minPage; i < maxPage; i++) player.tell(` ${config.commands.prefix}${RegisteredCommand[i].name} - ${RegisteredCommand[i].description}`);
            }
            
        } else if (args[0]) {
            const command = RegisteredCommand.find(c => c.name === args[0].toLowerCase() || c.aliases?.includes(args[0].toLowerCase()));
            if (!command) return player.tell(`§r§4[§cUAG§4]§r §cCannot display help because there is no command.`);
            player.tell(`§e${command.name} ${command.aliases ? `(${(JSON.stringify(command.aliases)).replace(/"/g, "").replace("[", "").replace("]", "")})` : ""}:`);
            player.tell(`§e${command.description}`);
            command.how.forEach(v => player.tell(`- ${config.commands.prefix}${v}`));
            
        }
        
        return;
    }
    
    const cmd = RegisteredCommand.find(c => c.name === commandName || c.aliases?.includes(commandName));
    if (args[0] && args[0].startsWith("?h")) {
        player.tell(`§e${cmd.name} ${cmd.aliases ? `(${(JSON.stringify(cmd.aliases)).replace(/"/g, "").replace("[", "").replace("]", "")})` : ""}:`);
        player.tell(`§e${cmd.description}`);
        cmd.how.forEach(v => player.tell(`- ${config.commands.prefix}${v}`));
        return;
    }
    if (!cmd) return player.tell(`§r§4[§cUAG§4]§r §cUnknown command. Use ${config.commands.prefix}help to get help.`);
    if(player.permission < cmd.permission) return player.tell(`§r§4[§cUAG§4]§r §cPermission level ${cmd.permission} is required to execute this command.`);
    const Args = chat.message.slice(config.commands.prefix.length + commandName.length + 1).split(" ?") || undefined;
    let PlayerOption = null, ReasonOption = null, TimeOption = null, SilentOption = false, SetOption = false, AddOption = false, RemoveOption = false, helpOption = false, TrueOption = false, FalseOption = false, OtherOptions = [];
    if (cmd.options.player.enabled) {
        if (!cmd.options.player.bypassText || !cmd.options.player.bypassText.includes(Args[0])) {
            if (!Args[0]) return player.tell(`§r§4[§cUAG§4]§r §cSpecify the player.`);
            if (cmd.options.player.useName) PlayerOption = Args[0].replace(/"|\\|@/g, "");
                else {
                    for (const pl of world.getPlayers()) if (pl.name.toLowerCase().includes(Args[0].toLowerCase().replace(/"|\\|@/g, ""))) PlayerOption = pl;
                    if (!PlayerOption) return player.tell(`§r§4[§cUAG§4]§r §cCould not find the specified player.`);
                    if (!cmd.options.player.canUseSelf && PlayerOption.name === player.name) return player.tell(`§r§4[§cUAG§4]§r §cYou cannot specify yourself.`);
                    if (!cmd.options.player.canUseHighLevelPlayer && PlayerOption.permission >= player.permission) return player.tell(`§r§4[§cUAG§4]§r §cPermission level ${PlayerOption.permission + 1} is required to execute this command on that player.`);
            }
        }
    }
    
    Args.forEach(v => {
        v = v.toLowerCase();
        if (v.startsWith("?")) v = v.replace("?", "");
        if (cmd.options.player.enabled && v === Args[0]) return;
        if (cmd.options.reason && v.startsWith("r ")) ReasonOption = v.slice(2);
        if (cmd.options.time && v.startsWith("t ")) TimeOption = parseTime(v.slice(2));
        if (cmd.options.silent && v.startsWith("s")) SilentOption = true;
        if (cmd.options.set && v.startsWith("set")) SetOption = true;
        if (cmd.options.add && v.startsWith("add")) AddOption = true;
        if (cmd.options.remove && v.startsWith("remove")) RemoveOption = true;
        if (cmd.options.true && (v.startsWith("true") || v.startsWith("on") || v.startsWith("enable"))) TrueOption = true;
        if (cmd.options.false && (v.startsWith("false") || v.startsWith("off") || v.startsWith("disable"))) FalseOption = true;
        if (cmd.options.OTHER.enabled) {
            for (const vv of cmd.options.OTHER.options) {
                if (v.startsWith(vv.parameter)) {
                    if (vv.getstring) OtherOptions.push({name: vv.name, value: v.slice(vv.parameter.length + 1)});
                        else OtherOptions.push({name: vv.name, value: true});
                }
            }
        }
        if (v.startsWith("h")) helpOption = true;

    });
    
    if (helpOption) {
        player.tell(`§e${cmd.name} ${cmd.aliases ? `(${(JSON.stringify(cmd.aliases)).replace(/"/g, "").replace("[", "").replace("]", "")})` : ""}:`);
        player.tell(`§e${cmd.description}`);
        cmd.how.forEach(v => player.tell(`- ${config.commands.prefix}${v}`));
    } else {
        const options = {
            player: PlayerOption,
            reason: ReasonOption,
            time: TimeOption,
            silent: SilentOption,
            set: SetOption,
            add: AddOption,
            remove: RemoveOption,
            true: TrueOption,
            false: FalseOption,
            other: OtherOptions
        };
        cmd.callback(player, Args, options);
    };
    
    
} catch (e) {
    postError(e);
}});