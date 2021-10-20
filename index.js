const sql = require('sqlite3').verbose();

const log = console.log;
let playerDataBase = new sql.Database('./db/playerlist.db', sql.OPEN_READWRITE | sql.OPEN_CREATE, err => {
  if (err) console.error(err);

  console.log("connected to the playerlist Database");
});

(require('./app'))();

(async () => {
  const { equal } = require('assert');
  const getOnlines = require('./OnlinePlayerCacher');
  const { wynnWrap } = require('./requests');

  await getOnlines.getOnlinePlayers(playerDataBase);

  await require('./UpdatePlayerList')(playerDataBase);

})();


