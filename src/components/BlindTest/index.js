import React, {useState, useEffect, useRef} from 'react';
import './BlindTest.css';
import ProgressBar from '../ProgressBar';
import AudioPlayer from '../AudioPlayer';
import $ from 'jquery';
import UserProfile from '../../session/UserProfile';
import * as firebase from 'firebase';
import * as Settings from '../../settings/constants.js';
import { Modal } from 'react-bootstrap';
import { CountdownCircleTimer } from "react-countdown-circle-timer";
import { useTranslation } from "react-i18next";
import CircleProgressBar from '../CircleProgressBar';
import ReactJWPlayer from 'react-jw-player';

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
 *   Display question timer, blind test question, play song, display answer, (as leader)handle leader answer, (as not leader) check for leader answer
*/
export default function BlindTest(props) {
    const [answered, setanswered] = useState(false);
    const inputEl = useRef(null);
    //const audioPlayerEl = useRef(null);
    const db = firebase.firestore();
    let checkResponseSnapshot;
    let userStatusListener;
    const [showAnswerSummaryModal, setshowAnswerSummaryModal] = useState(false);
    const [answer, setanswer] = useState("");
    const { width } = useViewport();
    const breakpoint = Settings.MOBILE_BREAKPOINT;
    const [answerSummary, setanswerSummary] = useState({
      content: "",
      isCorrect: false
    });
    const [showAnswerSummary, setshowAnswerSummary] = useState(false);
    const [isTimerPlaying, setisTimerPlaying] = useState(true);
    const [counter, setCounter] = useState(Settings.TIME_QUESTION_TIMER);
    const [isTimeUp, setisTimeUp] = useState(false);
    const {t} = useTranslation('common');

    useEffect(() => {
      console.log("blind test id : " + props.question.id + " /uniqueid : " + props.question.uniqueId);
      checkIfQuestionAnswered();
      //leaderStatusListener();
      //audioPlayerEl.current.play();
      return () => {
        console.log("q unmount");
        if(props.question.response !== UserProfile.getAlias()){
          if (typeof checkResponseSnapshot !== "undefined") { 
            // safe to use the function
            checkResponseSnapshot();
          }
        }
        if (typeof userStatusListener !== "undefined") { 
          userStatusListener();
        }
      }
    }, []);

    useEffect(() => {
      const timer = counter > 0 && setInterval(() => {
        setCounter(counter - 1);
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
    }, [isTimeUp])

    const leaderStatusListener = () => {
      console.log("resp : " + props.question.response);
      userStatusListener = firebase.firestore().collection('teams')
          .doc(props.teamUid)
          .onSnapshot(function(doc) {
            for(const user of doc.data().users){
              if(user.alias === props.question.response && user.status === "offline"){
                props.updateTeamQuestionAnswer("");
              }
            }
          });
  
    }

    const revealAnswer = (isTimeUp, leaderAnswer) => {
      if(!answered){
        var element = document.getElementById("explanation");
        if(typeof(element) != 'undefined' && element != null){
          element.style.display = 'block';
        }
  
        //$("input[type='radio'][name='answer'][value='"+ props.question.correctAnswer +"']").parent().addClass('correct-option');
        if(!isTimeUp){
          if(leaderAnswer === props.question.correctAnswer){
            setanswerSummary({
              content: t('correct_answer.title'),
              isCorrect: true
            });
          }
          else {
            setanswerSummary({
              content: t('bad_answer.title'),
              isCorrect: false
            });
          }
        }
        else {
          setanswerSummary({
            content: t('time_up.title'),
            isCorrect: false
          });
        }

        setshowAnswerSummary(true);

        if(isTimeUp){
          setTimeout(() => {
            goNextQuestion();
          }, Settings.TIME_ANSWER_SUMMARY * 1000);
        }
      }
    }

    const getCorrectAnswerLabel = (key) => {
      let answers = props.question.answers;
      for (let i = 0; i < answers.length; i++) {
        if(parseInt(answers[i].value) === parseInt(key)){
          return answers[i].label;
        }
      }
      return "";
    }

    const revealAnswerWithoutRedirect = (isTimeUp, userAnswer) => {
      if(!answered){
        console.log("revealAnswerWithoutRedirect");
        var element = document.getElementById("explanation");
        if(typeof(element) != 'undefined' && element != null){
          element.style.display = 'block';
        }
  
        //$("input[type='radio'][name='answer'][value='"+ props.question.correctAnswer +"']").parent().addClass('correct-option');

        if(!isTimeUp){
          if(userAnswer === props.question.correctAnswer){
            setanswerSummary({
              content: t('correct_answer.title'),
              isCorrect: true
            });
          }
          else {
            setanswerSummary({
              content: t('bad_answer.title'),
              isCorrect: false
            });
          }
        }
        else {
          setanswerSummary({
            content: t('time_up.title'),
            isCorrect: false
          });
        }

        setshowAnswerSummary(true);

        if(isTimeUp){
          setTimeout(() => {
            goNextQuestion();
          }, Settings.TIME_ANSWER_SUMMARY * 1000);
        }
      }
    }

    const answerQuestion = (event) => {
      //inputEl.current.handleStop();
      //audioPlayerEl.current.pause();

      setanswered(true);
      //setisTimerPlaying(false);
      props.updateTeamAnswerTime(Settings.TIME_QUESTION_TIMER - counter);
      console.log("answerQuestion");

      let selectedValue = event.target.value;
      setanswer(selectedValue);
      let answerInchat = " " + t('answered.title') + " " + getCorrectAnswerLabel(event.target.value);
      props.answerQuestionInChat(answerInchat, true);
      props.updateTeamQuestionAnswer(selectedValue);
      saveCorrectAnswer(selectedValue);
      event.target.parentNode.classList.add('selected-option');

      //good or bad, save answer
      console.log("answerQuestion222");
      revealAnswerWithoutRedirect(false, selectedValue);
    }

    const answerQuestionInChat = (event) => {
      setanswer(event.target.value);

      /*
      if($("input[type='radio'][name='answer']:checked")){
        $("input[type='radio'][name='answer']:checked").parent().removeClass('selected-option');
      }
      $("input[type='radio'][name='answer'][value='"+ event.target.value +"']").parent().addClass('selected-option');
      */
      if(event.target.parentNode.parentNode.parentNode.querySelector('label.customRadio.selected-option')){
        event.target.parentNode.parentNode.parentNode.querySelector('label.customRadio.selected-option').classList.remove("selected-option");
      }
      event.target.parentNode.classList.add("selected-option");

      let answerInchat = " " + t('answered.title') + " " + getCorrectAnswerLabel(event.target.value);
      props.answerQuestionInChat(answerInchat, false);
    }

    const goNextQuestion = () => {
      props.goNext();
    }

    const saveCorrectAnswer = (value) => {
      // if answer correct, add appropriate points to the team
      if(parseInt(value) === parseInt(props.question.correctAnswer)){
        props.addTeamPoints(props.question.points);
      }
    }

    const executeTimeUp = () => {
      console.log("answered : " + answered);
      if(props.question.response === UserProfile.getAlias()){
        if(!answered){
          revealAnswerWithoutRedirect(true, null);
          props.updateTeamQuestionAnswer("");
        }
        else {
          goNextQuestion();
        }
      }
      else {
        if(!answered){
          revealAnswer(true, "");
          if (typeof checkResponseSnapshot !== "undefined") { 
            // safe to use the function
            checkResponseSnapshot();
          }
        }
        else {
          setTimeout(() => {
            goNextQuestion();
          }, 5000);
        }
      }
    }

    const timeUp = () => {
      //audioPlayerEl.current.pause();
      setisTimeUp(true);
      /*
      console.log("answer : " + answer);
      console.log("param : " + param);
      if(props.question.response === UserProfile.getAlias()){
        if(!param){
          revealAnswerWithoutRedirect(true, null);
          props.updateTeamQuestionAnswer("");
        }
        else {
          goNextQuestion();
        }
      }
      else {
        if(param){
          goNextQuestion();
        }
      }
      */
      /*
      else {
        if (typeof checkResponseSnapshot !== "undefined") { 
          // safe to use the function
          checkResponseSnapshot();
        }
        revealAnswer(true, null);
      }
      */
    }

    const checkIfQuestionAnswered = () => {
      console.log("checkIfQuestionAnswered");
      if(props.question.response !== UserProfile.getAlias()){
        checkResponseSnapshot = db.collection('teams')
            .doc(props.teamUid)
            .onSnapshot(function(doc) {
                let rounds = doc.data().rounds;
                let foundQuestionAnswered = false;
                let answer = "";
                for (let i = 0; i < rounds.length; i++) {
                  let questions = rounds[i].questions;
                  for (let j = 0; j < questions.length; j++) {
                    if(questions[j].uniqueId === props.question.uniqueId && questions[j].answered){
                      if(questions[j].playerAnswer !== ""){
                        answer = questions[j].playerAnswer;
                      }
                      foundQuestionAnswered = true;
                      break;
                    }
                  }
                  if(foundQuestionAnswered ){
                    //inputEl.current.handleStop();
                    //audioPlayerEl.current.pause();
                    setanswered(true);
                    /*
                    if(answer !== ""){
                      $("input[type='radio'][name='answer'][value='"+ answer +"']").parent().addClass('selected-option');
                    }
                    */
                    revealAnswer((answer !== "" ? false : true), answer);
                    break;
                  }
                }
            });
      }
    }

    const answerSummaryModalEntered = () => {
      console.log("answerSummaryModalEntered");
      setTimeout(() => {
          setshowAnswerSummaryModal(false);
      }, Settings.TIME_ANSWER_SUMMARY * 1000);
    }

    const answerSummaryModalExited = () => {
        console.log("answerSummaryModalExited");
        goNextQuestion();
    }

    const unmute = () => {
      if(document.querySelector("#player-"+ props.question.uniqueId +" video")){
          if(document.querySelector("#player-"+ props.question.uniqueId +" video").muted === true){
              document.querySelector("#player-"+ props.question.uniqueId +" video").muted = false;
          }
      }
    }

    return (
      <div className="question" key={props.question.id}>
        <ReactJWPlayer
            playerId={"player-" + props.question.uniqueId}
            playerScript={Settings.JW_PLAYER_SCRIPT}
            file={process.env.PUBLIC_URL + '/assets/songs/' + props.question.fileName}
            isAutoPlay={true}
            isMuted={false}
            onTime={unmute}
        />
        <Modal backdrop="static" show={showAnswerSummaryModal} size="sm" onExited={answerSummaryModalExited} onEntered={answerSummaryModalEntered} centered onHide={() => setshowAnswerSummaryModal(false)}>
            <Modal.Body>
              <p>{answerSummary}</p>
            </Modal.Body>
        </Modal>
           
        <div className="right">
          <div className="statement">
            <h3 className="ttr">{props.question.statement}</h3>
          </div>
          <div className="timer-container">
            <CircleProgressBar allottedTime={Settings.TIME_QUESTION_TIMER} timeUp={timeUp} withCounter={false} />
          </div>
        </div>
        {
          showAnswerSummary ? 
          <div className="right answer-summary">
            {
              answerSummary.isCorrect ? 
              <img src={process.env.PUBLIC_URL + '/assets/images/icons/check.svg'} alt=""/> : 
              <img src={process.env.PUBLIC_URL + '/assets/images/icons/uncheck.svg'} alt=""/>
            }
            <h3 className="ttr subtitle">{t('good_answer_was.title')} { getCorrectAnswerLabel(props.question.correctAnswer) }</h3>
            <p>{ answerSummary.content }</p>
          </div> :
          <div className="right">
            <div className="statement mt-2">
              <p className="para">
                <span className="question-id">{t('extract.title')} {props.question.id}/{props.totalQuestions} : </span> 
                {t('you_play_for.title')} <strong>{props.question.points}</strong> {t('points.title')}
              </p>
              <p className="question-leader">
                {props.question.response} {t('is_leader_round.title')}
              </p>
            </div>
            <div className="answers row">
              {
                props.question.answers.map((item, index) => (
                  <div className="response-item contentRadio col-md-6 col-sm-12" key={index}>
                    <label className="customRadio">{item.label}
                      {
                        props.question.response === UserProfile.getAlias() ? 
                        <input type="radio" name="answer" value={item.value} onChange={event => answerQuestion(event)} /> : 
                        <input type="radio" name="answer" value={item.value} onChange={event => answerQuestionInChat(event)} />
                      }
                      <span className="checkmark"></span>
                    </label>
                  </div>
                ))
              }
            </div>
            {/* 
            <div className="explanation" id="explanation">
              <h4 className="sttr">{props.question.explanation}</h4>
            </div>
            */}
          </div>
        }
        
        
      </div>
    );
}
