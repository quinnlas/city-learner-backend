const express = require('express');
const util = require('node:util');
const exec = util.promisify(require('node:child_process').exec);

const app = express()
app.set('query string', 'extended')
const port = 3000

async function queryDB(query) {
  console.log('Running query:', query)

  const child = await exec(`/home/quinn/code/overpass/osm-3s_v0.7.62.11/bin/osm3s_query --db-dir="/home/quinn/code/overpass/data/" --request='${query}'`, {
    // big enough for Minneapolis roads
    maxBuffer: 1024 * 1024 * 8
  })

  if (child.stderr) {
    // don't throw, because it's just debug usually
    console.error(child.stderr)
  }

  return child.stdout
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

  res.send(await queryDB(query))
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
    way["highway"="motorway"](${bboxStr});
    way["highway"="trunk"](${bboxStr});
    way["highway"="primary"](${bboxStr});
    way["highway"="secondary"](${bboxStr});
    way["highway"="tertiary"](${bboxStr});
    way["highway"="unclassified"](${bboxStr});
  );
  out geom;`

  res.send(await queryDB(query))
})

app.listen(port, () => {
  console.log(`city-learner-backend listening on port ${port}`)
})