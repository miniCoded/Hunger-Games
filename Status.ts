/**
 * Statuses contain:
 * - An enum value which tells which state it is
 * - An integer value which tells how many days have passed
 * - A payload which is executed on every game loop
 * 
 * Statuses are debuffs every player has and they indicate how the player is. Some will kill it, other may not.
 */

import { Player } from "./Player.ts";
import { ItemType } from "./Inventory.ts";

export enum StatusEnum {
	ALIVE   , // All ALIVE players are still in the game
	DEAD    , // All DEAD players are no longer playing
	INJURED , // INJURED players die in 2 days
	POISONED, // POISONED players have a 30% chance of dying next round and a 10% chance of healing

	HUNGER  , // Hunger applies in 4 days. After that, each day the odds of dying increases
	THIRST  , // Thirst applies in 3 days. After that, each day the odds of dying increases
}

type PayloadType = (self: Status, player?: Player) => void;

export class Status {
	constructor(state: StatusEnum, payload: PayloadType){
		this.state = state;
		this.days_since_effect = 0;
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

const generic_die = (player: Player) => {
	player.status = [StatusList[StatusEnum.DEAD]()];
	player.status[0].payload(player.status[0], player);
	player.status[0].days_since_effect = 0;
}

export const StatusList: Array<() => Status> = [
	// ALIVE status
	// Being alive needs food and water
	() => new Status(
			StatusEnum.ALIVE,
			increment_day((_: Status, player?: Player) => {
				if(typeof(player) != "undefined"){
					player.days_since_hunger++;
					player.days_since_thirst++;

					if(player.days_since_hunger == 3){
						player.status.push(StatusList[StatusEnum.HUNGER]());
					}

					if(player.days_since_thirst == 2){
						player.status.push(StatusList[StatusEnum.THIRST]());
					}
				}
			})
		),
	// DEAD status
	() => new Status(
			StatusEnum.DEAD,
			increment_day((_: Status, player?: Player) => {
				if(typeof(player) != "undefined"){
					player.status = player.status.slice(0, 1);
				}
			})
		),
	// INJURED status
	() => new Status(
			StatusEnum.INJURED,
			increment_day((self: Status, player?: Player) => {
				
				if(typeof(player) != "undefined"){
					const has_sew = player.inventory.findIndex((item) => item.name == "sew");
					const has_medkit = player.inventory.findIndex((item) => item.name == "medkit");

					if(has_sew >= 0 || has_medkit >= 0){
						console.log(`${player.name} healed their wounds`);
						player.inventory.splice(Math.max(has_sew, has_medkit), 1);
						player.status = player.status.filter((status) => status.state != StatusEnum.INJURED);

					} else if (player.status.filter((status) => status.state == StatusEnum.INJURED).length > 1) {
						
						generic_die(player);
	
						console.log(`${player.name} has died from multiple injuries`);
						return;
					} else if(self.days_since_effect > 2 && typeof(player) != "undefined"){
						console.log(`${player.name} has died from their injuries`);
						
						generic_die(player);
					}
				}

			})
		),
	// POISONED status
	() => new Status(
			StatusEnum.POISONED,
			increment_day((_: Status, player?: Player) => {
				const their_fate = Math.random();

				if(typeof(player) != "undefined"){
					const has_herbs = player.inventory.findIndex((item) => item.name == "herbs");
					const has_medkit = player.inventory.findIndex((item) => item.name == "medkit");

					if(has_herbs >= 0 || has_medkit >= 0){
						console.log(`${player.name} took medicine. They feel way better`);
						player.inventory.splice(Math.max(has_herbs, has_medkit), 1);
						player.status = player.status.filter((status) => status.state != StatusEnum.POISONED);

					} else if(their_fate < .1){
						player.status = player.status.filter((status) => status.state != StatusEnum.POISONED);
						console.log(`${player.name} is no longer poisoned`);
					} else if(their_fate < .3){

						generic_die(player);

						console.log(`${player.name} has died from poisoning`);
					} 
				}

			})
		),
	// HAMBURGER status
	() => new Status(
		StatusEnum.HUNGER,
		increment_day((_: Status, player?: Player) => {
			if(typeof(player) != "undefined"){
				const has_food = player.inventory.findIndex((item) => item.what_item == ItemType.FOOD);

				if(has_food >= 0){
					player.inventory.splice(has_food, 1);

					player.status = player.status.filter((status) => status.state != StatusEnum.HUNGER);
					player.days_since_hunger = 0;
				} else if(player.days_since_hunger > 4 && Math.random() < (-(1/(.25 * (player.days_since_hunger-3))) + 1)){
					
					generic_die(player);

					player.days_since_hunger = 0;
					player.days_since_thirst = 0;
					
					console.log(`${player.name} has died of hunger`);
				}
			}
		})
	),
	// THIRST state
	() => new Status(
		StatusEnum.THIRST,
		increment_day((_: Status, player?: Player) => {
			if(typeof(player) != "undefined"){
				const has_water = player.inventory.findIndex((item) => item.what_item == ItemType.DRINK);

				if(has_water >= 0){

					player.inventory.splice(has_water, 1);

					player.status = player.status.filter((status) => status.state != StatusEnum.THIRST);
					player.days_since_thirst = 0;
				} else if(player.days_since_thirst > 3 && Math.random() < (-(1/(player.days_since_thirst-2)) + 1)){

					generic_die(player);

					player.days_since_hunger = 0;
					player.days_since_thirst = 0;

					console.log(`${player.name} has died of thirst`);
				}
			}
		})
	)
];
