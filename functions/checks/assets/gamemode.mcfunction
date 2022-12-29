scoreboard players set @a gamemode 0
execute as @a[m=!s,scores={gamemode=0}] at @s run scoreboard players add @s gamemode 1
execute as @a[m=!c,scores={gamemode=1}] at @s run scoreboard players add @s gamemode 1
execute as @a[m=!a,scores={gamemode=2}] at @s run scoreboard players add @s gamemode 1
ability @a[m=c] mayfly true
ability @a[tag=vanish] mayfly true
ability @a[tag=flying] mayfly true
ability @a[tag=!vanish,tag=!flying,m=!c] mayfly false