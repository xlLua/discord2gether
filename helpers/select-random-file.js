const path = require("path");
const fs = require("fs");

module.exports = async function selectRandomFile(dir) {
  return new Promise((resolve, reject) => {
    fs.readdir(dir, (err, files) => {
      if (err) return reject(err);

      function checkRandom() {
        if (!files.length) {
          return resolve(null);
        }
        const randomIndex = Math.floor(Math.random() * files.length);
        const file = files[randomIndex];
        fs.stat(path.join(dir, file), (err, stats) => {
          if (err) return reject(err);
          if (stats.isFile()) {
            return resolve(file);
          }
          // remove this file from the array because for some reason it's not a file
          files.splice(randomIndex, 1);

          // try another random one
          checkRandom();
        });
      }
      checkRandom();
    });
  });
};
