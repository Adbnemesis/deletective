/**
 * Original, deliberately authored conversations. This module is server-only:
 * examples and the future daily rotation must not be bundled into public pages.
 * `deletedIndex` is the insertion slot in the visible `messages` array.
 */
export type Mode = 'duo' | 'couples' | 'party' | 'daily' | 'chain';
export type Prompt = {
  id: string;
  title: string;
  category: string;
  modes: Mode[];
  difficulty: 'easy' | 'medium';
  messages: { sender: string; text: string }[];
  deletedIndex: number;
  constraint?: string;
  rating: 'family';
  language: 'en';
  tags: string[];
  version: number;
  example: string;
};

type Entry = [id: string, title: string, senderA: string, reactionA: string,
  senderB: string, reactionB: string, example: string,
  couplesPack?: 'wholesome' | 'date-night', constraint?: string];

function category(category: string, entries: Entry[]): Prompt[] {
  return entries.map(([id, title, senderA, reactionA, senderB, reactionB, example, couplesPack, constraint]) => ({
    id, title, category,
    modes: couplesPack ? ['duo', 'couples', 'party', 'daily', 'chain'] : ['duo', 'party', 'daily', 'chain'],
    difficulty: constraint ? 'medium' : 'easy',
    messages: [{ sender: senderA, text: reactionA }, { sender: senderB, text: reactionB }],
    deletedIndex: 0,
    ...(constraint ? { constraint } : {}),
    rating: 'family', language: 'en',
    tags: [category, ...(couplesPack ? ['couples', couplesPack] : [])],
    version: 1, example,
  }));
}

export const PROMPTS: Prompt[] = [
  ...category('family', [
    ['family-01', 'The family chat', 'Mum', 'Your grandmother has asked for a lawyer.', 'Lee', 'We were only supposed to teach her video calls.', 'I clicked “make host” and she thinks she owns the internet.'],
    ['family-02', 'Sunday lunch', 'Jo', 'Why does the roast have a name tag?', 'Dad', 'Please tell me we are still eating at one.', 'I entered the potatoes in a team-building workshop.'],
    ['family-03', 'Meeting the parents', 'Alex', 'I thought you said your parents were relaxed.', 'Sam', 'WHY IS YOUR DAD HOLDING A POWERPOINT?', 'He has prepared a quarterly review of our first date.', 'date-night'],
    ['family-04', 'Birthday logistics', 'Nia', 'Grandad is wearing the crown again.', 'Mum', 'Nobody let him near the microphone.', 'I told him the birthday person gets absolute power for a day.'],
    ['family-05', 'The new in-laws', 'Rae', 'Your mum just called me “the accomplice”.', 'Ash', 'That is actually better than the last nickname.', 'I helped her hide eighteen garden gnomes from your dad.', 'wholesome'],
    ['family-06', 'Family photo day', 'Ben', 'The photographer has gone very quiet.', 'Aunt Jo', 'Can we all just look in the same direction?', 'I booked a pet photographer because they said they handle difficult groups.'],
    ['family-07', 'Dinner with the family', 'Sam', 'Your sister is taking minutes.', 'Alex', 'I think the pudding has become a formal hearing.', 'I proposed a rotating custody agreement for the last brownie.', 'wholesome'],
    ['family-08', 'The family group', 'Dad', 'That is not what I meant by a family tree.', 'Mika', 'The council wants it removed by Friday.', 'I planted a separate oak for every cousin and labelled the branches.'],
  ]),
  ...category('workplace', [
    ['workplace-01', 'Office announcements', 'Dev', 'The printer has its own calendar now?', 'Priya', 'Why am I marked as optional?', 'I scheduled a mediation between the printer and the stapler.'],
    ['workplace-02', 'The team lunch', 'Kit', 'HR would like a word.', 'Mo', 'Please stop saying it was technically a team-building exercise.', 'I made everyone negotiate with the vending machine as a single organism.'],
    ['workplace-03', 'Project updates', 'Ari', 'The client has replied with just “wow”.', 'Jules', 'Was that the final version or the silly one?', 'I replaced every pie chart with a picture of the pie I wanted.'],
    ['workplace-04', 'Working from home', 'Priya', 'Your camera is still on.', 'Dev', 'The whole department is now invested in this.', 'My cat is giving the performance review and honestly the feedback is fair.'],
    ['workplace-05', 'Office supplies', 'Mo', 'The delivery driver says there are six more pallets.', 'Kit', 'I asked for enough to last the quarter.', 'I thought “a gross” was a review, so I kept increasing the quantity.'],
    ['workplace-06', 'All hands', 'Jules', 'The CEO is asking whether that was a metaphor.', 'Ari', 'Why is everyone holding a tiny shovel?', 'I took “dig into the numbers” extremely seriously.'],
    ['workplace-07', 'The office move', 'Dev', 'We have lost the meeting room.', 'Mo', 'How can a room be on annual leave?', 'I made the booking calendar more human and it requested two weeks off.'],
    ['workplace-08', 'Friday check-in', 'Priya', 'Nobody is allowed to name a spreadsheet again.', 'Kit', 'It has already received three birthday cards.', 'I called the expenses sheet Gary and told everyone Gary was struggling.'],
  ]),
  ...category('school', [
    ['school-01', 'The class project', 'Zoe', 'The volcano has a waiting list.', 'Eli', 'We were aiming for a science fair, not a tourist attraction.', 'I added a gift shop and now the baking soda has a sponsor.'],
    ['school-02', 'Study group', 'Owen', 'That is not what “show your working” means.', 'Mae', 'The teacher has kept the costume.', 'I performed long division as a one-person musical.'],
    ['school-03', 'The school play', 'Eli', 'The tree is refusing to go on.', 'Zoe', 'Did someone promise it a speaking part?', 'I told the oak costume it was the emotional centre of the story.'],
    ['school-04', 'Group presentation', 'Mae', 'How are there forty slides and no words?', 'Owen', 'The teacher just put on 3D glasses.', 'I interpreted “make the argument stand out” as a special-effects budget.'],
    ['school-05', 'The school trip', 'Zoe', 'The museum has offered us a job.', 'Eli', 'Please say the headteacher knows where we are.', 'We stood still so long the curator labelled us “Students, circa Tuesday”.'],
    ['school-06', 'Exam revision', 'Owen', 'The librarian has asked for an encore.', 'Mae', 'I said use a memory technique.', 'I turned the periodic table into a dramatic breakup song.'],
    ['school-07', 'The class pet', 'Mae', 'It now has a better attendance record than you.', 'Zoe', 'Who taught it to sign the register?', 'I have appointed the hamster as my academic representative.'],
    ['school-08', 'Sports day', 'Eli', 'Why is the trophy apologising?', 'Owen', 'The PE teacher says this is a first.', 'I entered the egg-and-spoon race with a motivationally insecure robot egg.'],
  ]),
  ...category('dating', [
    ['dating-01', 'The first date debrief', 'Alex', 'You took that to the restaurant?', 'Sam', 'Did it at least get its own chair?', 'I brought a backup conversation in a three-ring binder.', 'date-night'],
    ['dating-02', 'Saturday plans', 'Rae', 'The booking says “two adults and a goose”.', 'Ash', 'I have a feeling I know which one is me.', 'The restaurant asked about dietary requirements and I panicked.', 'date-night'],
    ['dating-03', 'A little surprise', 'Jo', 'There is a queue outside our front door.', 'Mika', 'What exactly did you mean by “a few flowers”?', 'I accidentally advertised our balcony as a tiny botanical garden.', 'wholesome'],
    ['dating-04', 'Cooking together', 'Sam', 'The pasta is somehow judging me.', 'Alex', 'Please stop giving the ingredients a backstory.', 'I told the ravioli we were separating them for character development.', 'wholesome'],
    ['dating-05', 'Date night', 'Ash', 'The instructor has stopped the class.', 'Rae', 'Did you think the word “pottery” meant something else?', 'I have been introducing myself to every vase before touching it.', 'date-night'],
    ['dating-06', 'An anniversary plan', 'Mika', 'That is incredibly sweet.', 'Jo', 'But why does the squirrel have a tiny headset?', 'I hired the park wildlife to recreate where we first met.', 'wholesome'],
    ['dating-07', 'The big introduction', 'Alex', 'My friends are still talking about your entrance.', 'Sam', 'The smoke machine was a choice.', 'You said you wanted them to see my mysterious side.', 'date-night', 'Make it unnecessarily dramatic.'],
    ['dating-08', 'The walk home', 'Rae', 'That was the most romantic thing anyone has ever done.', 'Ash', 'The traffic warden seemed less moved.', 'I reserved the last dry bench using seventeen tiny traffic cones.', 'wholesome'],
  ]),
  ...category('weddings', [
    ['weddings-01', 'Wedding planning', 'Nia', 'The seating chart now has a moat.', 'Lee', 'Are your cousins really that difficult?', 'I solved the table politics by designing a small medieval kingdom.', 'date-night'],
    ['weddings-02', 'The rehearsal', 'Alex', 'The officiant says that is not legally binding.', 'Sam', 'The dog looked very convincing, though.', 'We let him approve the vows with a paw print.', 'wholesome'],
    ['weddings-03', 'The big day', 'Jo', 'Why is the cake wearing a seatbelt?', 'Mika', 'I asked you to make sure it arrived safely.', 'I bought it a first-class train ticket and it got nervous.', 'wholesome'],
    ['weddings-04', 'Wedding speeches', 'Lee', 'The microphone has been confiscated.', 'Nia', 'You only had to say how you met.', 'I prepared an eight-part documentary with a cliffhanger.', 'date-night'],
    ['weddings-05', 'The invitation list', 'Rae', 'We have received an RSVP from the moon.', 'Ash', 'It wants the vegetarian option.', 'I wrote “everyone under the stars is welcome” a little too clearly.', 'wholesome'],
    ['weddings-06', 'The first dance', 'Mika', 'The DJ has asked us to sign a waiver.', 'Jo', 'We agreed on something slow.', 'I chose a twenty-minute documentary about glaciers because it moves slowly.', 'date-night'],
    ['weddings-07', 'Wedding favours', 'Sam', 'Every guest is now holding a potato.', 'Alex', 'Your aunt says hers is a keeper.', 'I wanted a gift people could grow old with or roast on Sunday.', 'wholesome'],
    ['weddings-08', 'The wedding photos', 'Nia', 'The photographer says it is their best work.', 'Lee', 'That is lovely, but where are the actual newlyweds?', 'We asked for candid shots and they followed the cake all afternoon.', 'date-night'],
  ]),
  ...category('restaurants', [
    ['restaurants-01', 'Table for two', 'Sam', 'The waiter has brought out a tiny certificate.', 'Alex', 'You were just supposed to ask about the soup.', 'I accidentally nominated it for employee of the month.', 'date-night'],
    ['restaurants-02', 'Dinner plans', 'Mo', 'The chef is standing outside with binoculars.', 'Kit', 'What did you order?', 'I asked for locally sourced clouds as a light starter.'],
    ['restaurants-03', 'The food critics', 'Rae', 'Our table has its own theme music now.', 'Ash', 'The waiter is really committed to this.', 'I said we were celebrating successfully assembling a flat-pack stool.', 'wholesome'],
    ['restaurants-04', 'Lunch break', 'Dev', 'The sandwich is listed as a co-founder.', 'Priya', 'Please stop pitching business ideas to the deli.', 'I told them this panini had disrupted my entire afternoon.'],
    ['restaurants-05', 'Trying somewhere new', 'Jo', 'They have put our photo on the wall.', 'Mika', 'Why does the plaque say “brave”?', 'I ordered the mystery dessert and asked it to surprise me emotionally.', 'date-night'],
    ['restaurants-06', 'The tasting menu', 'Kit', 'The next course needs charging.', 'Mo', 'I miss when food was a noun.', 'I signed us up for the experimental menu called “What If Lunch Was An App?”.'],
    ['restaurants-07', 'The lunch order', 'Priya', 'The delivery driver has asked which floor is the castle.', 'Dev', 'What name did you put on the order?', 'I got carried away filling out the special instructions.'],
    ['restaurants-08', 'Breakfast club', 'Mo', 'They are interviewing the toast.', 'Kit', 'I thought you said the service was personal.', 'I requested breakfast with a compelling origin story.'],
  ]),
  ...category('vacations', [
    ['vacations-01', 'Holiday planning', 'Alex', 'The hotel says our suitcase has checked in.', 'Sam', 'At least one of us is having a nice time.', 'I gave the luggage my passport and apparently it looked more relaxed.', 'date-night'],
    ['vacations-02', 'The scenic route', 'Rae', 'The guide is asking us for directions.', 'Ash', 'Did we book the advanced getting-lost package?', 'I said we wanted to see somewhere no tourist had ever found.', 'date-night'],
    ['vacations-03', 'Postcards home', 'Mika', 'Your mum thinks we have moved into a lighthouse.', 'Jo', 'The photo was quite convincing.', 'I captioned it “finally found somewhere with good lighting”.', 'wholesome'],
    ['vacations-04', 'The beach trip', 'Nia', 'The lifeguard is asking for the architect.', 'Lee', 'You said you were making a small sandcastle.', 'I included a town hall, a tram network and affordable housing.'],
    ['vacations-05', 'Souvenir shopping', 'Sam', 'We cannot fit that in the overhead locker.', 'Alex', 'It does look very happy, though.', 'You told me to bring home a little piece of the holiday, so I adopted the hotel fern.', 'wholesome'],
    ['vacations-06', 'The walking tour', 'Kit', 'The statue is not on the itinerary.', 'Mo', 'Why is everyone thanking you for your service?', 'I stood very still while waiting and the guide invented my history.'],
    ['vacations-07', 'Airport updates', 'Jo', 'The announcement is using your full name.', 'Lee', 'What did you put in the comments box?', 'I requested a window seat with a more interesting personal journey.'],
    ['vacations-08', 'Camping weekend', 'Nia', 'The ranger says the squirrels have unionised.', 'Kit', 'Who put up the noticeboard?', 'I offered snacks in exchange for directions and they negotiated benefits.'],
  ]),
  ...category('gaming', [
    ['gaming-01', 'Game night chat', 'Ash', 'The final boss has sent a thank-you note.', 'Rae', 'I thought we were trying to defeat it.', 'I noticed its castle was a mess and spent the fight organising the shelves.'],
    ['gaming-02', 'The guild meeting', 'Dev', 'Our healer has become the accountant.', 'Kit', 'We really should have read the update notes.', 'I asked everyone to submit receipts for emotional damage.'],
    ['gaming-03', 'One more round', 'Mika', 'The tutorial character wants a rematch.', 'Jo', 'How do you lose to the instructions?', 'I kept applauding when it showed me how to jump.'],
    ['gaming-04', 'The co-op campaign', 'Rae', 'The quest log now says “apologise”.', 'Ash', 'You promised not to improvise diplomacy.', 'I offered the dragon a customer satisfaction survey.'],
    ['gaming-05', 'The tournament', 'Eli', 'The referee is checking the definition of a controller.', 'Zoe', 'Please tell me that is not a toaster.', 'It has two buttons and an eject move, so I thought it counted.'],
    ['gaming-06', 'Building a base', 'Mo', 'The enemy keeps leaving five-star reviews.', 'Kit', 'We were building a fortress, not a bed and breakfast.', 'I added complimentary slippers and a continental breakfast.'],
    ['gaming-07', 'The speedrun', 'Sam', 'That is a world record for something.', 'Alex', 'The commentators are crying.', 'I accidentally completed the game entirely through the settings menu.'],
    ['gaming-08', 'Voice chat', 'Dev', 'The robot has muted itself.', 'Mika', 'Even the game needs a minute.', 'I lectured the automatic door.', undefined, 'Use exactly five words.'],
  ]),
  ...category('pets', [
    ['pets-01', 'The pet sitters', 'Jo', 'The cat has been offered a corner office.', 'Mika', 'What did you put on its little name badge?', 'I wrote “independent consultant” and it immediately ignored a meeting.'],
    ['pets-02', 'Our new puppy', 'Sam', 'The trainer says we are making excellent progress.', 'Alex', 'I think they mean us, not the dog.', 'He rings the bell and we both bring him a snack.', 'wholesome'],
    ['pets-03', 'Neighborhood animals', 'Lee', 'The pigeons are queuing politely.', 'Nia', 'This feels like the beginning of a new government.', 'I installed a tiny ticket machine next to the bird feeder.'],
    ['pets-04', 'The vet visit', 'Kit', 'The receptionist wants the original certificate.', 'Mo', 'You cannot just declare a rabbit qualified.', 'I told them he was a licensed carrot inspector.'],
    ['pets-05', 'Pet photo day', 'Rae', 'We are in none of the pictures.', 'Ash', 'The dog has already ordered wallet-sized copies.', 'I told the photographer to focus on the head of the household.', 'wholesome'],
    ['pets-06', 'The missing sock', 'Mika', 'There is a ransom note in the dog bed.', 'Jo', 'How does he know our printer password?', 'I taught him to bring the post and he has moved into correspondence.'],
    ['pets-07', 'The fish tank', 'Nia', 'The goldfish has requested curtains.', 'Lee', 'I thought the castle was enough.', 'I read its daily routine out loud and now it wants more privacy.'],
    ['pets-08', 'The pet contest', 'Mo', 'The judges have created a new category.', 'Kit', 'Is “most convincing cloud” a good thing?', 'I brushed the dog for three hours and now we cannot find the dog.'],
  ]),
  ...category('neighbors', [
    ['neighbors-01', 'The building chat', 'Pat', 'The lift is accepting compliments again.', 'Ren', 'Could it also accept the third floor?', 'I put a motivational poster over the buttons.'],
    ['neighbors-02', 'Welcome to the street', 'Rae', 'The neighbours have brought folding chairs.', 'Ash', 'How long is your introduction going to be?', 'I promised a brief history of our plant collection.', 'wholesome'],
    ['neighbors-03', 'The garden fence', 'Lee', 'The hedge has been invited to a wedding.', 'Nia', 'It does look very approachable.', 'I trimmed it into a person who is excellent at small talk.'],
    ['neighbors-04', 'Residents meeting', 'Ren', 'We have accidentally elected the doormat.', 'Pat', 'It did say “everyone welcome”.', 'I nominated the only resident who never complains about muddy shoes.'],
    ['neighbors-05', 'The shared driveway', 'Mo', 'Your parking space is in the local paper.', 'Kit', 'Why is the headline “Tiny Park Opens”?', 'I put a bench in it while my car was being repaired.'],
    ['neighbors-06', 'Noise complaints', 'Pat', 'That explains the applause at 3 a.m.', 'Ren', 'The building manager would still like a word.', 'My tumble dryer has been rehearsing a tap routine.'],
    ['neighbors-07', 'The community fair', 'Nia', 'There is a waiting list for the waiting list.', 'Lee', 'What exactly are we selling?', 'I opened a stall offering a moment of peace and a chair.'],
    ['neighbors-08', 'Borrowing a ladder', 'Kit', 'The whole street is watching now.', 'Mo', 'You said it would take five minutes.', 'I promised the roof a proper farewell before replacing a tile.'],
  ]),
  ...category('superheroes', [
    ['superheroes-01', 'Hero headquarters', 'Nova', 'The city is safe, but every sandwich is upside down.', 'Bolt', 'We need to discuss your definition of rescue.', 'I reversed gravity to save a kitten and forgot about lunch.'],
    ['superheroes-02', 'The secret identity', 'Ash', 'The cape is visible in your staff photo.', 'Rae', 'At least the disguise has good posture.', 'I said it was the office blanket and now everybody wants one.'],
    ['superheroes-03', 'Sidekick training', 'Bolt', 'The villain has requested a different opponent.', 'Nova', 'Were you too powerful or too polite?', 'I kept asking whether the evil plan fitted their long-term goals.'],
    ['superheroes-04', 'The hero group', 'Nova', 'The emergency signal is shaped like a biscuit.', 'Bolt', 'How urgent could this possibly be?', 'I let the mayor’s dog choose the new logo.'],
    ['superheroes-05', 'Saving the day', 'Rae', 'We have rescued the same bus seven times.', 'Ash', 'Maybe stop putting it back there.', 'I thought the route number was a difficulty level.'],
    ['superheroes-06', 'The costume fitting', 'Bolt', 'The city can hear you coming from four streets away.', 'Nova', 'Who approved the dramatic trousers?', 'I asked the tailor for a heroic entrance and got built-in wind chimes.'],
    ['superheroes-07', 'Villain negotiations', 'Nova', 'They have returned the moon with a bow on it.', 'Ash', 'What did you say to them?', 'I mentioned that we had nowhere to store it over the holidays.'],
    ['superheroes-08', 'A quiet day off', 'Rae', 'The duck pond now has a security perimeter.', 'Bolt', 'I said protect your peace.', 'I assigned each duck a tiny earpiece and a code name.'],
  ]),
  ...category('fantasy', [
    ['fantasy-01', 'The village council', 'Moss', 'The dragon has asked for a smaller cave.', 'Fern', 'What did the estate agent tell it?', 'I mentioned the heating bill and it suddenly remembered a budget.'],
    ['fantasy-02', 'Wizard study group', 'Fern', 'The broom has resigned.', 'Moss', 'Was it the flying or the sweeping?', 'I listed both as “other duties as required”.'],
    ['fantasy-03', 'The royal court', 'Pip', 'The crown is now technically a soup bowl.', 'Vale', 'Please tell me the coronation can still happen.', 'The spell said “make me a ruler” and I added kitchen measurements.'],
    ['fantasy-04', 'Quest companions', 'Vale', 'The enchanted door says it needs some space.', 'Pip', 'How did you get rejected by a hallway?', 'I asked it where this relationship was going.'],
    ['fantasy-05', 'The potion shop', 'Moss', 'The labels are giggling.', 'Fern', 'That is usually a sign to close for the day.', 'I mixed a truth potion with the staff suggestion box.'],
    ['fantasy-06', 'The tiny kingdom', 'Pip', 'The royal decree is written on a leaf.', 'Vale', 'It still has to be signed by Tuesday.', 'I promoted the garden snail to minister of transport.'],
    ['fantasy-07', 'The magic lesson', 'Fern', 'Your reflection has joined another class.', 'Moss', 'It says it wants a fresh start.', 'I used a confidence spell on the mirror and it outgrew me.'],
    ['fantasy-08', 'The treasure hunt', 'Vale', 'The chest is asking us for three references.', 'Pip', 'Since when does gold have standards?', 'I wished for a more exclusive adventure.'],
  ]),
  ...category('science-fiction', [
    ['scifi-01', 'Mission control', 'Zed', 'The alien ambassador is applauding the microwave.', 'Iris', 'What did you tell them was in charge?', 'It was the only thing on the ship that confidently counted backwards.'],
    ['scifi-02', 'Time travel support', 'Iris', 'Your future self has left a one-star review.', 'Zed', 'At least they made it home.', 'I borrowed tomorrow’s lunch and apparently it was a special occasion.'],
    ['scifi-03', 'The space station', 'Sol', 'The robot is charging rent for the charging station.', 'Ada', 'Who taught it economics?', 'I told it to value its downtime.'],
    ['scifi-04', 'First contact', 'Ada', 'They want to meet our most important leader.', 'Sol', 'Why are they pointing at the houseplant?', 'I said we all depend on it for oxygen and emotional stability.'],
    ['scifi-05', 'The moon base', 'Zed', 'The crater has been booked for a birthday party.', 'Iris', 'We are a research facility.', 'I put “large circular venue with excellent views” in the mission log.'],
    ['scifi-06', 'The spaceship upgrade', 'Sol', 'The autopilot keeps taking the scenic route.', 'Ada', 'Space is mostly scenic route.', 'I installed a “follow your dreams” update.'],
    ['scifi-07', 'The cloning lab', 'Iris', 'All twelve of you have called in tired.', 'Zed', 'We may have misunderstood the productivity benefits.', 'I cloned myself before I had coffee.'],
    ['scifi-08', 'Galactic deliveries', 'Ada', 'The package is older than the planet.', 'Sol', 'And yet they still missed the delivery window.', 'I selected yesterday shipping without checking the century.'],
  ]),
  ...category('internet', [
    ['internet-01', 'The group chat', 'Ash', 'Your fridge has more followers than all of us.', 'Rae', 'At least it posts consistently.', 'I made it an account and it has strong opinions about being left open.'],
    ['internet-02', 'A message for you', 'Sam', 'That was meant for me, right?', 'Alex', 'Because the neighbourhood chat is being very supportive.', 'I accidentally sent “you are my favourite human” to forty-seven neighbours.', 'wholesome'],
    ['internet-03', 'The shared playlist', 'Jo', 'We have been listening to a dishwasher for twenty minutes.', 'Mika', 'It does have a good build-up.', 'I uploaded our first date recording and forgot we were in the kitchen.', 'date-night'],
    ['internet-04', 'Online shopping', 'Kit', 'The seller has included a tiny apology.', 'Mo', 'How tiny are we talking?', 'I bought a “statement sofa” and its statement is that it fits in my palm.'],
    ['internet-05', 'The new app', 'Dev', 'It has reminded me to take a break from taking breaks.', 'Priya', 'We may have automated the wrong thing.', 'I connected my wellness app to my procrastination tracker.'],
    ['internet-06', 'Tech support', 'Rae', 'The smart speaker has gone to bed.', 'Ash', 'Try asking it nicely tomorrow.', 'I told it that eight hours of sleep was non-negotiable.'],
    ['internet-07', 'The video call', 'Mo', 'Your background has its own weather forecast.', 'Kit', 'Please tell me that thunder is virtual.', 'I chose “immersive tropical island” and apparently it is monsoon season.'],
    ['internet-08', 'The family website', 'Mika', 'We are the top search result for “confused beans”.', 'Jo', 'I asked for better visibility, I suppose.', 'I named every photo after what I thought the cat was thinking.'],
  ]),
  ...category('emergencies', [
    ['emergencies-01', 'A small situation', 'Lee', 'Nobody touch the glitter.', 'Nia', 'That was also the advice ten minutes ago.', 'I thought a vacuum cleaner would make the celebration more portable.'],
    ['emergencies-02', 'The birthday surprise', 'Mo', 'The magician is stuck in the photo booth.', 'Kit', 'Has anyone checked whether this is the trick?', 'I asked for a disappearing act in the smallest available space.'],
    ['emergencies-03', 'The kitchen situation', 'Jo', 'The smoke alarm has started applauding.', 'Mika', 'How many times have you done this recipe?', 'I set the toast to “standing ovation” instead of medium.'],
    ['emergencies-04', 'The town fair', 'Nia', 'The mayor is asking who owns the inflatable.', 'Lee', 'Could you be a little more specific?', 'I ordered a life-size balloon of the town hall and now it is slowly leaving.'],
    ['emergencies-05', 'The lift incident', 'Kit', 'We have been promoted to a different floor.', 'Mo', 'Does that mean we can leave?', 'I tried motivational speaking on the lift and it took “aim higher” literally.'],
    ['emergencies-06', 'Last-minute preparations', 'Mika', 'The cake is fine. The ceiling is not.', 'Jo', 'Why did the instructions mention a helmet?', 'I interpreted “whip the cream” as an extreme sport.'],
    ['emergencies-07', 'The escape room', 'Lee', 'The staff have asked us to come out.', 'Nia', 'You said we had to commit to the story.', 'I found a comfortable chair and declared that my character had retired.'],
    ['emergencies-08', 'The community centre', 'Mo', 'The emergency meeting needs an emergency meeting.', 'Kit', 'Please stop bringing new props.', 'I brought a second whiteboard to explain why the first whiteboard was missing.', undefined, 'Make it sound like a confession.'],
  ]),
];

// Lowercase alias keeps consumers readable and supports the shared contract.
export const prompts = PROMPTS;
export const CATEGORIES = [...new Set(PROMPTS.map(prompt => prompt.category))];

function hash(seed: string): number {
  let result = 2166136261;
  for (let i = 0; i < seed.length; i++) result = Math.imul(result ^ seed.charCodeAt(i), 16777619);
  return result >>> 0;
}

/** Select within a mode/pack, avoid repeats until that pool is exhausted. */
export function pickPrompt(options: {
  mode: string; category?: string; usedIds?: readonly string[]; seed?: string | number;
}): Prompt {
  let pool = PROMPTS.filter(prompt => prompt.modes.includes(options.mode as Mode));
  if (pool.length === 0) pool = PROMPTS.filter(prompt => prompt.modes.includes('duo'));
  if (options.category && options.category !== 'all' && options.category !== 'any') {
    const filtered = pool.filter(prompt => prompt.category === options.category || prompt.tags.includes(options.category!));
    if (filtered.length) pool = filtered;
  }
  const used = new Set(options.usedIds ?? []);
  const fresh = pool.filter(prompt => !used.has(prompt.id));
  if (fresh.length) pool = fresh;
  const index = options.seed === undefined ? Math.floor(Math.random() * pool.length) : hash(String(options.seed)) % pool.length;
  return pool[index];
}

/** Server UTC date is authoritative. Same date => same prompt worldwide. */
export function dailyPrompt(dateUTC: string): Prompt {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateUTC)) throw new Error('Expected a UTC calendar date (YYYY-MM-DD).');
  const parsed = Date.parse(`${dateUTC}T00:00:00.000Z`);
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString().slice(0, 10) !== dateUTC) throw new Error('Invalid UTC calendar date.');
  const pool = PROMPTS.filter(prompt => prompt.modes.includes('daily'));
  // A coprime step walks every prompt before repeating, with no adjacent repeat.
  const day = Math.floor(parsed / 86_400_000);
  return pool[((day * 47 + 19) % pool.length + pool.length) % pool.length];
}
