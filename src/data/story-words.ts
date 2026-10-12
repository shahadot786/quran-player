// Word lists for sync keys that read like a short story; together with a number from 2 to 99 they give about 64.6 bits.
// Removing or respelling a word would turn keys that use it invalid, so words are only ever added.

export const ADJECTIVES = `
able active agile airy alert amazed ample ancient angelic aware bashful beloved best big blessed blissful bold bouncy brave breezy bright brisk broad
bubbly busy calm candid careful caring cheerful cheery chubby civil classic clean clear clever close cloudy clumsy cozy crisp cuddly curious cute
dainty daring dear decent deep devoted dizzy dreamy eager early earnest easy elated elegant endless epic even exact excited expert fair faithful
famous fancy fast fearless festive fine firm fit fluffy fond free fresh friendly frosty full funny fuzzy gentle giant gifted giddy glad gleeful
glowing good graceful grand grateful great happy hardy hasty healthy hearty helpful heroic hidden honest hopeful huge humble hungry icy ideal jolly
joyful jumpy keen kind large lazy light likely little lively lofty long loud lovely loyal lucky magic major merry mighty mild misty modern modest neat
new nice nimble noble patient peaceful perfect playful plucky polite poised precious pretty proud quick quiet radiant rapid rare ready regal relaxed
rich robust rosy royal rugged rustic safe salty sandy sharp shiny short shy silent silky simple sincere sleepy slow small smart smiling smooth snowy
snug soft solid sparkly speedy spicy splendid sporty spotted steady stormy strong sturdy sunny super sweet swift tall tame tender thankful tidy tiny
tough tranquil trusty upbeat useful valiant vast velvet vivid warm wavy wild windy wise witty wonderful young zany zesty dapper dashing dazzling
jovial lanky mellow nifty peppy perky sassy snappy spry stately stoic sublime timid trendy vibrant wiry youthful zealous brainy chirpy comfy crafty
fiery gallant handy jaunty lush quirky
`.split(/\s+/).filter(Boolean);

export const COLOURS = `
amber azure beige black blue bronze brown copper coral cream crimson cyan ebony emerald gold golden green hazel indigo ivory jade khaki lemon lilac
lime magenta maroon mint navy ochre olive orange peach pearl pink plum purple red ruby rust saffron sage salmon sapphire scarlet silver sky slate tan
teal topaz turquoise violet white yellow cobalt chestnut cherry honey mustard pewter platinum marble velvet
`.split(/\s+/).filter(Boolean);

export const ANIMALS = `
ants badgers bats bears beavers bees beetles bison buffaloes bunnies camels canaries cats cheetahs chickens chipmunks cobras cougars cows coyotes
crabs cranes crickets crows deer dogs dolphins donkeys doves ducks eagles elephants elk emus falcons ferrets finches fireflies flamingos foxes frogs
gazelles geckos geese gerbils giraffes goats gorillas hamsters hares hawks hedgehogs herons hippos horses hyenas iguanas impalas jackals jaguars jays
kangaroos kittens koalas ladybugs lambs lemurs leopards lions lizards llamas lobsters lynxes macaws magpies mice moles monkeys moose moths mules
octopuses orcas ostriches otters owls oxen pandas panthers parrots peacocks pelicans penguins pigeons pigs ponies puffins pumas quails rabbits
raccoons ravens reindeer rhinos robins salmon seals sharks sheep sloths snails sparrows squids squirrels starlings storks swans tigers toads toucans
trout turkeys turtles walruses wolves wombats yaks zebras
`.split(/\s+/).filter(Boolean);

export const ADVERBS = `
boldly briskly busily calmly carefully cheerfully closely eagerly easily evenly fairly firmly freely gaily gently gladly gracefully happily hastily
humbly jointly joyfully kindly lazily lightly loudly lovingly merrily mildly neatly nicely nimbly noisily openly patiently playfully politely promptly
proudly quickly quietly rapidly rarely readily safely shyly silently slowly smoothly softly speedily steadily sweetly swiftly tenderly thankfully
tidily wildly wisely warmly bravely brightly dreamily sleepily
`.split(/\s+/).filter(Boolean);

export const VERBS = `
amble bake bathe beam bloom bounce bow camp canter cheer chirp chuckle clap climb crawl cruise dance dash dawdle dine dive doze drift drum dwell
explore fish flit float flock flutter fly frolic gallop gather gaze giggle glide glow graze grin hide hike hop hum hurry huddle jog juggle jump kneel
knit laugh linger lounge march meet mingle munch nap nest nibble paddle parade pause picnic play ponder pose prance pray race read relax rest roam
roll row run sail scamper settle shine sing sip sit skate ski skip sleep slide smile snooze sparkle splash sprint stand stay stomp stretch stroll
study surf swim swing swirl talk tiptoe toast travel trot twirl wade wait walk wander wave whistle wiggle wink work yawn yodel zigzag zoom chat clink
sway
`.split(/\s+/).filter(Boolean);

export const PREPOSITIONS = `
above across along around behind below beneath beside beyond inside near outside over past toward under
`.split(/\s+/).filter(Boolean);

export const PLACES = `
abbey airport alley arcade arch attic avenue bakery balcony bank barn bay beach bench boulder bridge brook bush cabin cafe camp canal canyon castle
cave cellar chapel cliff clock cloud coast college corner cottage court crater creek dam desert dock dome dune farm fence ferry field forest fort
fountain garage garden gate glacier glen gorge grove hall hedge hill hotel hut island jetty jungle kiosk kitchen lagoon lake lane lawn library
lighthouse lodge market marsh meadow mill minaret moon mosque motel mountain museum oasis ocean orchard palace park pass pasture path pavilion peak
pier pine plaza plain pond pool port porch quay railway ranch reef ridge river road rock roof ruins school sea shed shore shrine slope spring square
stable stadium station steeple stream street summit swamp temple tent terrace tower town track trail tree tunnel valley village vineyard volcano wall
well wharf windmill woods yard zoo anthill atrium bamboo banyan barge basin bazaar bluff boathouse bower campfire canopy carousel cascade causeway
chimney cloister colonnade courtyard cove crossroads cupola delta dockyard driveway embassy estuary fairground fjord foothill footpath gallery gazebo
geyser granary greenhouse grotto hammock hamlet hangar haven headland heath hilltop homestead inlet isthmus knoll ledge levee lookout mansion marina
mesa monument moor mound nursery observatory orangery outpost paddock pagoda pergola planetarium playground prairie promenade quarry rainforest
rampart riverbank rooftop rotunda sanctuary savanna seashore shipyard skyline sundial terminal thicket treehouse tundra turret upland vale viaduct
waterfall wetland wildwood workshop archway bandstand beehive bookshop boulevard burrow clearing cornfield hillside lakeside riverside seaside sandbar
snowfield sunroom opera seawall
`.split(/\s+/).filter(Boolean);

export const TIMES = `
dawn dusk noon midnight sunrise sunset night daybreak twilight moonrise fajr dhuhr asr maghrib isha bedtime
`.split(/\s+/).filter(Boolean);
