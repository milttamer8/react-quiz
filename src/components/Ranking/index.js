import React, {useEffect, useState} from 'react';
import './Ranking.css';
import * as firebase from 'firebase';
import UserProfile from '../../session/UserProfile';
import * as Settings from '../../settings/constants.js';
import { Badge, Modal } from 'react-bootstrap';
import $ from 'jquery';
import { Link } from 'react-router-dom';
import { useTranslation } from "react-i18next";
import CircleProgressBar from '../CircleProgressBar';
import Counter from '../Counter';

/*
 *   During mingle moment, display timer and team game infos(score and rank)
*/
export default function Ranking(props) {
  const db = firebase.firestore();
  const sessionId = UserProfile.getSessionId();
  const [ranking, setRanking] = useState(null);
  // const [counter, setCounter] = useState(props.partyDone ? Settings.TIME_TO_FINALE : Settings.TIME_BETWEEN_ROUNDS);
  // const [counter, setCounter] = useState(props.partyDone ? 0 : Settings.TIME_BETWEEN_ROUNDS);
  var teamQuery;
  const [allTeamReady, setallTeamReady] = useState(false);
  const [showRoundStartModal, setshowRoundStartModal] = useState(false);
  const [showWaitingMessage, setshowWaitingMessage] = useState(false);
  const {t} = useTranslation('common');
  const site = UserProfile.getSite();
  const country = UserProfile.getCountry();
  
  const getRanking = () => {
      console.log('finale : ' + props.isFinale);
      let choices = [false, true];
      if(props.isFinale){
        choices = [true];
      }
      teamQuery = db.collection('teams')
      .where('roomId', '==', UserProfile.getRoom())
      .where('sessionId', '==', sessionId)
      .where('site', '==', site)
      .where('country', '==', country)
      .where('active', '==', true)
      .orderBy("points", "desc")
      .orderBy("answerTime")
      .onSnapshot(function(queryTeamSnapshot) {
        let count = 0;
        let allTeamReadyNextRound = true;
        let teams = [];
        queryTeamSnapshot.forEach(function(doc) {
          let item = doc.data();
          let teamStatus = {
            id: item.id,
            name: 'Team ' + item.id,
            score: item.points,
            roundDone: true,
            qualified: false,
            users: item.users,
            uid: doc.id
          };

          if(count < 3){
            teamStatus.qualified = true;
          }
          
          if(props.partyDone && item.roundUid !== props.roundUid && item.id !== props.team.id){
            allTeamReadyNextRound = false;
            teamStatus.roundDone = false;
          }
          

          teams.push(teamStatus);
          count++;
        });

        console.log("ranking teams");
        console.log(teams);

        /*
        if(allTeamReadyNextRound && !allTeamReady){
          console.log("allTeamReadyNextRound");
          setallTeamReady(true);
          setCounter(props.partyDone ? Settings.TIME_FINALE_RANKING : Settings.TIME_BETWEEN_ROUNDS);
        }
        */

        let qualified = false;
        let inPodium = false;
        let message = '';
        let title = t('end_of_round.title') + ' ' + props.activeRoundNumber;
        let myPoints = 0;
        let myRank = 0;
        if(props.partyDone && allTeamReadyNextRound){
          //setshowWaitingMessage(false);
          //setCounter(Settings.TIME_TO_FINALE);
          title = t('end_of_game.title');
          for (let i = 0; i < teams.length; i++) {
            if(teams[i].uid === props.team.uid){
              if(teams[i].users[0].alias === UserProfile.getAlias()){
                updateTeamSessionDone(teams[i]);
              }
              break;
            }
          }

          $('#cta-feedback').addClass('hide-cta-feedback');

          if($('#team-name')){
            $('#team-name').addClass('hide');
          }
          
          if($('#team-current-infos')){
            $('#team-current-infos').addClass('hide');
          }
        }
        for (let i = 0; i < teams.length; i++) {
          if(teams[i].uid === props.team.uid){
            myPoints = teams[i].score;
            myRank = i + 1;
            if(i < 3){
              inPodium = true;
              break;
            }
          }
        }
        /*
        if(props.partyDone && !allTeamReadyNextRound){
          setshowWaitingMessage(true);
        }
        */
        setRanking({
          title,
          teams,
          message,
          allTeamReadyNextRound,
          qualified,
          inPodium,
          myPoints,
          myRank
        });
      });
    }

    function sendTeamInFinale(team) {
      console.log("sendTeamInFinale");
      db.collection("teams").doc(team.uid).update({
        advanceToFinale: true
      })
      .then(function() {
        console.log("advance to finale");
      })
      .catch(function(error) {
          console.error("Error updating team points: ", error);
      });
    }

    function updateTeamSessionDone(team) {
      console.log("updateTeamSessionDone");
      db.collection("teams").doc(team.uid).update({
        sessionDone: true
      })
      .then(function() {
        console.log("session done");
      })
      .catch(function(error) {
          console.error("Error updating team session done: ", error);
      });
    }

    /*
    useEffect(() => {
      const timer = counter > 0 && setInterval(() => {
        setCounter(counter - 1);
        //checkIfTimeUp(counter - 1);
      }, 1000);

      return () => {
        clearInterval(timer);
      }
    }, [counter]);
    */

    useEffect(() => {
      getRanking();
      props.switchOnMingleMoment();
      let classToAdd = site === "core" ? "leader" : "leader-senior";
      $(".active-player").removeClass(classToAdd);
      //$('.conversation-private').show();
      return () => {
        teamQuery();
      }
    }, []);

    const goNext = (timeLaspe, qualified) => {
      setTimeout(() => {
        props.goNext(qualified);
      }, timeLaspe)
    }

    const checkIfTimeUp = (totalSeconds) => {
      console.log("checkIfTimeUp : " + totalSeconds);
      let minutes = Math.floor(totalSeconds / 60);
      let seconds = totalSeconds % 60;
      console.log("minutes : " + minutes);
      console.log("seconds : " + seconds);
      console.log(ranking);
      if(minutes === 0 && seconds === 0){
        // redirect
        if(ranking){
          if(ranking.allTeamReadyNextRound){
            //goNext(timeLapse, qualified);
            if(props.partyDone){
              console.log("partyDone");
              props.goNext(ranking.qualified);
            }
            else {
              props.switchOnMingleMoment();
              setshowRoundStartModal(true);
            }
          }
        }
      }
    }

    const timeUp = () => {
      console.log("timeup ranking");
      if(props.partyDone){
        console.log("partyDone");
        props.goNext(false);
      }
      else {
        props.switchOnMingleMoment();
        setshowRoundStartModal(true);
      }
    }

    const addLeadingZeros = (value) => {
      value = String(value);
      while (value.length < 2) {
        value = '0' + value;
      }
      return value;
    }

    const renderFormattedRemainingTime = (totalSeconds) => {
        let hours = Math.floor(totalSeconds / 3600);
        totalSeconds %= 3600;
        let minutes = Math.floor(totalSeconds / 60);
        let seconds = totalSeconds % 60;
        return minutes !== 0 ? minutes + "m " + addLeadingZeros(seconds) + "s" : addLeadingZeros(seconds) + "s";
    }

    const roundStartModalEntered = () => {
      console.log("roundStartModalEntered");
      setTimeout(() => {
          setshowRoundStartModal(false);
      }, Settings.TIME_POPUP_ACTIVITY * 1000);
    }

    const roundStartModalExited = () => {
        console.log("roundStartModalExited");
        props.goNext(ranking.qualified);
    }

    const showWaitingMessageEntered = () => {
        console.log("showWaitingMessageEntered");
    }

    const showWaitingMessageExited = () => {
        console.log("showWaitingMessageExited");
    }

    return (
      <div className="ranking">
        <Modal className={site} backdrop="static" show={showRoundStartModal} size="sm" onExited={roundStartModalExited} onEntered={roundStartModalEntered} centered onHide={() => setshowRoundStartModal(false)}>
            <Modal.Body>
                <h4 className="ttr">{t('the_round.title')} {parseInt(props.activeRoundNumber) + 1} {t('starting_now.title')}</h4>
                <p className="para">{t('o2o_close.title')}</p>
            </Modal.Body>
        </Modal>
        
        <Modal className={site} backdrop="static" show={showWaitingMessage} size="sm" onExited={showWaitingMessageExited} onEntered={showWaitingMessageEntered} centered onHide={() => setshowWaitingMessage(false)}>
            <Modal.Body>
                <p className="ttr">{t('please_wait.title')}...</p>
              {/*
                <p className="ttr">Well done!</p>
                <p className="para">You answered fast! Please wait a few more seconds for the other teams to finish the game in order to know your rank!</p>
              */}
            </Modal.Body>
        </Modal>
        
        {
          ranking ? 
          (<div className="ranking-block">
            <div className="statement">
              <h3 className="ttr">{ranking.title}</h3>
            </div>
            {
              !props.partyDone ? 
              '' : 
              (
                ranking.inPodium ? 
                  <div className="podium-container">
                    <Counter allottedTime={Settings.TIME_PODIUM} timeUp={timeUp} />
                    <div className="leader-message">
                      <h3 className="sttr subtitle">{t('congrats.title')}</h3>
                    </div>
                    <Link className="btn btn-primary btn-feedback" target="_blank">{t('give_feedback.title')}</Link>
                    <div className="podium-steps">
                      <img src={process.env.PUBLIC_URL + '/assets/images/icons/podium.png'} alt=""/>
                    </div>
                    <div className="podium d-flex justify-content-between">
                      {
                        typeof ranking.teams[1] !== 'undefined' ? 
                        <div className={"podium-item podium-second podium-first" + (props.team.uid === ranking.teams[1].uid ? "isMine" : "")}>
                          <span className="team-title">{t('team.title')} <span className="team-name">{ranking.teams[1].id}</span></span>
                          <span className="team-score">{ranking.teams[1].score} {t('points.title')}</span>
                        </div> : 
                        <div className={"podium-item podium-first empty-block"}></div>
                      }
                      <div className="separat"></div>
                      <div className={"podium-item podium-first " + (props.team.uid === ranking.teams[0].uid ? "isMine" : "")}>
                        <span className="team-title">{t('team.title')} <span className="team-name">{ranking.teams[0].id}</span></span>
                        <span className="team-score">{ranking.teams[0].score} {t('points.title')}</span>
                      </div>
                      <div className="separat"></div>
                      {
                        typeof ranking.teams[2] !== 'undefined' ? 
                        <div className={"podium-item podium-third podium-first" + (props.team.uid === ranking.teams[2].uid ? "isMine" : "")}>
                          <span className="team-title">{t('team.title')} <span className="team-name">{ranking.teams[2].id}</span></span>
                          <span className="team-score">{ranking.teams[2].score} {t('points.title')}</span>
                        </div> : 
                        <div className={"podium-item podium-first empty-block"}></div>
                      }
                    </div>
                  </div>
                 : 
                  <div className="podium-container">
                    <Counter allottedTime={Settings.TIME_PODIUM} timeUp={timeUp} />
                    <div className="leader-message">
                      <p className="h5 lead">{t('you_scored.title')} { ranking.myPoints } {t('points.title')}</p>
                      <p className="h5 lead">{t('your_rank.title')} { ranking.myRank }{UserProfile.getCountry() === "fr" ? "e" : ""}{UserProfile.getCountry() === "fr" ? " place" : ""}</p>
                    </div>
                    <Link className="btn btn-primary btn-feedback" target="_blank">{t('give_feedback.title')}</Link>
                  </div>
              )
            }
            {
              ranking.allTeamReadyNextRound ? 
                props.partyDone ? '' :
                (
                  <div className="round-transition-message">
                    <div className="song-timer">
                      <div className="statement">
                        <h3 className="ttr">{t('next_round_in.title')} <span id="counter-numbers-timer"></span></h3>
                      </div>
                      <div className="timer-container">
                        <CircleProgressBar allottedTime={Settings.TIME_BETWEEN_ROUNDS} timeUp={timeUp} withCounter={true} symbol={"number"} />
                      </div>
                    </div>
                    <h3 className="sttr subtitle">{t('you_scored.title')} { ranking.myPoints } {t('points.title')}</h3>
                    <h3 className="sttr subtitle">{t('your_rank.title')} { ranking.myRank }{UserProfile.getCountry() === "fr" ? "e" : ""}{UserProfile.getCountry() === "fr" ? " place" : ""}</h3>
                    <Link className="btn btn-primary btn-feedback" target="_blank">{t('give_feedback.title')}</Link>
                  </div>
                )
              : <p>{t('wait_other_teams.title')}...</p>
            }
              
          </div>)
          : ''
        }
      </div>
    );
}
