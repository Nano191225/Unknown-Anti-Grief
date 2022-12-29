tag @s[tag=uag:inspect] add uag:inspected
tag @s[tag=uag:inspected] remove uag:inspect
tellraw @s[tag=uag:inspected] {"rawtext":[{"text":"§r§4[§cUAG§4]§r inspector now disabled!"}]}
execute at @s[tag=uag:inspected] run tellraw @a[tag=notify] {"rawtext":[{"text":"§r§4[§cUAG§4]§r "},{"selector":"@s"},{"text":" is no longer inspector."}]}
tag @s[tag=!uag:inspected] add uag:inspect
tellraw @s[tag=uag:inspect,tag=!uag:inspected] {"rawtext":[{"text":"§r§4[§cUAG§4]§r inspector now enabled!"}]}
execute at @s[tag=uag:inspect,tag=!uag:inspected] run tellraw @a[tag=notify] {"rawtext":[{"text":"§r§4[§cUAG§4]§r "},{"selector":"@s"},{"text":" is now inspector."}]}
tag @s[tag=uag:inspected] remove uag:inspected