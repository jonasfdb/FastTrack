const lt_tracks = new Map([
    [1,  { name: "Mario Kart Stadium",          cup: "Mushroom Cup" }],
    [2,  { name: "Water Park",                  cup: "Mushroom Cup" }],
    [3,  { name: "Sweet Sweet Canyon",          cup: "Mushroom Cup" }],
    [4,  { name: "Thwomp Ruins",                cup: "Mushroom Cup" }],
    
    // Flower Cup
    [5,  { name: "Mario Circuit",               cup: "Flower Cup" }],
    [6,  { name: "Toad Harbor",                 cup: "Flower Cup" }],
    [7,  { name: "Twisted Mansion",             cup: "Flower Cup" }],
    [8,  { name: "Shy Guy Falls",               cup: "Flower Cup" }],
    
    // Star Cup
    [9,  { name: "Sunshine Airport",            cup: "Star Cup" }],
    [10, { name: "Dolphin Shoals",              cup: "Star Cup" }],
    [11, { name: "Electrodrome",                cup: "Star Cup" }],
    [12, { name: "Mount Wario",                 cup: "Star Cup" }],
    
    // Special Cup
    [13, { name: "Cloudtop Cruise",             cup: "Special Cup" }],
    [14, { name: "Bone-Dry Dunes",              cup: "Special Cup" }],
    [15, { name: "Bowser's Castle",             cup: "Special Cup" }],
    [16, { name: "Rainbow Road",                cup: "Special Cup" }],
    
    // Shell Cup
    [17, { name: "[Wii] Moo Moo Meadows",       cup: "Shell Cup" }],
    [18, { name: "[GBA] Mario Circuit",         cup: "Shell Cup" }],
    [19, { name: "[DS] Cheep Cheep Beach",      cup: "Shell Cup" }],
    [20, { name: "[N64] Toad's Turnpike",       cup: "Shell Cup" }],
    
    // Banana Cup
    [21, { name: "[GCN] Dry Dry Desert",        cup: "Banana Cup" }],
    [22, { name: "[SNES] Donut Plains 3",       cup: "Banana Cup" }],
    [23, { name: "[N64] Royal Raceway",         cup: "Banana Cup" }],
    [24, { name: "[3DS] DK Jungle",             cup: "Banana Cup" }],
    
    // Leaf Cup
    [25, { name: "[DS] Wario Stadium",          cup: "Leaf Cup" }],
    [26, { name: "[GCN] Sherbet Land",          cup: "Leaf Cup" }],
    [27, { name: "[3DS] Mario Circuit",         cup: "Leaf Cup" }],
    [28, { name: "[N64] Yoshi Valley",          cup: "Leaf Cup" }],
    
    // Lightning Cup
    [29, { name: "[DS] Tick-Tock Clock",        cup: "Lightning Cup" }],
    [30, { name: "[3DS] Piranha Plant Slide",   cup: "Lightning Cup" }],
    [31, { name: "[Wii] Grumble Volcano",       cup: "Lightning Cup" }],
    [32, { name: "[N64] Rainbow Road",          cup: "Lightning Cup" }],
    
    // Egg Cup
    [33, { name: "[GCN] Yoshi Circuit",         cup: "Egg Cup" }],
    [34, { name: "Excitebike Arena",            cup: "Egg Cup" }],
    [35, { name: "Dragon Driftway",             cup: "Egg Cup" }],
    [36, { name: "Mute City",                   cup: "Egg Cup" }],
    
    // Triforce Cup
    [37, { name: "[Wii] Wario's Gold Mine",     cup: "Triforce Cup" }],
    [38, { name: "[SNES] Rainbow Road",         cup: "Triforce Cup" }],
    [39, { name: "Ice Ice Outpost",             cup: "Triforce Cup" }],
    [40, { name: "Hyrule Circuit",              cup: "Triforce Cup" }],
    
    // Crossing Cup
    [41, { name: "[GCN] Baby Park",             cup: "Crossing Cup" }],
    [42, { name: "[GBA] Cheese Land",           cup: "Crossing Cup" }],
    [43, { name: "Wild Woods",                  cup: "Crossing Cup" }],
    [44, { name: "Animal Crossing",             cup: "Crossing Cup" }],
    
    // Bell Cup
    [45, { name: "[3DS] Neo Bowser City",       cup: "Bell Cup" }],
    [46, { name: "[GBA] Ribbon Road",           cup: "Bell Cup" }],
    [47, { name: "Super Bell Subway",           cup: "Bell Cup" }],
    [48, { name: "Big Blue",                    cup: "Bell Cup" }],
    
    // Golden Dash Cup
    [49, { name: "[Tour] Paris Promenade",      cup: "Golden Dash Cup" }],
    [50, { name: "[3DS] Toad Circuit",          cup: "Golden Dash Cup" }],
    [51, { name: "[N64] Choco Mountain",        cup: "Golden Dash Cup" }],
    [52, { name: "[Wii] Coconut Mall",          cup: "Golden Dash Cup" }],
    
    // Lucky Cat Cup
    [53, { name: "[Tour] Tokyo Blur",           cup: "Lucky Cat Cup" }],
    [54, { name: "[DS] Shroom Ridge",           cup: "Lucky Cat Cup" }],
    [55, { name: "[GBA] Sky Garden",            cup: "Lucky Cat Cup" }],
    [56, { name: "[Tour] Ninja Hideaway",       cup: "Lucky Cat Cup" }],
    
    // Turnip Cup
    [57, { name: "[Tour] New York Minute",      cup: "Turnip Cup" }],
    [58, { name: "[SNES] Mario Circuit 3",      cup: "Turnip Cup" }],
    [59, { name: "[N64] Kalimari Desert",       cup: "Turnip Cup" }],
    [60, { name: "[DS] Waluigi Pinball",        cup: "Turnip Cup" }],
    
    // Propeller Cup
    [61, { name: "[Tour] Sydney Sprint",        cup: "Propeller Cup" }],
    [62, { name: "[GBA] Snow Land",             cup: "Propeller Cup" }],
    [63, { name: "[Wii] Mushroom Gorge",        cup: "Propeller Cup" }],
    [64, { name: "Sky-High Sundae",             cup: "Propeller Cup" }],
    
    // Rock Cup
    [65, { name: "[Tour] London Loop",          cup: "Rock Cup" }],
    [66, { name: "[GBA] Boo Lake",              cup: "Rock Cup" }],
    [67, { name: "[3DS] Rock Rock Mountain",    cup: "Rock Cup" }],
    [68, { name: "[Wii] Maple Treeway",         cup: "Rock Cup" }],
    
    // Moon Cup
    [69, { name: "[Tour] Berlin Byways",        cup: "Moon Cup" }],
    [70, { name: "[DS] Peach Gardens",          cup: "Moon Cup" }],
    [71, { name: "[Tour] Merry Mountain",       cup: "Moon Cup" }],
    [72, { name: "[3DS] Rainbow Road",          cup: "Moon Cup" }],
    
    // Fruit Cup
    [73, { name: "[Tour] Amsterdam Drift",      cup: "Fruit Cup" }],
    [74, { name: "[GBA] Riverside Park",        cup: "Fruit Cup" }],
    [75, { name: "[Wii] DK Summit",             cup: "Fruit Cup" }],
    [76, { name: "Yoshi's Island",              cup: "Fruit Cup" }],
    
    // Boomerang Cup
    [77, { name: "[Tour] Bangkok Rush",         cup: "Boomerang Cup" }],
    [78, { name: "[DS] Mario Circuit",          cup: "Boomerang Cup" }],
    [79, { name: "[GCN] Waluigi Stadium",       cup: "Boomerang Cup" }],
    [80, { name: "[Tour] Singapore Speedway",   cup: "Boomerang Cup" }],
    
    // Feather Cup
    [81, { name: "[Tour] Athens Dash",          cup: "Feather Cup" }],
    [82, { name: "[GCN] Daisy Cruiser",         cup: "Feather Cup" }],
    [83, { name: "[Wii] Moonview Highway",      cup: "Feather Cup" }],
    [84, { name: "Squeaky Clean Sprint",        cup: "Feather Cup" }],
    
    // Cherry Cup
    [85, { name: "[Tour] Los Angeles Laps",     cup: "Cherry Cup" }],
    [86, { name: "[GBA] Sunset Wilds",          cup: "Cherry Cup" }],
    [87, { name: "[Wii] Koopa Cape",            cup: "Cherry Cup" }],
    [88, { name: "[Tour] Vancouver Velocity",   cup: "Cherry Cup" }],
    
    // Acorn Cup
    [89, { name: "[Tour] Rome Avanti",          cup: "Acorn Cup" }],
    [90, { name: "[GCN] DK Mountain",           cup: "Acorn Cup" }],
    [91, { name: "[Wii] Daisy Circuit",         cup: "Acorn Cup" }],
    [92, { name: "[Tour] Piranha Plant Cove",   cup: "Acorn Cup" }],
    
    // Spiny Cup
    [93, { name: "[Tour] Madrid Drive",         cup: "Spiny Cup" }],
    [94, { name: "[3DS] Rosalina's Ice World",  cup: "Spiny Cup" }],
    [95, { name: "[SNES] Bowser Castle 3",      cup: "Spiny Cup" }],
    [96, { name: "[Wii] Rainbow Road",          cup: "Spiny Cup" }],  
]);

// The below lookup table returns an array of track IDs of the track in that cup.
const lt_cups = new Map([
    [1,  { name: "Mushroom Cup",     track_ids: [1, 2, 3, 4],       emoji: '<:1_mk8_mushroom_cup:1347595435384246386>' }],
    [2,  { name: "Flower Cup",       track_ids: [5, 6, 7, 8],       emoji: '<:2_mk8_flower_cup:1347595506188288104>' }],
    [3,  { name: "Star Cup",         track_ids: [9, 10, 11, 12],    emoji: '<:3_mk8_star_cup:1347595541424377918>' }],
    [4,  { name: "Special Cup",      track_ids: [13, 14, 15, 16],   emoji: '<:4_mk8_special_cup:1347595600346222742>' }],
  
    [5,  { name: "Shell Cup",        track_ids: [17, 18, 19, 20],   emoji: '<:5_mk8_shell_cup:1347595638434430986>' }],
    [6,  { name: "Banana Cup",       track_ids: [21, 22, 23, 24],   emoji: '<:6_mk8_banana_cup:1347595671020113971>' }],
    [7,  { name: "Leaf Cup",         track_ids: [25, 26, 27, 28],   emoji: '<:7_mk8_leaf_cup:1347595702640840765>' }],
    [8,  { name: "Lightning Cup",    track_ids: [29, 30, 31, 32],   emoji: '<:8_mk8_lightning_cup:1347595734958084106>' }],
  
    [9,  { name: "Egg Cup",          track_ids: [33, 34, 35, 36],   emoji: '<:9_mk8_egg_cup:1347595792956919849>' }],
    [10, { name: "Triforce Cup",     track_ids: [37, 38, 39, 40],   emoji: '<:10_mk8_triforce_cup:1347595831372415036>' }],
    [11, { name: "Crossing Cup",     track_ids: [41, 42, 43, 44],   emoji: '<:11_mk8_crossing_cup:1347595866328006656>' }],
    [12, { name: "Bell Cup",         track_ids: [45, 46, 47, 48],   emoji: '<:12_mk8_bell_cup:1347595905771110541>' }],
  
    [13, { name: "Golden Dash Cup",  track_ids: [49, 50, 51, 52],   emoji: '<:13_mk8_golden_dash_cup:1347595958493380730>' }],
    [14, { name: "Lucky Cat Cup",    track_ids: [53, 54, 55, 56],   emoji: '<:14_mk8_lucky_cat_cup:1347595994136838184>' }],
    [15, { name: "Turnip Cup",       track_ids: [57, 58, 59, 60],   emoji: '<:15_mk8_turnip_cup:1347596034435448945>' }],
    [16, { name: "Propeller Cup",    track_ids: [61, 62, 63, 64],   emoji: '<:16_mk8_propeller_cup:1347596070766645469>' }],
  
    [17, { name: "Rock Cup",         track_ids: [65, 66, 67, 68],   emoji: '<:17_mk8_rock_cup:1347596141998641233>' }],
    [18, { name: "Moon Cup",         track_ids: [69, 70, 71, 72],   emoji: '<:18_mk8_moon_cup:1347596174231863367>' }],
    [19, { name: "Fruit Cup",        track_ids: [73, 74, 75, 76],   emoji: '<:19_mk8_fruit_cup:1347596213402206299>' }],
    [20, { name: "Boomerang Cup",    track_ids: [77, 78, 79, 80],   emoji: '<:20_mk8_boomerang_cup:1347596256230506657>' }],
  
    [21, { name: "Feather Cup",      track_ids: [81, 82, 83, 84],   emoji: '<:21_mk8_feather_cup:1347596407338565652>' }],
    [22, { name: "Cherry Cup",       track_ids: [85, 86, 87, 88],   emoji: '<:22_mk8_cherry_cup:1347596445053616138>' }],
    [23, { name: "Acorn Cup",        track_ids: [89, 90, 91, 92],   emoji: '<:23_mk8_acorn_cup:1347596485759336448>' }],
    [24, { name: "Spiny Cup",        track_ids: [93, 94, 95, 96],   emoji: '<:24_mk8_spiny_cup:1347596519565693054>' }],
  ]);

const lt_categories = new Map([
  [1500, { name: '150cc',           emoji: '<:mk8_150cc:1347686753733050388>'}],
  [1501, { name: '150cc Itemless',  emoji: '<:mk8_150cc_itemless:1347687481277153341>'}],
  [2000, { name: '200cc',           emoji: '<:mk8_200cc:1347687516840661083>'}],
  [2001, { name: '200cc Itemless',  emoji: '<:mk8_200cc_itemless:1347687543142879367>'}]
])

export { lt_tracks, lt_cups, lt_categories };