// board.js: draws the results as columns, one per category.
// Owner: ________

/**
 * @param {object[]} items
 */
export function renderBoard(items) {
  const board = document.getElementById("board");
  // TODO: one column per category, one card per item
  board.textContent = `${items.length} results`;
}
