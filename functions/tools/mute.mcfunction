tag @s[tag=isMuted] add noMuted
tag @s[tag=noMuted] remove isMuted
ability @s[tag=noMuted] mayfly false
tellraw @s[tag=noMuted] {"rawtext":[{"text":"§4[§cUAG§4]§r You are unmuted!"}]}
execute at @s[tag=noMuted] run tellraw @a[tag=notify] {"rawtext":[{"text":"§r§4[§cUAG§4]§r "},{"selector":"@s"},{"text":" is no longer muted."}]}
ability @s[tag=!noMuted] mayfly true
tag @s[tag=!noMuted] add isMuted
tellraw @s[tag=isMuted,tag=!noMuted] {"rawtext":[{"text":"§4[§cUAG§4]§r You are muted!"}]}
execute at @s[tag=isMuted,tag=!noMuted] run tellraw @a[tag=notify] {"rawtext":[{"text":"§r§4[§cUAG§4]§r "},{"selector":"@s"},{"text":" was muted."}]}
tag @s[tag=noMuted] remove noMuted