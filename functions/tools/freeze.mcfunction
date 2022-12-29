tag @s[tag=frozen] add nofreeze
tag @s[tag=nofreeze] remove frozen
effect @s[tag=nofreeze] clear
tellraw @s[tag=nofreeze] {"rawtext":[{"text":"§r§4[§cUAG§4]§r You are no longer frozen!"}]}
execute at @s[tag=nofreeze] run tellraw @a[tag=notify] {"rawtext":[{"text":"§r§4[§cUAG§4]§r "},{"selector":"@s"},{"text":" is no longer frozen."}]}
effect @s[type=player,tag=!nofreeze] slowness 9999 250 true
effect @s[type=player,tag=!nofreeze] weakness 9999 250 true
effect @s[type=player,tag=!nofreeze] mining_fatigue 9999 250 true
effect @s[type=player,tag=!nofreeze] blindness 9999 250 true
tag @s[tag=!nofreeze] add frozen
execute at @s[tag=frozen,tag=!nofreeze] run tellraw @a[tag=notify] {"rawtext":[{"text":"§r§4[§cUAG§4]§r "},{"selector":"@s"},{"text":" has been frozen"}]}
tag @s[tag=nofreeze] remove nofreeze