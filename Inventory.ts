/**
 * Each player has an Inventory of items, which they can use.
 * 
 * Each item has a name, type (weapon, consumeable, utility) and uses (wear)
 */

export enum ItemType {
	WEAPON,
	FOOD,
	DRINK,
	UTILITY,
}

export type Item = {
	what_item: ItemType,
	name: string,
	wear: number,
}

export const ItemList: Array<() => Item> = [
	() => {return {what_item: ItemType.FOOD, name: "food", wear: 1};},
	() => {return {what_item: ItemType.DRINK, name: "water", wear: 1};},
]