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
import { StatusEnum, StatusList } from "./Status.ts";

type PayloadType = (player_list: Array<Player>, group_list?: Array<Group>, interactions?: number, days?: number) => [string, number];
type EventSubvariants = [string, number, string, (player?: Player) => void];

export function select_random_player(players: Array<Player>): Player{
	return players[Math.floor(Math.random() * players.length)];
}

function filter_alive(players: Array<Player>): Array<Player>{
	return players.filter((player) => player.status[0].state == StatusEnum.ALIVE);
}

function _filter_dead(players: Array<Player>): Array<Player>{
	return players.filter((player) => player.status[0].state == StatusEnum.DEAD);
}

const generic_die = (player?: Player) => {
	if(typeof(player) != "undefined"){
		player.status = [StatusList[StatusEnum.DEAD]()];
	}
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
	new Event(.60, 1,"idle", (players: Array<Player>) => {
		players = filter_alive(players);

		let player1: Player = select_random_player(players);
		while(player1.interacted)
			player1 = select_random_player(players);

		const Outcomes: Array<EventSubvariants> = [
			["nap"       , .3, `${player1.name} takes a nap`          , () => {}],
			["walk"      , .3, `${player1.name} goes for a walk`      , () => {}],
			["clouds"    , .3, `${player1.name} watches the clouds`   , () => {}],
			["bonfire"   , .3, `${player1.name} sits by the fire`     , () => {}],
			["meditation", .3, `${player1.name} meditates`            , () => {}],
			["daydream"  , .3, `${player1.name} daydreams`            , () => {}],
			["draw"      , .3, `${player1.name} draws with a stick`   , () => {}],
			["sing"      , .3, `${player1.name} sings`                , () => {}],
			["stars"     , .3, `${player1.name} stares into the stars`, () => {}],
			["stand"     , .3, `${player1.name} stands still`         , () => {}],
		]

		const event = Event.pick_event(Outcomes) as EventSubvariants;

		player1.interacted = true;

		return [event[2], 1]
	}),

	// Generic "player kills player" event for 2 players.
	new Event(0.10, 2, "murder", (players: Array<Player>) => {
		players = filter_alive(players);
		let player1: Player = select_random_player(players);
		let player2: Player = select_random_player(players);

		while(player1.interacted) player1 =select_random_player(players);
		while(player2.interacted || player2 == player1) player2 =select_random_player(players);

		const Outcomes: Array<EventSubvariants> = [
			["both"  , .05, `${player1.name} attempted to kill ${player2.name}. Both die instead`  , () => {
				generic_die(player1);
				generic_die(player2);
			}],
			["karma" , .10, `${player1.name} tries to kill ${player2.name}, but kills them instead`, () => {
				player2.kills++;
				generic_die(player1);
			}],
			["escape", .15, `${player1.name} attempts to kill ${player2.name}, but them escapes`   , () => {

			}],
			["wound" , .20, `${player1.name} has fatally wounded ${player2.name}`                  , () => {
				player2.status.push(StatusList[StatusEnum.INJURED]());
			}],
			["clean" , .40, `${player1.name} kills ${player2.name}`                                , () => {
				player1.kills++;
				generic_die(player2);

			}],
		];

		const event = Event.pick_event(Outcomes) as EventSubvariants;

		event[3]();

		player1.interacted = true;
		player2.interacted = true;

		return [event[2], 2];
	}),
	// Generic "something bad happens" to a single player
	new Event(0.15, 1, "kill", (players: Array<Player>) => {
		players = filter_alive(players);
		let player1: Player = select_random_player(players);
		while(player1.interacted)
			player1 = select_random_player(players)

		const Outcomes: Array<EventSubvariants> = [
			["suicide" , .01, `${player1.name} kills themself`                           , generic_die],
			["storm"   , .02, `${player1.name} is struck by lightning`                   , generic_die],
			["cliff"   , .10,`${player1.name} falls off a cliff`                         , generic_die],
			["lit"     , .10,`While trying to lit a fire, ${player1.name} burns themself`, () => {
				player1.status.push(StatusList[StatusEnum.INJURED]());
			}],
			["eaten"   , .20,`${player1.name} is eaten by a bear`                        , generic_die],
			["berries" , .20,`${player1.name} is poisoned by berries`                    , () => {
				player1.status.push(StatusList[StatusEnum.POISONED]());
			}],
			["snake"   , .20,`${player1.name} is bitten by a snake`                      , () => {
				player1.status.push(StatusList[StatusEnum.POISONED]());
			}],
			["lake"    , .30,`${player1.name} drowns while swimming in a lake`           , generic_die],
			["mud"     , .30, `${player1.name} sinks in the mud`                         , generic_die],
			["tree"    , .50,`${player1.name} falls off a tree`                          , generic_die],
		]
		
		const event = Event.pick_event(Outcomes) as EventSubvariants;

		event[3](player1);

		player1.interacted = true;

		return [event[2], 1];
	}),
	// Player comes back from the dead
	new Event(0.0, 1, "reanimation", (players: Array<Player>) => {
		// const player_list_dead: Array<Player> = filter_dead(players);
		
		const player1: Player = players[Math.floor(Math.random() * players.length)];

		player1.status[0] = StatusList[StatusEnum.ALIVE]();

		return [`${player1.name} returned from the dead`, 0];
	})
]