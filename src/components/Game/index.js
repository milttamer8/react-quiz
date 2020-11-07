import React, {useState} from 'react';
import './Game.css';
import Round from '../Round';
import Ranking from '../Ranking';
import * as firebase from 'firebase';
import UserProfile from '../../session/UserProfile';
import $ from 'jquery';


/*
 *   Part of the hierarchy: GamePlatform > Game > Round > Question
 *   Handle question rounds
*/
export default function Game(props) {
    const rounds = props.rounds;
    const [activeRound, setActiveRound] = useState(props.rounds[0]);
    const [activeRoundNumber, setActiveRoundNumber] = useState(1);
    const [activeDisplay, setActiveDisplay] = useState('round');
    const team = props.team;
    const db = firebase.firestore();

    const goNextRound = () => {
      if(rounds.length > activeRoundNumber){
        if(activeRoundNumber === 1){
          $('#cta-feedback').removeClass('hide-cta-feedback');
        }
        console.log("round next");
        // show next round ready button
        setActiveRound(rounds[activeRoundNumber]);
        setActiveRoundNumber(activeRoundNumber + 1);
        setActiveDisplay('round');
      } else {
        //something else
        console.log('no more round');
        props.goFinaleRanking(true);
      }
    }

    /*
    const goRanking = () => {
        console.log("user 0 : " + team.users[0].alias);
        console.log("roundUid : " + "main_" + activeRoundNumber);
      if(team.users[0].alias === UserProfile.getAlias()){
        db.collection("teams").doc(team.uid).update({
          numberRoundPassed: firebase.firestore.FieldValue.increment(1),
          roundUid: "main_" + activeRoundNumber
        })
        .then(function() {
          console.log("round added");
          console.log('ranking');
          setActiveDisplay('ranking');
        })
        .catch(function(error) {
            console.error("Error updating team round passed: ", error);
        });
      }
      else {
        var queryTeamNotCaptain = db.collection("teams").doc(team.uid)
          .onSnapshot(function(doc) {
            if(doc.data().roundUid === ("main_" + activeRoundNumber)){
              console.log('ranking not captain');
              setActiveDisplay('ranking');
              queryTeamNotCaptain();
            }
            else {
              // loader
            }
          })
      }
    }
    */

    const goRanking = () => {
      console.log("user 0 : " + team.users[0].alias);
      console.log("roundUid : " + "main_" + activeRoundNumber);
      db.collection("teams").doc(team.uid).update({
        roundUid: "main_" + activeRoundNumber
      })
      .then(function() {
        console.log("round added");
        console.log('ranking');
        setActiveDisplay('ranking');
      })
      .catch(function(error) {
          console.error("Error updating team round passed: ", error);
      });
    }

    const goReady = (qualified) => {
      console.log('ready');
      if(rounds.length > activeRoundNumber){
        setActiveDisplay('ready');
      }
      else {
        //something else
        console.log('no more round');
        props.goFinaleRanking(true);
      }
    }

    const addTeamPoints = async (points) => {
      var teamDocRef = db.collection('teams').doc(team.uid);
      await db.runTransaction(function(transaction) {
        return transaction.get(teamDocRef).then(function(teamDoc) {
            if (!teamDoc.exists) {
                throw "Document does not exist!";
            }

            transaction.update(teamDocRef, {
              points: firebase.firestore.FieldValue.increment(parseInt(points))
            });
        });
      }).then(function() {
        console.log("points points added");
      }).catch(function(err) {
        console.error("Error updating team points: ", err);
      }); 
    }

    const renderSwitch = (param) => {
      switch (param) {
        case 'round':
          if(activeRound)
            return <Round round={activeRound} goNextRound={goNextRound} teamUid={team.uid} teamUsers={props.players} goRanking={goRanking} addTeamPoints={addTeamPoints} />
          break;
        case 'ranking':
          return <Ranking goNext={goNextRound} roundUid={"main_" + activeRoundNumber} team={team} activeRoundNumber={activeRoundNumber} isFinale={props.isFinale} partyDone={rounds.length > activeRoundNumber ? false : true} switchOnMingleMoment={() => props.switchOnMingleMoment()} />
      }
    }

    return (
      <div className="game">
        {renderSwitch(activeDisplay)}
      </div>
    );
}
