/**
 * Players are just simple objects that interact with each other.
 * 
 * TODO: implement inventory.
 */

import {Status} from "./Status.ts"

export type Player = {
	name: string
	kills: number
	status: Array<Status>
	interacted: boolean
}

export type Group = {
	name: string
	members: Array<Player>
	interacted: boolean
}
