tag @s[tag=spectatorvanish] add nospectatorvanish
tag @s[tag=nospectatorvanish] remove spectatorvanish
event entity @s[tag=nospectatorvanish] unvanish
effect @s[tag=nospectatorvanish] clear
tellraw @s[tag=nospectatorvanish] {"rawtext":[{"text":"§r§4[§cUAG§4]§r You are no longer in spectator vanish!"}]}
execute at @s[tag=nospectatorvanish] run tellraw @a[tag=notify] {"rawtext":[{"text":"§r§4[§cUAG§4]§r "},{"selector":"@s"},{"text":" is no longer spectator vanished."}]}
ability @s[tag=nospectatorvanish,m=!c] mayfly false
gamemode s @s[scores={gamemodeSV=0}]
gamemode c @s[scores={gamemodeSV=1}]
gamemode a @s[scores={gamemodeSV=2}]
tag @s[tag=!nospectatorvanish] add spectatorvanish
event entity @s[tag=spectatorvanish,tag=!nospectatorvanish] vanish
tellraw @s[tag=spectatorvanish,tag=!nospectatorvanish] {"rawtext":[{"text":"§r§4[§cUAG§4]§r You are now in spectator vanish!"}]}
execute at @s[tag=spectatorvanish,tag=!nospectatorvanish] run tellraw @a[tag=notify] {"rawtext":[{"text":"§r§4[§cUAG§4]§r "},{"selector":"@s"},{"text":" is now spectator vanished."}]}
scoreboard players operation @s gamemodeSV = @s gamemode
gamemode spectator @s[tag=spectatorvanish,tag=!nospectatorvanish]
tag @s[tag=nospectatorvanish] remove nospectatorvanish