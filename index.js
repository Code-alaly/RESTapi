const express = require('express');
const app = express();

const {Datastore} = require('@google-cloud/datastore');
const bodyParser = require('body-parser');

const datastore = new Datastore({projectId: 'cloud-jetbrains-project'});

const boat = 'boats';

const s = 'slips';

const router = express.Router();

app.use(bodyParser.json());

function fromDatastore(item) {
  item.id = item[Datastore.KEY].id;
  return item;
}

// now creating the boats and slips assignment.

/* ------------- Begin boat Model Functions ------------- */
function post_boat(name, type, length) {
  const key = datastore.key(boat);
  const new_boat = {name: name, type: type, length: length};
  return datastore.save({key: key, data: new_boat}).then(() => {
    return key;
  });
}

function get_boats() {
  const q = datastore.createQuery(boat);
  return datastore.runQuery(q).then((entities) => {
    return entities[0].map(fromDatastore);
  });
}

function put_boat(id, name, description, price) {
  const key = datastore.key([boat, parseInt(id, 10)]);
  const boat = {name: name, type: description, length: price};
  return datastore.save({key: key, data: boat});
}

function delete_boat(id) {
  const key = datastore.key([boat, parseInt(id, 10)]);
  return datastore.delete(key);
}

/* ------------- End Model Functions ------------- */

/* ------------- Begin Controller Functions ------------- */

router.get('/', function (req, res) {
  const boats = get_boats().then((boats) => {
    res.status(200).json(boats);
  });
});

router.post('/', function (req, res) {
  post_boat(req.body.name, req.body.type, req.body.length).then((key) => {
    const self = 'http://' + req.headers['host'] + '/boats/' + key.id;
    res.status(201).json({
      name: req.body.name,
      type: req.body.type,
      length: req.body.length,
      id: key.id,
      self: self,
    });
  });
});

router.put('/:id', function (req, res) {
  put_boat(req.params.id, req.body.name, req.body.type, req.body.length).then(
    res.status(200).end()
  );
});

router.delete('/:id', function (req, res) {
  delete_boat(req.params.id).then(res.status(200).end());
});

app.use('/boats', router);
/* ------------- End Controller Functions ------------- */

// begin slip model functions

function post_slips(number) {
  const key = datastore.key(s);
  const new_slip = {number: number};
  return datastore.save({key: key, data: new_slip}).then(() => {
    return key;
  });
}

function get_slips() {
  const q = datastore.createQuery(s);
  return datastore.runQuery(q).then((entities) => {
    return entities[0].map(fromDatastore);
  });
}

function put_slips(id, boat) {
  const key = datastore.key([s, parseInt(id, 10)]);
  const slip = {boat: boat};
  return datastore.save({key: key, data: slip});
}

function delete_slips(id) {
  const key = datastore.key([s, parseInt(id, 10)]);
  return datastore.delete(key);
}

app.use('/slips', function (req, res) {
  const slips = get_slips().then((slips) => {
    res.status(200).json(slips);
  });
});

app.post('/slips', function (req, res) {
  post_slips(req.body.number).then((key) => {
    res
      .status(200)
      .send(
        '{ "id": ' +
          key.id +
          ' }, ' +
          '{ "number": ' +
          req.body.number +
          ' },' +
          '{ "current_boat": ' +
          'null' +
          ' }'
      );
  });
});

app.put('slips/:s_id/:b_id', function (req, res) {
  put_slips(req.params.id, req.params, req.body.boat).then(
    res.status(200).end()
  );
});

// app.use('/slips', router);

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});
