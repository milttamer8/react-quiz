import React, {useEffect, useState} from 'react';
import './QuestionTimer.css';
import * as Settings from '../../settings/constants.js';
import UserProfile from '../../session/UserProfile';
import $ from 'jquery';
import { CountdownCircleTimer } from "react-countdown-circle-timer";
import * as firebase from 'firebase';
import { useTranslation } from "react-i18next";
import CircleProgressBar from '../CircleProgressBar';
import { Modal } from 'react-bootstrap';
import { useHistory } from "react-router-dom";

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
 *   Users in the same wait here for each other before going into question
 *   On enter, user updates a questionId in the db to notify he is ready for next question
 *   Then, check for all users questionId status to check for ready status
*/
export default function QuestionTimer(props) {
    const [counter, setCounter] = useState(0);
    const [isTimerPlaying, setisTimerPlaying] = useState(true);
    const [teamReady, setteamReady] = useState(true);
    const db = firebase.firestore();
    var teamQuery;
    const questionId = "r" + props.roundId + "q" + props.question.id;
    const [isAlone, setisAlone] = useState(true);
    const { width } = useViewport();
    const breakpoint = Settings.MOBILE_BREAKPOINT;
    const site = UserProfile.getSite();
    const country = UserProfile.getCountry();
    const {t} = useTranslation('common');
    const [showLateUserModal, setshowLateUserModal] = useState(false);
    let history = useHistory();
    const [internetSpeedCounter, setinternetSpeedCounter] = useState(0);
    const [isConnectionSlow, setisConnectionSlow] = useState(false);
    const [imageReadyToLoad, setimageReadyToLoad] = useState(false);
    var internetSpeedTimer;

    useEffect(() => {
      const timer = counter > 0 && setInterval(() => {
        setCounter(counter - 1);
        checkIfTimeUp(counter - 1);
      }, 1000);

      return () => {
        clearInterval(timer);
      }
    }, [counter]);

    /*
    useEffect(() => {
      internetSpeedTimer = setInterval(() => {
          setinternetSpeedCounter(internetSpeedCounter + 0.1);
          checkIfWaitingTimeUp(internetSpeedCounter + 0.1);
      }, 100);
      setimageReadyToLoad(true);

      return () => {
        clearInterval(internetSpeedTimer);
      }
    }, [internetSpeedCounter]);
    */

    const checkIfWaitingTimeUp = (totalSeconds) => {
      if(totalSeconds > Settings.TIME_WAIT_TEAMMATES){
        db.collection('teams')
        .doc(UserProfile.getTeam())
        .get()
        .then(function(doc) {
          switch (parseInt(UserProfile.getUserIdInTeam())) {
            case 1:
              if(doc.data().p1QuestionId === questionId){
                setteamReady(true);
              }
              else {
                setisConnectionSlow(true);
              }
              break;
            case 2:
              if(doc.data().p2QuestionId === questionId){
                setteamReady(true);
              }
              else {
                setisConnectionSlow(true);
              }
              break;
            case 3:
              if(doc.data().p3QuestionId === questionId){
                setteamReady(true);
              }
              else {
                setisConnectionSlow(true);
              }
              break;
            case 4:
              if(doc.data().p4QuestionId === questionId){
                setteamReady(true);
              }
              else {
                setisConnectionSlow(true);
              }
              break;
            case 5:
              if(doc.data().p5QuestionId === questionId){
                setteamReady(true);
              }
              else {
                setisConnectionSlow(true);
              }
              break;
            case 6:
              if(doc.data().p6QuestionId === questionId){
                setteamReady(true);
              }
              else {
                setisConnectionSlow(true);
              }
              break;
            case 7:
              if(doc.data().p7QuestionId === questionId){
                setteamReady(true);
              }
              else {
                setisConnectionSlow(true);
              }
              break;
            case 8:
              if(doc.data().p8QuestionId === questionId){
                setteamReady(true);
              }
              else {
                setisConnectionSlow(true);
              }
              break;
          }
        });
        
      }
    }

    useEffect(() => {
      //setPlayerQuestionId();
      //playersReadyListener();
      highlightLeader();

      /*
      // highlight leader
      if(document.querySelector('.player-active-item.leader')){
        document.querySelector('.player-active-item.leader').classList.remove("leader");
      }
      document.querySelector('#player-' + props.question.response).classList.add("leader");
      */
      return () => {
        //teamQuery();
      }
    }, []);

    const highlightLeader = () => {
      let classToAdd = site === "core" ? "leader" : "leader-senior";
      $(".active-player").removeClass(classToAdd);
      if($("#active-player-" + props.question.response)){
        $("#active-player-" + props.question.response).addClass(classToAdd);
      }
    }

    const checkIfTimeUp = (totalSeconds) => {
      let seconds = totalSeconds % 60;
      if(seconds === 0){
        // redirect
        //props.nextStep();
        if(!teamReady){
          //ejectLatePlayers();
        }
      }
    }

    const checkMyStatus = () => {
      var teamDocRef = db.collection('teams').doc(UserProfile.getTeam());
      let selfInactive = false;
      db.runTransaction(function(transaction) {
        return transaction.get(teamDocRef).then(function(teamDoc) {
            if (!teamDoc.exists) {
                throw "Document does not exist!";
            }

            let users = teamDoc.data().users;
            for (let i = 0; i < users.length; i++) {
              if(users[i].questionId !== questionId && users[i].status === "offline" && users[i].alias === UserProfile.getAlias()){
                selfInactive = true;
              }
            }
        });
      }).then(function() {
        console.log("checked user status : " + questionId);
        if(selfInactive){
          console.log("late user");
          setshowLateUserModal(true);
        }
        else {
          setPlayerQuestionId();
        }
      }).catch(function(err) {
          console.error("Error checking user status: ", err);
      });
    }

    const logout = () => {
      history.push('/');
    }

    const ejectLatePlayers = () => {
      var teamDocRef = db.collection('teams').doc(UserProfile.getTeam());
      db.runTransaction(function(transaction) {
        return transaction.get(teamDocRef).then(function(teamDoc) {
            if (!teamDoc.exists) {
                throw "Document does not exist!";
            }

            let users = teamDoc.data().users;
            let notReadyUsersFound = false;
            for (let i = 0; i < users.length; i++) {
              if(users[i].questionId !== questionId && users[i].status === "online" && users[i].alias !== UserProfile.getAlias()){
                notReadyUsersFound = true;
                users[i].status = "offline";
              }
            }
            
            if(notReadyUsersFound){
              transaction.update(teamDocRef, {
                users
              });
            }
        });
      }).then(function() {
        console.log("updated user status : " + questionId);
      }).catch(function(err) {
          console.error("Error updating user status: ", err);
      });
    }

    const setPlayerAsInactive = (users) => {
      for (let i = 0; i < users.length; i++) {
        users[i].status = "offline";
      }
      return users;
    }

    const renderFormattedRemainingTime = (totalSeconds) => {
        let seconds = totalSeconds % 60;
        return seconds + "s";
    }

    const renderTime = ({ remainingTime }) => {
      $("#counter-numbers-timer").html(renderFormattedRemainingTime(remainingTime));
      return (
          <img className="circle-timer" src={process.env.PUBLIC_URL + '/assets/images/icons/' + (site === "core" ? "music.png" : "music-sr.svg")} alt=""/>
      );
    }

    const timeUp = () => {
      console.log("timeup");
      props.nextStep();
    }

    const setPlayerQuestionId = () => {
        console.log("setPlayerQuestionId : " + questionId);
        var teamDocRef = db.collection('teams').doc(UserProfile.getTeam());
        /*
        db.runTransaction(function(transaction) {
            return transaction.get(teamDocRef).then(function(teamDoc) {
                if (!teamDoc.exists) {
                    throw "Document does not exist!";
                }

                console.log("inside setPlayerQuestionId : " + questionId);
                
                transaction.update(teamDocRef, {
                  users: setQuestionId(teamDoc.data().users, questionId)
                });
            });
        }).then(function() {
          console.log("updated questionId : " + questionId);
        }).catch(function(err) {
            console.error("Error updating user questionid: ", err);
        });
        */
        console.log("uid : " + UserProfile.getUserIdInTeam());
        let params = getPlayerQuestionId(UserProfile.getUserIdInTeam());
        console.log("params");
        console.log(params);
        teamDocRef.update(params).then(function() {
          console.log("updated questionId : " + questionId);
        }).catch(function(err) {
            console.error("Error updating user questionid: ", err);
        });
    }

    const getPlayerQuestionId = (param) => {
      param = parseInt(param);
      console.log("param : " + param);
      if (param === 1){
        console.log("ici1");
        return {
          p1QuestionId: questionId
        }
      }
      else if (param === 2){
        console.log("ici2");
        return {
          p2QuestionId: questionId
        }
      }
      else if (param === 3){
        console.log("ici3");
        return {
          p3QuestionId: questionId
        }
      }
      else if (param === 4){
        console.log("ici4");
        return {
          p4QuestionId: questionId
        }
      }
      else if (param === 5){
        return {
          p5QuestionId: questionId
        }
      }
      else if (param === 6){
        return {
          p6QuestionId: questionId
        }
      }
      else if (param === 7){
        return {
          p7QuestionId: questionId
        }
      }
      else if (param === 8){
        return {
          p8QuestionId: questionId
        }
      }
    }

    const setQuestionId = (users, tmpQuestionId) => {
      for (let i = 0; i < users.length; i++) {
        if(users[i].alias === UserProfile.getAlias()){
          users[i].questionId = tmpQuestionId;
          break;
        }
      }
      return users;
    }

    const playersReadyListener = () => {
      console.log("playersReadyListener : " + questionId);
      teamQuery = db.collection('teams')
      .doc(UserProfile.getTeam())
      .onSnapshot(function(snapshot) {
          console.log("then ql : " + questionId);
          let users = snapshot.data().users;
          let allUsers = [];
          for (let i = 0; i < users.length; i++) {
            if(users[i].status === "online"){
              allUsers.push(users[i]);
            }
          }

          if(allUsers.length > 1){
            setisAlone(false);
          }
          else {
            setisAlone(true);
          }

          console.log("allUsers");
          console.log(allUsers);

          if(checkUsersReadyState(snapshot.data(), allUsers)){
            console.log("ready");
            if(questionId === "r1q1"){
              if(allUsers.length === 4){
                setteamReady(true);
              }
            }
            else {
              setteamReady(true);
            }
          }
          else {
            console.log("not ready");
            //setCounter(Settings.TIME_WAIT_TEAMMATES);
          }
      });
    }

    const checkUsersReadyState = (tmpTeam, onlineUsers) => {
      console.log("tmpTeam");
      console.log(tmpTeam);
      for (let i = 0; i < onlineUsers.length; i++) {
        let param = parseInt(onlineUsers[i].id);
        console.log("param check : " + param);
        if (param === 1){
          if(tmpTeam.p1QuestionId !== questionId){
            return false;
          }
        }
        if (param === 2){
          if(tmpTeam.p2QuestionId !== questionId){
            return false;
          }
        }
        if (param === 3){
          if(tmpTeam.p3QuestionId !== questionId){
            return false;
          }
        }
        if (param === 4){
          if(tmpTeam.p4QuestionId !== questionId){
            return false;
          }
        }
        if (param === 5){
          if(tmpTeam.p5QuestionId !== questionId){
            return false;
          }
        }
        if (param === 6){
          if(tmpTeam.p6QuestionId !== questionId){
            return false;
          }
        }
        if (param === 7){
          if(tmpTeam.p7QuestionId !== questionId){
            return false;
          }
        }
        if (param === 8){
          if(tmpTeam.p8QuestionId !== questionId){
            return false;
          }
        }

        if(i === onlineUsers.length - 1){
          return true;
        }
      }
    }

    const checkIfImageLoaded = () => {
      const size = 140910;
      let count = internetSpeedCounter / 10;
      console.log("internetSpeedCounter : " + count);
      let speed = Math.round(size / count);
      console.log("speed");
      console.log(speed / 1000 + "Kb/s");
      clearInterval(internetSpeedTimer);

      if(speed < Settings.INTERNET_SPEED_LIMIT){
          // poor connection
          setisConnectionSlow(true);
      }
      else {
          setisConnectionSlow(false);
      }
    }

    const lateUserModalEntered = () => {
      console.log("lateUserModalEntered");
      setTimeout(() => {
          setshowLateUserModal(false);
      }, 3000);
    }

    const lateUserModalExited = () => {
        console.log("lateUserModalExited");
        firebase.database().ref('/status/' + UserProfile.getAlias()).set({
          state: 'offline',
          last_changed: firebase.database.ServerValue.TIMESTAMP,
          teamUid: UserProfile.getTeam()
      }).then(function() {
          logout();
      }).catch(() => {
          logout();
      });
    }

    return (
      <div className="counter">
        {/*<p className="para">Round {props.roundId}!</p>*/}
        {
          imageReadyToLoad ? 
          <img style={{display: "none"}} src={Settings.FIREBASE_STORAGE + "o/volume.svg?alt=media&token=82a3186d-0cf6-4b75-9f30-159de5430b5e"} onLoad={checkIfImageLoaded} />
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
        {
          teamReady ? 
          <div className="song-timer">
            <div className="statement">
              <h3 className="ttr">{ parseInt(props.question.id) === 1 ? t('first.title') : t('next.title') } {site === "core" ? t('song_in.title') : t('question_in.title')} <span id="counter-numbers-timer"></span></h3>
            </div>
            <div className="timer-container">
              <CircleProgressBar allottedTime={Settings.TIME_BEFORE_QUESTION} timeUp={timeUp} withCounter={true} symbol={"letter"} />
            </div>
          </div>
          : 
          (
            isAlone ? 
            <h3 className="ttr">{t('please_wait.title')}</h3> : 
            <h3 className="ttr">{t('teammates_behind.title')}</h3>
            )
        }
        {
          props.question.response === UserProfile.getAlias() ? 
            <div className="leader-message">
              <h3 className="ttr subtitle">{site === "core" ? t('you_leader.title') : t('you_leader_question.title')}</h3>
              <p>{t('you_answer_team.title')}</p>
            </div>
            : 
            <div className="leader-message">
              <h3 className="ttr subtitle">{props.question.response + " " + (site === "core" ? t('is_leader_this_song.title') : t('is_leader_this_question.title'))}</h3>
              <p>{site === "core" ? t('help_him.title') : t('help_him_question.title')}</p>
            </div>
        }
        {/*<p className="para">Theme: {props.question.theme}</p>*/}
      </div>
    );
}
