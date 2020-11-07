import React, {useEffect, useState} from 'react';
import './FinaleRanking.css';
import * as firebase from 'firebase';
import UserProfile from '../../session/UserProfile';
import { useHistory } from "react-router-dom";
import TeamScoring from '../TeamScoring';
import * as Settings from '../../settings/constants.js';
import $ from 'jquery';
import { Modal } from 'react-bootstrap';
import { useTranslation } from "react-i18next";

const useViewport = () => {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleWindowResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, []);

  // Return the width so we can use it in our components
  return { width };
}


/*
 *   When game ends, display CTAs in order to continue playing or leave the room
 *   Also displays info popup messages
*/
export default function FinaleRanking(props) {
  const db = firebase.firestore();
  const sessionId = UserProfile.getSessionId();
  const [ranking, setRanking] = useState(null);
  let history = useHistory();
  const site = UserProfile.getSite();
  const country = UserProfile.getCountry();
  const [sessionlist, setsessionlist] = useState([]);
  const [nextDaySession, setnextDaySession] = useState(null);
  const daysOfWeek = [
    "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"
  ];
  const monthNames = [
    "janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"
  ];
  const [showFinaleCtaModal, setshowFinaleCtaModal] = useState(true);
  const [counter, setCounter] = useState(0);
  const { width } = useViewport();
  const breakpoint = Settings.MOBILE_BREAKPOINT;
  const [showJoinNewTeamModal, setshowJoinNewTeamModal] = useState(false);
  const {t} = useTranslation('common');

  const getFinalRanking = () => {
    db.collection('teams')
    .where('roomId', '==', UserProfile.getRoom())
    .where('sessionId', '==', sessionId)
    .where('active', '==', true)
    .orderBy("points", "desc")
    .get()
    .then(function(queryTeamSnapshot) {
      let count = 0;
      queryTeamSnapshot.forEach(function(doc) {
        if(props.team.uid === doc.id){
          setRanking(parseInt(count + 1));
        }

        count++;
      });

    }).catch(function (error) {
        console.log("Error getting finale ranking:", error);
    });
  }

  useEffect(() => {
    const timer = counter > 0 && setInterval(() => {
      setCounter(counter - 1);
      checkIfTimeUp(counter - 1);
    }, 1000);

    return () => {
      clearInterval(timer);
    }
  }, [counter]);

  const checkIfTimeUp = (totalSeconds) => {
    if(totalSeconds < 1 && sessionlist.length > 0){
      loadNextSession(true);
    }
  }

  async function getTodaySessions() {
      await db.collection("sessions")
          .where("countries", "array-contains", country)
          .where("date", ">", new Date())
          .orderBy("date", "asc")
          .limit(4)
          .get()
          .then(function(querySnapshot) {
              let list = [];
              let gotSession = false;
              let count = 0;
              querySnapshot.forEach(function(doc) {
                count++; 
              });
              let countEach = 0;
              querySnapshot.forEach(function(doc) { 
                  countEach++;
                  // à activer dans le cas réel
                  if(doc.data().sites.indexOf(site) !== -1 && doc.id !== sessionId && formatDate(new Date()) === formatDate(new Date(doc.data().date.toDate())) && !gotSession){
                      gotSession = true;
                      let tempsession = doc.data();
                      tempsession.id = doc.id;

                      let date = new Date(doc.data().date.toDate());
                      date = date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2) + "-" + ("0" + date.getDate()).slice(-2) + "T" + ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2) + ":00";
                      tempsession.date = date;

                      list.push(tempsession);
                  }
                  if(countEach === count){
                    setsessionlist(list);
                  }
              });
          });
  }

  async function getNextDaySession() {
    let today = new Date()
    let tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0,0,0,0);

    await db.collection("sessions")
        .where("countries", "array-contains", country)
        .where("date", ">", tomorrow)
        .orderBy("date", "asc")
        .limit(1)
        .get()
        .then(function(querySnapshot) {
            let gotSession = false;
            querySnapshot.forEach(function(doc) { 
                if(doc.data().sites.indexOf(site) !== -1 && !gotSession){
                    gotSession = true;
                    let tempsession = doc.data();
                    tempsession.id = doc.id;

                    let date = new Date(doc.data().date.toDate());
                    date = daysOfWeek[date.getDay() - 1] + " " + ("0" + date.getDate()).slice(-2) + " " + monthNames[date.getMonth()] + " " + date.getFullYear() + " à " + ("0" + date.getHours()).slice(-2) + "h" + ("0" + date.getMinutes()).slice(-2);

                    tempsession.date = date;

                    setnextDaySession(tempsession);
                }
            });
        });
  }
  
  const loadNextSession = (inNewTeam) => {
      console.log("inNewTeam : " + inNewTeam);
      console.log(sessionlist);
      let currentSession = sessionlist[0];
      UserProfile.setSessionId(currentSession.id);
      UserProfile.setSessionDate(currentSession.date);

      clearTeamConfig();
  }

    // SET NEW TEAM TO USER HERE
  function clearTeamConfig() {
      // delete team id in user
      // delete user in team
      props.changeLoaderStatus();
      let user_team = UserProfile.getTeam();
      db.collection("users").doc(UserProfile.getUserUid()).update({
        team: firebase.firestore.FieldValue.delete()
      })
      .then(function() {
          console.log("user team deleted");
          localStorage.removeItem('user_team');
      })
      .catch(function(error) {
          console.error("Error deleting user team: ", error);
      });

      // remove user from team chat
      firebase
          .database()
          .ref("users/" + UserProfile.getAlias() + "/chatUids/" + user_team)
          .remove();

      // remove user form former team
      var teamDocRef = db.collection('teams').doc(user_team);
      let currentUser = null;
      db.runTransaction(function(transaction) {
        return transaction.get(teamDocRef).then(function(teamDoc) {
            if (!teamDoc.exists) {
                throw "Document does not exist!";
            }

            let tempUsers = teamDoc.data().users;            
            currentUser = getUserByIndex(tempUsers, UserProfile.getAlias());    
            if(tempUsers.length < 2){
              // delete the team
              transaction.delete(teamDocRef);

              // remove chat if user is the last
              firebase
              .database()
              .ref("messages/" + user_team)
              .remove();
            }
            else {
              let newUsers = removeUserByIndex(tempUsers, UserProfile.getAlias());            
              transaction.update(teamDocRef, {
                users: newUsers,
                advanceToFinale: false,
                points: 0,
                male: UserProfile.getGender() === 'male' ? (parseInt(teamDoc.data().male) - 1) : teamDoc.data().male,
                female: UserProfile.getGender() === 'female' ? (parseInt(teamDoc.data().female) - 1) : teamDoc.data().female,
                rounds: firebase.firestore.FieldValue.delete()
              });
            }
        });
      }).then(function() {
          // done clearing
          console.log("Done clearing");
          console.log(currentUser);
          props.hideLoader();
          if(currentUser){
            history.push("/waiting-room", { user: currentUser });
          }
      }).catch(function(err) {
          console.error(err);
      });
  }

  function parseISOLocal(s) {
      var b = s.split(/\D/);
      return new Date(b[0], b[1]-1, b[2], b[3], b[4], b[5]);
  }

    async function resetTeamConfig(newSessionId) {
      db.collection('series')
        .where('country', '==', country)
        .where('site', '==', site)
        .where('session', '==', newSessionId)
        .where("regions", "array-contains", UserProfile.getRegion())
        .get()
        .then((querySeriesSnapshot) => {
          if (!querySeriesSnapshot.empty) {
            let serie = null;
            let foundSerie = false;
            querySeriesSnapshot.forEach(function(doc) {
              let ageRanges = doc.data().ageRanges;
              for (let i = 0; i < ageRanges.length; i++) {
                if(parseInt(UserProfile.getAge()) >= parseInt(ageRanges[i].min) && parseInt(UserProfile.getAge()) <= parseInt(ageRanges[i].max)){
                    serie = doc.data();
                    serie.id = doc.id;
                    delete serie.rounds;
                    delete serie.finaleRounds;
                    break;
                }
              }

              if(serie && !foundSerie){
                foundSerie = true;

                var teamDocRef = db.collection('teams').doc(UserProfile.getTeam());
                let tempTeam = null;
                db.runTransaction(function(transaction) {
                  return transaction.get(teamDocRef).then(function(teamDoc) {
                      if (!teamDoc.exists) {
                          throw "Document does not exist!";
                      }

                      tempTeam = teamDoc.data();
                      tempTeam.uid = teamDoc.id;
                      transaction.update(teamDocRef, {
                        users: unmarkUserAsReady(teamDoc.data().users, UserProfile.getAlias()),
                        advanceToFinale: false,
                        sessionId: newSessionId,
                        points: 0,
                        serie,
                        rounds: firebase.firestore.FieldValue.delete(),
                        sessionDone: firebase.firestore.FieldValue.delete()
                      });
                  });
                }).then(function() {
                    UserProfile.setTeamSerie(serie.id);
                    if(tempTeam !== null){
                      history.push('/waiting-room', { team : tempTeam });
                    }
                    else {
                      history.push('/waiting-room');
                    }
                }).catch(function(err) {
                    console.error(err);
                });    
              }
              else {
                  // set a default serie

              }
            })
          }
      }).catch(function (error) {
          console.log("Error getting questions:", error);
      });    
    }

    const unmarkUserAsReady = (users, alias) => {
      for (let i = 0; i < users.length; i++) {
        if(users[i].alias === alias){
          users[i].ready = false;
        }
      }
      return users;
    }

    const removeUserByIndex = (list, userAlias) => {
      let newList = [];
      for (let i = 0; i < list.length; i++) {
        if(list[i].alias !== userAlias){
          newList.push(list[i]);
        }
      }
      return newList;
    }

    const getUserByIndex = (list, userAlias) => {
      for (let i = 0; i < list.length; i++) {
        if(list[i].alias === userAlias){
          return list[i];
        }
      }
    }

    const formatDate = (date) => {
      return date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2) + "-" + ("0" + date.getDate()).slice(-2);
    }

    async function leaveGameRoom() {
      let user_team = UserProfile.getTeam();
      let user_room = UserProfile.getRoom();
      await db.collection("users").doc(UserProfile.getUserUid()).update({
        team: firebase.firestore.FieldValue.delete(),
        room: firebase.firestore.FieldValue.delete()
      })
      .then(function() {
          firebase
              .database()
              .ref("users/" + UserProfile.getAlias())
              .remove();
          console.log("user team & room & chat deleted");
      })
      .catch(function(error) {
          console.error("Error deleting user team & room: ", error);
      });

      // remove user from team chat
      firebase
          .database()
          .ref("users/" + UserProfile.getAlias() + "/chatUids/" + user_team)
          .remove();

      // remove all o2o chats

      var roomDocRef = db.collection('rooms').doc(user_room);
      db.runTransaction(function(transaction) {
        return transaction.get(roomDocRef).then(function(roomDoc) {
            if (!roomDoc.exists) {
                throw "Document room does not exist!";
            }

            if(roomDoc.data().nbPlayers < 2){
              // delete the room
              transaction.delete(roomDocRef);

              // remove chat if user is the last
              firebase
              .database()
              .ref("messages/" + user_room)
              .remove();
            }
            else {
              transaction.update(roomDocRef, {
                nbPlayers: firebase.firestore.FieldValue.increment(-1)
              });
            }
        });
      }).then(function() {
        console.log("Room updated");
      }).catch(function(err) {
          console.error(err);
      });

      var teamDocRef = db.collection('teams').doc(user_team);
      db.runTransaction(function(transaction) {
        return transaction.get(teamDocRef).then(function(teamDoc) {
            if (!teamDoc.exists) {
                throw "Document does not exist!";
            }

            if(teamDoc.data().users.length < 2){
              // delete the team
              transaction.delete(teamDocRef);

              // remove chat if user is the last
              firebase
              .database()
              .ref("messages/" + user_team)
              .remove();
            }
            else {
              let tempusers = teamDoc.data().users;
              transaction.update(teamDocRef, {
                users: removeUserByIndex(tempusers, UserProfile.getAlias()),
                male: UserProfile.getGender() === 'male' ? (parseInt(teamDoc.data().male) - 1) : teamDoc.data().male,
                female: UserProfile.getGender() === 'female' ? (parseInt(teamDoc.data().female) - 1) : teamDoc.data().female
              });
            }
        });
      }).then(function() {
          history.push('/survey');
      }).catch(function(err) {
          console.error(err);
      });
    }

    useEffect(() => {
      /*
      if($('#players-list')){
        $('#players-list').removeClass('hide');
      }
      */
      console.log("finaleranking useeffect");
      getTodaySessions();
      getFinalRanking();
      getNextDaySession();
    }, []);

    const goChatRoom = () => {
      history.push('/chat-room', { user_alias: UserProfile.getAlias() });
    }

    const renderNextGameSessionSchedule = () => {
      if(nextDaySession){
        return (
          <div>
            <p className="para">{t('sessions_done.title')}</p>
            <p className="para">{t('next_session_day.title')} {nextDaySession.date}</p>
          </div>
        );
      }
      else {
        return (
          <div>
            <p className="para">{t('sessions_done.title')}</p>
          </div>
        );
      }
    }

    function assignToRoom(user, sessionId) {
      firebase
          .firestore()
          .collection('rooms')
          .where('sessionId', '==', sessionId)
          .get()
          .then(function(querySnapshot) {
              // no room
              if (querySnapshot.empty) {
                  // create room
                  db.collection("rooms").add({
                      id: 1,
                      sessionId,
                      country,
                      site,
                      nbPlayers: 1
                  })
                  .then(docRef => {
                      // update user room with the newly created room
                      db.collection("users").doc(user.alias).update({
                          room: docRef.id
                      })
                      .then(function() {
                          UserProfile.setRoom(docRef.id);
                          user.room = docRef.id;
                          assignTeam(user, docRef.id, sessionId);
                      })
                      .catch(function(error) {
                          console.error("Error updating user room: ", error);
                      });
                      
                  })
                  .catch(function(error) {
                      console.error("Error adding document: ", error);
                  });
              } else {
                  console.log("room found");
                  // room with this session ID found
                  let roomWithAvailableSpot = null;
                  let countRooms = 0;
                  querySnapshot.forEach(function(doc) {
                      countRooms++;
                      let room = doc.data();
                      if(room.nbPlayers < Settings.MAX_PLAYERS_IN_ROOM && room.country === country && room.site === site){
                          roomWithAvailableSpot = doc.id;
                          user.room = roomWithAvailableSpot;

                          var roomDocRef = db.collection('rooms').doc(roomWithAvailableSpot);
                          var userDocRef = db.collection('users').doc(user.alias);
                          db.runTransaction(function(transaction) {
                              return transaction.get(roomDocRef).then(function(roomDoc) {
                                  if (!roomDoc.exists) {
                                      throw "Document does not exist!";
                                  }
                      
                                  transaction.update(roomDocRef, {
                                      nbPlayers: firebase.firestore.FieldValue.increment(1)
                                  });

                                  transaction.update(userDocRef, {
                                      room: roomWithAvailableSpot
                                  });
                              });
                          }).then(function() {
                              UserProfile.setRoom(roomWithAvailableSpot);
                              assignTeam(user, roomWithAvailableSpot, sessionId);
                          }).catch(function(err) {
                              console.error("Error updating user room: ", err);
                          });
                      }
                  });

                  // if no room with less than 50 players
                  if(roomWithAvailableSpot == null){
                      // create a room with id = room + 1
                      db.collection("rooms").add({
                          id: parseInt(countRooms + 1),
                          sessionId,
                          country,
                          site,
                          nbPlayers: 1
                      })
                      .then(function(docRef) {
                          let roomAlias = docRef.id;
                          user.room = roomAlias;
                          // update user room with the newly created room
                          db.collection("users").doc(user.alias).update({
                              room: roomAlias
                          })
                          .then(function() {
                              UserProfile.setRoom(roomAlias);
                              console.log("ici4 : user");
                              console.log(user);
                              console.log(roomAlias);
                              assignTeam(user, roomAlias, sessionId);
                          })
                          .catch(function(error) {
                              console.error("Error updating user room: ", error);
                          });
                      })
                      .catch(function(error) {
                          console.error("Error adding document: ", error);
                      });
                  }  
              } 
          })
          .catch(function(error) {
              console.error("Error fetching rooms: ", error);
          });   
    }

    const assignTeam = (user, room, sessionId) => {
      console.log("assign team");
      firebase
          .firestore()
          .collection('teams')
          //.where('roomId', '==', UserProfile.getRoom())
          .where('sessionId', '==', sessionId)
          .get()
          .then(function(queryTeamSnapshot) {
              let count = 0;
              queryTeamSnapshot.forEach(function() {
                  count++;
              });
              if(count < Settings.LEADING_TEAM_NUMBER){
                  console.log("create 111 : " + user.alias);
                  let team = {
                      id: count + 1,
                      roomId: room,
                      sessionId,
                      advanceToFinale: false,
                      points: 0,
                      numberRoundPassed: 0,
                      roundUid: "",
                      sessionDone: false,
                      male: user.gender === 'male' ? 1 : 0,
                      female: user.gender === 'female' ? 1 : 0,
                      users: [
                          user
                      ]
                  };
                  createTeam(team, user, sessionId);
              }
              else {
                  // create a new team if less than 9 (MAX_PLAYERS_IN_TEAM) but let the player choose his team
                  console.log('choose a team for the user');
                  let inTeam = false;
                  let countEach = 0;
                  queryTeamSnapshot.forEach(function(doc) {
                      countEach++;
                      let team  = doc.data();
                      // add condition on age and region
                      if(team.users.length < Settings.MAX_PLAYERS_IN_TEAM && !inTeam && team.serie.session === sessionId && checkTeamParityAvailability(team.users, user.gender)){
                          inTeam = true;                                                                          
                          updateTeam(doc.id, team, user, sessionId);
                          console.log("here22");
                      }

                      // callback
                      if(countEach === count && !inTeam){
                          if(count < Settings.MAX_TEAMS_IN_ROOM){
                              console.log("here11");
                              team = {
                                  id: count + 1,
                                  roomId: room,
                                  sessionId,
                                  advanceToFinale: false,
                                  points: 0,
                                  numberRoundPassed: 0,
                                  roundUid: "",
                                  sessionDone: false,
                                  male: user.gender === 'male' ? 1 : 0,
                                  female: user.gender === 'female' ? 1 : 0,
                                  users: [
                                      user
                                  ]
                              };
                              createTeam(team, user, sessionId);
                          }
                          else {
                              // parité not respecté, des personnes sont sans team
                              console.log("Attendez la prochaine session");
                              // check for next session
                              // assign to next session
                              // else -> no more session
                              revertAssignation(room, user, sessionId);
                          }
                      }
                  });

                  
              }
          })
          .catch(function(error) {
              console.error("Error fetching teams: ", error);
          });
  }

  const checkTeamParityAvailability = (users, gender) => {
    let countMale = 0;
    let countFemale = 0;
    for (let i = 0; i < users.length; i++) {
      if(users[i].gender === "male"){
        countMale++;
      } else {
        countFemale++;
      }
    }

    if(gender === "male" && countMale > 2){
      return false;
    }

    if(gender === "female" && countFemale > 2){
      return false;
    }

    return true;
  }

  const revertAssignation = (roomId, user, sessionId) => {
      var roomDocRef = db.collection('rooms').doc(roomId);
      db.runTransaction(function(transaction) {
        return transaction.get(roomDocRef).then(function(roomDoc) {
            if (!roomDoc.exists) {
                throw "Document room does not exist!";
            }

            if(roomDoc.data().nbPlayers < 2){
              // delete the room
              transaction.delete(roomDocRef);
            }
            else {
              transaction.update(roomDocRef, {
                nbPlayers: firebase.firestore.FieldValue.increment(-1)
              });
            }
        });
      }).then(function() {
        console.log("Room updated");
        loadSecondNextSession(user, sessionId)
      }).catch(function(err) {
          console.error(err);
      });

  }

  const loadSecondNextSession = (user, sessionId) => {
    db.collection("sessions")
      .where("countries", "array-contains", country)
      .where("date", ">", new Date())
      .orderBy("date", "asc")
      .get()
      .then(function(querySnapshot) {
          let tempsession = null;
          let gotSession = false;
          querySnapshot.forEach(function(doc) { 
              if(doc.data().sites.indexOf(site) !== -1 && !gotSession && formatDate(new Date()) === formatDate(new Date(doc.data().date.toDate())) && doc.id !== sessionId){
                  gotSession = true;
                  tempsession = doc.data();
                  tempsession.id = doc.id;
              }
          }); 

          if(gotSession){
              let date = new Date(tempsession.date.toDate());
              date = date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2) + "-" + ("0" + date.getDate()).slice(-2) + "T" + ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2) + ":00";
              tempsession.date = date;
              
              UserProfile.setSessionId(tempsession.id);
              UserProfile.setSessionDate(tempsession.date);

              assignToRoom(user, tempsession.id);
          }
          else {
            // no more session for today
            console.log("no more other session for today");
          }
      });
  }

  const executeCreateTeam = (team, userAlias) => {
      db.collection('teams').add(team).then(function(docRef) {
          db.collection('users').doc(userAlias).update({
            team: docRef.id
          }).then(function() {
              UserProfile.setTeam(docRef.id);
              UserProfile.setTeamSerie(team.serie.id);
              goWaitingRoom(team, docRef.id);
          }).catch(function(err) {
              console.error("Error updating user team: ", err);
          });
      }).catch(function(err) {
          console.error("Error creating team: ", err);
      });
  }

  const createTeam = (team, user, sessionId) => {
      db.collection('series')
      .where('country', '==', country)
      .where('site', '==', site)
      .where('session', '==', sessionId)
      .where("regions", "array-contains", user.region)
      .get()
      .then((querySeriesSnapshot) => {
        if (!querySeriesSnapshot.empty) {
          let foundSerie = false;
          querySeriesSnapshot.forEach(function(doc) {
            let ageRanges = doc.data().ageRanges;
            let serie = null;
            for (let i = 0; i < ageRanges.length; i++) {
              if(parseInt(user.age) >= parseInt(ageRanges[i].min) && parseInt(user.age) <= parseInt(ageRanges[i].max)){
                  serie = doc.data();
                  serie.id = doc.id;
                  delete serie.rounds;
                  delete serie.finaleRounds;
                  break;
              }
            }

            if(serie && !foundSerie){
              team.serie = serie;
              foundSerie = true;
              console.log("ici1 : user");
              console.log(user);
              executeCreateTeam(team, user.alias);
            }
            else {
                // set a default serie

            }
          })
        }
    }).catch(function (error) {
        console.log("Error getting questions:", error);
    });
  }

    const updateTeam = (teamUid, team, user, sessionId) => {
      delete user.team;
      delete user.room;

      var teamDocRef = db.collection('teams').doc(teamUid);
      var userDocRef = db.collection('users').doc(user.alias);
      let abortTransaction = false;
      db.runTransaction(function(transaction) {
          return transaction.get(teamDocRef).then(function(teamDoc) {
              if (!teamDoc.exists) {
                  throw "Document does not exist!";
              }
              
              console.log("update : " + user.alias);
              console.log("update team : " + teamUid);
              if(teamDoc.data().users.length >= Settings.MAX_PLAYERS_IN_TEAM){
                  console.log("abort update");
                  abortTransaction = true;
              }
              else {
                  console.log("not abort update team");
                  transaction.update(teamDocRef, {
                      users: firebase.firestore.FieldValue.arrayUnion(user),
                      male: user.gender === 'male' ? firebase.firestore.FieldValue.increment(1) : team.male,
                      female: user.gender === 'female' ? firebase.firestore.FieldValue.increment(1) : team.female
                  });
              }
          });
      }).then(function() {
          if(abortTransaction){
              assignTeam(user, UserProfile.getRoom(), sessionId);
          }
          else {
              console.log("not abort update user");
              teamDocRef.get().then(function(doc){
                  let tempUsers = doc.data().users;
                  let notIn = true;
                  for (let i = 0; i < tempUsers.length; i++) {
                      if(tempUsers[i].alias === user.alias){
                          notIn = false;
                          break;
                      }
                  }
                  if(!notIn){
                      console.log("!notin");
                      userDocRef.update({
                          team: teamUid
                      })
                      .then(function() {
                          UserProfile.setTeam(teamUid);
                          UserProfile.setTeamSerie(team.serie.id);
                          goWaitingRoom(team, teamUid);
                          
                      }).catch(function(err) {
                          console.error("Error updating user: ", err);
                      });
                  }
                  else {
                      console.log("notin");
                      assignTeam(user, UserProfile.getRoom(), sessionId);
                  }
              }).catch(function(err) {
                  console.error("Error getting team: ", err);
              });
              
          }
      }).catch(function(err) {
          console.error("Error updating user team: ", err);
      });
    }

    const goWaitingRoom = (team, teamUid) => {
        props.changeLoaderStatus();
        team.uid = teamUid;
        history.push('/waiting-room', { team });
    }

    const finaleCtaModalEntered = () => {
      console.log("finaleCtaModalEntered");
    }

    const finaleCtaModalExited = () => {
        console.log("finaleCtaModalExited");
        setshowJoinNewTeamModal(true);
        setCounter(Settings.TIME_FINALE_CTA);
    }

    const joinNewTeamModalEntered = () => {
      console.log("joinNewTeamModalEntered");
      setTimeout(() => {
        setshowJoinNewTeamModal(false);
      }, 5000)
      
    }

    const joinNewTeamModalExited = () => {
        console.log("joinNewTeamModalExited");
    }

    const continuePlaying = () => {
      setshowFinaleCtaModal(false);
      let diff = (Date.parse(parseISOLocal(sessionlist[0].date)) - Date.parse(new Date())) / 1000;
      if(diff > 0 && diff < 60){
        loadNextSession(true);
      }
      else {
        setshowJoinNewTeamModal(true);
        setCounter(Settings.TIME_FINALE_CTA);
      }
    }

    return ranking ? (
        width < breakpoint ? 
        (
            <div className="ranking">
              {
                sessionlist.length > 0 ? <TeamScoring nextSessionDate={sessionlist[0].date} endSession={continuePlaying} leaveGameRoom={leaveGameRoom} /> : renderNextGameSessionSchedule()
              }
              <button className="btn btn-primary btn-feedback" onClick={() => leaveGameRoom()}>{t('leave_game_so.title')}</button>
              <Modal className={site} backdrop="static" show={showFinaleCtaModal} size="sm" onExited={finaleCtaModalExited} onEntered={finaleCtaModalEntered} centered onHide={() => setshowFinaleCtaModal(false)}>
                <Modal.Header closeButton>
                </Modal.Header>
                <Modal.Body>
                <div className="ranking">
                  <div className="statement">
                    <p className="para">{t('if_leave_game.title')} <br/> {t('it_close_chat.title')}</p>
                  </div>
                </div>
                </Modal.Body>
              </Modal>
              <Modal className={site} backdrop="static" show={showJoinNewTeamModal} size="sm" onExited={joinNewTeamModalExited} onEntered={joinNewTeamModalEntered} centered onHide={() => setshowJoinNewTeamModal(false)}>
                  <Modal.Header closeButton>
                  </Modal.Header>
                  <Modal.Body>
                    <div className="ranking">
                        <h4 className="ttr">{t('great_news.title')}</h4>
                        <p className="para">{t('continue_chat.title')}</p>
                    </div>
                  </Modal.Body>
              </Modal>
            </div>
        )
        : 
        <div className="ranking">
          <Modal className={site} backdrop="static" show={showFinaleCtaModal} size="sm" onExited={finaleCtaModalExited} onEntered={finaleCtaModalEntered} centered onHide={() => setshowFinaleCtaModal(false)}>
              <Modal.Header closeButton>
              </Modal.Header>
              <Modal.Body>
              <div className="ranking">
                {
                  sessionlist.length > 0 ? <TeamScoring nextSessionDate={sessionlist[0].date} endSession={continuePlaying} leaveGameRoom={leaveGameRoom} /> : renderNextGameSessionSchedule()
                }
                <button className="btn btn-primary btn-feedback btn-leave-game" onClick={() => leaveGameRoom()}><strong>{t('leave_the_game.title')}</strong><span className="info d-sm-block d-none">{t('this_close_chat.title')}</span></button>
              </div>
              </Modal.Body>
          </Modal>
          <Modal className={site} backdrop="static" show={showJoinNewTeamModal} size="sm" onExited={joinNewTeamModalExited} onEntered={joinNewTeamModalEntered} centered onHide={() => setshowJoinNewTeamModal(false)}>
              <Modal.Header closeButton>
              </Modal.Header>
              <Modal.Body>
                <div className="ranking">
                    <h4 className="ttr">{t('great_news.title')}</h4>
                    <p className="para">{t('continue_chat.title')}</p>
                </div>
              </Modal.Body>
          </Modal>
        </div>
      
    ) : null;
}