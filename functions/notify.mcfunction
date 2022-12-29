tag @s[tag=notify] add nonotify
tag @s[tag=nonotify] remove notify
tellraw @a[tag=nonotify] {"rawtext":[{"text":"§r§4[§cUAG§4]§r "},{"selector":"@s"},{"text":" §rhas disabled anti-grief notifications."}]}
tag @s[tag=!nonotify] add notify
tellraw @a[tag=notify,tag=!nonotify] {"rawtext":[{"text":"§r§4[§cUAG§4]§r "},{"selector":"@s"},{"text":" §rhas enabled anti-grief notifications."}]}
tag @s[tag=nonotify] remove nonotify