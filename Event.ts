/**
 * Events contain:
 * - A chance of occuring
 * - A number of players it affects
 * - A payload
 * 
 * Some events may share similarities, but in general no two events are equal.
 * Some events may only apply to a single player, others my affect multiple
 * players and another ones ay affect group players (gangs/packs)
 */

import { Player, Group } from "./Player.ts";
import { Status, StatusEnum, StatusList } from "./Status.ts";

type PayloadType = (player_list: Array<Player>, group_list?: Array<Group>, interactions?: number, days?: number) => [string, number];
type EventSubvariants = [string, number, string, () => void];

function select_random_player(players: Array<Player>): Player{
	return players[Math.floor(Math.random() * players.length)];
}

function filter_alive(players: Array<Player>): Array<Player>{
	return players.filter((player) => player.status[0].state == StatusEnum.ALIVE);
}

function filter_dead(players: Array<Player>): Array<Player>{
	return players.filter((player) => player.status[0].state == StatusEnum.DEAD);
}

export class Event {
	constructor(chance: number, play_affected: number, name:string, payload: PayloadType){
		this.chance = chance;
		this.play_affected = play_affected;
		this.payload = payload;
		this.name = name;
	}

	static pick_event(events: Array<Event|EventSubvariants>): Event|EventSubvariants{
		for(let i = 0; i < events.length; i++){
			const event = events[i];
			let luck = 0;
			if(event instanceof Event)
				luck = event.chance;
			else
				luck = event[1]

			if(Math.random() < luck)
				return event;
			else
				continue;
		}

		
		return events[events.length - 1];
	}

	chance: number;
	play_affected: number;
	payload: PayloadType;
	name: string;
}

export const EventList: Array<Event> = [
	// Generic "do nothing" event for 1 player.
	new Event(.5, 1,"idle", (players: Array<Player>) => {
		players = filter_alive(players);

		let player1: Player = select_random_player(players);
		while(player1.interacted)
			player1 = select_random_player(players);

		const Outcomes: Array<EventSubvariants> = [
			["nap"       , .5, `${player1.name} takes a nap`          , () => {}],
			["walk"      , .5, `${player1.name} goes for a walk`      , () => {}],
			["clouds"    , .5, `${player1.name} watches the clouds`   , () => {}],
			["bonfire"   , .5, `${player1.name} sits by the fire`     , () => {}],
			["meditation", .5, `${player1.name} meditates`            , () => {}],
			["daydream"  , .5, `${player1.name} daydreams`            , () => {}],
			["draw"      , .5, `${player1.name} draws with a stick`   , () => {}],
			["sing"      , .5, `${player1.name} sings`                , () => {}],
			["stars"     , .5, `${player1.name} stares into the stars`, () => {}],
			["stand"     , .5, `${player1.name} stands still`         , () => {}],
		]

		const event = Event.pick_event(Outcomes) as EventSubvariants;

		player1.interacted = true;

		return [event[2], 1]
	}),

	// Generic "player kills player" event for 2 players.
	new Event(0.3, 2, "murder", (players: Array<Player>) => {
		players = filter_alive(players);
		let player1: Player = select_random_player(players);
		let player2: Player = select_random_player(players);

		while(player1.interacted) player1 =select_random_player(players);
		while(player2.interacted || player2 == player1) player2 =select_random_player(players);

		const Outcomes: Array<EventSubvariants> = [
			["both"  , .05, `${player1.name} attempted to kill ${player2.name}. Both die instead`  , () => {
				player1.status[0] = StatusList[StatusEnum.DEAD]();
				player2.status[0] = StatusList[StatusEnum.DEAD]();

				player1.status[0].payload(player1.status[0]);
				player2.status[0].payload(player2.status[0]);
			}],
			["karma" , .10, `${player1.name} tries to kill ${player2.name}, but kills them instead`, () => {
				player2.kills++;
				player1.status[0] = StatusList[StatusEnum.DEAD]();
				player1.status[0].payload(player1.status[0]);

			}],
			["escape", .15, `${player1.name} attempts to kill ${player2.name}, but them escapes`   , () => {

			}],
			["wound" , .20, `${player1.name} wounds ${player2.name}`                               , () => {
				player2.status.push(StatusList[StatusEnum.INJURED]());
			}],
			["clean" , .40, `${player1.name} kills ${player2.name}`                                , () => {
				player1.kills++;
				player2.status[0] = StatusList[StatusEnum.DEAD]();
				player2.status[0].payload(player2.status[0]);

			}],
		];

		const event = Event.pick_event(Outcomes) as EventSubvariants;

		event[3]();

		player1.interacted = true;
		player2.interacted = true;

		return [event[2], 2];
	}),
	// Generic "player dies", but no murder
	new Event(0.2, 1, "kill", (players: Array<Player>) => {
		players = filter_alive(players);
		let player1: Player = select_random_player(players);
		while(player1.interacted)
			player1 = select_random_player(players)

		const generic_ded_payload = () => {
			player1.status[0] = StatusList[StatusEnum.DEAD]();
			player1.status[0].payload(player1.status[0])
		}

		const Outcomes: Array<EventSubvariants> = [
			["suicide", .01, `${player1.name} kills themself`                 , generic_ded_payload],
			["cliff"  , .10,`${player1.name} falls off a cliff`              , generic_ded_payload],
			["storm"  , .10, `${player1.name} is struck by lightning`         , generic_ded_payload],
			["eaten"  , .20,`${player1.name} is eaten by a bear`             , generic_ded_payload],
			["poison" , .20,`${player1.name} is poisoned by berries`         , () => {
				player1.status.push(StatusList[StatusEnum.POISONED]());
				player1.status[player1.status.length - 1].days_since_effect++;
			}],
			["lake"   , .30,`${player1.name} drowns while swimming in a lake`, generic_ded_payload],
			["mud"    , .30, `${player1.name} sinks in the mud`               , generic_ded_payload],
			["tree"   , .50,`${player1.name} falls off a tree`               , generic_ded_payload],
		]
		
		const event = Event.pick_event(Outcomes) as EventSubvariants;

		event[3]();

		player1.interacted = true;

		return [event[2], 1];
	}),
	// Player comes back from the dead
	new Event(0.0, 1, "reanimation", (players: Array<Player>) => {
		const player_list_dead: Array<Player> = filter_dead(players);
		
		const player1: Player = players[Math.floor(Math.random() * players.length)];

		player1.status[0] = StatusList[StatusEnum.ALIVE]();

		return [`${player1.name} returned from the dead`, 0];
	})
]