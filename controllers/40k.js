'use strict';
/*var Joueur = require('../models/Joueur');
var Match = require('../models/Match');*/

const fs = require('fs');
const swaggerMongoose = require('swagger-mongoose');

var swaggerDefinition = fs.readFileSync('./api/swagger.json');
var models = swaggerMongoose.compile(swaggerDefinition).models
var Joueur = models.joueur;
var Match = models.match;
var matchDetailJoueur = models.matchDetailJoueur;
var MyError = models.Error;

// var classement = require('../classement');

function handleError(res, err){
  var error = { code: 11111, message: JSON.stringify(err), fields: 'mongoose'};
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(error|| {}, null, 2))
}

function classementRun(){
  console.log("Running ranking");
  return Joueur.find({}).sort({'datecreation': 'asc'}).exec(function (err, joueurs) {
    if (err) {
      res.end();
      return handleError(err);
      var error = { code: 10001, message: 'Joueur non trouvé', fields: 'userid'};
      res.end(JSON.stringify(error|| {}, null, 2));
    }

    // Ranking by order of player registration
    var i=1;
    for (let joueur of joueurs) {
      joueur.classement = i++;
      joueur.parties = 0;
      console.log("Classement initial: " + joueur.nom + " " + joueur.classement);
    }

    return Match.find().sort('date').exec(function (err, matches) {
      if (err) {
        return {code: 400, message: err};
      }

      function findByName(joueur, index) {
        return joueur.nom == this;
      };

      function findByRank(joueur, index) {
        return joueur.classement == this;
      };

      function swapRank(joueurs, indexJ1, indexJ2) {
        console.log("Swapping: " + joueurs[indexJ1].nom + " & " + joueurs[indexJ2].nom);
        var c = joueurs[indexJ1].classement;
        joueurs[indexJ1].classement = joueurs[indexJ2].classement;
        joueurs[indexJ2].classement = c;
      }

      function displayRank(joueurs){
        for(let joueur of joueurs){
          console.log(joueur.classement+" " + joueur.nom);
        }
      }

      displayRank(joueurs);

      for (let match of matches) {
        console.log(match.date + ": " +  (match.joueurs[0].vainqueur ? "V " : "") + match.joueurs[0].nom + "-" + match.joueurs[1].nom +  (match.joueurs[1].vainqueur ? " V" : ""));
        var indexJ1 = joueurs.findIndex(findByName, (match.joueurs[0].nom));
        var indexJ2 = joueurs.findIndex(findByName, (match.joueurs[1].nom));

        joueurs[indexJ1].parties ++;
        joueurs[indexJ2].parties ++;

        if (match.joueurs[0].vainqueur === true){
          if (joueurs[indexJ1].classement > joueurs[indexJ2].classement){
            // winner ranking lower than looser, swap position
            swapRank(joueurs, indexJ1, indexJ2);
          } else if (joueurs[indexJ1].classement < joueurs[indexJ2].classement) {
            // winner ranking is higher than looser, winner gain one position, looser lose one position
            var indexJ3 = joueurs.findIndex(findByRank, joueurs[indexJ1].classement-1);
            if (indexJ3 >= 0) {
              // Winner gain one position
              swapRank(joueurs, indexJ1, indexJ3);
            } else {
              // Winner is already top of teh board, looser looses one position
              var indexJ3 = joueurs.findIndex(findByRank, joueurs[indexJ2].classement+1);
              // TODO check if player not already the last
              // TODO ensure player below was created before match too place
              if (indexJ3 >= 0 && joueurs[indexJ3].datecreation > match.date) {
                swapRank(joueurs, indexJ2, indexJ3);
              }
            }
          }
        } else if (match.joueurs[1].vainqueur === true) {
          if (joueurs[indexJ2].classement > joueurs[indexJ1].classement){
            // winner ranking lower than looser, swap position
            swapRank(joueurs, indexJ1, indexJ2);
          } else if (joueurs[indexJ2].classement < joueurs[indexJ1].classement) {
            // winner ranking is higher than looser, winner gain one position
            var indexJ3 = joueurs.findIndex(findByRank, joueurs[indexJ2].classement-1);
            if (indexJ3 >= 0) {
              // Winner gain one position
              swapRank(joueurs, indexJ2, indexJ3);
            } else {
              // Winner is already top of teh board, looser looses one position
              var indexJ3 = joueurs.findIndex(findByRank, joueurs[indexJ1].classement+1);
              if (indexJ3 >= 0 && joueurs[indexJ3].datecreation > match.date) {
                swapRank(joueurs, indexJ1, indexJ3);
              }
            }
          }
        }
      }

      displayRank(joueurs);

      /*joueurs[0].save(function (err, fluffy) {
        console.log("Saving " + joueurs[0].nom);
        if (err) return console.error(err);
        console.log(fluffy.nom + " -- Saved");
      });*/
      for (let joueur of joueurs){
        console.log("Saving " + joueur.nom);

        joueur.save(function (err, fluffy) {
          if (err) {
             console.error(err);
             return {code: 400, message: err};
          }
          console.log(fluffy.nom);
        });
      }

      return {
        code: 200,
        message: "ranking completed",
      };
    });
  });
}

function classementPUT(req, res, next) {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(classementRun()|| {}, null, 2));
}

function classementGET(req, res, next) {
  /**
   * show board
   * return the ranking board
   *
   * date String date du classement (optional)
   * returns List
   **/

/*   Joueur.find({nom: "Mike"}, { _id: 0, __v: 0 }).sort( { classement: 1 } ).exec(function (err, joueur) {
     if (err) {
       res.end();
       return handleError(err);
     }
     var newM = new Match({ date: new Date(), vainqueur: joueur, perdant: joueur});
     newM.save(function (err, fluffy) {
       if (err) return console.error(err);
     });
   })
*/
   Joueur.find({}, { _id: 0, __v: 0 }).sort('classement').exec(function (err, joueur) {
     if (err) {
       res.end();
       return handleError(err);
     }
     console.log(joueur)

     if (joueur.length > 0) {
       res.setHeader('Content-Type', 'application/json');
       res.setHeader('Access-Control-Allow-Origin', '*')
       res.end(JSON.stringify(joueur|| {}, null, 2));
     } else {
       res.end();
     }
   })
}

function joueurNomGET(req, res, next) {
  /**
   * return a player by id
   *
   * nom String nom du joueur
   * returns joueur
   **/

   var nom = req.swagger.params.nom.value;
   console.log("nom: " + nom);

  Joueur.findOne({nom: nom}, { _id: 0, __v: 0, fbuserid: 0, fbname: 0, admin: 0, actif: 0}).exec(function (err, joueur) {
    if (err) {
      res.end();
      return handleError(err);
    }
    //console.log("Joueur: " + joueur);

    if (joueur) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(joueur|| {}, null, 2));
    } else {
      res.end("User not found");
    }
  })
}

function joueurPUT(req, res, next) {
  /**
  * return a player by id
  *
  * joueur Joueur details du joueur
  * returns joueur
  **/


  const data = req.swagger.params.joueur.value;
  console.log(JSON.stringify(data));

  var accessToken = res.socket.parser.incoming.headers['x-fb-api-key'];
  console.log("Access Token: " + accessToken);
  var userId = accessToken.split('----')[0].replace(/^"/, '');

  Joueur.findOne({fbuserid: data.fbuserid}).exec(function (err, joueur) {
    if (err) {
      res.end();
      return handleError(err);
    }
    //console.log("Joueur: " + joueur);

    if (joueur) {
      // Modification Joueur
      console.log('Update update');

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(joueur|| {}, null, 2));
    } else {
      // Creation Joueur
      console.log('Creation Joueur');

      Joueur.findOne()
      .sort('-classement')  // give me the max
      .exec(function (err, dernierJoueur) {
        var newJoueur = new Joueur(data);
        newJoueur.admin = false;
        newJoueur.actif = false;
        newJoueur.datecreation = new Date();
        newJoueur.parties = 0;
        newJoueur.fbuserid = userId;
        newJoueur.classement = dernierJoueur ? dernierJoueur.classement + 1 : 1;

        newJoueur.save(function (err, joueur) {
          if (err) return console.error(err);

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(joueur|| {}, null, 2));
        });
      });
    }
  });
}

function joueurFBGET(req, res, next) {
  /**
   * return a player by id
   *
   * nom String nom du joueur
   * returns joueur
   **/

   var userid = req.swagger.params.userid.value;
   console.log("FB userid: " + userid);


  Joueur.findOne({fbuserid: userid}).exec(function (err, joueur) {
    if (err) {
      res.end();
      return handleError(err);
    }

    console.log("Joueur: " + joueur );

    if (joueur) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(joueur|| {}, null, 2));
    } else {
      var error = { code: 100, message: 'Joueur non trouvé', fields: 'userid'};
      res.end(JSON.stringify(error|| {}, null, 2));
    }
  })
}


function matchGET(req, res, next) {
  /**
   * return list of match
   *
   * returns List
   **/

   /*var newM = new Match({ date: new Date(), vainqueur: 'rien', perdant: 'toto' });
   newM.save(function (err, fluffy) {
     if (err) return console.error(err);
   });*/

  //args.nom.value

  Match.find({}, { _id: 0, __v: 0}).sort( { date: 1 } ).exec(function (err, match) {
    if (err) {
      res.end();
      return handleError(err);
    }
    console.log(match)

    if (match.length > 0) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(match|| {}, null, 2));
    } else {
      res.end();
    }
  })
}


function matchIdGET(req, res, next) {
  /**
   * return match matching id
   *
   * returns match
   **/

  //args.nom.value
  var id = req.swagger.params.id.value
  console.log("retrieving match: " + id);

  Match.findOne({id: id}, { _id: 0, __v: 0}).sort( { date: 1 } ).exec(function (err, match) {
    if (err) {
      res.end();
      return handleError(err);
    }

    console.log(match)

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(match|| {}, null, 2));

  })
}

function matchPUT(req, res, next) {
  /**
   * record a match
   *
   * joueur String nom du joueur qui entre le match
   * accessToken String token d'acces du joueur
   * vainqueur String nom du vainqueur
   * armeevainqueur String armee du vainqueur
   * pointsvainqueur Integer nombre de points de l'armee du vainqueur
   * perdant String nom du perdant
   * armeeperdant String armee du perdant
   * pointsperdant Integer nombre de points de l'armee du perdant
   * formatPartie String format de la partie
   * derniertour Integer numero du dernier tour
   * date Date Date du match (optional)
   * scenario String nom du scenario joue (optional)
   * points Integer nombre de points de la partie (optional)
   * powerlevel Integer nombre de PL de la partie (optional)
   * scorevainqueur Integer score du vainqueur (optional)
   * scoreperdant Integer score du perdant (optional)
   * briseurligne String nom du joueur ayant score en briseur de ligne (optional)
   * premiersang String nom du joueur ayant score en premier sang (optional)
   * seigneurguerre String nom du joueur ayant score le seigneur de guere (optional)
   * tablerase Boolean Tour auquel la partie a ete gagne par table rase (optional)
   * returns match
   **/

  console.log('match data:');
  //console.log(JSON.stringify(req.swagger.params.match.value));
  var match = new Match(req.swagger.params.match.value);
  console.log(JSON.stringify(match));
  match.save(function (err, match) {
    if (err) return console.error(err);
    match.id = match._id;
    match.save(function (err, match) {
      if (err) return console.error(err);
      classementRun();
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(match|| {}, null, 2));
    });
  });
}

function matchIdPUT(req, res, next) {
  /**
   * record a match
   *
   * joueur String nom du joueur qui entre le match
   * accessToken String token d'acces du joueur
   * vainqueur String nom du vainqueur
   * armeevainqueur String armee du vainqueur
   * pointsvainqueur Integer nombre de points de l'armee du vainqueur
   * perdant String nom du perdant
   * armeeperdant String armee du perdant
   * pointsperdant Integer nombre de points de l'armee du perdant
   * formatPartie String format de la partie
   * derniertour Integer numero du dernier tour
   * date Date Date du match (optional)
   * scenario String nom du scenario joue (optional)
   * points Integer nombre de points de la partie (optional)
   * powerlevel Integer nombre de PL de la partie (optional)
   * scorevainqueur Integer score du vainqueur (optional)
   * scoreperdant Integer score du perdant (optional)
   * briseurligne String nom du joueur ayant score en briseur de ligne (optional)
   * premiersang String nom du joueur ayant score en premier sang (optional)
   * seigneurguerre String nom du joueur ayant score le seigneur de guere (optional)
   * tablerase Boolean Tour auquel la partie a ete gagne par table rase (optional)
   * returns match
   **/


  var match = new Match(req.swagger.params.match.value);
  var id = req.swagger.params.id.value;
  var accessToken = res.socket.parser.incoming.headers['x-fb-api-key'];
  var userId = accessToken.split('----')[0].replace(/^"/, '');
  var allowed = false;

  console.log('match ' + id);
  console.log(JSON.stringify(match));


  Joueur.findOne({fbuserid: userId}).exec(function (err, joueur) {
    if (err) {
      res.end();
      return handleError(err);
    }



    if (joueur != undefined) {
      const nom = joueur.nom;
      const admin = joueur.admin;
      Match.findOne({id: id}).exec(function (err, curMatch) {
        if (err) {
          res.end();
          return handleError(err);
        }

        if (! admin && (curMatch.joueurentree !== nom)) {
          // Check is the player was part of the get_name
          for (var matchDetail of curMatch.joueurs) {
            if (matchDetail.nom === nom) {
              allowed = true;
              break;
            }
          }
        } else {
          allowed = true;
        }

        if (! allowed) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({code: 1301, message: 'Droits insuffisants pour sauvegarder'}));
        } else {
          /*curMatch.points = 2;
          curMatch.save();*/
          console.log("Updating match " + curMatch.id);
          Match.schema.eachPath(function(path) {
            if (path !== 'joueurs' && path !== '_id' && path !== '__v')
            curMatch[path] = match[path];
            curMatch.save();
          });
          for (var index = 0 ; index < curMatch.joueurs.length ; index++){
            matchDetailJoueur.schema.eachPath(function(path) {
              if (path !== '_id' && path !== '__v')
                curMatch.joueurs[index][path] = match.joueurs[index][path];
                curMatch.save();
            });
          }
        }
        console.log("Updating Classement");
        classementRun();
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(curMatch));
      });
    }
  });


  return;

  console.log(JSON.stringify(match));
  match.save(function (err, match) {
    if (err) return console.error(err);
    match.id = match._id;
    match.save(function (err, match) {
      if (err) return console.error(err);
      classementRun();
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(match|| {}, null, 2));
    });
  });
}

function matchJoueurNomGET(req, res, next) {
  /**
   * return list of match for a player
   *
   * nom String nom du joueur
   * returns List
   **/

   var nom = req.swagger.params.nom.value;
     console.log("matchjoueurNomGET " + nom);

   Match.find({joueurs: {$elemMatch: {nom: nom}}}, { _id: 0, __v: 0}).sort( { date: 'desc' } ).exec(function (err, match) {
     if (err) {
       res.end();
       return handleError(err);
     }
     console.log(match)

     if (match.length > 0) {
       res.setHeader('Content-Type', 'application/json');
       res.end(JSON.stringify(match|| {}, null, 2));
     } else {
       res.end(JSON.stringify({}, null, 2));
     }
   })
}

function joueursGET(req, res, next) {
  /**
  * return list of all players
  *
  * accessToken String Access Token
  * returns List
  **/
  console.log("joueursGET");

  //console.log(res.socket.parser.incoming.headers['x-fb-api-key']);
  var accessToken = res.socket.parser.incoming.headers['x-fb-api-key'];
  console.log("access Token: " + accessToken);
  var userId = accessToken.split('----')[0].replace(/^"/, '');

  Joueur.findOne({fbuserid: userId, actif: true}).exec(function (err, joueur) {
    if (err) {
      res.end();
      return handleError(err);
    }

    if (joueur !== null){
      var listeNoms = [];
      Joueur.find({}, 'nom').exec(function (err, listeJoueurs) {
        if (err) {
          res.end();
          return handleError(err);
        }

        for (var key in listeJoueurs) {
          listeNoms.push(listeJoueurs[key].nom);
        }
        console.log("Liste Joueurs:" + listeNoms);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(listeNoms|| {}, null, 2));
      })
    } else {
      console.log('Utilisateur ' + userId + ' non trouve ou innactif');

      // return {code: 400, statusCode: 403, message: 'UserId inconnu ou desactivé'};
      // return handleError({code: -1, statusCode: 403, message: 'UserId inconnu ou desactivé'});
      res.statusCode = 403;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({code: 1201, message: 'UserId inconnu ou desactivé'}));
    }



  })
}



// export the middleware function
module.exports = {
  classementGET,
  classementPUT,
  joueurNomGET,
  joueurPUT,
  matchGET,
  matchIdGET,
  matchIdPUT,
  matchPUT,
  matchJoueurNomGET,
  joueurFBGET,
  joueursGET,
};
