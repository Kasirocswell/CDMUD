import supabase from "../../utils/supabase";

// Check inventory

export const inventoryCheck = async () => {
  const { data: inventory } = await supabase
    .from("Inventory")
    .select("*")
    .eq("uid", characterId);
};

// Add an item to a character's inventory
export const addItemToInventory = async (
  characterId,
  itemId,
  name,
  quantity = 1
) => {
  // Check for existing items
  const { data: existingItems } = await supabase
    .from("Inventory")
    .select("*")
    .eq("uid", characterId)
    .eq("item_id", itemId);

  if (existingItems.length > 0) {
    // Increase existing item quantity
    const { data, error } = await supabase
      .from("Inventory")
      .update({ quantity: existingItems[0].quantity + quantity })
      .eq("item_id", existingItems[0].id);

    // exception handling here
  } else {
    // If the item does not exist in inventory, add it
    const { data, error } = await supabase
      .from("Inventory")
      .insert([
        { uid: characterId, id: itemId, name: name, quantity: quantity },
      ]);

    // exception handling here
  }
};

// Remove an item from inventory
export const removeItemFromInventory = async (
  characterId,
  itemId,
  quantity = 1
) => {
  // Check if the character has this item in their inventory
  const { data: existingItems } = await supabase
    .from("Inventory")
    .select("*")
    .eq("uid", characterId)
    .eq("item_id", itemId);

  if (existingItems.length > 0) {
    if (existingItems[0].quantity > quantity) {
      // If the remaining quantity will be greater than zero, decrease the quantity
      const { data, error } = await supabase
        .from("Inventory")
        .update({ quantity: existingItems[0].quantity - quantity })
        .eq("id", existingItems[0].id);

      // exception handling here
    } else {
      // If the remaining quantity will be zero, remove the item from the inventory
      const { data, error } = await supabase
        .from("Inventory")
        .delete()
        .eq("id", existingItems[0].id);

      // exception handling here
    }
  } else {
    // If the item does not exist in the inventory, do nothing or handle as an error
  }
};

// Equip an item
export const equipItem = async (characterId, itemId, slot) => {
  // Check if the character already has an item equipped in the same slot
  const { data: equippedItems } = await supabase
    .from("Equipment")
    .select("*")
    .eq("character_id", characterId)
    .eq("slot", slot);

  if (equippedItems.length > 0) {
    // If an item is already equipped in this slot, unequip it
    await unequipItem(characterId, equippedItems[0].item_id);
  }

  // Equip the new item
  const { data, error } = await supabase
    .from("Equipment")
    .insert([{ character_id: characterId, item_id: itemId, slot: slot }]);

  // exception handling here

  // Remove the item from the inventory
  await removeItemFromInventory(characterId, itemId);
};

// Unequip an item
export const unequipItem = async (characterId, itemId) => {
  // Remove the item from the equipment
  const { data, error } = await supabase
    .from("Equipment")
    .delete()
    .match({ character_id: characterId, item_id: itemId });

  // exception handling here

  // Add the item back to the inventory
  await addItemToInventory(characterId, itemId);
};
