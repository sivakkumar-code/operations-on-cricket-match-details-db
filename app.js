const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializingDBandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Started Listening...");
    });
  } catch (err) {
    console.log(`DB error ${err.message}`);
    process.exit(1);
  }
};
initializingDBandServer();

// Returns a list of all the players in the player table
app.get("/players/", async (req, res) => {
  const sqlQuery = `
        SELECT player_id AS playerId, player_name AS playerName
        FROM player_details;
    `;
  const dbResponse = await db.all(sqlQuery);
  res.send(dbResponse);
});

// Returns a specific player based on the player ID
app.get("/players/:playerId/", async (req, res) => {
  const { playerId } = req.params;
  const sqlQuery = `
        SELECT player_id AS playerId, player_name AS playerName
        FROM player_details
        WHERE player_id = ${playerId};
    `;
  const dbResponse = await db.get(sqlQuery);
  res.send(dbResponse);
});

// Updates the details of a specific player based on the player ID
app.put("/players/:playerId/", async (req, res) => {
  const { playerId } = req.params;
  const playerDetails = req.body;
  const { playerName } = playerDetails;
  const sqlQuery = `
        UPDATE
            player_details
        SET 
            player_name = '${playerName}'
        WHERE player_id = ${playerId};
    `;
  await db.run(sqlQuery);
  res.send("Player Details Updated");
});

// Returns the match details of a specific match
app.get("/matches/:matchId/", async (req, res) => {
  const { matchId } = req.params;
  const sqlQuery = `
        SELECT match_id AS matchId, match, year
        FROM match_details
        WHERE match_id = ${matchId};
    `;
  const dbResponse = await db.get(sqlQuery);
  res.send(dbResponse);
});

// Returns a list of all the matches of a player
app.get("/players/:playerId/matches/", async (req, res) => {
  const { playerId } = req.params;
  console.log(req.params);
  const sqlQuery = `
        SELECT match_details.match_id AS matchId, match_details.match AS match, 
        match_details.year AS year
        FROM (player_details 
            JOIN player_match_score 
            ON player_details.player_id = Player_match_score.player_id) AS T1
            JOIN match_details 
            ON match_details.match_id = T1.match_id
        WHERE T1.player_id = ${playerId};
    `;
  const dbResponse = await db.all(sqlQuery);
  res.send(dbResponse);
});

// Returns a list of players of a specific match
app.get("/matches/:matchId/players/", async (req, res) => {
  const { matchId } = req.params;
  const sqlQuery = `
        SELECT 
            player_details.player_id AS playerId,
            player_details.player_name AS playerName
        FROM (player_details 
            JOIN player_match_score 
            ON player_details.player_id = Player_match_score.player_id) AS T1
            JOIN match_details 
            ON match_details.match_id = T1.match_id
        WHERE match_details.match_id = ${matchId};
    `;
  const dbResponse = await db.all(sqlQuery);
  res.send(dbResponse);
});

// Returns the statistics of the total score, fours, sixes of a specific player based on the player ID
app.get("/players/:playerId/playerScores/", async (req, res) => {
  const { playerId } = req.params;
  const sqlQuery = `
        SELECT 
            player_details.player_id AS playerId,
            player_details.player_name AS playerName,
            SUM(T1.score) AS totalScore,
            SUM(T1.fours) AS totalFours,
            SUM(T1.sixes) AS totalSixes
        FROM (player_details 
            JOIN player_match_score 
            ON player_details.player_id = Player_match_score.player_id) AS T1
            JOIN match_details 
            ON match_details.match_id = T1.match_id
        WHERE T1.player_id = ${playerId}
        GROUP BY T1.player_id;
    `;
  const dbResponse = await db.get(sqlQuery);
  res.send(dbResponse);
});

module.exports = app;
