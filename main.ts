/*
TODO:
- Being able to generate new players.
- Create the main game loop.
- Implement events
- Implement players
*/

import { Player } from "./Player.ts";
import { StatusEnum, StatusList } from "./Status.ts";
import { Event, EventList } from "./Event.ts";

function printSync(input: string | Uint8Array, to = Deno.stdout) {
    let bytesWritten = 0
    const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input
    while (bytesWritten < bytes.length) {
        bytesWritten += to.writeSync(bytes.subarray(bytesWritten))
    }
}

/**
 * 
 * SETUP
 * 
 */

const player_list: Array<Player> = [];
const getAlive = () => player_list.filter((player) => player.status[0].state == StatusEnum.ALIVE);
const getDead = () => player_list.filter((player) => player.status[0].state == StatusEnum.DEAD);

let days = 1;

/**
 * Insert your players here
 */
const player_count = 10;

for(let i = 0; i < player_count; i++){
	player_list.push({
		name:              `${i}`,
		kills:             0,
		status:            [StatusList[0]()],
		interacted:        false,

		inventory:         [],

		days_since_hunger: 0,
		days_since_thirst: 0,
	});
}

// sort event_list by chance, low to high
EventList.sort((a, b) => a.chance - b.chance);

/**
 * 
 * MAIN LOOP
 * 
 * No player can interact more than once per day.
 * All players must interact with each other per day.
 * No dead players can play.
 * 
 */

while(getAlive().length > 1){
	const day_log_message = `------------Day ${days}------------`
	console.log(day_log_message);
	let interacted = 0;
	
	player_list.sort(() => Math.random() - 0.5);
	
	// Pahse 1: update the statuses. Only after day 1.
	if(days > 1){
		player_list.forEach((player) => {
			player.status.forEach((status) => {
				status.payload(status, player);
			});
		});
	}

	console.log('-'.repeat(day_log_message.length));

	const alive_ones = getAlive().length;
	// Phase 2: pickup items (W.I.P.)
	
	// Phase 3: select an event
	// Phase 4: make players/groups interact
	while(interacted < alive_ones){
		const event = Event.pick_event(EventList) as Event;

		if(event.play_affected > alive_ones - interacted)
			continue;

		const [log, interactions] = event.payload(player_list, [], interacted, days);

		interacted += interactions;

		console.log(log);
	}
	// Phase 5: repeat
	player_list.forEach((player) => {
		if(player.status[0].state == StatusEnum.ALIVE)
			player.interacted = false;
	});

	console.log(`************ + Dead + ************`);
	getDead().forEach((player) => {
		if(player.status[0].days_since_effect == 0)
			printSync(player.name + " ");
	});

	printSync(`(${getDead().filter((player) => player.status[0].days_since_effect == 0).length}) \n`);
	days += 1;

	/*await new Promise<void>((resolve) => {
		Deno.stdin.read(new Uint8Array(1)).then(() => resolve());
	});*/
}

/**
 * 
 * END
 * 
 */

console.log(`------------Day ${days}------------`);

if(getAlive().length == 0){
	console.log("Nobody wins :(");
} else {
	const lucky_one = getAlive()[0];
	let statusMessage = '';
	if (lucky_one.status.some(status => status.state == StatusEnum.INJURED)) {
		statusMessage = ' (while injured!)';
	} else if (lucky_one.status.some(status => status.state == StatusEnum.POISONED)) {
		statusMessage = ' (while poisoned!)';
	}
	console.log(`Player ${lucky_one.name} wins ${statusMessage}! (${lucky_one.kills})`);

	const mostKills = player_list.reduce((max, player) => player.kills > max.kills ? player : max, player_list[0]);
	console.log(`Player with most kills: ${mostKills.name} (${mostKills.kills})`);

}
