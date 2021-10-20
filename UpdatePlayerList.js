const sql = require('sqlite3').verbose();
const internal = require('stream');
const requests = require('./requests');
const createPlayerListQuery = `CREATE TABLE IF NOT EXISTS PlayerList(
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


let offset = 0; // next to offset for sniping.


/**
 * 
 * @param {import('sqlite3').Database} playerDataBase 
 * @returns 
 */
const updateDatabase = async (playerDataBase) => {

    const playersAndWorlds = [{}];


    // 
    playerDataBase.serialize(async () => {

        playerDataBase.get(`select count(name) as cnt from OnlinePlayers `, (err, len) => {
            if (err) throw err;
            let length = len.cnt;
            playerDataBase.each(

                `select * from OnlinePlayers
            where name not in (
                select name from SKIPME
            )
        limit 100 OFFSET ${offset};
        `, async (err, row) => { // this is the sniping thing. update them here.
                let name = row.name;

                const data = await requests.getData(name);

                const { uuid, meta: metadata, classes } = data.data[0];
                const { firstJoin, lastJoin, location } = metadata;
                const highestLevel = Math.max(...classes.map((v) => v.professions.combat.level));
                const totalChests = classes.reduce(
                    (accum, curr) => {
                        // the chests the player has found on the classes, and all their logins.. all adde up.
                        return [accum[0] + curr.logins, accum[1] + curr.chestsFound]
                    },
                    [0, 0]
                );
                playerDataBase.exec(
                    `
                 INSERT OR REPLACE into PlayerList(name, uuid, wc, level, chestsTotal, loginsTotal) values ('${row.name}', '${uuid}', '${row.wc}', ${highestLevel}, ${totalChests[1]}, ${totalChests[0]})
                `
                    , (err) => { if (err) console.log(err); })
                if (offset >= length) {
                    offset = 0;
                }
            });
            offset += 200;
            if (offset > length) {
                offset = length;
            }
        });
    });
    // console.log(playersAndWorlds);
    return 200;

}
module.exports = async (playerDataBase) => {

    // create db
    playerDataBase.serialize(() => {
        playerDataBase.exec(createPlayerListQuery, (err) => {
            if (err) console.error(`caught error executing db: ${err}`);
        });
    });

    await updateDatabase(playerDataBase);
    console.log('wtf');



}



