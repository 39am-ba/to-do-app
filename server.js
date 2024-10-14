const express = require('express');
const session = require('express-session');
const mysql = require('mysql');
const MySQLStore = require('express-mysql-session')(session);
const bodyParser = require('body-parser');
const { redirect } = require('express/lib/response');
const bcrypt = require('bcrypt');

const app = express();
const port = 3000;

// options for MySQL connection
const options = {
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'users',
  port: 3306
};
// creating MySQL connection
const con = mysql.createConnection(options);
con.connect(function(err) {
  if(err) throw err;
  console.log('MySQL connected!');
});
// creating storage for sessions in MySQL connection
const sessionStore = new MySQLStore(options, con);

// use coockies(sessions)
app.use(session({
  secret: 'do not know',
  resave: false,
  saveUninitialized: false,
  store: sessionStore
}));
app.use(express.static('public'));
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

const isAuth = (req, res, next) => {
  if (req.session.isAuth) {
    next()
  } else {
    res.redirect('/login');
  }
}


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/public/login.html');
});

app.post('/login', (req, res) => {
  const {username, password} =  req.body;
  
  if (!username || !password) {
    return res.redirect('/login');
  };

  const sql = "SELECT password, id FROM accounts WHERE username = ?";
  con.query(sql, username, function (err, result, fields) {
    if (err) throw err;
    
    if (result.length == 0) {
      return res.redirect('/login');
    }

    if (bcrypt.compare(password, result[0].password)) {
      req.session.isAuth = true;
      req.session.user_id = result[0].id;
      res.redirect('/main');
    }
    else {
      res.redirect('/login');
    }    
  });
});

app.get('/register', async (req, res) => {
  res.sendFile(__dirname + '/public/register.html');
});

app.post('/register', (req, res) => {
  const {username, password, password2} =  req.body;
  
  if (!username || !password || !password2) {
    return res.redirect('/register');
  }

  if (password !== password2) {
    return res.redirect('/register');
  }

  // check unique username
  let sql = "SELECT * FROM accounts WHERE username = ?";
  con.query(sql, username, function (err, result) {
    if (err) throw err;
    if (result.length) {
      return res.redirect('/register');
    }
    else {
      bcrypt.hash(password, 4, (err, hashedPassword) => {
        if (err) throw err;
        sql = "INSERT INTO accounts (username, password) VALUES (?, ?)";
        con.query(sql, [username, hashedPassword], function (err, result) {
          if (err) throw err;
          console.log("1 record inserted");
          return res.redirect('/login');
        });
      });
    }
  });
});

app.get('/main', isAuth, (req, res) => {
 res.sendFile(__dirname + '/public/to-do.html');
});

app.post('/main', (req, res) => {
  const sql = "SELECT * FROM user_data WHERE user_id = ?";
  con.query(sql, req.session.user_id, function (err, result, fields) {
      if (err) throw err;      
      res.json(result);
  })
})

app.get('/log_out', (req, res) => {
  req.session.destroy((err) => {
    if (err) throw err;
    res.redirect('/');
  })
});

app.post('/add', (req, res) => {
  const {task, task_status} = req.body;
  const user_id = req.session.user_id;
  sql = "INSERT INTO user_data (user_id, task, task_status) VALUES (?, ?, ?)";
  con.query(sql, [user_id, task, task_status], function (err, result) {
    if (err) throw err;
    res.json({
      status: 'add success',
      data_added: result
    });
    console.log(result);
  });
})

app.post('/check', (req, res) => {
  const obj = req.body;
  sql = "UPDATE user_data SET task_status = '1' WHERE entry_id = ?;";
  con.query(sql, obj.entry_id, function (err, result) {
    if (err) throw err;
    res.json({
      status: 'check success',
      data_checked: obj
    });
  });
})

app.post('/clear', (req, res) => {
  const obj = req.body;
  sql = "DELETE FROM user_data WHERE entry_id = ?";
  con.query(sql, obj.entry_id, function (err, result) {
    if (err) throw err;
    res.json({
      status: 'clear success',
      data_cleared: obj
    });
  });
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});