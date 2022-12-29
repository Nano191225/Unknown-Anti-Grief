tag @s[tag=flying] add noflying
tag @s[tag=noflying] remove flying
ability @s[tag=noflying] mayfly false
tellraw @s[tag=noflying] {"rawtext":[{"text":"§4[§cUAG§4] §rDisabled Fly Mode."}]}
execute at @s[tag=noflying] run tellraw @a[tag=notify] {"rawtext":[{"text":"§r§4[§cUAG§4]§r "},{"selector":"@s"},{"text":" has left Fly Mode."}]}
ability @s[tag=!noflying] mayfly true
tag @s[tag=!noflying] add flying
tellraw @s[tag=flying,tag=!noflying] {"rawtext":[{"text":"§4[§cUAG§4] §rEnabled Fly Mode!"}]}
execute at @s[tag=flying,tag=!noflying] run tellraw @a[tag=notify] {"rawtext":[{"text":"§r§4[§cUAG§4]§r "},{"selector":"@s"},{"text":" has entered Fly Mode."}]}
tag @s[tag=noflying] remove noflying