const sql = require('sqlite3').verbose();

const axios = require('axios');


var loadedOnlines = false;







const creations = `
CREATE TABLE IF NOT EXISTS OnlinePlayers(
  name text NOT NULL,
  wc TEXT NOT NULL,
  PRIMARY KEY(name)
);

CREATE TABLE IF NOT EXISTS PlayerList(
  name TEXT NOT NULL,

  uuid TEXT, -- maybe null, uuids are hard to cache wihhout reatelimit
  wc TEXT,
  level INT,
  chestsTotal INT,
  chestsOnWorld INT,
  chestLoginDiff INT,
  loginsTotal INT,
  timeStamp NUMBER,
  timeOnWorld INT,
  PRIMARY KEY(name)
);
CREATE TABLE IF NOT EXISTS SKIPME(
    name TEXT NOT NULL,
    uuid TEXT NOT NULL,
    level INT,
    chestsLooted INT,
    primary key(uuid)
); -- these users are too low level to be sniped.
`

ONLINE_PLAYERS = [];


const filterWorldsWCOnly = (worlds) => {
  return Object.keys(worlds)
    .filter((key) => key.slice(0, 2) === 'WC')
    .reduce((accum, curr) => {
      accum[curr] = worlds[curr]
      return accum
    }, {})
}



const onlinePlayersEndpoint = 'https://api.wynncraft.com/public_api.php?action=onlinePlayers';
async function cacheOnlines(playerDataBase) {

  const playerWorldMap = await axios.get(onlinePlayersEndpoint).then(res => res.data).then(res => filterWorldsWCOnly(res)).then(worldLists => {
    return Object.entries(worldLists).flat()
  }).catch(err => console.log(`error: ${err}`));//.then(res => //console.log(res)));
  // console.log(playerWorldMap);
  return (await axios.get(
    'https://api.wynncraft.com/public_api.php?action=onlinePlayers').then(res => res.data).then(res => filterWorldsWCOnly(res)).then(res => Object.values(res)).then(res => res.flat()).catch(err => console.log(`error: ${err}`)).then(res => ONLINE_PLAYERS = res).then(_ => {
      loadedOnlines = true; // successes!

      playerWorldMap.forEach((worldName, index) => {
        if (index % 2 !== 0)
          return "";
        playerWorldMap[index + 1].map((player) => {
          playerDataBase.exec(
            `
            INSERT OR REPLACE INTO OnlinePlayers(name, wc) VALUES ('${player}', '${worldName}')
            `
          );
        });
      });
      const sqlAllowed = `${ONLINE_PLAYERS.map(e => `'${e}'`)
        .reduce(
          (prev, cur, ind) => {
            // remove offlines from the online list..

            if (ind < ONLINE_PLAYERS.length - 1) {

              return prev + cur + ","
            }
            return prev + cur;
          }, ""
        )}`

      playerDataBase.exec(
        `
        DELETE FROM OnlinePlayers WHERE name NOT IN (${sqlAllowed});
        DELETE FROM SKIPME WHERE name NOT IN (${sqlAllowed});
        DELETE FROM PlayerList WHERE name NOT IN (${sqlAllowed});
        `
      )
    }));

}

const getOnlinePlayers = async (playerDataBase) => {


  playerDataBase.exec(creations);
  await cacheOnlines(playerDataBase
  ); // this just movbes them into the online lists;

  return ONLINE_PLAYERS;
}

module.exports = {
  getOnlinePlayers
}

