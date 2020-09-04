const emailLookup = (emailAddress, database) => {
  for (let user in database) {
    const userID = database[user]['id'];
    if (database[user]['email'] === emailAddress) {
      return userID;
    }
  }
  return undefined;
};

module.exports = { emailLookup };