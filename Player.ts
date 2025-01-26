/**
 * Players are just simple objects that interact with each other.
 * 
 * TODO: implement inventory.
 */

import {Status} from "./Status.ts"
import {Item} from "./Inventory.ts"

export type Player = {
	name: string
	kills: number
	status: Array<Status>
	interacted: boolean

	inventory: Array<Item>

	days_since_hunger: number
	days_since_thirst: number
}

export type Group = {
	name: string
	members: Array<Player>
	interacted: boolean
}
