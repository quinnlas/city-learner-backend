# Install and run
```
npm i
npm run dev
```

# TODO
- set up areas (db, document, streets in borders route)
- set up overpass API (might have better performance than running `exec()`)

# Setting up the DB
download osmium (best done on linux):

https://wiki.openstreetmap.org/wiki/Osmium

this has a lot of functions but primarily is needed to convert the file format of the map data

download the .pbf file:

https://download.geofabrik.de/north-america/us/minnesota.html

convert the .pbf file (e.g.):

```sh
osmium cat -o minnesota-261101.osm minnesota-261101.osm.pbf
```

download and install overpass:

https://dev.overpass-api.de/overpass-doc/en/more_info/setup.html

create the overpass database from the .osm file (e.g.):

```sh
./osm-3s_v0.7.62.11/bin/update_database --db-dir="data/" < minnesota-261101.osm
```

run a test query:

```sh
echo '[out:json][timeout:25];
  (
    way["highway"="secondary"](44.9141278,-93.2551289,44.9317520,-93.1929016);
  );
  out geom;' |
./osm-3s_v0.7.62.11/bin/osm3s_query --db-dir="data/"
```

note that areas are not enabled, you would need to continue the setup process for that