gamerule randomtickspeed 1
function checks/cbe
function checks/illegalitems
function checks/others
function checks/assets/gamemode

effect @s[tag=frozen] slowness 9999 250 true
effect @s[tag=frozen] weakness 9999 250 true
effect @s[tag=frozen] mining_fatigue 9999 250 true
effect @s[tag=frozen] blindness 9999 250 true
execute as @s [tag=frozen] at @s run tp @s @s

execute as @s[tag=!uag:joined] at @s run scoreboard players add users websocket 1
tag @s add uag:joined