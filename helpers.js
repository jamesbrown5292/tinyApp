const emailLookup = (emailAddress, database) => {
  for (let user in database) {
    const userID = database[user]['id'];
    if (database[user]['email'] === emailAddress) {
      return userID;
    }
  }
  return undefined;
};

const generateRandomString = () => {
  //loop from 1-6
  //generate a random number between (48 - 90 excluding 58 - 64), get char code from this number
  let retString = "";
  while (retString.length < 6) {
    let raNum = Math.ceil(Math.random() * (90 - 49) + 48);
    if (raNum >= 58 && raNum <= 64) {
      continue;
    } else {
      let addChar = String.fromCharCode(raNum);
      retString += addChar;
    }
  }
  return retString.toLowerCase();
};

module.exports = { emailLookup, generateRandomString };