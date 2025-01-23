/**
 * Statuses contain:
 * - An enum value which tells which state it is
 * - An integer value which tells how many days have passed
 * - A payload which is executed on every game loop
 * 
 * Statuses are debuffs eery player has and they indicate how the player is. Some will kill it, other may not.
 */

import { Player } from "./Player.ts"

export enum StatusEnum {
	ALIVE,   // All ALIVE players are still in the game
	DEAD ,   // All DEAD players are no longer playing
	INJURED, // INJURED players die in 5 days
	POISONED // POISONED players have a 40% chance of dying next round and a 10% chance of healing
}

type PayloadType = (self: Status, player?: Player) => void;

export class Status {
	constructor(state: StatusEnum, payload: PayloadType){
		this.state = state;
		this.days_since_effect = -1;
		this.payload = payload;
	}

	state: StatusEnum;
	days_since_effect: number;
	payload: PayloadType;
}

// Per day, status increment the amount of days they've been active.
const increment_day = (payload: PayloadType) => {
	return (self: Status, player?: Player) => {
		self.days_since_effect++;

		return payload(self, player);
	}
}

export const StatusList: Array<() => Status> = [
	// ALIVE status
	() => {
		return new Status(
			StatusEnum.ALIVE,
			increment_day(() => {
			})
		);
	},
	// DEAD status
	() => {
		return new Status(
			StatusEnum.DEAD,
			increment_day((self: Status, player?: Player) => {
				if(typeof(player) != "undefined"){
					player.status = [StatusList[1]()];
				}
			})
		)
	},
	// INJURED status
	() => {
		return new Status(
			StatusEnum.INJURED,
			increment_day((self: Status, player?: Player) => {
				if(self.days_since_effect > 2 && typeof(player) != "undefined"){
					console.log(`${player.name} has died from their injuries`);
					
					player.status = player.status.filter((status) => status.state != StatusEnum.INJURED);
					player.status[0] = StatusList[1]();
					player.status[0].payload(player.status[0]);
				}
			})
		)
	},
	// POISONED status
	() => {
		return new Status(
			StatusEnum.POISONED,
			increment_day((self: Status, player?: Player) => {
				const their_fate = Math.random();

				if(typeof(player) != "undefined"){
					if(their_fate < .1){
						player.status.filter((status) => status.state != StatusEnum.POISONED);
						console.log(`${player.name} is no longer poisoned`);
					} else if(their_fate < .4){
						player.status = [StatusList[1]()];
						player.status[0].payload(player?.status[0], player);
						console.log(`${player.name} has died from poisoning`);
					} 
				}

			})
		);
	}
];
