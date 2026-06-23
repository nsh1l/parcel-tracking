export function getSavedItems() {
  return JSON.parse(localStorage.getItem("savedTrackings") || "[]");
}

export function saveItems(items) {
  localStorage.setItem("savedTrackings", JSON.stringify(items));
}

export function addSavedItem(carrier, memo, trackingNumber, maxSaved = 8, direction = "shipping") {
  const items = getSavedItems();
  
  const exists = items.some(
    (i) => i.carrier === carrier && i.trackingNumber === trackingNumber,
  );
  if (exists) return items;

  if (items.length >= maxSaved) {
    items.shift();
  }
  items.push({ carrier, memo, trackingNumber, direction });
  saveItems(items);
  return items;
}

export function removeSavedItem(index) {
  const items = getSavedItems();
  items.splice(index, 1);
  saveItems(items);
  return items;
}
