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
	chance: number
	name: string,
	wear: number,
}

export const ItemList: Array<() => Item> = [
	() => {return {what_item: ItemType.UTILITY , name: "medkit", wear: 1, chance: .01};},
	() => {return {what_item: ItemType.UTILITY , name: "sew"   , wear: 1, chance: .02};},
	() => {return {what_item: ItemType.UTILITY , name: "herbs" , wear: 1, chance: .02};},
	() => {return {what_item: ItemType.FOOD    , name: "food"  , wear: 1, chance: .20};},
	() => {return {what_item: ItemType.DRINK   , name: "water" , wear: 1, chance: .30};},
]

export const pick_random_item = (amount: number) => {
	ItemList.sort((item1, item2) => item2().chance - item1().chance);

	const result_item_list: Array<Item> = [];

	while(result_item_list.length < amount) {
		let last_item: Item = ItemList[ItemList.length - 1]();
		ItemList.forEach((item) => {
			last_item = item();
			if(result_item_list.length < amount && Math.random() < last_item.chance)
				result_item_list.push(last_item);
		})
	}

	return result_item_list;
}