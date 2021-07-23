require('dotenv').config()
const express = require('express');
const app = express();
const path = require('path');
const monk = require('monk');
const db = require('monk')(process.env.DB_URL)

app.use(express.json());

const movie_data = db.get('movie_data')

app.get('/', async (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
})

app.get('/getAllMovies', async (req, res) => {
  const limit = 5;
  let skip = limit * (parseInt(req.query.page || 1))
  const movieListdata = await movie_data.find({}, {
    fields: {
      original_title: 1,
      vote_average: 1,
      vote_count: 1,
      genres:1
    },
    limit: 5,
    skip,
    sort:{ _id:1 }
  })

  res.json({
    movieListdata
  })
})

app.get('/getRecommendation', async (req, res) => {
  const recommendadtion = await movie_data.aggregate([
    {
      $match: {
        "vote_average": { $not: { $type: "string" } },
        "vote_count": { $not: { $type: "string" } },
        "genres": req.query.genres,
        "_id":{$ne:monk.id(req.query._id)}
      }
    },
    {
      $project: {
        original_title: 1,
        vote_average: 1,
        vote_count: 1,
        overview:1,
        release_date:1,
        genres:1,
        distance: {
          $sqrt: {
            $add: [
              { $pow: [{ $subtract: [Number(req.query.vote_average), "$vote_average"] }, 2] },
              { $pow: [{ $subtract: [Number(req.query.vote_count), "$vote_count"] }, 2] }
            ]
          }
        }
      }
    },
    {
      $match: {
        distance: { $ne: null }
      }
    },
    {
      $sort: { distance: 1 },
    },
    {
      $limit: 5
    }
  ])

  res.json({
    recommendadtion
  })
})

app.listen(3000, (err) => {
  if (err) console.log(err);
  else console.log('Server on port 3000');
})