const ItemSpawner = () => {
  const spawnInitItems = () => {
    CustomState.dispatch({
      type: "SET_TABLE_DATA",
      payload: {
        tableName: "loot",
        data: newInventory,
      },
    });
  };
};
