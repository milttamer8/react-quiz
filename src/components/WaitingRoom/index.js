import React, {useState, useEffect, memo, useRef} from 'react';
import ProgressBar from '../ProgressBar';
import * as firebase from 'firebase';
import { Link, useHistory } from "react-router-dom";
import UserProfile from '../../session/UserProfile';
import './WaitingRoom.css';
import { useTranslation } from "react-i18next";
import ReactPlayer from 'react-player';
import * as Settings from '../../settings/constants.js';
import { Modal, Button } from 'react-bootstrap';
import teamnames from '../../settings/teamnames.json';

import SongPlayer from '../SongPlayer';
import 'react-h5-audio-player/lib/styles.css';
import TeamChat from '../TeamChat';
import OneToOneChat from '../OneToOneChat';
import $ from 'jquery';
import PresenceChecker from '../PresenceChecker';
import CircleProgressBarReal from '../CircleProgressBarReal';
import CircleProgressBarRealDays from '../CircleProgressBarRealDays';

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
 *   Handle user assignation to room and team
 *   Handle chats display in /waiting-room
 *   Handle user reassignation to team when no team found after countdown
*/
export default function WaitingRoom(props) {
    let history = useHistory();
    const [players, setplayers] = useState([]);
    let playersSnapshot;
    const {t} = useTranslation('common');
    const [showModal, setshowModal] = useState(false);
    const [declaration, setdeclaration] = useState("");
    const [accused, setaccused] = useState(null);
    var complainantsListener;
    var playerSnapshot;
    var teamOnlineQuery;
    var teamOrganizedListener;
    var teamReorganizationListener;
    var teamFullQuery;
    const [complainants, setcomplainants] = useState([]);
    const [team, setteam] = useState(null);
    const auth = firebase.auth();
    const db = firebase.firestore();
    const site = UserProfile.getSite();
    const country = UserProfile.getCountry();
    const [showRules, setshowRules] = useState(UserProfile.getSite() === "core" ? false : true);
    const [showMatchmakingResult, setshowMatchmakingResult] = useState(false);
    const [showGameStartModal, setshowGameStartModal] = useState(false);
    const [privateConversations, setprivateConversations] = useState([]);
    const [initialPrivateConversations, setinitialPrivateConversations] = useState([]);
    const { width } = useViewport();
    const breakpoint = Settings.MOBILE_BREAKPOINT;
    
    const windowHeight = $( document ).height();
    const headerHeight = $('.header').offsetHeight;
    const heightApp = windowHeight - headerHeight;
    const [counter, setCounter] = useState(0);
    const [showWaitingMessage, setshowWaitingMessage] = useState(false);
    const [isTeamChatOpen, setisTeamChatOpen] = useState(true);
    const [isChatOpen, setisChatOpen] = useState(true);
    const [isMatchmakingSuccess, setisMatchmakingSuccess] = useState(true);
    const [currentSession, setcurrentSession] = useState(null);
    const [noMoreSession, setnoMoreSession] = useState(false);
    const [loadPresenceChecker, setloadPresenceChecker] = useState(false);
    const [isReadyForGame, setisReadyForGame] = useState(false);
    const [isTimeUp, setisTimeUp] = useState(false);
    const [isTeamFull, setisTeamFull] = useState(false);
    const [isConnectionSlow, setisConnectionSlow] = useState(false);
    var internetSpeedTimer;
    const [internetSpeedCounter, setinternetSpeedCounter] = useState(0);
    const [showLateUserModal, setshowLateUserModal] = useState(true);
    const [imageReadyToLoad, setimageReadyToLoad] = useState(false);

    useEffect(() => {
      const timer = counter > 0 && setInterval(() => {
        setCounter(counter - 1);
        checkIfTimeUp(counter - 1);
      }, 1000);

      return () => {
        clearInterval(timer);
      }
    }, [counter]);

    useEffect(() => {
        if(isTimeUp){
          executeTimeUp();
        }
        return () => {
          
        }
    }, [isTimeUp]);

    const checkIfTimeUp = (totalSeconds) => {
      if(totalSeconds < 1){
        // redirect
        timeUp();
      }
    }

    const audioPlayerEl = useRef(null);
    useEffect(() => {
        $('.App').height(heightApp + 'px');

        // check if already assigned
        if(props.location.state){
            if(props.location.state.user){
                console.log("about to check waiting room");
                checkUserConnected(props.location.state.user);
                loadComplainants();
                privateConversationListener();
            }
            else {
                logout();
            }
        }
        else {
            logout();
        }
        
        return () => {
            if (typeof playersSnapshot !== "undefined") { 
                // safe to use the function
                playersSnapshot();
            }
            if (typeof complainantsListener !== "undefined") { 
                // safe to use the function
                complainantsListener();
            }
            if (typeof playerSnapshot !== "undefined") { 
                // safe to use the function
                playerSnapshot();
            }
            if (typeof teamOnlineQuery !== "undefined") { 
                // safe to use the function
                teamOnlineQuery();
            }
            if (typeof teamOrganizedListener !== "undefined") { 
                // safe to use the function
                teamOrganizedListener();
            }
            if (typeof teamFullQuery !== "undefined") { 
                // safe to use the function
                teamFullQuery();
            }
        }
    }, []);

    const checkIfSessionStarted = () => {
        let timeLeft = calculateCountdown();
        if(timeLeft < 1){
            return true;
        }
        return false;
    }
    
    const checkIfSessionStartedWithDate = (sessionDate) => {
        let timeLeft = calculateCountdownWithDate(sessionDate);
        if(timeLeft < 1){
            return true;
        }
        return false;
    }

    const checkUserConnected = (tmpUser) => {
        /*
        if(auth.currentUser !== null){
            console.log("logged in wr");
            console.log(auth.currentUser);
            // check if user still has team
            loadNextSession(auth.currentUser, tmpUser);
        }
        else {
            console.log("not logged in wr");
            history.push('/');
        }
        */
        
        auth.onAuthStateChanged(firebaseUser => {
            if(firebaseUser){
                console.log("logged in profile");
                console.log(firebaseUser);
                // check if user still has team
                loadNextSession(firebaseUser, tmpUser);
            }
            else {
                console.log("not logged in profile");
                history.push('/');
            }
        })
        
        
      }

        function parseISOLocal(s) {
            var b = s.split(/\D/);
            return new Date(b[0], b[1]-1, b[2], b[3], b[4], b[5]);
        }

        function calculateCountdown() {
            console.log("calculate countdown : " + UserProfile.getSessionDate());
            let endDate = UserProfile.getSessionDate();
            let diff = (Date.parse(parseISOLocal(endDate)) - Date.parse(new Date())) / 1000;
            return diff;
        }

        const [nextSessionTime, setnextSessionTime] = useState(calculateCountdown());

        function calculateCountdownWithDate(sessionDate) {
            let endDate = sessionDate;
            let diff = (Date.parse(parseISOLocal(endDate)) - Date.parse(new Date())) / 1000;
            return diff;
        }
  
      const checkIfTeamValid = (teamId, session, tempUser) => {
          firebase
              .firestore()
              .collection('teams')
              .doc(teamId)
              .get()
              .then(function(doc) {
                  if(doc.exists){
                      if(doc.data().sessionId === session.id){
                          console.log("valid team -> next step");
                          let tmpTeam = doc.data();
                          tmpTeam.uid = teamId;
                          setteam(tmpTeam);
                          loadAllPlayers(teamId);
                          checkIfVideoSeen(tmpTeam, session.date);
                            setloadPresenceChecker(true);
                          //onTeamFound();
                      }
                      else {
                        assignToRoom(tempUser, session.id, session.date);
                      }
                  }
                  else {
                    assignToRoom(tempUser, session.id, session.date);
                  }
              })
              .catch(function(error) {
                  console.error("Error fetching team: ", error);
              });
      }

      const onTeamFound = (teamUid) => {
        console.log("onTeamFound : " + teamUid);
        // check user online
        teamOnlineQuery = db.collection('teams')
        .doc(teamUid)
        .onSnapshot(function(doc) {
            if(doc.exists){
                if(doc.data() !== undefined){
                    let users = doc.data().users;
                    let isOnline = true;
                    console.log("onTeamFound : users");
                    console.log(users);
                    for (let i = 0; i < users.length; i++) {
                        if(users[i].alias === UserProfile.getAlias() && users[i].status === "offline"){
                            isOnline = false;
                            break;
                        }
                    }
                    if(isOnline){
                        console.log("onTeamFound : isOnline");
                        setshowMatchmakingResult(true);
                        setisReadyForGame(true);
                    }
                }
            }
        });
      }

      const teamFullListener = (teamUid) => {
        console.log("teamFullListener : " + teamUid);
        // check user online
        teamFullQuery = db.collection('teams')
        .doc(teamUid)
        .onSnapshot(function(doc) {
            if(doc.exists){
                if(doc.data() !== undefined){
                    let users = doc.data().users;
                    let isFull = true;
                    console.log("teamFullListener then : users");
                    console.log(users);
                    let activeUsers = [];
                    for (let i = 0; i < users.length; i++) {
                        if(users[i].status === "online"){
                            activeUsers.push(users[i]);
                        }
                    }

                    console.log("activeUsers");
                    console.log(activeUsers);

                    //if(activeUsers.length > 3){
                    if(checkTeamParityGood(activeUsers)){
                        setisTeamFull(true);
                        switchToWaitingMessage();
                    }
                    /*
                    else {
                        setisTeamFull(false);
                    }
                    */
                }
            }
        });
      }

      const onTeamFoundWithoutRedirect = (teamUid) => {
        console.log("onTeamFoundWithoutRedirect : " + teamUid);
        // check user online
        teamOnlineQuery = db.collection('teams')
        .doc(teamUid)
        .onSnapshot(function(doc) {
            if(doc.exists){
                if(doc.data() !== undefined){
                    let users = doc.data().users;
                    console.log("users");
                    console.log(users);
                    let isOnline = true;
                    for (let i = 0; i < users.length; i++) {
                        if(users[i].alias === UserProfile.getAlias() && users[i].status === "offline"){
                            console.log("found");
                            isOnline = false;
                            break;
                        }
                    }
                    if(isOnline){
                        console.log("isOnline and readyforgame");
                        setisReadyForGame(true);
                    }
                }
            }
        });
      }

    const checkIfVideoSeen = (tmpTeam, sessionDate) => {
        if(checkIfSessionStartedWithDate(sessionDate)){
            console.log("matchmaking failure");
            loadIncomingSession(currentSession ? currentSession.id : null);
        }
        else {
            initiateTeamChat(tmpTeam.uid, tmpTeam.id);
            //reorganizeTeams(tmpTeam);
            teamFullListener(tmpTeam.uid);
            // check if session time < video length
            let timeLeft = calculateCountdown();
            if(timeLeft < Settings.RULES_VIDEO_LENGTH + 10){
                console.log("not enough time");
                onTeamFound(tmpTeam.uid);
            }
            else {
                console.log("enough time");
                onTeamFoundWithoutRedirect(tmpTeam.uid);
                console.log("userId : " + UserProfile.getAlias())
                playerSnapshot = firebase
                .firestore()
                .collection('users')
                .doc(UserProfile.getUserUid())
                .onSnapshot(function(doc) {
                    if(doc.exists){
                        console.log("exist");
                        console.log(doc.data());
                        if(doc.data().isVideoSeen === true){
                            console.log("seen");
                            playerSnapshot();

                            let timeLeftInside = calculateCountdown();
                            if(timeLeftInside > 15){
                                setshowMatchmakingResult(true);
                            }
                            //initiateTeamChat(tmpTeam.uid, tmpTeam.id);
                        }
                        else {
                            console.log("not seen");
                        }
                    }
                    else {
                        console.log("dont exist");
                    }
                });
            }   
        }
    }

    const setVideoSeen = () => {
        videoEnded();
        let userId = UserProfile.getUserUid();
        firebase.firestore().collection("users").doc(userId).update({
            isVideoSeen: true
        }).then(function(){
            console.log("video seen");
        })
        .catch(error => {
            console.log(error);
        });
    }
  
      const logout = () => {
          auth.signOut();
          history.push('/');
      }
  
      const checkIfUserInValidTeam = (firebaseUser, session, tmpUser) => {
        firebase
        .firestore()
        .collection('users')
        .doc(firebaseUser.uid)
        .get()
        .then(function(doc) {
            if(doc.exists){
                let teamId = null;
                let tempUser = doc.data();
                if(doc.data().team && doc.data().sessions.indexOf(session.id) !== -1){
                    teamId = doc.data().team;
                }

                if(teamId !== null){
                    checkIfTeamValid(teamId, session, tempUser);
                }
                else {
                    assignToRoom(tempUser, session.id, session.date);
                }
            }
            else {
              console.log("user not found");
              logout();
            }
        })
        .catch(function(error) {
            console.error("Error fetching user: ", error);
        });
      }
  
      function loadNextSession(firebaseUser, tmpUser) {
        db.collection("sessions")
          .where("countries", "array-contains", country)
          .where("date", ">", new Date())
          .orderBy("date", "asc")
          .limit(10)
          .get()
          .then(function(querySession) {
              let gotSession = false;
              let session = null;
              if(!querySession.empty){
                  querySession.forEach(function(doc) {
                      if(doc.data().sites.indexOf(site) !== -1 && !gotSession){
                          gotSession = true;
                          let tempsession = doc.data();
                          tempsession.id = doc.id;
  
                          let date = new Date(doc.data().date.toDate());
                          date = date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2) + "-" + ("0" + date.getDate()).slice(-2) + "T" + ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2) + ":00";
                          tempsession.date = date;
  
                            if(UserProfile.getSessionId()){
                                if(UserProfile.getSessionId() !== tempsession.id){
                                    UserProfile.setSessionId(tempsession.id);
                                    UserProfile.setSessionDate(tempsession.date);
                                }
                            }
                            else {
                                UserProfile.setSessionId(tempsession.id);
                                UserProfile.setSessionDate(tempsession.date);
                            }
                          
                          session = tempsession;
                          setcurrentSession(tempsession);
                      }
                  });  
                  if(session !== null){
                      checkIfUserInValidTeam(firebaseUser, session, tmpUser);
                  }
                  else {
                      logout();
                  }
              }
              else {
                console.log("no more session found");
                logout();
              }
          });
      }

    const executeCreateRoom = (user, room, sessionId, sessionDate) => {
        // check if team created
        db.collection("rooms").add(room)
        .then(docRef => {
            // update user room with the newly created room
            db.collection("users").doc(user.uid).update({
                room: docRef.id
            })
            .then(function() {
                UserProfile.setRoom(docRef.id);
                user.room = docRef.id;
                getUserSerie(user, docRef.id, sessionId, sessionDate);
            })
            .catch(function(error) {
                console.error("Error updating user room: ", error);
            });
            
        })
        .catch(function(error) {
            console.error("Error adding document: ", error);
        });

          
    }
  
      function assignToRoom(user, sessionId, sessionDate) {
        firebase
            .firestore()
            .collection('rooms')
            .where('sessionId', '==', sessionId)
            .where('site', '==', site)
            .where('country', '==', country)
            .get()
            .then(function(querySnapshot) {
                // no room
                if (querySnapshot.empty) {
                    // create room
                    executeCreateRoom(user, {
                        id: 1,
                        sessionId,
                        country,
                        site,
                        nbPlayers: 1,
                        teams: []
                    }, sessionId, sessionDate);
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
                            var userDocRef = db.collection('users').doc(user.uid);
                            let abortTransaction = false;
                            db.runTransaction(function(transaction) {
                                return transaction.get(roomDocRef).then(function(roomDoc) {
                                    if (!roomDoc.exists) {
                                        throw "Document does not exist!";
                                    }
                        
                                    if(roomDoc.data().nbPlayers < Settings.MAX_PLAYERS_IN_ROOM){
                                        transaction.update(roomDocRef, {
                                            nbPlayers: firebase.firestore.FieldValue.increment(1)
                                        });
                                        
                                        transaction.update(userDocRef, {
                                            room: roomWithAvailableSpot
                                        });
                                    }
                                    else {
                                        abortTransaction = true;
                                    }
                                });
                            }).then(function() {
                                if(!abortTransaction){
                                    UserProfile.setRoom(roomWithAvailableSpot);
                                    getUserSerie(user, roomWithAvailableSpot, sessionId, sessionDate);
                                }
                                else {
                                    assignToRoom(user, sessionId, sessionDate);
                                }
                            }).catch(function(err) {
                                console.error("Error updating user room: ", err);
                            });
                        }
                    });
  
                    // if no room with less than 50 players
                    if(roomWithAvailableSpot == null){
                        // create a room with id = room + 1
                        executeCreateRoom(user, {
                            id: parseInt(countRooms + 1),
                            sessionId,
                            country,
                            site,
                            nbPlayers: 1,
                            teams: []
                        }, sessionId, sessionDate);
                    }  
                } 
            })
            .catch(function(error) {
                console.error("Error fetching rooms: ", error);
            });   
    }
  
    const assignTeam = (user, room, sessionId, sessionDate) => {
        console.log("assign team");
        user.status = "online";
        firebase
            .firestore()
            .collection('teams')
            .where('roomId', '==', room)
            .where('sessionId', '==', sessionId)
            .where('site', '==', site)
            .where('country', '==', country)
            .where('active', '==', true)
            .get()
            .then(function(queryTeamSnapshot) {
                let count = 0;
                /*
                if(sessionId === "KMIVHqbIQnhnM8vsfJL4"){
                    loadIncomingSession(sessionId);
                    return;
                }
                */
                queryTeamSnapshot.forEach(function(docTeam) {
                    count++;
                });
                if(queryTeamSnapshot.empty){
                    console.log("create 1 : " + count);
                    let names = [];
                    for (let i = 0; i < teamnames.length; i++) {
                        if(teamnames[i].lang === UserProfile.getCountry()){
                            if(UserProfile.getSite() === "senior"){
                                names = teamnames[i].names_senior;
                            }
                            else {
                                names = teamnames[i].names_core;
                            }
                        }
                    }
                    user.id = 1;
                    let team = {
                        id: names[Math.floor(Math.random() * names.length)].trim(),
                        countId: count + 1,
                        roomId: room,
                        sessionId,
                        advanceToFinale: false,
                        points: 0,
                        numberRoundPassed: 0,
                        timestamp: new Date().getTime(),
                        roundUid: "",
                        answerNext: user.alias,
                        answerTime: 0,
                        active: true,
                        site,
                        country,
                        onlineUsers: [],
                        firstQuestionUid: "",
                        p1QuestionId: "",
                        p2QuestionId: "",
                        p3QuestionId: "",
                        p4QuestionId: "",
                        p5QuestionId: "",
                        p6QuestionId: "",
                        p7QuestionId: "",
                        p8QuestionId: "",
                        region: user.region,
                        readyToGame: false,
                        organized: false,
                        isOrganizer: false,
                        ageRanges: setTeamAgeRange(user.age),
                        sessionDone: false,
                        serie: user.serie,
                        male: user.gender === 'male' ? 1 : 0,
                        female: user.gender === 'female' ? 1 : 0,
                        users: [
                            user
                        ]
                    };
                    executeCreateTeam(team, user, sessionDate);
                }
                else {
                    console.log("step 2");
                    // create a new team if less than 9 (MAX_PLAYERS_IN_TEAM) but let the player choose his team
                    console.log('choose a team for the user');
                    let inTeam = false;
                    let countEach = 0;
                    queryTeamSnapshot.forEach(function(doc) {
                        countEach++;
                        let team  = doc.data();
                        // add condition on age and region
                        console.log("step 3");
                        if(getTeamUserActiveLength(team.users) < Settings.MAX_PLAYERS_IN_TEAM && !inTeam && team.serie.session === sessionId && checkTeamAgeRegionParityAvailability(team.users, user.gender, team.ageRanges, user.age, team.region, user.region)){
                            inTeam = true;   
                            console.log("update 1 : " + user.alias);                                                                       
                            updateTeam(doc.id, team, user, sessionId, sessionDate);
                        }
                        else {
                            console.log("step 4");
                        }
  
                        // callback
                        if(countEach === count && !inTeam){
                            // parité not respecté, des personnes sont sans team
                            // console.log("Attendez la prochaine session ");
                            //history.push('/matchmaking-failure', { session: UserProfile.getSessionId() });
                            // loadIncomingSession(sessionId);

                            console.log("create 2 : " + user.alias);
                            let names = [];
                            for (let i = 0; i < teamnames.length; i++) {
                                if(teamnames[i].lang === UserProfile.getCountry()){
                                    if(UserProfile.getSite() === "senior"){
                                        names = teamnames[i].names_senior;
                                    }
                                    else {
                                        names = teamnames[i].names_core;
                                    }
                                }
                            }
                            user.id = 1;
                            team = {
                                id: names[Math.floor(Math.random() * names.length)].trim(),
                                countId: count + 1,
                                roomId: room,
                                sessionId,
                                advanceToFinale: false,
                                points: 0,
                                numberRoundPassed: 0,
                                timestamp: new Date().getTime(),
                                roundUid: "",
                                answerNext: user.alias,
                                answerTime: 0,
                                active: true,
                                site,
                                country,
                                onlineUsers: [],
                                p1QuestionId: "",
                                p2QuestionId: "",
                                p3QuestionId: "",
                                p4QuestionId: "",
                                p5QuestionId: "",
                                p6QuestionId: "",
                                p7QuestionId: "",
                                p8QuestionId: "",
                                firstQuestionUid: "",
                                region: user.region,
                                readyToGame: false,
                                organized: false,
                                isOrganizer: false,
                                ageRanges: setTeamAgeRange(user.age),
                                serie: user.serie,
                                sessionDone: false,
                                male: user.gender === 'male' ? 1 : 0,
                                female: user.gender === 'female' ? 1 : 0,
                                users: [
                                    user
                                ]
                            };
                            executeCreateTeam(team, user, sessionDate);
                        }
                    });
  
                    
                }
            })
            .catch(function(error) {
                console.error("Error fetching teams: ", error);
            });
    }

    const getTeamUserActiveLength = (users) => {
        let list = [];
        for (let i = 0; i < users.length; i++) {
            if(users[i].status === "online"){
                list.push(users[i].alias);
            }
        }

        console.log("getTeamUserActiveLength : " + list.length);

        return list.length;
    }

    const setTeamAgeRange = (userAge) => {
        let ageRanges = Settings.AGE_RANGES;
        for (let i = 0; i < ageRanges.length; i++) {
            if(parseInt(userAge) >= parseInt(ageRanges[i].min) && parseInt(userAge) <= parseInt(ageRanges[i].max)){
                return ageRanges[i];
            }
        }
    }

    const isUserInTeamPreviousAgeRange = (teamAgeRanges, userAge) => {
        if(userAge - 10 > 17){
            userAge = userAge - 10;
        }
        else {
            return false;
        }

        if(parseInt(userAge) >= parseInt(teamAgeRanges.min) && parseInt(userAge) <= parseInt(teamAgeRanges.max)){
            return true;
        }

        return false;
    }

    const isUserInTeamNextAgeRange = (teamAgeRanges, userAge) => {
        if(userAge + 10 < 100){
            userAge = userAge + 10;
        }
        else {
            return false;
        }

        if(parseInt(userAge) >= parseInt(teamAgeRanges.min) && parseInt(userAge) <= parseInt(teamAgeRanges.max)){
            return true;
        }

        return false;
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

          console.log("countMale : " + countMale);
          console.log("countFemale : " + countFemale);
  
          if(gender === "male" && countMale > 1){
              return false;
          }
  
          if(gender === "female" && countFemale > 1){
              return false;
          }
  
          return true;
    }

    const checkTeamAgeRegionParityAvailability = (teamUsers, userGender, teamAgeRanges, userAge, teamRegion, userRegion) => {
        let countMale = 0;
        let countFemale = 0;
        for (let i = 0; i < teamUsers.length; i++) {
            if(teamUsers[i].status === "online"){
                if(teamUsers[i].gender === "male"){
                    countMale++;
                } else {
                    countFemale++;
                }
            }
        }

        console.log("countMale : " + countMale);
        console.log("countFemale : " + countFemale);

        if(userGender === "male" && countMale > 1){
            return false;
        }

        if(userGender === "female" && countFemale > 1){
            return false;
        }

        if(parseInt(userAge) < parseInt(teamAgeRanges.min) || parseInt(userAge) > parseInt(teamAgeRanges.max)){
            return false;
        }

        if(teamRegion !== userRegion){
            return false
        }

        return true;
    }

    const checkTeamCloseAgeRegionParityAvailability = (teamUsers, userGender, teamAgeRanges, userAge, teamRegion, userRegion) => {
        let countMale = 0;
        let countFemale = 0;
        for (let i = 0; i < teamUsers.length; i++) {
            if(teamUsers[i].status === "online"){
                if(teamUsers[i].gender === "male"){
                    countMale++;
                } else {
                    countFemale++;
                }
            }
        }

        console.log("countMale2 : " + countMale);
        console.log("countFemale2 : " + countFemale);

        if(userGender === "male" && countMale > 1){
            return false;
        }

        if(userGender === "female" && countFemale > 1){
            return false;
        }

        if(teamRegion !== userRegion){
            return false
        }

        if(!isUserInTeamPreviousAgeRange(teamAgeRanges, userAge) && !isUserInTeamNextAgeRange(teamAgeRanges, userAge)){
            return false;
        }

        return true;
    }

    const checkTeamParityGood = (users) => {
          let countMale = 0;
          let countFemale = 0;
          for (let i = 0; i < users.length; i++) {
            if(users[i].status === "online"){
                if(users[i].gender === "male"){
                    countMale++;
                } else {
                    countFemale++;
                }
            }
          }

          console.log("countMale : " + countMale);
          console.log("countFemale : " + countFemale);
  
          if(countMale === 2 && countFemale === 2){
              return true;
          }
  
          return false;
    }
  
    const executeCreateTeam = (team, user, sessionDate) => {
        // check if team created
        console.log("step 6");
        db.collection('teams').add(team).then(function(docRef) {
            db.collection('users').doc(user.uid).update({
                team: docRef.id
            }).then(function() {
                UserProfile.setTeam(docRef.id);
                UserProfile.setTeamSerie(team.serie.id);
                UserProfile.setUserIdInTeam(user.id);

                team.uid = docRef.id;
                setteam(team);
                loadAllPlayers(docRef.id);
                checkIfVideoSeen(team, sessionDate);
                //onTeamFound();
            }).catch(function(err) {
                console.error("Error updating user team: ", err);
            });
        }).catch(function(err) {
            console.error("Error creating team: ", err);
        });

          
    }

    const getUserSerie = (user, room, sessionId, sessionDate) => {
        db.collection('series')
          .where('country', '==', country)
          .where('site', '==', site)
          .where('session', '==', sessionId)
          //.where("regions", "array-contains", user.region)
          .get()
          .then((querySeriesSnapshot) => {
              if (!querySeriesSnapshot.empty) {
                querySeriesSnapshot.forEach(function(doc) {
                    let ageRanges = doc.data().ageRanges;
                    let serie = doc.data();
                    serie.id = doc.id;
                    delete serie.rounds;
                    delete serie.finaleRounds;
    
                    if(serie){
                        user.serie = serie;
                        console.log("ici1 : user");
                        console.log(user);
                        if(!checkIfSessionStartedWithDate(sessionDate)){
                            assignTeam(user, room, sessionId, sessionDate);
                        }
                        else {
                            console.log("matchmaking failure");
                            loadIncomingSession(sessionId);
                        }
                    }

                })
              }
          }).catch(function (error) {
              console.log("Error getting questions:", error);
          });
    }
  
    const updateTeam = (teamUid, team, user, sessionId, sessionDate) => {
        delete user.team;
        delete user.room;
  
        var teamDocRef = db.collection('teams').doc(teamUid);
        var userDocRef = db.collection('users').doc(user.uid);
        let abortTransaction = false;
        let newNickname = null;
        db.runTransaction(function(transaction) {
            return transaction.get(teamDocRef).then(function(teamDoc) {
                if (!teamDoc.exists) {
                    throw "Document does not exist!";
                }
                
                console.log("update : " + user.alias);
                console.log("update team : " + teamUid);

                if(getTeamUserActiveLength(teamDoc.data().users) >= Settings.MAX_PLAYERS_IN_TEAM && checkTeamParityAvailability(teamDoc.data().users, user.gender)){
                    console.log("abort update");
                    abortTransaction = true;
                }
                else {
                    console.log("not abort update team");
                    user.id = teamDoc.data().users.length + 1;
                    let sameName = checkDuplicateNicknameInTeam(user.alias, teamDoc.data().users);
                    if(sameName > 0){
                        newNickname = user.alias + (sameName + 1).toString();
                        user.alias = newNickname;
                    }
                    transaction.update(teamDocRef, {
                        users: firebase.firestore.FieldValue.arrayUnion(user),
                        male: user.gender === 'male' ? firebase.firestore.FieldValue.increment(1) : team.male,
                        female: user.gender === 'female' ? firebase.firestore.FieldValue.increment(1) : team.female
                    });
                }
            });
        }).then(function() {
            if(abortTransaction){
                assignTeam(user, UserProfile.getRoom(), sessionId, sessionDate);
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
                        let paramUser = {
                            team: teamUid
                        };

                        if(newNickname){
                            paramUser.alias = newNickname;
                            UserProfile.setAlias(newNickname);
                        }

                        userDocRef.update(paramUser)
                        .then(function() {
                            UserProfile.setTeam(teamUid);
                            UserProfile.setTeamSerie(team.serie.id);
                            UserProfile.setUserIdInTeam(user.id);
  
                            team.uid = teamUid;
                            setteam(team);
                            loadAllPlayers(teamUid);
                            checkIfVideoSeen(team, sessionDate);
                            //onTeamFound();
                        }).catch(function(err) {
                            console.error("Error updating user: ", err);
                        });
                    }
                    else {
                        console.log("notin");
                        assignTeam(user, UserProfile.getRoom(), sessionId, sessionDate);
                    }
                }).catch(function(err) {
                    console.error("Error getting team: ", err);
                });
                
            }
        }).catch(function(err) {
            console.error("Error updating user team: ", err);
        });
    }

    const checkDuplicateNicknameInTeam = (name, users) => {
        let sameName = 0;
        if(users){
            for (let i = 0; i < users.length; i++) {
                if(users[i].alias === name){
                    sameName++;
                }
            }
        }
        return sameName;
    }

    const loadAllPlayers = (teamUid) => {
        console.log("loadAllPlayers teamUid : " + teamUid)
        playersSnapshot = firebase
            .firestore()
            .collection('teams')
            .doc(teamUid)
            .onSnapshot(function(doc) {
                var tempPlayers = [];
                let tmpUsers = doc.data().users;
                for (let i = 0; i < tmpUsers.length; i++) {
                    if(tmpUsers[i].status === "online"){
                        tempPlayers.push(tmpUsers[i]);
                    }
                }
                setplayers(tempPlayers);
            });
    }

    const discuss = (user) => {
        // check if chat exist
        if(user == "team"){
            setisTeamChatOpen(true);
            if(width < breakpoint){
                setisChatOpen(true);
            }
        }
        else {
            firebase
            .database()
            .ref("users/" + user.alias + "/chatUids")
            .orderByKey().equalTo(user.alias + "_" + UserProfile.getAlias())
            .once("value", userSnapshot => {
                if(userSnapshot.val() !== null){
                    // discussion exist => launch
                    //document.getElementById("chat_" + user.alias + "_" + UserProfile.getAlias()).click();
                    showChat(user.alias + "_" + UserProfile.getAlias());
                    setisTeamChatOpen(false);
                    setisChatOpen(true);
                }
                else {
                    firebase
                        .database()
                        .ref("users/" + UserProfile.getAlias() + "/chatUids")
                        .orderByKey().equalTo(UserProfile.getAlias() + "_" + user.alias)
                        .once("value", userSelfSnapshot => {
                            if(userSelfSnapshot.val() !== null){
                                // discussion exist => launch
                                //document.getElementById("chat_" + UserProfile.getAlias() + "_" + user.alias).click();
                                showChat(UserProfile.getAlias() + "_" + user.alias);
                                setisTeamChatOpen(false);
                                setisChatOpen(true);
                            }
                            else {
                                // no discussion yet => initiate
                                // create chat in this.user
                                firebase
                                    .database()
                                    .ref("users/" + UserProfile.getAlias() + "/chatUids/" + (UserProfile.getAlias() + "_" + user.alias))
                                    .set({
                                        name: user.alias,
                                        photo: user.avatar,
                                        gender: user.gender,
                                        isRequest: true,
                                        isChatAccepted: true,
                                        requester: UserProfile.getAlias(),
                                        isBlocked: false,
                                        initIsBlocked: true,
                                        blocker: UserProfile.getAlias(),
                                        uid: UserProfile.getAlias() + "_" + user.alias
                                    });
                                // create chat in recipient user
                                firebase
                                    .database()
                                    .ref("users/" + user.alias + "/chatUids/" + (UserProfile.getAlias() + "_" + user.alias))
                                    .set({
                                        name: UserProfile.getAlias(),
                                        photo: UserProfile.getAvatar(),
                                        gender: UserProfile.getGender(),
                                        isRequest: true,
                                        isChatAccepted: true,
                                        requester: UserProfile.getAlias(),
                                        isBlocked: false,
                                        initIsBlocked: true,
                                        blocker: UserProfile.getAlias(),
                                        uid: UserProfile.getAlias() + "_" + user.alias
                                    });
                                // create discussion
                                firebase
                                    .database()
                                    .ref("messages/" + (UserProfile.getAlias() + "_" + user.alias))
                                    .push({
                                        author: "bot",
                                        message: "Vous pouvez commencer à discuter",
                                        timestamp: new Date().getTime()
                                    });
                                /*
                                if(document.getElementById("chat_" + UserProfile.getAlias() + "_" + user.alias)){
                                    document.getElementById("chat_" + UserProfile.getAlias() + "_" + user.alias).click();
                                    setisTeamChatOpen(false);
                                    setisChatOpen(true);
                                }
                                */
                               setisChatOpen(true);
                               setisTeamChatOpen(false);
                            }
                        })
                }
            })
        }
    }

    const sessionBegin = () => {
        console.log("sessionBegin");
        if(team){
            //initiateTeamChat(team.uid, team.id);
            timeUp();
        }
        else {
            console.log("matchmaking failure sessionBegin");
            loadIncomingSession(currentSession.id);
        }
    }

    const executeTimeUp = () => {
        console.log("isReadyForGame : " + isReadyForGame);
        if(isReadyForGame){
            // team re-organization
            //setshowGameStartModal(true);
            props.changeLoaderStatus();
            updateTeamReadyStatus();
            checkIfAllTeamOrganized();
        }
        else {
            console.log("matchmaking failure executeTimeUp");
            loadIncomingSession(currentSession.id);
        }
    }

    const checkIfUserInTeam = (tmpUsers) => {
        for (let i = 0; i < tmpUsers.length; i++) {
            if(tmpUsers[i].alias === UserProfile.getAlias()){
                return true;
            }
        }
        return false;
    }

    const checkIfAllTeamOrganized = () => {
        console.log("checkIfAllTeamOrganized");
        let tmpTeamUid = team.uid;
        teamOrganizedListener = firebase
          .firestore()
          .collection('teams')
          .where('roomId', '==', UserProfile.getRoom())
          .where('sessionId', '==', UserProfile.getSessionId())
          .onSnapshot(function(queryTeamSnapshot) {
                let allTeamOrganized = true;
                let count = 0;
                queryTeamSnapshot.forEach(function(doc) {
                    count++;
                });

                let countEach = 0;
                let teamList = [];
                let myTeamInactive = false;
                queryTeamSnapshot.forEach(function(doc) {
                    countEach++;
                    if(doc.data().organized !== true && doc.data().active === true){
                        allTeamOrganized = false;
                    }

                    if(doc.data().active === false && doc.id === tmpTeamUid && checkIfUserInTeam(doc.data().users)){
                        myTeamInactive = true;
                    }

                    if(doc.data().active === true){
                        teamList.push(doc.id);
                    }

                    console.log("teamList");
                    console.log(teamList);

                    if(countEach === count){
                        if(!myTeamInactive){
                            if(allTeamOrganized){
                                console.log("all team organized");
                                if (typeof teamOrganizedListener !== "undefined") { 
                                    // safe to use the function
                                    teamOrganizedListener();
                                }
                                // check myteam is active
                                db.collection('users')
                                .doc(UserProfile.getUserUid())
                                .get()
                                .then((docUser) => {
                                    console.log("myteam : " + docUser.data().team);
                                    props.hideLoader();
                                    if(teamList.indexOf(docUser.data().team) !== -1){
                                        console.log("go on");
                                        setshowGameStartModal(true);
                                    }
                                    else {
                                        console.log("go back");
                                        loadIncomingSession(UserProfile.getSessionId());
                                    }
                                }).catch(function (error) {
                                    console.log("Error getting user:", error);
                                });
                            }
                            else {
                                console.log("not all team organized");
                            }  
                        }
                        else {
                            console.log("my team not active");
                            loadIncomingSession(UserProfile.getSessionId());
                            if (typeof teamOrganizedListener !== "undefined") { 
                                // safe to use the function
                                teamOrganizedListener();
                            }
                        }
                    }
                });
          });
    }

    function removeTeamFirstElement(allTeam) {
        let tmpTeams = [];
        for (let i = 0; i < allTeam.length; i++) {
			if(i > 0){
				tmpTeams.push(allTeam[i]);
			}
		}
        return tmpTeams;
    }

    function checkIfTeamWithLessThan4Player(allTeam) {
        let tmpTeams = [];
        for (let i = 0; i < allTeam.length; i++) {
			if(getTeamUserActiveLength(allTeam[i].users) < 4 && allTeam[i].active === true){
				tmpTeams.push(allTeam[i]);
			}
        }
        tmpTeams.sort((a, b) => (a.users.length > b.users.length) ? 1 : -1);
        return tmpTeams;
    }

	function setAllTeamAsOrganized(allTeam) {
        var batch = firebase.firestore().batch();
		let teamRef = null;
        for (let i = 0; i < allTeam.length; i++) {
            teamRef = firebase.firestore().collection("teams").doc(allTeam[i].uid);
            batch.update(teamRef, {
                organized: true
            });
        }
        // Commit the batch
        batch.commit().then(function () {
            console.log("setAllTeamAsOrganized done");
        });
    }

    const updateTeamActiveStatus = (teamUid) => {
        firebase.firestore().collection("teams").doc(teamUid).update({
            active: false
        })
        .then(function() {
            console.log("team active updated");
            //teamReorganizationListener();
            //loadIncomingSession(UserProfile.getSessionId());
        })
        .catch(function(error) {
            console.error("Error updating team active: ", error);
        });
    }

    const updateTeamAsOrganizer = (teamUid) => {
        firebase.firestore().collection("teams").doc(teamUid).update({
            isOrganizer: true
        })
        .then(function() {
            console.log("team isorganizer updated");
        })
        .catch(function(error) {
            console.error("Error updating team isorganizer: ", error);
        });
    }

    const isSelfUserToAction = (tmpUsers) => {
        if(tmpUsers){
            let userToAction = null;
            for (let i = 0; i < tmpUsers.length; i++) {
                if(tmpUsers[i].status === "online"){
                    userToAction =  tmpUsers[i].alias;
                    break;
                }
            }
            if(userToAction){
                if(userToAction === UserProfile.getAlias()){
                    return true;
                }
            }
        }
        return false;
    }

    const isSelfTeamToAction = (tmpTeams, myTeamUid) => {
        if(tmpTeams){
            let teamToAction = null;
            if(tmpTeams[0].active === true && tmpTeams[0].uid === myTeamUid){
                return tmpTeams[0].users;
            }
        }
        return null;
    }

    const updateTeamReadyStatus = () => {
        let tmpTeamUid = team.uid;
        console.log("updateTeamReadyStatus : " + tmpTeamUid);
        firebase.firestore().collection("teams").doc(tmpTeamUid).update({
            readyToGame: true
        })
        .then(function() {
            console.log("team ready updated");
        })
        .catch(function(error) {
            console.error("Error updating team ready: ", error);
        });
    }

    const timeUp = () => {
        console.log("timeUp");
        setisTimeUp(true);
    }

    const switchToWaitingMessage = () => {
        console.log("switchToWaitingMessage");
        setTimeout(() => {
            setshowWaitingMessage(true);
        }, Settings.TIME_POPUP_ACTIVITY * 1000);
    }

    const gameStartModalEntered = () => {
        console.log("gameStartModalEntered");
        setTimeout(() => {
            setshowGameStartModal(false);
        }, Settings.TIME_POPUP_ACTIVITY * 1000);
    }

    const gameStartModalExited = () => {
        console.log("gameStartModalExited");
        history.push('/game-platform', { team });
    }

    function handleOpenModal () {
        setshowModal(true);
    }
      
    function handleCloseModal () {
        setshowModal(false);
    }

    const handleSubmitDeclaration = (event) => {
        event.preventDefault();
        if(accused && declaration !== ""){
            firebase.firestore().collection("complaints").add({
                date : new Date,
                complainant: UserProfile.getAlias(),
                accused,
                declaration
            })
            .then(() => {
                console.log("complaint added");
                document.getElementById('alert-complaint').style.display = 'block';
                setTimeout(() => {
                    document.getElementById('alert-complaint').style.display = 'none';
                    handleCloseModal();
                }, 3000);
            }).catch(function (error) {
                console.log("Error adding complaint:", error);
            });
        }
        else {
            console.log("check accused & declaration");
        }
    }

    const loadComplainants = () => {
        complainantsListener = firebase.firestore().collection("complaints")
            .where("accused", "==", UserProfile.getAlias())
            .onSnapshot(function(querySnapshot) {
                let tempArray = []; 
                querySnapshot.forEach(function(doc) {
                    if(tempArray.indexOf(doc.data().complainant) === -1) {
                        tempArray.push(doc.data().complainant);
                    }
                });
                setcomplainants(tempArray);
            });
    }

    const initiateTeamChat = (uid, id) => {
        let teamId = uid;
        // check if chat exist
        firebase
          .database()
          .ref("users/" + UserProfile.getAlias() + "/chatUids")
          .orderByKey().equalTo(teamId)
          .once("value", userSnapshot => {
              if(userSnapshot.val() === null){
                // create chat in this.user
                firebase
                    .database()
                    .ref("users/" + UserProfile.getAlias() + "/chatUids/" + teamId)
                    .set({
                        name: t('team_chat_upper.title'),
                        photo: "default.png",
                        uid: teamId
                    });
                if(!checkIfSessionStarted()){
                    setloadPresenceChecker(true);
                }
                else {
                    console.log("matchmaking failure");
                    loadIncomingSession(currentSession ? currentSession.id : null);
                }
                firebase
                    .database()
                    .ref("messages/" + teamId)
                    .once("value", messageSnapshot => {
                        if(messageSnapshot.val() === null){
                            firebase
                                .database()
                                .ref("messages/" + teamId)
                                .push({
                                    author: "bot",
                                    message: t('team_chat_bot_message.title'),
                                    isWelcome: true,
                                    timestamp: new Date().getTime()
                                });
                        }
                        firebase
                            .database()
                            .ref("messages/" + teamId)
                            .push({
                                author: "bot",
                                message: getTeamChatNotification(UserProfile.getAlias(), false),
                                isStatusMessage: true,
                                hasLeft: false,
                                timestamp: new Date().getTime()
                            });
                    });
              }
        })
    }

    const getTeamChatNotification = (userName, hasLeft) => {
        if(hasLeft){
            return userName + " " + t('left_room.title');
        }
        else {
            return userName + " " + t('joined_room.title');
        }
    }

    const privateConversationListener = () => {
        console.log("privateConversationListener");
        firebase
          .database()
          .ref("users/" + UserProfile.getAlias() + "/chatUids")
          .on("value", snapshot => {
              console.log("exist list");
            let initCount = 0;
            snapshot.forEach(child => {
                initCount++;
            });
            console.log("initCount : " + initCount);
            let tempConversations = [];
            let count = 1;
            let countEach = 0;
            snapshot.forEach(child => {
                countEach++;
              if(child.key.includes('_')){
                tempConversations.push({
                  id: count,
                  uid: child.key,
                  name: child.val().name,
                  photo: child.val().photo,
                  isOneToOne: true,
                  active: true
                });
              }
              count++;

              console.log("countEach : " + countEach);
              console.log("initCount : " + initCount);

              if(countEach === initCount){
                setinitialPrivateConversations(tempConversations);
                if(tempConversations.length > 0 && width < breakpoint){
                    let tmpList = [];
                    tmpList.push(tempConversations[tempConversations.length - 1]);
                    console.log("tmpList : ");
                    console.log(tmpList);
                    setprivateConversations(tmpList);
                }
                else {
                    setprivateConversations(tempConversations);
                }
              }
            });
  
            
          })
    }

    const hideChat = (uid) => {
        if(width < breakpoint){
            setisChatOpen(false);
        }
        else{
            if(privateConversations){
                let tmpConversations = privateConversations;
                let newTmpList = [];
                for (let i = 0; i < tmpConversations.length; i++) {
                    if(tmpConversations[i].uid !== uid){
                        newTmpList.push(tmpConversations[i]);
                    }
                    
                }
                setprivateConversations(newTmpList);
            }
        }
    }

    const showChat = (uid) => {
        if(privateConversations){
            let tmpConversations = [...privateConversations];
            let tmpInitialConversations = [...initialPrivateConversations];
            let exists = false;
            for (let i = 0; i < tmpConversations.length; i++) {
                if(tmpConversations[i].uid === uid){
                    exists = true;
                    break;
                }
            }

            if(!exists){
                if(width < breakpoint){
                  tmpConversations = tmpInitialConversations.filter(function(item){
                      return item.uid === uid;
                  });
                }
                else {
                  let chatToShow = tmpInitialConversations.filter(function(item){
                    return item.uid === uid;
                  });
                  if(chatToShow.length > 0){
                    tmpConversations.push(chatToShow[0]);
                  }
                }
            }

            console.log("showChat wr");
            console.log("tmpConversations");
            console.log(tmpConversations);
            setprivateConversations(tmpConversations);
        }
    }

    const swipeUp = () => {
        console.log("onSwipedUp");
        $("#team-chat-block").animate({height:'25%'});
        $("#compose-block").addClass('mobile-swipeable');
        $("#icon-swiper").addClass('rotate');

    }

    const swipeDown = () => {
        console.log("onSwipedDown");
        $("#team-chat-block").animate({height:'100%'});
        $("#compose-block").removeClass('mobile-swipeable');
        $("#icon-swiper").removeClass('rotate');
    }

    const renderFormattedRemainingTime = (totalSeconds) => {
        let hours = Math.floor(totalSeconds / 3600);
        totalSeconds %= 3600;
        let minutes = Math.floor(totalSeconds / 60);
        let seconds = totalSeconds % 60;
        let textHour = '';
        if(hours > 0){
            textHour = hours + "'''";
        }
        return textHour + (minutes !== 0 ? minutes + "'" + addLeadingZeros(seconds) + "''" : addLeadingZeros(seconds) + "''");
    }

    const addLeadingZeros = (value) => {
      value = String(value);
      while (value.length < 2) {
        value = '0' + value;
      }
      return value;
    }

    const playerTopSong = () => {
        console.log("playerTopSong");
        audioPlayerEl.current.toggle();
    }

    const loadIncomingSession = (sessionId) => {
        db.collection("sessions")
            .where("countries", "array-contains", country)
            .where("date", ">", new Date())
            .orderBy("date", "asc")
            .get()
            .then(function(querySnapshot) {
                console.log("load session");
                let count = 0;
                querySnapshot.forEach(function(doc) {
                    count++;
                });
                let tempsession = null;
                let gotSession = false;
                let countEach = 0;
                if(count > 0){
                    querySnapshot.forEach(function(doc) { 
                        countEach++;
                        if(doc.data().sites.indexOf(site) !== -1 && !gotSession && doc.id !== sessionId){
                            gotSession = true;
                            tempsession = doc.data();
                            tempsession.id = doc.id;
                        }

                        if(countEach === count){
                            setshowMatchmakingResult(false);
                            setisMatchmakingSuccess(false);
                            props.hideLoader();
                            if(gotSession){
                                let date = new Date(tempsession.date.toDate());
                                date = date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2) + "-" + ("0" + date.getDate()).slice(-2) + "T" + ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2) + ":00";
                                tempsession.date = date;
                                
                                let changeSession = false;
                                if(UserProfile.getSessionDate()){
                                    if(UserProfile.getSessionDate() !== tempsession.date){
                                        changeSession = true;
                                    }
                                }
                                else {
                                    changeSession = true;
                                }
                                UserProfile.setSessionId(tempsession.id);
                                UserProfile.setSessionDate(tempsession.date);
                                
                                console.log(tempsession);
                                
                                if(changeSession){
                                    console.log("change session");
                                    setcurrentSession(tempsession);
                                    setnextSessionTime(calculateCountdownWithDate(tempsession.date));
                                    setloadPresenceChecker(true);
                                    
                                    // reload user assignment
                                    let tmpUser = {
                                        alias: UserProfile.getAlias(),
                                        region: UserProfile.getRegion(),
                                        age: UserProfile.getAge(),
                                        gender: UserProfile.getGender(),
                                        avatar: UserProfile.getAvatar(),
                                        uid: UserProfile.getUserUid()
                                    }
                                    reloadUserAssignation(tempsession.id, tmpUser, tempsession.date);
                                }
                            }
                            else {
                                // no more session
                                console.log("no more session");
                                setnoMoreSession(true);
                            } 
                        }
                    });   
                }
                else {
                    console.log("no more session found");
                    props.hideLoader();
                    setshowMatchmakingResult(false);
                    setisMatchmakingSuccess(false);
                    setnoMoreSession(true);
                }
            });
    }

    const reloadUserAssignation = (sessionId, tmpUser, sessionDate) => {
        console.log("sessionId : " + sessionId);
        console.log(tmpUser);
        firebase.firestore().collection("users").doc(tmpUser.uid).update({
            room: firebase.firestore.FieldValue.delete(),
            isVideoSeen: false
          }).then(function(){
            console.log("user reloaded");
            assignToRoom(tmpUser, sessionId, sessionDate);
          })
          .catch(error => {
              console.log(error);
          });
    }
    
    function maskMovie() {
        console.log("maskMovie");
        let movieMask = document.getElementById('playMovie');
        movieMask.classList.add("d-none");
    }

    const checkIfImageLoaded = () => {
        const size = 3770;
        let count = internetSpeedCounter / 10;
        console.log("internetSpeedCounter : " + count);
        let speed = Math.round(size / count);
        console.log("speed");
        console.log(speed / 1000 + "Kb/s");
        clearInterval(internetSpeedTimer);

        if(speed < Settings.INTERNET_SPEED_LIMIT){
            // poor connection
            //setisConnectionSlow(true);
        }
        else {
            setisConnectionSlow(false);
        }
    }

    const lateUserModalEntered = () => {
        console.log("lateUserModalEntered");
        setTimeout(() => {
            setshowLateUserModal(false);
        }, 5000);
    }

    const lateUserModalExited = () => {
        console.log("lateUserModalExited");
        /*
        firebase.database().ref('/status/' + UserProfile.getAlias()).set({
            state: 'offline',
            last_changed: firebase.database.ServerValue.TIMESTAMP,
            teamUid: UserProfile.getTeam()
        }).then(function() {
            logout();
        }).catch(() => {
            logout();
        });
        */
       logout();
    }

    const videoEnded = () => {
        console.log("videoEnded wr");
        if(document.fullscreenElement){
            console.log("videoEnded2 wr");
            document.webkitExitFullscreen();
        }
    }

    return (
        <div className="waiting-room">
            {
                team && loadPresenceChecker ? <PresenceChecker key={team.uid} userUid={UserProfile.getAlias()} teamUid={team.uid} loadIncomingSession={loadIncomingSession} from="waiting-room" currentSessionDate={currentSession.date} /> : ''
            }

            {
                imageReadyToLoad ? 
                <img style={{display: "none"}} src={Settings.FIREBASE_STORAGE + "o/Logo-match.png?alt=media&token=68dc9338-112b-4ff8-a3ae-c072863df6dc"} onLoad={checkIfImageLoaded} />
                : ''
            }

            {
                isConnectionSlow ? 
                <Modal className={site} backdrop="static" show={showLateUserModal} size="sm" onExited={lateUserModalExited} onEntered={lateUserModalEntered} centered onHide={() => setshowLateUserModal(false)}>
                    <Modal.Body>
                    <p className="para">Your internet connection is not good enough to go further. You will be ejected from the room.</p>
                    </Modal.Body>
                </Modal>
                : ''
            }
            <Modal className={site} backdrop='static' show={showGameStartModal} size="sm" onExited={gameStartModalExited} onEntered={gameStartModalEntered} centered onHide={() => setshowGameStartModal(false)}>
                <Modal.Body>
                    <h4 className="ttr">{t('game_starting.title')}</h4>
                    <p className="para"> {t('o2o_close.title')}</p>
                </Modal.Body>
            </Modal>
            {
                showMatchmakingResult && isTeamFull ? 
                <div className="matchmaking-content">
                    {
                        team ? 
                        <div className="matchmaking-sucess col-12">
                            <div className="col-12">
                                <ul className="players-list">
                                    {
                                        players ? 
                                        players.map((player) => (
                                            <li className="player-item" key={player.alias} onClick={() => UserProfile.getAlias() !== player.alias ? discuss(player) : {}}>
                                                <div className="image-container">
                                                    {
                                                        UserProfile.getAlias() !== player.alias ? <span id={"chat-dot-" + player.alias} className="chat-dot d-none"></span> : ''
                                                    }
                                                    
                                                    <img src={process.env.PUBLIC_URL + '/assets/images/avatars/' + (player.avatar !== "" ? player.avatar : 'default.png')} alt=""/>
                                                    <span className="indicator">{UserProfile.getAlias() === player.alias ? '('+ t('you.title') +')' : ''}</span>
                                                </div>
                                                <span>{player.alias}</span>
                                                <span>{player.age}yo<br/> {player.region}</span>
                                            </li>
                                        )) : ''
                                    }
                                    {
                                        width < breakpoint ? 
                                        <li className="player-item" key={"teamchat"} onClick={() => discuss("team")}>
                                            <div className="image-container">
                                                <img src={process.env.PUBLIC_URL + '/assets/images/avatars/default.png'} alt=""/>
                                            </div>
                                            <span>{t('team_chat.title')}</span>
                                        </li>
                                        : ''
                                    }
                                </ul>
                            </div>
                            {
                                width < breakpoint && isChatOpen ? 
                                <div className="waiting-area-mobile"> 
                                    <div className="progressContent">
                                        <ProgressBar allottedTime={calculateCountdown()} targetDate={UserProfile.getSessionDate()} timeUp={timeUp} screen={width} isMobile={true}/>
                                    </div>
                                    {
                                        team ? 
                                        (
                                            isTeamChatOpen ? 
                                                <TeamChat changeConversationStatus={hideChat} isMobile={true} teamUid={team.uid} isLive={false} /> 
                                            : 
                                            (
                                                privateConversations.map((item, index) => (
                                                    item && index === 0 ? 
                                                    <OneToOneChat key={item.uid} changeConversationStatus={hideChat} isMobile={true} chatUniqueId={item.uid} isLive={false} />
                                                    : ''
                                                ))
                                            )
                                        )
                                        : ''
                                    }
                                </div>
                                : 
                                ''
                            }
                            <div className="col-12">
                                <h3 className="ttr">{site === "core" ? t('first_song_in.title') : t('first_question_in.title')} <span id="counter-numbers-timer"></span></h3>
                                <div className="timer-container">
                                    <CircleProgressBarReal date={UserProfile.getSessionDate()} timeUp={timeUp} withCounter={true} symbol={"number"} />
                                </div>
                                {
                                    showWaitingMessage ? 
                                    <div className="waiting-message">
                                        <p>{t('short_time.title')}</p>
                                        <p>{t('enjoy.title')}</p>
                                    </div> : 
                                    <div className="joined-team leader-message">
                                        <h3 className="sttr">{t('joined_team.title')} "{team.id}"</h3>
                                        <p>{t('short_time.title')}</p>
                                        <p>{t('enjoy.title')}</p>
                                    </div>
                                }
                            </div>
                        </div>
                        :
                        ''
                    }
                </div> :
                (
                    isMatchmakingSuccess ? 
                        <div className="rules-content">
                            <h2 className="ttr">{t('next_session_in.title')}</h2>
                            {/*<CountdownSession date={UserProfile.getSessionDate()} dateReached={sessionBegin} from="waiting-room"/>*/}
                            {/*<Countdown key={UserProfile.getSessionId()} date={UserProfile.getSessionDate()} dateReached={sessionBegin} />*/}
                            <CircleProgressBarRealDays key={UserProfile.getSessionId()} date={UserProfile.getSessionDate()} timeUp={sessionBegin} oneHourReached={() => {}} langs= {[t('days.title'), t('hours.title'), t('minutes.title'), t('seconds.title')]}/>
                            <h3 className="sttr">{t('looking_team.title')}</h3>
                            {
                                showRules ? 
                                <div className="rules">
                                    <p className="para">{t('look_rules.title')}</p>
                                    <div className="rulesMovie">
                                        <ReactPlayer 
                                            className='react-player' 
                                            width='100%' 
                                            height='100%' 
                                            controls={true} 
                                            url={process.env.PUBLIC_URL + '/assets/videos/' + Settings.RULES_VIDEO + "_" + UserProfile.getSite() + "_" + UserProfile.getCountry() + ".mp4"} 
                                            onEnded={setVideoSeen} 
                                            onStart={maskMovie} 
                                            onReady={maskMovie}  
                                            playing={true} 
                                            loop={false} />
                                            <div id="playMovie" className="playMovie">
                                                <button onClick={maskMovie} id="playerBtn" className="playerBtn"></button>
                                            </div>
                                    </div>
                                </div>
                                : 
                                <div className="sound-tester">
                                    <p className="para">{t('test_sound.title')}</p>
                                    <p className="para">{t('click_test_sound.title')}</p>
                                    <button onClick={playerTopSong} className="btnPlay"><i className="pic"></i></button>
                                    <SongPlayer ref={audioPlayerEl} fileName={"extraitjohnny1.mp3"} />
                                    <button className="btn btn-primary" onClick={() => {
                                        audioPlayerEl.current.pause();
                                        setshowRules(true);
                                    }}>{t('go_further.title')}</button>
                                </div>
                            }
                        </div> : 
                        (
                            noMoreSession ? 
                            <div className="rules-content">
                                <h3 className="sttr">{t('sorry_no_team_next_day.title')}</h3>
                            </div> : 
                            <div className="rules-content">
                                <h2 className="ttr">{t('next_session_in.title')}</h2>
                                {/*<Countdown key={UserProfile.getSessionId()} date={UserProfile.getSessionDate()} dateReached={sessionBegin} />*/}
                                <CircleProgressBarRealDays key={UserProfile.getSessionId()} date={UserProfile.getSessionDate()} timeUp={sessionBegin} oneHourReached={() => {}} langs= {[t('days.title'), t('hours.title'), t('minutes.title'), t('seconds.title')]}/>
                                <h3 className="sttr">{t('sorry_no_team.title')}</h3>
                                <div className="rules">
                                    <p className="para">{t('dont_disconnect.title')}</p>
                                    <div className="rulesMovie">
                                        <ReactPlayer 
                                            className='react-player' 
                                            width='100%' 
                                            height='100%' 
                                            controls={true} 
                                            url={process.env.PUBLIC_URL + '/assets/videos/' + Settings.RULES_VIDEO + "_" + UserProfile.getSite() + "_" + UserProfile.getCountry() + ".mp4"}
                                            onEnded={setVideoSeen} 
                                            onStart={maskMovie}
                                            onReady={maskMovie}
                                            playing={true} 
                                            loop={false} />
                                            <div id="playMovie" className="playMovie">
                                                <button onClick={maskMovie} id="playerBtn" className="playerBtn"></button>
                                            </div>
                                    </div>
                                </div>
                            </div>
                        )
                )
            }
            {
                width < breakpoint || !showMatchmakingResult || !isTeamFull ? 
                ''
                : 
                <div className="row waiting-area">
                    <div className="col-md-9 col-sm-12 o2ochats">
                        {
                            privateConversations.map(item => (
                                <div className="chatting" key={item.uid} style={{ width: 100/(privateConversations.length) + '%' }}>
                                    <OneToOneChat changeConversationStatus={hideChat} isMobile={false} chatUniqueId={item.uid} isLive={false} />
                                </div>
                            ))
                        }
                    </div>
                    <div className="chatting col-md-3 col-sm-12">
                        {
                            team ? 
                            <TeamChat changeConversationStatus={hideChat} isMobile={false} teamUid={team.uid} isLive={false} />
                            : ''
                        }
                    </div>
                </div>
            }
        </div>
    )
}