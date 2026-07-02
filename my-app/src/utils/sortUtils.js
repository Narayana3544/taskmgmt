/**
 * Sort an array of items so the newest/latest items appear first (descending).
 * By default, uses the 'id' field.
 */
export const sortLatestFirst = (arr, key = "id") => {
  if (!Array.isArray(arr)) return arr;
  return [...arr].sort((a, b) => (b[key] || 0) - (a[key] || 0));
};

/**
 * Sort an array of users alphabetically by their name.
 */
export const sortAlphabetically = (users) => {
  if (!Array.isArray(users)) return users;
  return [...users].sort((a, b) => {
    // Some endpoints wrap the user object in a parent object, e.g. { user: { first_name: '...' } }
    const userA = a.user ? a.user : a;
    const userB = b.user ? b.user : b;

    const nameA =
      userA.first_name ||
      userA.preffered_name ||
      userA.username ||
      userA.name ||
      "";
    const nameB =
      userB.first_name ||
      userB.preffered_name ||
      userB.username ||
      userB.name ||
      "";

    return nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
  });
};
