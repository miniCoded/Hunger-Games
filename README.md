# Hunger Games

The structure of the Hunger Games is like this:

1. Generate an amout of players.
2. Make them interact with each oher, either individual actions or group actions.
3. The last player standing wins.

Now, each player has:
- A name
- Luck
- Statuses
- Inventory

Luck determines what kind of events will the player get and the outcome. Luck goes from (0, 1), where 0 = certain ded and 1 = ez win.
Statuses are debuffs that affect each player, such as THIRST, HUNGER, IBJURY, etc.
Iventory holds items or the players to use and interact, such as water, food, weapons, etc.

There are also GROUPS (or packs) that act as single entities and group many players.

The interactions withing players are called events, and they too have their own chance of occuring.
There are 3 kinds of events:
1. Base. These events can happend regardless of conditions.
2. Unique. These events happen when not in a special event round.
3. Special. These events revolve around something and replace every other event except the base ones. These only last some days and cannot happen twice.

Phase 2 goes like this:
1. Update statuses
2. Give players items
3. Select a random number and determine whether or not a special event will be triggered. If yes, then replace the unique events with those.
4. Select one, two players or groups to interact with each other.
5. Show the results of the interactions.


The way players interact with each other is:
1. Select one or two entities
2. The first player will be the one performing the action, the other one will receive it.
3. The chance of the event will be determined by the luck of the player. To prevent reinventing the wheel, I decided to copy the algorithm from the Roblox's game: Sol's RNG:
   1. Sort the event lists (merge them) from rarest to most common. Rarity goes from (0, 1)
   2. Select the first player (the one who performs the action), take his luck and add 1.
   3. Generate new lucks for each event using this formula: n_luck = max(1, floor(luck/rarity + 0.5))
   4. Go event by event. Apply the formula and get a random number from 1 to n_luck.
      1. If the number is 1, then apply the event. If not, then continue.
      2. Select the last event (most common) if no other events were choosen.

## Branches

- `main`:    The game with no experimental features, as-is.
- `feature`: Experimental features of the game, either already integrated or not.
- `play`:    Fine-tuning of tghe settings of the game.