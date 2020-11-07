import React, {useState, useEffect} from 'react';
import './Round.css';
import Question from '../Question';
import BlindTest from '../BlindTest';
import UserProfile from '../../session/UserProfile';
import * as firebase from 'firebase';
import QuestionTimer from '../QuestionTimer';
import $ from 'jquery';
import { useHistory } from "react-router-dom";

/*
 *   Part of the hierarchy: GamePlatform > Game > Round > Question
 *   Handle questions in round
*/
export default function Round(props) {
    let history = useHistory();
    const questions = props.round.questions;
    const [question, setquestion] = useState({
      activeQuestion: null,
      activeQuestionNumber: 0
    });
    const db = firebase.firestore();
    const [active, setActive] = useState(null);
    const site = UserProfile.getSite();

    useEffect(() => {
      /*
      setquestion({
        activeQuestion: checkOfflineUser(questions[question.activeQuestionNumber]),
        activeQuestionNumber: question.activeQuestionNumber + 1
      });
      setActive('timer');
      */
      checkOfflineUser();
      checkMyStatus();
      //$('.conversation-private').hide();

      return () => {
        
      }
    }, []);

    

    const goNext = () => {
      if(questions.length > question.activeQuestionNumber){
        /*
        setActive('timer');
        setquestion({
          activeQuestion: checkOfflineUser(questions[question.activeQuestionNumber]),
          activeQuestionNumber: question.activeQuestionNumber + 1
        });
        */
       checkOfflineUser();
      }
      else {
        console.log('Ranking');
        props.goRanking();
      }
    }

    const goQuestion = () => {
      setActive('question');
    }

    const addTeamPoints = (points) => {
      console.log("addTeamPoints round : " + points)
      props.addTeamPoints(points);
    }

    const getAnswerNext = (rounds, index) => {
      if(typeof rounds[index[0]].questions[index[1] + 1] !== 'undefined') {
        return rounds[index[0]].questions[index[1] + 1].response;
      }
      else if(typeof rounds[index[0] + 1] !== 'undefined') {
        return rounds[index[0] + 1].questions[0].response;
      }
      return "";
    }

    const updateTeamQuestionAnswer = (answer) => {
      console.log("updateTeamQuestionAnswer");
      
      db.collection('teams')
        .doc(props.teamUid)
        .get()
        .then(function(doc) {
          let rounds = doc.data().rounds;
          let index = getQuestionIndex(rounds);
          rounds[index[0]].questions[index[1]].answered = true;
          rounds[index[0]].questions[index[1]].playerAnswer = answer;
          db.collection("teams").doc(props.teamUid).update({
            rounds,
            answerNext: getAnswerNext(rounds, index)
          })
          .then(function() {
            console.log("then");
            /*
            setTimeout(() => {
              goNext();
            }, 3000);
            */
            return null;
          })
          .catch(function(error) {
              console.error("Error updating team rounds: ", error);
          });
        })
        .catch(function(error) {
            console.error("Error updating team rounds: ", error);
        });
    }

    const updateTeamAnswerTime = (timeLeft) => {
      console.log("updateTeamAnswerTime");
      
      db.collection("teams").doc(props.teamUid).update({
        answerTime: firebase.firestore.FieldValue.increment(timeLeft)
      })
      .then(function() {
        console.log("then updateTeamAnswerTime");
      })
      .catch(function(error) {
          console.error("Error updating team answer time: ", error);
      });
    }

    const answerQuestionInChat = (answer, isLeader) => {
      firebase
        .database()
        .ref("messages/" + props.teamUid)
        .push({
          author: UserProfile.getAlias(),
          message: answer,
          isLeader,
          isAnswer: true,
          timestamp: new Date().getTime()
        })
    }

    const getQuestionIndex = (list) => {
      for (let i = 0; i < list.length; i++) {
        let questions = list[i].questions;
        for (let j = 0; j < questions.length; j++) {
          if(questions[j].uniqueId === question.activeQuestion.uniqueId){
            return [i, j];
          }
        }
      }
    }

    const getQuestionIndexRound = (list, uniqueId) => {
      for (let i = 0; i < list.length; i++) {
        let questions = list[i].questions;
        for (let j = 0; j < questions.length; j++) {
          if(questions[j].uniqueId === uniqueId){
            return [i, j];
          }
        }
      }
    }

    /*
    const checkOfflineUser = () => {
        let currentQuestion = questions[question.activeQuestionNumber];
        firebase.firestore().collection('status')
            .where('teamUid', '==', props.teamUid)
            .where('state', '==', "online")
            .get()
            .then(function(snapshot) {
                let count = 0;
                snapshot.forEach(function(doc) {
                  count++;
                });
                let onlineUsers = [];
                let countEach = 0;
                snapshot.forEach(function(doc) {
                    countEach++;
                    onlineUsers.push(doc.id);

                    if(count === countEach){
                      console.log("userss");
                      console.log(props.teamUsers);
                      console.log("userss2");
                      console.log(onlineUsers);
                      
                      if(props.teamUsers.length > onlineUsers.length){
                        currentQuestion.response = getWhoAnswers(onlineUsers);
                      }
                      setquestion({
                        activeQuestion: currentQuestion,
                        activeQuestionNumber: question.activeQuestionNumber + 1
                      });
                      setActive('timer');
                    }
                });
                
            });

    }
    */

   const checkOfflineUser = () => {
    let currentQuestion = questions[question.activeQuestionNumber];
    firebase.firestore().collection('teams')
        .doc(props.teamUid)
        .get()
        .then(function(doc) {
            let allUsers = doc.data().users;
            let onlineUsers = [];
            for (let i = 0; i < allUsers.length; i++) {
              if(allUsers[i].status === "online"){
                onlineUsers.push(allUsers[i].alias);
              }
            }

            let currentRounds = doc.data().rounds;
            let index = getQuestionIndexRound(currentRounds, currentQuestion.uniqueId);
            console.log("index");
            console.log(index);
            let leader = getWhoAnswers(currentRounds, index);
            console.log("leader : " + leader);
            console.log("onlineUsers");
            console.log(onlineUsers);

            if(!checkIfArraySame(onlineUsers, doc.data().onlineUsers) && onlineUsers.indexOf(leader) === -1){
              console.log("change");
              let newRounds = setWhoAnswersRound(doc.data().rounds, onlineUsers);
              firebase.firestore().collection("teams").doc(props.teamUid).update({
                rounds: newRounds,
                onlineUsers
              })
              .then(function() {
                console.log("team rounds 2 updated");
                let index = getQuestionIndexRound(newRounds, currentQuestion.uniqueId);

                currentQuestion.response = getWhoAnswers(newRounds, index);
                setActive('timer');
                setquestion({
                  activeQuestion: currentQuestion,
                  activeQuestionNumber: question.activeQuestionNumber + 1
                });
              })
              .catch(function(error) {
                  console.error("Error updating team rounds 2: ", error);
              });    
            }
            else {
              currentQuestion.response = leader;
              setActive('timer');
              setquestion({
                activeQuestion: currentQuestion,
                activeQuestionNumber: question.activeQuestionNumber + 1
              });
            }
        });
    }

    const getWhoAnswers = (rounds, index) => {
      return rounds[index[0]].questions[index[1]].response;
    }

    const setWhoAnswersRound = (roundSeries, users) => {
      console.log("setWhoAnswersRound");
      console.log(roundSeries);
      console.log(users);
      let nbPlayer = 0;
      for (let i = 0; i < roundSeries.length; i++) {
        let questions = roundSeries[i].questions;
        for (let j = 0; j < questions.length; j++) {
          if(nbPlayer < users.length){
            roundSeries[i].questions[j].response = users[nbPlayer];
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

    const checkIfArraySame = (list1, list2) => {
      if(list1.length === list2.length){
        for (let i = 0; i < list1.length; i++) {
          let found = false;
          for (let j = 0; j < list2.length; j++) {
            if(list2[j] === list1[i]){
              found = true;
              break;
            }
          }
          if(!found){
            return false;
          }
        }
        return true;
      }
      else {
        return false;
      }
    }

    const checkMyStatus = () => {
    firebase.firestore().collection('users')
        .doc(UserProfile.getUserUid())
        .get()
        .then(function(doc) {
            if(doc.data().status === "offline"){
              firebase.firestore().collection('teams')
              .doc(props.teamUid)
              .get()
              .then(function(docTeam) {
                  let users = docTeam.data().users;
                  for (let i = 0; i < users.length; i++) {
                    if(users[i].alias === UserProfile.getAlias() && users[i].status === "offline"){
                      logout();
                      break;
                    }
                  }
              });
            }
            
        });

    }

    const logout = () => {
      history.push('/');
    }
    
    const renderSwitch = (param) => {
      console.log("renderSwitch " + param);
      switch (param) {
        case 'timer':
          console.log("renderSwitch - timer");
          return <QuestionTimer key={question.activeQuestion.uniqueId} question={question.activeQuestion} nextStep={goQuestion} roundId={parseInt(props.round.id)} />
        case 'question':
          console.log("renderSwitch - question");
          return question.activeQuestion.type === "quizz" ? 
          <Question key={question.activeQuestion.uniqueId} goNext={goNext} question={question.activeQuestion} answered={false} addTeamPoints={addTeamPoints} updateTeamQuestionAnswer={updateTeamQuestionAnswer} totalQuestions={questions.length} answerQuestionInChat={answerQuestionInChat} updateTeamAnswerTime={updateTeamAnswerTime} teamUid={props.teamUid} /> : 
          <BlindTest key={question.activeQuestion.uniqueId} goNext={goNext} question={question.activeQuestion} answered={false} addTeamPoints={addTeamPoints} updateTeamQuestionAnswer={updateTeamQuestionAnswer} totalQuestions={questions.length} answerQuestionInChat={answerQuestionInChat} updateTeamAnswerTime={updateTeamAnswerTime} teamUid={props.teamUid} />
      }
    }

    return (
      <div className="round" key={props.round.id}>
        {
          question.activeQuestion ? (active ? renderSwitch(active) : '') : ''
        }
      </div>
    );
}
