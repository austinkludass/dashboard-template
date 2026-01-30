import React from "react";
import { Box, Stack, Typography, useTheme } from "@mui/material";
import { tokens } from "../../theme";
import Popup from "reactjs-popup";
import "reactjs-popup/dist/index.css";

const owlFacts = [
  "Scientists think male owls find and advertise a territory, but female owls select the actual nest sites. Together, the owl pair defends their nest. The nest area will be the owl family's home for several months.",
  "When young owls hatch, they are covered with white, downy feathers and their eyes are closed. Several days after hatching, their eyes open and their white downy feathers are replaced with darker ones, often grey or brownish.",
  "Owls eyes can't move like ours can, its fixated in their skull, so to look at things they have to move their entire head.",
  "Owls are zygodactyl, which means their feet have two forward-facing toes and two backward-facing toes.",
  "Some owls fish for their food, like the Pel's fishing owl.",
  "Owls have a special adaptation that allows them to see in almost complete darkness.",
  "Owls can detect prey hidden under snow, leaves, or even underground using their sharp hearing.",
  "Owls don't have eyeballs—they're more like eye tubes. They're elongated and held in place by a bony structure in the skull called a sclerotic ring.",
  "The Spectacled Owl has distinctive white markings around its eyes, making it look like it's wearing glasses.",
  "Often, burrowing owls will line the entrance of their burrows with animal dung. This is a wise hunting strategy, as dung works as bait for insects that the owl can then feed on.",
  "Generally, the large owls hoot and the small owls toot.",
  "Owls sometimes hide their food. They capture prey and use their bill to carefully stuff the food into a hiding spot.",
  "A female owl will listen for a call that interests her. She will only respond to calls from males of the same species.",
  "Some owls can eat prey larger than themselves, like hares and other birds.",
  "Northern Saw-whet Owls can travel long distances over large bodies of water. One showed up 70 miles from shore near Montauk, New York.",
  "For the first couple weeks of life nestlings are helpless; they are unable to see, fly, or thermoregulate (maintain their own body temperature).",
  "Only female owls incubate eggs. During the incubation period, the female loses the feathers on her belly in order to transfer more body heat to the eggs.",
  "Owls have broad wings that allow them to glide, minimizing the flapping that creates most of the noise from a flying bird.",
  "Owls have 14 cervical vertebra, so they can turn 270 degrees.",
  "The roost is commonly located next to good hunting grounds so owls can search for prey as soon as they leave or return to the roost.",
  "There are approximately 250 species of owls across the world.",
  "The barn owl is known for its heart-shaped face.",
  "Owls are found on every continent except Antarctica.",
  "Owls are talented hunters, but nest builders they are not.",
  "Late winter is mating time for most owls. Males begin seeking mates by calling through the afternoon and evening air.",
  "Not all owls hoot! Barn Owls make hissing sounds, the Eastern Screech-Owl whinnies like a horse, and Saw-whet Owls sound like, well, an old whetstone sharpening a saw. Hence the name.",
  "A group of owls is called a parliament.",
  "Barn Owls typically nest in the rafters of barns, in empty buildings or silos, or in cavities along cliffs.",
  "An owl's diet may also include frogs, lizards, snakes, fish, mice, rabbits, birds, squirrels, and other creatures.",
  "The number of eggs an owl lays in a given season depends on her access to food.",
  "The largest North American owl, in appearance, is the Great Gray Owl, which is up to 32 inches tall.",
  "Many owls vocalize at a distinctively low frequency, which allows their songs to travel long distances without being absorbed by vegetation.",
  "Small, rodent-like mammals, such as voles and mice, are the primary prey for many owl species.",
  "An Owls vision is long-sighted, so owls can't see things clearly up-close.",
  "When flapping is necessary, many owl species have special flight feathers that make the action as silent as possible.",
  "The Northern Hawk Owl can detect—primarily by sight—a vole to eat up to a half a mile away.",
  "Owls must overcome a natural fear of each other in order to mate.",
  "Owls hunt other owls. Great Horned Owls are the top predator of the smaller Barred Owl.",
  "Owls have powerful talons that can exert several hundred pounds of pressure.",
  "After nestlings are capable of thermoregulation, but often before they can fly, they leave the nest and hide in the surrounding vegetation.",
  "Many owl species are nocturnal, but some, like the Northern Hawk Owl, hunt during the day.",
  "Most owls roost alone, or near a nest during the breeding season. However, there are a few species that roost communally, or share a roosting area with other individuals of the same species.",
  "Many owls take advantage of the hard work performed by other animals, instead of building their nests from scratch.",
  "The baby owls, or owlets, hatch within three to five weeks of the eggs being laid, and will hatch in the order in which they were laid.",
  "Some owls have been trained to hunt with humans, similar to falconry.",
  "Owls are often seen as the symbol for wisdom.",
  "Did you know their ears aren't placed symmetrical on the sides of their heads. One is placed a tiny bit higher than the other, this makes it so the owl can better place where the sound is coming from.",
  "Eagle Owls are among the most powerful owls and can hunt foxes.",
  "They are often seen doing a little dance with their heads. They are calculating a distance.",
  "Owls have no teeth in their beaks to chew prey. Instead, they swallow it whole or in large chunks.",
  "The tiniest owl in the world is the Elf Owl, which is 5 - 6 inches tall and weighs about 1.5 ounces.",
  "Owls have three eyelids—one for blinking, one for sleeping, and one for cleaning.",
  "The Great Horned Owl is one of the only birds that regularly preys on skunks.",
  "Unlike most birds, owls don't have crops, so they cannot store extra food in their throat.",
  "Some owls, like the Burrowing Owl, are known to mimic rattlesnake sounds to scare away predators.",
  "Owls have special neck arteries with air pockets that prevent blood from being cut off when they twist their heads.",
  "Owls can close one eye while keeping the other open, allowing them to rest while staying alert.",
  "Some owl species can detect ultraviolet light, helping them spot prey by seeing urine trails left by rodents.",
  "Owls have more vertebrae in their necks than giraffes.",
  "Owls can change the shape of their faces slightly to direct sound better when hunting.",
  "Some owls mimic the calls of prey animals, luring them into striking range.",
  "Owls have disproportionately large brains for their body size compared to other birds of prey.",
  "Some species of owls have been known to adopt orphaned owlets, even if they are not their own.",
  "Owls have been featured in mythology, folklore, and literature for thousands of years, from Ancient Greece to Harry Potter.",
  "Many owls prefer perching on dead trees to avoid being spotted by predators.",
  "Owls' pupils can dilate and contract independently, allowing them to fine-tune their vision.",
  "The Ashy-faced Owl is one of the rarest owls in the world and is found only on the island of Hispaniola.",
  "Owl eyes take up about 70% of their skull space, which is why they have such powerful vision.",
  "Some owl species are immune to the venom of poisonous snakes, allowing them to hunt snakes as prey.",
  "The Striped Owl has striking dark-and-light streaked feathers that help it blend into tree bark.",
  "The Short-eared Owl hunts mostly by flying low over open fields, unlike most owls that prefer perching.",
  "Some owls change feather colors slightly with the seasons, blending better with their surroundings.",
  "A single barn owl family will eat around 3000 rodents in a four-month breeding cycle.",
  "Female owls tend to be larger than males in both wingspan and weight.",
  "Hoothoot, Noctowl and Rowlet are three Pokemon inspired by an owl.",
  "Harry Potter's owl, Hedwig, is a snowy owl and is named after someone Harry reads about in his textbook, A History of Magic.",
];

function OwlFacts() {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const today = new Date();
  const dayOfYear = Math.floor(
    (today - new Date(today.getFullYear(), 0, 0)) / 86400000
  );
  const factOfTheDay = owlFacts[dayOfYear % owlFacts.length];

  return (
    <Box>
      <Popup
        trigger={
          <img
            alt="Wise Minds Logo"
            width={100}
            height={100}
            src={"../../assets/dashboardlogo_small.png"}
            style={{ cursor: "pointer", borderRadius: "50%" }}
            loading="lazy"
          />
        }
        position="right center"
        contentStyle={{
          zIndex: 1300,
          width: "300px",
          backgroundColor: `${colors.primary[400]}`,
        }}
      >
        <Stack p={1} spacing={1}>
          <Typography
            variant="h3"
            sx={{ textAlign: "left", color: `${colors.orangeAccent[400]}` }}
          >
            Owl Fact of the Day
          </Typography>
          <Typography variant="body" sx={{ fontWeight: "600" }}>
            {factOfTheDay}
          </Typography>
        </Stack>
      </Popup>
    </Box>
  );
}

export default OwlFacts;
