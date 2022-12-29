tag @s[tag=vanish] add novanish
tag @s[tag=novanish] remove vanish
event entity @s[tag=novanish] unvanish
effect @s[tag=novanish] clear
tellraw @s[tag=novanish] {"rawtext":[{"text":"§r§4[§cUAG§4]§r You are no longer in vanish!"}]}
execute at @s[tag=novanish] run tellraw @a[tag=notify] {"rawtext":[{"text":"§r§4[§cUAG§4]§r "},{"selector":"@s"},{"text":" is no longer vanished."}]}
ability @s[tag=novanish,m=!c] mayfly false
tag @s[tag=!novanish] add vanish
event entity @s[tag=vanish,tag=!novanish] vanish
tellraw @s[tag=vanish,tag=!novanish] {"rawtext":[{"text":"§r§4[§cUAG§4]§r You are now in vanish!"}]}
execute at @s[tag=vanish,tag=!novanish] run tellraw @a[tag=notify] {"rawtext":[{"text":"§r§4[§cUAG§4]§r "},{"selector":"@s"},{"text":" is now vanished."}]}
ability @s[tag=vanish,tag=!novanish] mayfly true
tag @s[tag=novanish] remove novanish