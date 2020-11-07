import React, {useEffect, useState} from 'react';
import FinaleRanking from '../FinaleRanking';
import Game from '../Game';
import './GamePlatform.css';
import * as firebase from 'firebase';
import { useHistory, Link } from "react-router-dom";
import UserProfile from '../../session/UserProfile';
import TeamChat from '../TeamChat';
import OneToOneChat from '../OneToOneChat';
import { useSwipeable } from "react-swipeable";
import $ from 'jquery';
import PresenceCheckerGp from '../PresenceCheckerGp';
import * as Settings from '../../settings/constants.js';
import { useTranslation } from "react-i18next";
import NavigatorOnline from 'react-navigator-online'

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
 *   Part of the hierarchy: GamePlatform > Game > Round > Question
 *   Init user when entering the game with a complete team of 4
 *   Get questions
 *   Check for user team change
 *   Handle screen separation to display the game area, chats and team infos
*/
export default function GamePlatform(props) {
    const [active, setActive] = useState(null);
    const [team, setteam] = useState(null);
    const [players, setplayers] = useState([]);
    const db = firebase.firestore();
    let history = useHistory();
    const [rounds, setRounds] = useState([]);
    const [isqualified, setisqualified] = useState(false);
    const [isFinale, setisFinale] = useState(false);
    const [activeFinale, setActiveFinale] = useState('finale-ranking');
    const [teamScoreRank, setteamScoreRank] = useState({
      score: 0,
      rank: 0
    })
    var teamPlayers;
    var teamQuery;
    const [privateConversations, setprivateConversations] = useState([]);
    const [initialPrivateConversations, setinitialPrivateConversations] = useState([]);
    const { width } = useViewport();
    const breakpoint = Settings.MOBILE_BREAKPOINT;
    const [isMingleMoment, setisMingleMoment] = useState(false);
    const [isTeamChatOpen, setisTeamChatOpen] = useState(true);
    const [isChatOpen, setisChatOpen] = useState(true);
    const [allTeamPlayers, setallTeamPlayers] = useState([]);
    const {t} = useTranslation('common');
    var internetSpeedTimer;
    const [internetSpeedCounter, setinternetSpeedCounter] = useState(0);

    useEffect(() => {
      if(!props.location.state || !props.location.state === undefined){
          history.push('/');
      }
      else {
        checkUserOnline(props.location.state.team);
        // loadAllNext(props.location.state.team);
      }

      window.onbeforeunload = function(e) {
        return 'Are you sure you want to leave the game?';
      };

      return () => {
        if (typeof teamPlayers !== "undefined") { 
            // safe to use the function
            teamPlayers();
        }
        if (typeof teamQuery !== "undefined") { 
            // safe to use the function
            teamQuery();
        }
      }
    }, []);

    useEffect(() => {
      internetSpeedTimer = setInterval(() => {
          setinternetSpeedCounter(internetSpeedCounter + 1);
          if((internetSpeedCounter + 1)%10 === 0 && team){
            firebase.database().ref('/status/' + team.uid).update(getUserPresenceId())
          }
      }, 1000);

      return () => {
        clearInterval(internetSpeedTimer);
      }
    }, [internetSpeedCounter]);

    const getUserPresenceId = () => {
      switch (parseInt(UserProfile.getUserIdInTeam())) {
          case 1:
              return {
                  user1Time: new Date().getTime()
              }
          case 2:
              return {
                  user2Time: new Date().getTime()
              }
          case 3:
              return {
                  user3Time: new Date().getTime()
              }
          case 4:
              return {
                  user4Time: new Date().getTime()
              }
          case 5:
              return {
                  user5Time: new Date().getTime()
              }
          case 6:
              return {
                  user6Time: new Date().getTime()
              }
          case 7:
              return {
                  user7Time: new Date().getTime()
              }
          case 8:
              return {
                  user8Time: new Date().getTime()
              }
      }
    }

    const loadAllNext = (activeTeam) => {
      props.changeLoaderStatus();
      setteam(activeTeam);
      getQuestions(false, activeTeam.uid);
      getTeamPlayersList(activeTeam.uid);
      getAllTeamPlayers(activeTeam.uid);
      getTeamScoreRank(activeTeam.uid, activeTeam.roomId);
      privateConversationListener();
    }

    const checkUserOnline = (activeTeam) => {
      if(!UserProfile.getAlias()){
        logout();
      }
      else {
        db.collection('users')
        .doc(UserProfile.getUserUid())
        .get()
        .then((docUser) => {
            if(docUser.exists){
              if(docUser.data().status === "online"){
                // get team
                db.collection('teams')
                .doc(docUser.data().team)
                .get()
                .then((docTeam) => {
                  if(docTeam.data().active === true){
                    let tmpTeam = docTeam.data();
                    tmpTeam.uid = docTeam.id;
                    
                    if(docUser.data().hasChangedTeam === true){
                      firebase
                      .database()
                      .ref("users/" + docUser.data().alias + "/chatUids/" + UserProfile.getTeam())
                      .remove();
                      
                      firebase
                      .database()
                      .ref("users/" + docUser.data().alias + "/chatUids/" + docTeam.id)
                      .set({
                        name: t('team_chat_upper.title'),
                        photo: "default.png",
                        uid: docTeam.id
                      });
                    }
                    
                    UserProfile.setTeam(docTeam.id);
                    UserProfile.setTeamSerie(docTeam.data().serie.id);
                    getUserIdInTeam(docTeam.data().users, UserProfile.getAlias());
                    loadAllNext(tmpTeam);
                  }
                  else {
                    console.log("team not active");
                  }
                })
              }
              else {
                logout();
              }
            }
            else {
              logout();
            }
        }).catch(function (error) {
            console.log("Error getting questions:", error);
        });
      }
    }

    const getUserIdInTeam = (tmpTeamUsers, userAlias) => {
      for (let i = 0; i < tmpTeamUsers.length; i++) {
        if(tmpTeamUsers[i].alias === userAlias){
          UserProfile.setUserIdInTeam(tmpTeamUsers[i].id);
          break;
        }
      }
    }

    const logout = () => {
      history.push('/');
    }

    const getQuestions = (isFinale, teamUid) => {
      db.collection('series')
        .doc(UserProfile.getTeamSerie())
        .get()
        .then((docSerie) => {
          let roundSeries = (!isFinale) ? docSerie.data().rounds : docSerie.data().finaleRounds;
          loadAllPlayers(roundSeries, isFinale, teamUid);
      }).catch(function (error) {
          console.log("Error getting questions:", error);
      });
    }

    async function updateTeamSerieOfQuestions(tempRoundSeries, isFinale, tempPlayers, teamUid) {
      // remove ready status if finale
      // get listONline users
      let onlineUsers = [];
      for (let i = 0; i < tempPlayers.length; i++) {
        if(tempPlayers[i].status === "online"){
          onlineUsers.push(tempPlayers[i].alias);
        }
      }

      let params = {
        rounds: tempRoundSeries,
        points: 0,
        numberRoundPassed: 0,
        roundUid: "",
        onlineUsers,
        firstQuestionUid: tempRoundSeries[0].questions[0].uniqueId,
        answerNext: tempPlayers[0].alias,
        sessionDone: firebase.firestore.FieldValue.delete()
      };
      
      await db.collection("teams").doc(teamUid).update(params)
      .then(function() {
        console.log("team rounds updated");
        props.hideLoader();
        setActive('game');
      })
      .catch(function(error) {
          console.error("Error updating team rounds: ", error);
      });
    }

    const setWhoAnswers = (roundSeries, users) => {
      console.log("setWhoAnswers");
      console.log(roundSeries);
      console.log(users);
      let nbPlayer = 0;
      for (let i = 0; i < roundSeries.length; i++) {
        let questions = roundSeries[i].questions;
        for (let j = 0; j < questions.length; j++) {
          if(nbPlayer < users.length){
            roundSeries[i].questions[j].response = users[nbPlayer].alias;
            if(nbPlayer + 1 < users.length){
              nbPlayer++;
            }
            else {
              nbPlayer = 0;
            }
          }
        }
      }
      console.log(roundSeries); 
      return roundSeries;
    }

    const goFinale = () => {
      console.log('goFinale');
      setisFinale(true);
      getQuestions(true);
    }

    const goFinaleRanking = (qualified) => {
      setisqualified(qualified);
      console.log('goFinaleRanking');
      setisFinale(true);
    }

    const renderSwitch = (param) => {
      switch (param) {
        case 'game':
          return <Game rounds={rounds} isFinale={false} goFinale={goFinale} team={team} players={allTeamPlayers} goFinaleRanking={goFinaleRanking} finaleended={false} switchOnMingleMoment={switchOnMingleMoment} />
      }
    }

    const renderSwitchFinale = (param) => {
      switch (param) {
        case 'finale-ranking':
          return <FinaleRanking team={team} isqualified={isqualified} changeLoaderStatus={() => props.changeLoaderStatus()} hideLoader={() => props.hideLoader()} switchOnMingleMoment={switchOnMingleMoment} />
      }
    }

    const loadAllPlayers = (activeRounds, isFinale, teamUid) => {
            firebase
                .firestore()
                .collection('teams')
                .doc(teamUid)
                .get()
                .then(function(doc) {
                    var tempPlayers = doc.data().users;

                    // be carefull if you want to remove self
                    let roundSeries = setWhoAnswers(activeRounds, tempPlayers);
                    console.log("loadAllPlayers");
                    updateTeamSerieOfQuestions(roundSeries, isFinale, tempPlayers, teamUid);

                    console.log("setRounds");
                    setRounds(roundSeries);
                    
                });
    }

    const getTeamPlayersList = (teamUid) => {
      teamPlayers = firebase
          .firestore()
          .collection('teams')
          .doc(teamUid)
          .onSnapshot(function(doc) {
            if(doc.exists){
              if(doc.data() !== undefined){
                let users = doc.data().users;
                let newusers = [];
                let tmpPlayer = null;
                for (let i = 0; i < users.length; i++) {
                  if(users[i].status === "online"){
                    tmpPlayer = users[i];
                    tmpPlayer.isLeader = doc.data().answerNext === users[i].alias;
                    newusers.push(tmpPlayer);
                  }
                }
                setplayers(newusers);
              }
            }
          });
    }

    const getAllTeamPlayers = (teamUid) => {
      firebase
          .firestore()
          .collection('teams')
          .doc(teamUid)
          .get()
          .then(function(doc) {
            if(doc.exists){
              if(doc.data() !== undefined){
                setallTeamPlayers(doc.data().users);
              }
            }
          });
    }

    const getTeamScoreRank = (teamUid, roomId) => {
      teamQuery = db.collection('teams')
        .where('roomId', '==', roomId)
        .where('active', '==', true)
        .orderBy("points", "desc")
        .onSnapshot(function(queryTeamSnapshot) {
            if(!queryTeamSnapshot.empty){
              let score = 0;
              let rank = 0;
              let count = 0
              queryTeamSnapshot.forEach(function(doc) {
                if(doc.id === teamUid){
                  score = doc.data().points;
                  rank = count + 1;
                }
                count++;
              });
              setteamScoreRank({
                score,
                rank
              })
            }
          });
    }

    const privateConversationListener = () => {
        firebase
          .database()
          .ref("users/" + UserProfile.getAlias() + "/chatUids")
          .on("value", snapshot => {
            let tempConversations = [];
            let count = 1;
            snapshot.forEach(child => {
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
            });
  
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
                if(tmpConversations[i] === uid){
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

            console.log("showChat gp");
            console.log("tmpConversations");
            console.log(tmpConversations);
            setprivateConversations(tmpConversations);
        }
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
                            setisTeamChatOpen(false);
                            setisChatOpen(true);
                        }
                    })
            }
        })
      }
  }

  const handlers = useSwipeable({
      onSwipedUp: () => swipeUp(),
      onSwipedDown: () => swipeDown(),
      preventDefaultTouchmoveEvent: true,
      trackMouse: true
  });

  const swipeUp = () => {
      console.log("onSwipedUp");
      $("#team-chat-block").animate({height:'25%'});
      $("#compose-block").addClass('mobile-swipeable');
      $("#icon-swiper").removeClass('rotate');

  }

  const swipeDown = () => {
      console.log("onSwipedDown");
      $("#team-chat-block").animate({height:'90%'});
      $("#compose-block").removeClass('mobile-swipeable');
      $("#icon-swiper").addClass('rotate');
  }

  const switchOnMingleMoment = () => {
    setisMingleMoment(!isMingleMoment);
  }

  const showMessage = (status) => {
    props.changeBlockingStatus();
    if (!status) {
      setTimeout(() => {
        firebase.database().ref('/status/' + UserProfile.getAlias()).set({
          state: 'offline',
          last_changed: firebase.database.ServerValue.TIMESTAMP,
          teamUid: UserProfile.getTeam()
        }).then(function() {
          logout();
        });
      }, 5000);
    }
  }

  return (
      <div className="game-platform">
        {
          team ? <PresenceCheckerGp userUid={UserProfile.getAlias()} teamUid={team.uid} from="game-platform" /> : ''
        }
        <NavigatorOnline onChange={(status) => showMessage(status)} />
        <div className="game-platform-container container">
          {
                width < breakpoint && !isMingleMoment ? 
                <div id="team-chat-block" className="top-mobile-team-chat" {...handlers}>
                    {
                        team ? 
                        <TeamChat changeConversationStatus={hideChat} isMobile={true} teamUid={team.uid} isLive={true} />
                        : ''
                    }
                </div>
                : 
                ''
          }
          <div className={"col-12 barInfos " + (isMingleMoment ? "noMargin" : "")}>
            {
              width < breakpoint && isMingleMoment ? '' : 
              <div className="col-md-3 col-sm-12 d-inline">
                {
                  team ? 
                  <div className="score-rank">
                    <h3 className="ttr" id={width < breakpoint ? "team-name" : ""}>{t('team.title')} <span>{team.id}</span></h3>
                    <div className="mt-3 mb-2" id={width < breakpoint ? "team-current-infos" : ""}>
                      <span>{t('you_scored.title')} <strong>{teamScoreRank.score} {t('points.title')}</strong></span><br/> <span className="ml-1 mr-1 d-sm-none d-inline-block"> / </span>
                      <span>{t('your_rank.title')} <strong>{teamScoreRank.rank}{UserProfile.getCountry() === "fr" ? "e" : ""}</strong>{UserProfile.getCountry() === "fr" ? " place" : ""}</span><br/>
                    </div>
                    <Link className="btn btn-primary hide-cta-feedback btn-feedback" id="cta-feedback" target="_blank">{t('give_feedback.title')}</Link>
                  </div>
                  : ''
                }
              </div>
            }
            {
              width < breakpoint && !isMingleMoment ? '' : 
              <div className={"col-md-6 col-sm-12 d-inline"} id={width < breakpoint ? "players-list" : ""}>
                  <ul className="players-list">
                      {
                        players ? 
                        players.map((player) => (
                          <li className={"player-item player-active-item "} key={player.alias} id={"player-" + player.alias} onClick={() => UserProfile.getAlias() !== player.alias ? discuss(player) : {}}>
                                <div id={"active-player-" + player.alias} className={"active-player image-container " + (player.gender === "male" ? "male " : "female ")}>
                                  {
                                    UserProfile.getAlias() !== player.alias && isMingleMoment ? <span id={"chat-dot-" + player.alias} className="chat-dot d-none"></span> : ''
                                  }
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
            }
            {
                width < breakpoint && isMingleMoment ? 
                  <div className="waiting-area-mobile">
                      {
                          team ? 
                          (
                              isChatOpen ? 
                              (
                                  isTeamChatOpen ? 
                                  <TeamChat changeConversationStatus={hideChat} isMobile={true} teamUid={team.uid} isLive={false} /> : 
                                  (
                                      privateConversations.map((item, index) => (
                                          item && index === 0 ? 
                                          <OneToOneChat key={item.uid} changeConversationStatus={hideChat} isMobile={true} chatUniqueId={item.uid} isLive={false} />
                                          : ''
                                      ))
                                  )
                              )
                              : ''
                          )
                          : ''
                      }
                      <div className="col-md-3 col-sm-12 info-zone">
                        {isFinale ? renderSwitchFinale(activeFinale) : ''}
                      </div>
                  </div>
                  : 
                  ''
              }
          </div>
          
          <div className="col-12 mt-10 game-area">

          
            {
              width > breakpoint ? 
              <div className="col-md-3 col-sm-12 info-zone">
              {isFinale ? renderSwitchFinale(activeFinale) : ''}
            </div> : ''
            }
            {
              isFinale ? 
                <div className="col-md-9 col-sm-12 o2ochats">
                  {
                    width < breakpoint ? '' : 
                    (
                        privateConversations.map(item => (
                            <div className="chatting" key={item.uid} style={{ width: 100/(privateConversations.length) + '%' }}>
                                <OneToOneChat changeConversationStatus={hideChat} chatUniqueId={item.uid} isLive={false} />
                            </div>
                        ))
                    ) 
                  }
                </div>
              : (
                <div className="col-md-6 col-sm-12">
                  {
                    active ? renderSwitch(active) : ''
                  }
                </div>
              )
            }
            {
              !isFinale && isMingleMoment ? 
              (
                <div className="col-md-9 col-sm-12 o2ochats">
                  {
                    width < breakpoint ? '' : 
                    (
                        privateConversations.map(item => (
                            <div className="chatting" key={item.uid} style={{ width: 100/(privateConversations.length) + '%' }}>
                                <OneToOneChat changeConversationStatus={hideChat} chatUniqueId={item.uid} isLive={false} />
                            </div>
                        ))
                    ) 
                  }
                </div>
              )
              : ''
            }
            {
              width < breakpoint ? '' : 
              <div className="chatting col-md-3 col-sm-12">
                {
                    team ? 
                    <TeamChat changeConversationStatus={hideChat} isMobile={false} teamUid={team.uid} isBlocked={true} isLive={false} />
                    : ''
                }
              </div>
            }
            
          </div>
        </div>
      </div>
    );
}
