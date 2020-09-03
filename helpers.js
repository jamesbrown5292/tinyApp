const emailLookup = (emailAddress, database) => {
  for (let userId in database) {
    const user = database[userId];
    if (user.email === emailAddress) {
      return user;
    }
  }
  return false;
};

module.exports = { emailLookup };