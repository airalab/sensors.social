/**
 * Two-word names for addresses, shown instead of the address itself.
 * Sensors are plants ("Sleepy Clematis"), owners are animals ("Woolly Pony").
 *
 * name = adjective + noun, picked by blake2b-256(32-byte public key + SALT):
 * bytes 0..7 pick the adjective, bytes 8..15 the noun. SS58 addresses are decoded to the public key,
 * so one key gives one name whatever prefix it is written with; DIY sensors' 64-hex ids are that key.
 *
 * FROZEN: the word lists, their order and SALT define every name on the map and in the Android app.
 * Changing any of them renames sensors. A new scheme needs a new SALT and a migration plan.
 * The Android app keeps a copy (tools/sync-names.mjs there); the prototype and the reasoning
 * are in the agent repo, scripts/address_names.py.
 *
 * A name is a label, not an identity: duplicates are allowed (~1 pair per 1000 sensors), and an
 * address with a chosen name can be ground out. Where ownership is confirmed, show the address too.
 */
import { blake2AsU8a, decodeAddress } from "@polkadot/util-crypto";

const SALT = new TextEncoder().encode("sensors.social/names/v1.1");

// prettier-ignore
const ADJECTIVES = [
  "able", "acoustic", "adept", "adroit", "affable", "agile", "alert", "alpine", "amber",
  "amethyst", "amiable", "ample", "amused", "ancient", "angular", "animated", "antique", "arctic",
  "ardent", "artful", "assured", "astral", "astute", "atomic", "attentive", "auburn", "audacious",
  "autumn", "avid", "azure", "baroque", "bashful", "beaded", "beaming", "beige", "benign",
  "binary", "black", "blissful", "blithe", "blue", "blush", "bold", "bonny", "bookish", "boreal",
  "bouncy", "boundless", "braided", "brassy", "brave", "bright", "brisk", "bristly", "brocade",
  "bronze", "bronzed", "brown", "brushed", "bubbly", "buoyant", "burgundy", "bustling", "busy",
  "butter", "buttoned", "calm", "canary", "candid", "canny", "caramel", "carefree", "careful",
  "caring", "carmine", "carved", "celadon", "cerise", "cerulean", "chalky", "charcoal", "charming",
  "chartreuse", "chatty", "checkered", "cheeky", "cheerful", "chipper", "chirpy", "chiseled",
  "chivalrous", "chrome", "chubby", "chummy", "citrine", "civil", "claret", "classic", "classy",
  "clever", "clockwork", "coastal", "cobalt", "composed", "confident", "content", "copper",
  "coral", "corded", "cordial", "cosmic", "cosy", "courteous", "courtly", "crafted", "crafty",
  "cream", "crimson", "crisp", "crocheted", "crystal", "cubic", "cuddly", "curious", "curly",
  "curved", "cyan", "dainty", "dandy", "dapper", "dappled", "daring", "dashing", "dazzling",
  "decent", "decisive", "deft", "denim", "dependable", "desert", "devoted", "dexterous", "digital",
  "diligent", "discreet", "distant", "dizzy", "dotted", "dotty", "dreamy", "driven", "dynamic",
  "eager", "earnest", "easy", "easygoing", "ebony", "ebullient", "efficient", "elated", "electric",
  "elegant", "eloquent", "embossed", "emerald", "eminent", "enamel", "enchanted", "endearing",
  "energetic", "engaging", "enthusiastic", "epic", "etched", "exact", "excellent", "expert",
  "exuberant", "fabled", "fabulous", "fair", "faithful", "famous", "fancy", "fantastic", "fast",
  "fearless", "feathered", "feisty", "felted", "festive", "fierce", "fiery", "filigree", "fine",
  "flannel", "flashy", "flaxen", "fleecy", "fleet", "flexible", "flint", "floral", "fluent",
  "fluffy", "focused", "folded", "fond", "forest", "forged", "formal", "fortunate", "frank",
  "free", "friendly", "frilly", "fringed", "frisky", "frosted", "frugal", "fuchsia", "funny",
  "fuzzy", "galactic", "gallant", "garnet", "genial", "gentle", "genuine", "giant", "giddy",
  "gifted", "gilded", "gingham", "glad", "glamorous", "glassy", "glazed", "gleaming", "gleeful",
  "glittery", "glossy", "glowing", "golden", "good", "gossamer", "gothic", "graceful", "gracious",
  "grand", "granite", "graphite", "grateful", "green", "grey", "gutsy", "hammered", "handmade",
  "handsome", "handy", "happy", "hardy", "harmonious", "heartfelt", "hearty", "helpful", "heroic",
  "hexagonal", "hidden", "highland", "hilarious", "hollow", "homespun", "honest", "honey",
  "honorable", "hopeful", "hospitable", "humble", "humorous", "hungry", "idyllic", "imaginative",
  "immense", "impish", "indigo", "inked", "inky", "inspired", "intrepid", "inventive", "iron",
  "ironclad", "ivory", "jade", "jagged", "jazzy", "jet", "jeweled", "jocular", "jolly", "jovial",
  "joyful", "jubilant", "jumpy", "jungle", "just", "keen", "khaki", "kind", "kindly", "kinetic",
  "kingly", "knitted", "knowing", "laced", "lacquered", "lacy", "lanky", "lapis", "lavender",
  "lavish", "leather", "legendary", "lemon", "likable", "lilac", "limber", "lime", "linen",
  "lithe", "lively", "logical", "lovable", "lovely", "loving", "loyal", "lucent", "lucid", "lucky",
  "luminous", "lunar", "lush", "lyrical", "magenta", "magical", "majestic", "marble", "marbled",
  "maroon", "marvelous", "masterful", "matte", "mature", "mauve", "meadow", "measured",
  "mechanical", "meek", "mellow", "melodic", "merciful", "merry", "metal", "metallic",
  "methodical", "mighty", "mild", "milky", "mindful", "mint", "minted", "mirthful", "modern",
  "modest", "mosaic", "mossy", "mustard", "mystic", "natural", "nautical", "navy", "neat", "neon",
  "nickel", "nifty", "nimble", "noble", "nordic", "noted", "novel", "oaken", "obliging",
  "observant", "ochre", "olive", "onyx", "opal", "optimistic", "opulent", "orange", "orbital",
  "orderly", "ornate", "outgoing", "oval", "painted", "paisley", "paper", "pastel", "patchwork",
  "patient", "peaceful", "peach", "pearl", "pearly", "pebbled", "peerless", "pensive", "peppy",
  "perfect", "perky", "persistent", "pert", "pewter", "pink", "pinstriped", "pixel", "placid",
  "plaid", "platinum", "playful", "pleasant", "pleated", "plentiful", "plucky", "plum", "plush",
  "poetic", "poised", "polar", "polished", "polite", "porcelain", "posh", "prairie", "precious",
  "precise", "premium", "pretty", "prime", "pristine", "prized", "prompt", "proper", "proud",
  "prudent", "punctual", "purple", "quaint", "quartz", "quick", "quiet", "quilted", "quirky",
  "radiant", "rapid", "rare", "raspberry", "ready", "red", "refined", "regal", "relaxed",
  "reliable", "resolute", "resourceful", "rhythmic", "rippled", "ritzy", "riveted", "robust",
  "rocky", "rolling", "rose", "rosy", "royal", "rubber", "ruby", "ruddy", "rugged", "russet",
  "rustic", "rusty", "sable", "saffron", "sandy", "sapphire", "sassy", "satin", "savvy", "scaled",
  "scarlet", "scenic", "scholarly", "secret", "sedate", "sensible", "sepia", "sequined", "serene",
  "settled", "shaggy", "shapely", "sharp", "shimmering", "shiny", "showy", "sienna", "silken",
  "silky", "silly", "silver", "sincere", "skilled", "skillful", "slate", "sleek", "sleepy",
  "slender", "smart", "smiling", "smooth", "snappy", "snazzy", "snug", "sociable", "soft", "solar",
  "solemn", "solid", "sonic", "sparkling", "speedy", "spiffy", "spiral", "spirited", "splendid",
  "spotless", "spotted", "sprightly", "spry", "spunky", "stalwart", "starry", "stately",
  "steadfast", "steady", "steel", "stellar", "sterling", "stitched", "stocky", "stoic", "stony",
  "stout", "striking", "striped", "strong", "studious", "stunning", "sturdy", "suave", "sublime",
  "subtle", "suede", "summer", "sunlit", "super", "superb", "supple", "sure", "swanky", "sweet",
  "swift", "tactful", "talented", "tame", "tan", "tangerine", "tartan", "tasteful", "taupe",
  "tawny", "teal", "tender", "terracotta", "thankful", "thoughtful", "thrifty", "thriving",
  "tidal", "tidy", "tiled", "timber", "tinted", "tiny", "tireless", "topaz", "tough", "tranquil",
  "treasured", "tremendous", "trim", "true", "trusting", "trusty", "truthful", "tufted",
  "turquoise", "tweed", "twinkling", "umber", "unique", "unruffled", "upbeat", "upright", "urbane",
  "useful", "valiant", "velvet", "velvety", "vermilion", "vibrant", "vigilant", "vigorous",
  "vintage", "violet", "virtuous", "vital", "vivacious", "vivid", "wacky", "warm", "wavy",
  "whimsical", "white", "wholesome", "wicker", "wild", "willing", "wily", "winning", "winsome",
  "winter", "wiry", "wise", "wistful", "witty", "wonderful", "wonky", "wooden", "woolly",
  "worldly", "worthy", "woven", "yellow", "youthful", "zany", "zealous", "zestful", "zesty",
  "zigzag", "zippy",
];

// prettier-ignore
const PLANTS = [
  "acacia", "acorn", "agave", "alder", "allium", "allspice", "almond", "aloe", "amaranth",
  "amaryllis", "anemone", "anthurium", "apple", "artichoke", "arugula", "ash", "asparagus",
  "aspen", "aster", "aubergine", "avocado", "azalea", "balsa", "bamboo", "banana", "banyan",
  "baobab", "barberry", "barley", "basil", "basswood", "bay", "beech", "beetroot", "begonia",
  "bellflower", "bergamot", "bilberry", "birch", "blackberry", "blackcurrant", "blackthorn",
  "bluebell", "blueberry", "bluebonnet", "bonsai", "bougainvillea", "boxwood", "bracken",
  "bramble", "breadfruit", "broccoli", "buckeye", "buckwheat", "bulrush", "burdock", "buttercup",
  "butternut", "cabbage", "cactus", "calendula", "calla", "camellia", "camomile", "caper",
  "caraway", "cardamom", "carnation", "carob", "carrot", "cashew", "cassava", "catalpa", "catkin",
  "catnip", "cattail", "cauliflower", "cedar", "celery", "celosia", "chanterelle", "chard",
  "cherimoya", "cherry", "chestnut", "chickpea", "chicory", "chili", "cinnamon", "citrus",
  "clematis", "clove", "clover", "cocoa", "coconut", "coffee", "columbine", "coneflower",
  "coriander", "cork", "corn", "cornflower", "cosmos", "cotton", "cowslip", "cranberry", "cress",
  "crocus", "cucumber", "cumin", "currant", "cyclamen", "cypress", "daffodil", "dahlia", "daikon",
  "daisy", "damson", "dandelion", "date", "daylily", "delphinium", "dill", "dogwood", "durian",
  "edelweiss", "eggplant", "elder", "elm", "endive", "eucalyptus", "feijoa", "fennel", "fern",
  "fig", "fir", "flax", "forsythia", "foxglove", "freesia", "gardenia", "garlic", "geranium",
  "gerbera", "ginger", "ginkgo", "gladiolus", "goji", "gooseberry", "gorse", "gourd", "grape",
  "grapefruit", "guava", "hackberry", "hawthorn", "hazel", "heather", "heliotrope", "henna",
  "hibiscus", "hickory", "holly", "hollyhock", "honeydew", "honeysuckle", "hop", "hornbeam",
  "horseradish", "horsetail", "huckleberry", "hyacinth", "hydrangea", "iris", "ironwood", "ivy",
  "jacaranda", "jackfruit", "jasmine", "jojoba", "jonquil", "juniper", "jute", "kale", "kapok",
  "kauri", "kelp", "kiwifruit", "kohlrabi", "kumquat", "lantana", "larch", "larkspur", "laurel",
  "leek", "lemongrass", "lentil", "lettuce", "lily", "linden", "lingonberry", "liquorice",
  "lobelia", "loganberry", "loquat", "lotus", "lupin", "lychee", "macadamia", "magnolia",
  "mahogany", "maize", "mallow", "mandarin", "mango", "mangosteen", "mangrove", "maple",
  "marguerite", "marigold", "marjoram", "medlar", "melon", "mesquite", "millet", "mimosa",
  "mistletoe", "morel", "moss", "mulberry", "myrtle", "narcissus", "nasturtium", "nectarine",
  "neem", "nettle", "nutmeg", "oak", "oat", "okra", "oleander", "onion", "orchid", "palm",
  "palmetto", "pansy", "papaya", "paprika", "parsley", "parsnip", "passionflower", "pawpaw", "pea",
  "peanut", "pear", "pecan", "peony", "pepper", "peppermint", "periwinkle", "persimmon", "petunia",
  "phlox", "pimento", "pine", "pineapple", "pinecone", "pistachio", "plane", "plantain",
  "plumeria", "poinsettia", "pomegranate", "pomelo", "poplar", "poppy", "porcini", "potato",
  "primrose", "privet", "protea", "pumpkin", "quince", "quinoa", "radicchio", "radish", "rambutan",
  "ranunculus", "redcurrant", "redwood", "reed", "rhubarb", "rice", "rooibos", "rosemary",
  "rosewood", "rowan", "rutabaga", "rye", "sage", "saguaro", "salvia", "sandalwood", "sassafras",
  "satsuma", "scallion", "seaweed", "sedge", "sequoia", "sesame", "shallot", "shiitake",
  "snapdragon", "snowdrop", "sorghum", "sorrel", "soybean", "spelt", "spinach", "spruce", "squash",
  "starfruit", "stevia", "strawberry", "sugarcane", "sumac", "sunflower", "sweetpea", "sycamore",
  "tamarack", "tamarind", "taro", "tarragon", "tea", "teak", "thistle", "thyme", "tomato",
  "truffle", "tuberose", "tulip", "tupelo", "turmeric", "turnip", "vanilla", "verbena", "vine",
  "viola", "wallflower", "walnut", "wasabi", "watercress", "waterlily", "watermelon", "wattle",
  "wheat", "whitebeam", "willow", "wisteria", "yam", "yarrow", "yew", "yucca", "yuzu", "zinnia",
  "zucchini",
];

// prettier-ignore
const ANIMALS = [
  "aardvark", "albatross", "alligator", "alpaca", "anaconda", "angelfish", "ant", "anteater",
  "antelope", "armadillo", "auk", "avocet", "axolotl", "baboon", "badger", "barracuda", "bat",
  "bear", "beaver", "bee", "beetle", "beluga", "bison", "bittern", "blackbird", "bluebird", "boar",
  "bobcat", "bongo", "bonobo", "buffalo", "bullfinch", "bumblebee", "bunting", "butterfly",
  "buzzard", "caiman", "camel", "capuchin", "capybara", "cardinal", "caribou", "carp", "cassowary",
  "cat", "caterpillar", "catfish", "chaffinch", "chameleon", "chamois", "cheetah", "chickadee",
  "chicken", "chinchilla", "chipmunk", "cicada", "civet", "clam", "clownfish", "cobra",
  "cockatiel", "cockatoo", "condor", "coot", "cormorant", "cougar", "cow", "coyote", "crab",
  "crane", "crayfish", "cricket", "crocodile", "crow", "cuckoo", "curlew", "cuttlefish", "deer",
  "dingo", "dipper", "dodo", "dog", "dolphin", "donkey", "dormouse", "dove", "dragonfly", "duck",
  "dugong", "eagle", "eel", "egret", "eider", "eland", "elephant", "elk", "emu", "ermine",
  "falcon", "fennec", "ferret", "finch", "firefly", "flamingo", "flounder", "flycatcher", "fox",
  "frog", "gannet", "gazelle", "gecko", "gerbil", "gharial", "gibbon", "giraffe", "gnu", "goat",
  "goldfinch", "goldfish", "goose", "gopher", "gorilla", "goshawk", "grasshopper", "grebe",
  "grizzly", "grouper", "grouse", "guanaco", "guillemot", "gull", "guppy", "hammerhead", "hamster",
  "hare", "harrier", "hawk", "hedgehog", "heron", "hippo", "hoopoe", "hornbill", "horse",
  "hummingbird", "hyena", "hyrax", "ibex", "ibis", "iguana", "impala", "jackal", "jackdaw",
  "jackrabbit", "jaguar", "jay", "jellyfish", "jerboa", "kakapo", "kangaroo", "katydid", "kea",
  "kestrel", "kingfisher", "kinkajou", "kite", "kiwi", "koala", "koi", "kookaburra", "krill",
  "kudu", "lacewing", "ladybug", "lamb", "lapwing", "lark", "lemming", "lemur", "leopard",
  "limpet", "linnet", "lion", "lizard", "llama", "lobster", "loon", "loris", "lovebird", "lynx",
  "macaque", "macaw", "magpie", "mallard", "mamba", "manatee", "mandrill", "manta", "mantis",
  "marlin", "marmoset", "marmot", "marten", "meerkat", "merlin", "mink", "minnow", "mockingbird",
  "mole", "mongoose", "monkey", "moorhen", "moose", "moth", "mouflon", "mouse", "mudskipper",
  "mule", "muntjac", "muskox", "mussel", "narwhal", "nautilus", "newt", "nightingale", "numbat",
  "nuthatch", "ocelot", "octopus", "okapi", "opossum", "orangutan", "orca", "oriole", "oryx",
  "osprey", "ostrich", "otter", "owl", "ox", "oyster", "panda", "pangolin", "panther", "parakeet",
  "parrot", "parrotfish", "partridge", "peacock", "peccary", "pelican", "penguin", "perch",
  "petrel", "pheasant", "pig", "pigeon", "pika", "pike", "pipit", "platypus", "plover", "polecat",
  "pony", "porcupine", "porpoise", "possum", "prawn", "pronghorn", "ptarmigan", "pufferfish",
  "puffin", "puma", "python", "quail", "quetzal", "quokka", "quoll", "rabbit", "raccoon", "raven",
  "redstart", "reindeer", "rhea", "rhino", "roadrunner", "robin", "rook", "saiga", "sailfish",
  "salamander", "salmon", "sandpiper", "sardine", "sawfish", "scallop", "scorpion", "seahorse",
  "seal", "serval", "shark", "sheep", "shoebill", "shrew", "shrike", "shrimp", "siskin", "skink",
  "skunk", "skylark", "sloth", "snail", "snake", "snipe", "sparrow", "spider", "springbok",
  "squid", "squirrel", "stag", "starfish", "starling", "stickleback", "stilt", "stingray", "stoat",
  "stonechat", "stork", "sturgeon", "sunbird", "sunfish", "swallow", "swan", "swordfish", "takin",
  "tamarin", "tanager", "tapir", "tarsier", "tenrec", "tern", "tetra", "thrasher", "thrush",
  "tiger", "titmouse", "toad", "tortoise", "toucan", "treefrog", "triggerfish", "trout", "tuna",
  "turaco", "turkey", "turtle", "urchin", "vole", "vulture", "wagtail", "wallaby", "walrus",
  "warbler", "warthog", "waxwing", "weasel", "weaver", "whale", "whimbrel", "wigeon", "wildcat",
  "wildebeest", "wolf", "wolverine", "wombat", "woodcock", "woodpecker", "wrasse", "wren", "yak",
  "yellowhammer", "zebra", "zebu",
];

const HEX64 = /^(0x)?[0-9a-fA-F]{64}$/;
const cache = new Map();

function keyBytes(address) {
  const s = String(address || "").trim();
  if (HEX64.test(s)) {
    const hex = s.replace(/^0x/, "");
    return Uint8Array.from(hex.match(/../g), (b) => parseInt(b, 16));
  }
  return decodeAddress(s);
}

/** Bytes [offset, offset+8) as a big-endian uint64, modulo m — in 32-bit halves, no BigInt. */
function readMod(bytes, offset, m) {
  let hi = 0;
  let lo = 0;
  for (let i = 0; i < 4; i++) hi = hi * 256 + bytes[offset + i];
  for (let i = 4; i < 8; i++) lo = lo * 256 + bytes[offset + i];
  return ((hi % m) * (2 ** 32 % m) + (lo % m)) % m;
}

const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1);

function nameFrom(address, nouns, kind) {
  const id = String(address || "").trim();
  if (!id) return "";
  const key = `${kind}:${id}`;
  if (cache.has(key)) return cache.get(key);
  let name = "";
  try {
    const pub = keyBytes(id);
    const input = new Uint8Array(pub.length + SALT.length);
    input.set(pub);
    input.set(SALT, pub.length);
    const h = blake2AsU8a(input, 256);
    const adj = ADJECTIVES[readMod(h, 0, ADJECTIVES.length)];
    const noun = nouns[readMod(h, 8, nouns.length)];
    name = `${cap(adj)} ${cap(noun)}`;
  } catch {
    // not an address we can decode: fall back to a short form rather than nothing
    name = id.length > 14 ? `${id.slice(0, 6)}…${id.slice(-6)}` : id;
  }
  cache.set(key, name);
  return name;
}

/** "Sleepy Clematis" — the name of a sensor by its id. */
export const sensorName = (sensorId) => nameFrom(sensorId, PLANTS, "sensor");

/** "Woolly Pony" — the name of an owner (account) by its address. */
export const ownerName = (address) => nameFrom(address, ANIMALS, "owner");
