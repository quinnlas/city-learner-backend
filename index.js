const express = require('express');
const cors = require('cors')
const Axios = require('axios')
const fs = require('fs/promises')

const app = express()
app.use(cors())
app.set('query string', 'extended')
const port = 3000

// // example for self hosting
// const util = require('util');
// const exec = util.promisify(require('child_process').exec);
// async function queryDB(query) {
//   console.log('Running query:', query)

//   const child = await exec(`/home/quinn/code/overpass/osm-3s_v0.7.62.11/bin/osm3s_query --db-dir="/home/quinn/code/overpass/data/" --request='${query}'`, {
//     // big enough for Minneapolis roads
//     maxBuffer: 1024 * 1024 * 64
//   })

//   if (child.stderr) {
//     // don't throw, because it's just debug usually
//     console.error(child.stderr)
//   }

//   return JSON.parse(child.stdout)
// }

let overpass

async function initiate() {
  const API_KEY = await fs.readFile('./API_KEY', {encoding: 'utf8'})
  overpass = Axios.create({
    baseURL: `https://overpass.nextgis.com/${API_KEY}/api/interpreter`
  })
  console.log('Initiated Overpass API successfully.')
}

initiate().catch(console.error)

async function queryDB(query) {
  console.log('Running query:', query)

  const res = await overpass.post("", "data=" + encodeURIComponent(query))

  return res.data
}

function scrubCityName(name) {
  // prevent injection
  return name.replaceAll('"', '')
}

app.get('/borders/', async (req, res) => {
  // curl localhost:3000/borders?name=Minneapolis
  console.log(req.query)

  // quotes are needed in the query to prevent injection
  const query = `
  [out:json][timeout:25];
  relation["name"="${scrubCityName(req.query.name)}"];
  out geom;`

  res.json(await queryDB(query))
})

app.get('/roads/', async (req, res) => {
  // curl "localhost:3000/roads?minlat=44.8906175&maxlat=45.0512576&minlon=-93.3291250&maxlon=-93.1938590"
  console.log(req.query)

  const bbox = {}

  // prevent injection and validate
  for (let key of ['minlat', 'maxlat', 'minlon', 'maxlon']) {
    if (!req.query[key] || Number.isNaN(Number.parseFloat(req.query[key]))) {
      res.status(400)
      return res.send(`Missing query string param ${key}!\n`)
    }

    bbox[key] = Number.parseFloat(req.query[key])
  }

  const bboxStr = [bbox.minlat, bbox.minlon, bbox.maxlat, bbox.maxlon].join(',')

  const query = `
  [out:json][timeout:25];
  (
    way[highway](${bboxStr});
  );
  out geom;`

  res.json(await queryDB(query))
})

app.listen(port, () => {
  console.log(`city-learner-backend listening on port ${port}`)
})