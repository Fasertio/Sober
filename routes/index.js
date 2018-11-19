var express = require('express');
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs'); //Per l'hash dellle password
var cookie = require('cookie-parser');
var passport = require('passport');
var ls = require('passport-local').Strategy;
var multer = require('multer');
var nodemailer = require('nodemailer');
var router = express.Router();
var path = require('path');
var random = require('randomstring');

//richiamo il modello
var Auth = require('../models/auth');
var Msg = require('../models/msg');

//Mail - ethereal mail
/*
let transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  secure: false,
  port: 587,
  auth:{
    user: '',
    pass: ''
  }
});
*/
//gmail settings
let transporter = nodemailer.createTransport({
  service: 'gmail',
  secure: false,
  port: 25,
  auth:{
    user: '',
    pass: ''
  }
});

/* Uploading file */
var storage = multer.diskStorage({
  destination: './public/uploads',
  filename: function(req, file, cb){
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

//chek image - controllo la validità dell'immagine
function checkext(file, cb){
  var estensioni = /jpg|jpeg|gif|svg|png/;
  var estnome = estensioni.test(path.extname(file.originalname).toLowerCase());
  var tipomime = estensioni.test(file.mimetype);
  if(estnome && tipomime){
    return cb(null,true);
  }else{
    cb('Immagine non riconosciuta');
  }
}

//Manage file upload
var upload = multer({ storage: storage ,
                      limits: {fileSize: 1000000},
                      fileFilter: function(req,file,cb){
                        checkext(file, cb);
                      }
                    }).single('propic'); //nome dell'input propic

/* GET home page. */
router.get('/', function(req, res, next) {
  var fl = req.flash('error');
  console.log("Renderizzata la page: " + fl);

  res.render('log', { title: 'Sober', message: fl, success: req.session.success, er: req.session.errors });
});

//Auth
passport.use('local',new ls(
  function(username, password, done) {
    Auth.SearchByUsername(username, function(err, utente){
      console.log("Ricerca utente:" + utente);
      if(err) throw err;
      if(!utente){
        return done(null,false,{message: 'Utente non trovato'});
      }else if(utente.autenticazione == false){
        return done(null,false,{message: 'Account da convalidare'});
      }

      Auth.ComparaPassword(password, utente.password, function(errore, match){
        if(errore) throw errore;
        if(match){
          console.log("Password confermata");
          return done(null, utente);
        }else{
          console.log("[-] Password errata");
          return done(null, false, {message: 'Password errata'});
        }
      });

    });
  }
));
//auth passport
router.post('/',
  passport.authenticate('local', { successRedirect: '/users',
                                   failureRedirect: '/#login',
                                    failureFlash: true}));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  Auth.findById(id, function(err, user) {
    done(err, user);
  });
});

//POST account creation
router.post('/create', function(req,res,next){
  req.check('email', 'Email non valida').isEmail();
  req.check('email', 'Le due email non corrispondono').equals(req.body.confemail);
  req.check('pass','La password deve essere lunga almeno 4 caratteri').isLength({min : 4}).equals(req.body.confpass);

  var checkusername;
  //check username must be unique
  Auth.findOne({ username: req.body.username },function(err,doc){
    if(err) console.log(err);
    checkusername = doc;
  });

  req.check('username','Username già utilizzato').not().equals(checkusername);

  var err = req.validationErrors();
  if(err){
    console.log("Errore creazione utente");
    req.session.errors = err;
    req.session.success = false;
    res.redirect('/#login');
    //sss
  }else{
    //if there aren't errors create a new user
    req.session.success = true;

    console.log('[+] Password: ' + req.body.pass);
    // Genero token per attivazione mail
    var token = random.generate({length: 14, charset: 'alphanumeric'});
    //hash password CREAZIONE UTENTE
    bcrypt.hash(req.body.pass, null, null, function(err, hash){
      if(err){
        console.log("Errore hashing password\n");
      }
      console.log("[+] Token generato: " + token);
      /* Creazione della query */
      const auth = new Auth({
        _id : new mongoose.Types.ObjectId(),
        username: req.body.username,
        nome: req.body.nome,
        cognome: req.body.cognome,
        email: req.body.email,
        password: hash,
        pp: "/uploads/user.png",
        descrizione: "Aggiungi qui la tua descrizione",
        autenticazione: false,
        token: token,
        seguiti: 0,
        seguaci: 0,
        post: 0,
        amici: ["base"]
      });

      //Saving on mongoDB database in the auths collection
      auth.save(function(err,auths){
        if(err){
          console.log("Errore salvataggio su db: " + err);
        }else{
          console.log("Salvato su db 1 utente: " + auths);
        }
      });
    });
    //create transport mail
    console.log("Email: " + req.body.email);

    var mail = {
                  from: 'sobersocialofficial@gmail.com',
                  to: req.body.email , //user mail
                  subject: 'Conferma identità',
                  text: 'Salve, puoi confermare la tua identità premendo sul link, buona permanenza! ' + token
                  //html: '<p>Salve, puoi confermare la tua identità premendo sul link, buona permanenza! </br> <a href="/accepttoken/' + token +'">Token</a></p>'
               };
    //confirm identity with link
    /*
    var mail = {
                  from: 'sobersocialofficial@gmail.com',
                  to: req.body.email , //qui ci vuole la mail dell'utente
                  subject: 'Conferma identità',
                  //text: 'Salve, puoi confermare la tua identità premendo sul link, buona permanenza! ' + token,
                  html: '<p>Salve, puoi confermare la tua identità premendo sul link, buona permanenza! </br> <a href="/accepttoken/' + token +'">Token</a></p>'
               };
     */
    transporter.sendMail(mail , function(error,response){
      if(error || typeof(mail) == null){
        return console.log("errore, mail non inviata: " + error.message);
      }else{
        console.log("[+] Mail inviata: " + response);
      }
    });
    //Render mail page 
    res.render('sendmail');
  }
});

router.post('/accepttoken', function(req,res,next){
  //se viene inserito il token
  var token = req.body.token;
  Auth.findByToken(token, function(err,tk){
    if(err) console.log(err);
    if(!tk){
      //se non trova l'utente
      console.log("Utente non trovato");
      res.render('sendmail');
    }else{
      if(tk.autenticazione == true){
          console.log("[*] Utente già convalidato..");
      }else{
        //If user confirmed update collection
        console.log("Utente trovato: " + tk);
        Auth.findByIdAndUpdate(tk._id, { autenticazione: true }, function(err, doc){
          if(err){
            console.log("[-] Errore: " + err);
          }else{
            console.log("[+] Token rimosso");
            res.redirect('/users');
          }
        });
      }
    }
  });
});

//Main page - pagina principale
router.get('/users', loggato, function(req,res,next){

    var oggi = new Date();
    var ieri = new Date();
    ieri.setDate(ieri.getDate() -1);
    console.log("[+] Buongiorno, oggi è il: " + oggi);
    console.log("[+] Buongiorno, ieri era il: " + ieri);

    Msg.find({ autore: req.user.amici, data: {"$gte": ieri, "$lt": oggi } } , function(err,doc){
      if(err) throw err;
      console.log("Lunghezza array" + doc.length);
      res.render('home',{ utente: req.user ,msg: doc, length: doc.length });
  });
});

//New message - creazione nuovo messaggio
router.post('/users/sendmsg',loggato, function(req,res,next){

  //for upload image and message togheter
  /* manage enctype
  upload(req,res,function(er){
    if(er){
      Console-log("Errore caricamento img");
    }
    console.log("File: " + req.file);
    s = req.file.path.substr(6);
    console.log("[*] Path: " + s);
  });
  */

  console.log("Corpo messaggio: " + req.body.txt);
  const msg = new Msg({
    _id: new mongoose.Types.ObjectId(),
    testo: req.body.txt,
    autore: req.user.username,
    nautore: req.user.nome,
    cogautore: req.user.cognome,
    data: new Date()
  });
  //Saving n the msg collection on database - Salvataggio su db con mongoose nella collection msg
  msg.save(function(err,msg){
    if(err){
      console.log("Errore salvataggio su db: " + err);
    }else{
      console.log("Salvato su db 1 messaggio: " + msg);
      //Redirecting to refresh
    }
  });
});

//Nav - amici
router.get('/users/amici', loggato, function(req,res,next){

  Auth.findOne({ _id: req.user._id}, function(err, d){
    if(err) throw err;
    console.log("[+] Ricerca amici..");
    console.log("[+] Lunghezza array: " + d.amici.length);

    Auth.find({ username: d.amici } , function(err,doc){
      console.log(doc);
      res.render('amici',{ friend: doc, length: d.amici.length });
    });
  });

});

//Nav - impostazioni
router.get('/users/impostazioni',loggato, function(req,res,next){
  res.render('impostazioni', {title: "Impostazioni - Sober"});
});

//Settings - Impostazioni

//Avatar
router.post('/users/uav',loggato ,function(req,res){
  upload(req,res,function(er){
    var s;
    if(er) throw er;
    console.log("File: " + req.file);
    s = req.file.path.substr(6);
    console.log("[*] Id utente: " + req.user._id);
    Auth.findByIdAndUpdate(req.user._id, { pp: s}, function(err, doc){
      if(err){
        console.log("[-] Errore: " + err);
      }else{
        console.log("[+] Path aggiornata: " + doc);
        res.redirect('/users');
      }
    });
  });
});

//Descrizione
router.post('/users/udescr',loggato, function(req,res){
  Auth.findByIdAndUpdate(req.user._id, { descrizione: req.body.descr }, function(err, doc){
    if(err){
      console.log("[-] Errore: " + err);
    }else{
      console.log("[+] Descrizione aggiornata: " + doc);
      res.redirect('/users');
    }
  });
});

//Mail
router.post('/users/umail',loggato, function(req,res){
  Auth.findOne({ _id: req.user._id, email: req.body.umail }, function(error, doc){
    if(error){
      throw error;
    }else{
      //Aggiorno la psw
      //(query,parametro da modificare)
      Auth.findByIdAndUpdate({_id: req.user._id }, {email: req.body.confumail}, function(err,doc){
        console.log("[*] Email modificata: " + doc);
      });
    }
  });
});

//Password
router.post('/users/upsw',loggato, function(req,res){
  Auth.findOne({ _id: req.user._id, email: req.body.upsw }, function(error, doc){
    if(error){
      throw error;
    }else{
      //Aggiorno la psw
      //(query,parametro da modificare)
      Auth.findByIdAndUpdate({_id: req.user._id }, {email: req.body.uconfpsw }, function(err,doc){
        console.log("[*] Email modificata: " + doc);
      });
    }
  });
});

//Search - ricerca
router.post('/users/ricerca', loggato, function(req,res,next){
  Auth.SearchByUsername(req.body.cerca, function(err, utente){
    if(err) throw err;
    if(utente){
      console.log("Utente trovato: " + utente);
      res.render('cerca', { qnome: utente.nome, qcognome: utente.cognome, qusername: utente.username, qid: utente._id , qpp: utente.pp , nome: req.user.nome });  //Renderizzo la pagina con lo username
      //res.writeHead(200, { 'Content-Type': 'text/html' });
      //res.end("file", "utf-8");
    }
  });
});

/* Delete message passed in parameters - cancella il messaggio passato */
router.post('/users/cancellamsg', loggato, function(req,res,next){
  var idmsg = req.body.delmsg;
  //var name = req.query.n;
  console.log("Id messaggio: " + idmsg);
  Msg.findOne({ _id: idmsg }, function(err,doc){
    if(err) throw err;
    console.log("[+] Messaggio trovato: " + doc);
    if(req.user.username == doc.autore){
      Msg.DeleteMessage(doc._id,function(err, del){
        if(err) throw err;
        console.log("Messaggio eliminato");
      });
    }else{
      console.log("Messaggio di un'altra persona");
    }
  });
});

//User page - Pagina dell'utente
router.get('/users/@:username', function(req,res,next){
  //cerco tutti i messaggi di chi ha l'id
  console.log("Passed: " + req.params.username);
  Auth.findOne({ username: req.params.username }, function(err, d){
    if(err){
      console.log("Errore");
      throw err;
    }
    //console.log(d);
    console.log("Nome: " + d);
    Msg.find({ autore: d.username }, function(err,docs){
      if(err){
        console.log("Errore stampa messaggi");
        console.log("Non ci sono messaggi");
      }else{
        console.log("Messaggi: " + docs[0])
      }
      var managemessage = false;
      if(req.user != null){
        if(req.user.username == d.username){
          managemessage = true;
        }
      }
      res.render('users',{nome: d.nome, utente: d, messaggi: docs, vuoto: false, newmessage: managemessage });
    });
  });
});

//auth only server
/*
router.get('/accepttoken/:tkn',function(req,res){
  //se viene inserito il token
  var token = req.params.tkn;
  console.log("Parametro passato: " + token);
  Auth.findByToken(token, function(err,tk){
    if(err) console.log(err);
    if(!tk){
      //se non trova l'utente
      console.log("Utente non trovato");
      res.render('users'); //redirect users
    }else{
      if(tk.autenticazione == true){
          console.log("[*] Utente già convalidato..");
      }else{
        //Update dell'utente se non è autenticato
        console.log("Utente trovato: " + tk);
        Auth.findByIdAndUpdate(tk._id, { autenticazione: true }, function(err, doc){
          if(err){
            console.log("[-] Errore: " + err);
          }else{
            console.log("[+] Token rimosso");
            res.render('ok'); //render ok
          }
        });
      }
    }
  });
});

*/

//Add follower - Aggiunge follower
//currently the increment of friends not work
router.post('/users/addfollower', loggato ,function(req,res,next){
  //prende l'id di chi segue
  console.log("Id da aggiungere ai follower: " + req.body.idf);
  console.log("Id utente:" + req.user._id);

  Auth.findByIdAndUpdate(req.user._id, {$push: {"amici": req.body.idf }, $inc: { "seguiti": 1}}, {safe: true, upsert: true}, function(err,doc){
    if(err){
      console.log(err);
    }else{
      console.log("Aggiunto con successo e incrementato di 1 i seguiti: " + doc.seguiti);
    }
  });
});

//Remove follower - Toglie un follower
router.post('/users/toglifollower', loggato, function(req,res,next){
  console.log("Id da rimuovere ai follower: " + req.body.idf);
  console.log("Id utente:" + req.user._id);

  Auth.findByIdAndUpdate(req.user._id, {$pull: {"amici": req.body.idf }, $inc: { "seguiti": -1}}, {safe: true, upsert: true}, function(err,doc){
    if(err){
      console.log(err);
    }else{
      console.log("Rimosso con successo");
    }
  });
});

//Logout
router.get('/users/logout', loggato, function(req,res,next){
  req.logout();
  res.redirect("/");
});

//Json  for debug
router.get('/msg.json', function(req, res){
  Msg.find({}, function(err, messaggi){
    if(err) return console.log("Errore stamp messaggi");
    res.send(messaggi);
  });
});

//List user
router.get('/usr.json', function(req,res){
  Auth.find({}, function(err, messaggi){
    if(err) return console.log("Errore stamp utenti");
    res.send(messaggi);
    //var formattedj = {"nome": messaggi.nome ,"password": messaggi.password }
    //console.log(formattedj);
  });
});

//Check if the user is logged - Funzione check login
function loggato(req,res,next){
  if(req.isAuthenticated()){
    next();
  }else{
    res.redirect('/');
  }
}

module.exports = router;
