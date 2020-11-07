/* eslint-disable default-case */
import React, {useEffect, useState} from 'react';
import * as firebase from 'firebase';
import { useHistory } from "react-router-dom";
import UserProfile from '../../session/UserProfile';
import * as Settings from '../../settings/constants.js';
import { useTranslation } from "react-i18next";
import { Modal } from 'react-bootstrap';

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
 *   Survey page with steps form
*/
export default function Survey(props) {
  const db = firebase.firestore();
  const auth = firebase.auth();
  let history = useHistory();
  const [enjoyEvent, setenjoyEvent] = useState("");
  const site = UserProfile.getSite();

  const [websiteQuality, setwebsiteQuality] = useState("");
  const [easinessRegister, seteasinessRegister] = useState("");
  const [lookAndfeel, setlookAndfeel] = useState("");
  const [descriptionExpect, setdescriptionExpect] = useState("");

  const [selectedWeekday, setselectedWeekday] = useState("");
  const [timeEventStart, settimeEventStart] = useState("");
  const [eventDuration, seteventDuration] = useState("");
  const [questionsAsked, setquestionsAsked] = useState("");
  const [teamChat, setteamChat] = useState("");
  const [onetooneChat, setonetooneChat] = useState("");
  const [typeOfGame, settypeOfGame] = useState("");

  const [recommendation, setrecommendation] = useState("");
  const [experienceImprovement, setexperienceImprovement] = useState("");
  const [nextEvent, setnextEvent] = useState("");
  const [eventFrequency, seteventFrequency] = useState("");
  const [stayInTouch, setstayInTouch] = useState("");

  const [experienceRate, setexperienceRate] = useState("");
  const [user, setuser] = useState(null);
  const [showStep1, setshowStep1] = useState(true);

  const { width } = useViewport();
  const breakpoint = Settings.MOBILE_BREAKPOINT;

  const [mobileStep, setmobileStep] = useState(1);
  const {t} = useTranslation('common');

  const [showSurveyModal, setshowSurveyModal] = useState(false);
  const [showFinaleMessage, setshowFinaleMessage] = useState(false);

  const rates = [1, 2, 3, 4, 5];
  const recommendations = [
    {
      "value": "no",
      "label": t('no.title')
    },
    {
      "value": "might-not",
      "label": t('might_not.title')
    },
    { 
      "value": "might",
      "label": t('might.title')
    },
    {
      "value": "definitely",
      "label": t('definitely.title')
    },
  ];
  const events = [
    {
      "value": "less-week",
      "label": t('less_than_week.title')
    },
    {
      "value": "once-week",
      "label": t('once_week.title')
    },
    {
      "value": "twice-week",
      "label": t('twice_week.title')
    },
    {
      "value": "three-week",
      "label": t('three_times_week.title')
    },
    {
      "value": "more",
      "label": t('more.title')
    },
  ];
  const satifactions = [
    {
      "value": "very-dissatisfied",
      "label": t('very_dissatisfied.title')
    },
    {
      "value": "dissatisfied",
      "label": t('dissatisfied.title')
    },
    {
      "value": "neither-satisfied-dissatisfied",
      "label": t('neither.title')
    },
    {
      "value": "satisfied",
      "label": t('satisfied.title')
    },
    {
      "value": "very-satisfied",
      "label": t('very_satisfied.title')
    },
  ];
  const stayTouch = [
    {
      "value": "touch1",
      "label": t('touch1.title')
    },
    {
      "value": "touch2",
      "label": t('touch2.title')
    },
    {
      "value": "touch3",
      "label": t('touch3.title')
    },
    {
      "value": "touch4",
      "label": t('touch4.title')
    },
  ];

  const pinkColor = "#ed147d";
  const grayColor = "#eef0f5";

  useEffect(() => {
    console.log("survey user ");
    console.log(UserProfile.getAlias());
    
    if(UserProfile.getAlias()){
      console.log("user found");
      setuser(UserProfile.getAlias());
    }
    else {
        logout();
    }

    return () => {
    }
  }, []);
  
  const logout = () => {
      auth.signOut();
      history.push('/');
  }

  const checkForm = (e) => {
    e.preventDefault();
    if(stayInTouch !== "" && recommendation !== "" && nextEvent !== "" && eventFrequency !== "" && experienceImprovement !== ""){
      props.changeLoaderStatus();
      saveSurveyAnswers();
    }
    else {
      if(stayInTouch === "") {
        document.getElementById('alert-stayintouch-empty').style.display = 'block';
        setTimeout(() => {
          document.getElementById('alert-stayintouch-empty').style.display = 'none';
        }, 3000);
      }
      if(recommendation === "") {
        document.getElementById('alert-recommendation-empty').style.display = 'block';
        setTimeout(() => {
          document.getElementById('alert-recommendation-empty').style.display = 'none';
        }, 3000);
      }
      if(nextEvent === "") {
        document.getElementById('alert-nextevent-empty').style.display = 'block';
        setTimeout(() => {
          document.getElementById('alert-nextevent-empty').style.display = 'none';
        }, 3000);
      }
      if(eventFrequency === "") {
        document.getElementById('alert-eventfrequency-empty').style.display = 'block';
        setTimeout(() => {
          document.getElementById('alert-eventfrequency-empty').style.display = 'none';
        }, 3000);
      }
      if(experienceImprovement === "") {
        document.getElementById('alert-experienceimprovement-empty').style.display = 'block';
        setTimeout(() => {
          document.getElementById('alert-experienceimprovement-empty').style.display = 'none';
        }, 3000);
      }
    }
  }

  const saveSurveyAnswers = () => {
    /*
        db.collection('survey')
        .where("user", "==", user.alias)
        .get()
        .then(function(querySurvey) {
            if(!querySurvey.empty){
              let surveyId = null;
              querySurvey.forEach(function(doc) {
                surveyId = doc.id;
              });

              if(surveyId) {
                db.collection("survey").doc(surveyId).update({
                  experienceRate,
                  recommendation,
                  nextEvent,
                  eventFrequency,
                  experienceImprovement,
                  timestamp: new Date().getTime()
                }).then(function(){
                  console.log("user survey updated");
                })
                .catch(error => {
                  console.log(error);
                });
              }
            }
            else {
            }
        })
        .catch(function(error) {
            console.log("Error getting users: ", error);
        });
    */
      db.collection("survey").add({
        enjoyEvent,
        websiteQuality,
        easinessRegister,
        lookAndfeel,
        descriptionExpect,
        selectedWeekday,
        timeEventStart,
        eventDuration,
        questionsAsked,
        teamChat,
        onetooneChat,
        typeOfGame,
        recommendation,
        experienceImprovement,
        nextEvent,
        eventFrequency,
        stayInTouch,
        user,
        timestamp: new Date().getTime()
      }).then(function(){
        console.log("user survey added");
        props.hideLoader();
        resetAllFields();
        //setshowSurveyModal(true);
        setmobileStep(9);
        setshowFinaleMessage(true);
      })
      .catch(error => {
        console.log(error);
      });
  }

  const submitStep1 = (e) => {
    e.preventDefault();
    if(enjoyEvent !== "" && 
    websiteQuality !== "" && 
    easinessRegister !== "" && 
    lookAndfeel !== "" && 
    descriptionExpect !== "" && 
    selectedWeekday !== "" && 
    timeEventStart !== "" && 
    eventDuration !== "" && 
    questionsAsked !== "" && 
    teamChat !== "" && 
    onetooneChat !== "" && 
    typeOfGame !== ""
    ){
      setshowStep1(false);
    }
    else {
      //if(enjoyEvent === "") {
        document.getElementById('alert-enjoyevent-empty').style.display = 'block';
        setTimeout(() => {
          document.getElementById('alert-enjoyevent-empty').style.display = 'none';
        }, 3000);
      //}
      console.log("else submitStep1");

      if(websiteQuality === ""){
        document.getElementById('line-qualitywebsite').style.background = pinkColor;
        setTimeout(() => {
          document.getElementById('line-qualitywebsite').style.background = grayColor;
        }, 3000);
      }
      if(easinessRegister === ""){
        document.getElementById('line-easinessregister').style.background = pinkColor;
        setTimeout(() => {
          document.getElementById('line-easinessregister').style.background = 'none';
        }, 3000);
      }
      if(lookAndfeel === ""){
        document.getElementById('line-lookfeel').style.background = pinkColor;
        setTimeout(() => {
          document.getElementById('line-lookfeel').style.background = grayColor;
        }, 3000);
      }
      if(descriptionExpect === ""){
        document.getElementById('line-descriptionexpect').style.background = pinkColor;
        setTimeout(() => {
          document.getElementById('line-descriptionexpect').style.background = 'none';
        }, 3000);
      }
      if(selectedWeekday === ""){
        document.getElementById('line-selectedweekday').style.background = pinkColor;
        setTimeout(() => {
          document.getElementById('line-selectedweekday').style.background = grayColor;
        }, 3000);
      }
      if(timeEventStart === ""){
        document.getElementById('line-timeventstart').style.background = pinkColor;
        setTimeout(() => {
          document.getElementById('line-timeventstart').style.background = 'none';
        }, 3000);
      }
      if(eventDuration === ""){
        document.getElementById('line-eventduration').style.background = pinkColor;
        setTimeout(() => {
          document.getElementById('line-eventduration').style.background = grayColor;
        }, 3000);
      }
      if(questionsAsked === ""){
        document.getElementById('line-questionsasked').style.background = pinkColor;
        setTimeout(() => {
          document.getElementById('line-questionsasked').style.background = 'none';
        }, 3000);
      }
      if(teamChat === ""){
        document.getElementById('line-teamchat').style.background = pinkColor;
        setTimeout(() => {
          document.getElementById('line-teamchat').style.background = grayColor;
        }, 3000);
      }
      if(onetooneChat === ""){
        document.getElementById('line-onetoone').style.background = pinkColor;
        setTimeout(() => {
          document.getElementById('line-onetoone').style.background = 'none';
        }, 3000);
      }
      if(typeOfGame === ""){
        document.getElementById('line-typeofgame').style.background = pinkColor;
        setTimeout(() => {
          document.getElementById('line-typeofgame').style.background = grayColor;
        }, 3000);
      }

    }
  }

  const resetAllFields = () => {
    setenjoyEvent("");
    setwebsiteQuality("");
    seteasinessRegister("");
    setlookAndfeel("");
    setdescriptionExpect("");

    setselectedWeekday("");
    settimeEventStart("");
    seteventDuration("");
    setquestionsAsked("");
    setteamChat("");
    setonetooneChat("");
    settypeOfGame("");

    setstayInTouch("");
    setrecommendation("");
    setnextEvent("");
    seteventFrequency("");
    setexperienceImprovement("");

    document.getElementsByName('enjoyevent').forEach(element => {
      element.checked = false;
    });
    document.getElementsByName('qualitywebsite').forEach(element => {
      element.checked = false;
    });
    document.getElementsByName('easinessregister').forEach(element => {
      element.checked = false;
    });
    document.getElementsByName('lookfeel').forEach(element => {
      element.checked = false;
    });
    document.getElementsByName('descriptionexpect').forEach(element => {
      element.checked = false;
    });

    document.getElementsByName('selectedweekday').forEach(element => {
      element.checked = false;
    });
    document.getElementsByName('timeventstart').forEach(element => {
      element.checked = false;
    });
    document.getElementsByName('eventduration').forEach(element => {
      element.checked = false;
    });
    document.getElementsByName('questionsasked').forEach(element => {
      element.checked = false;
    });
    document.getElementsByName('teamchat').forEach(element => {
      element.checked = false;
    });
    document.getElementsByName('onetoone').forEach(element => {
      element.checked = false;
    });
    document.getElementsByName('typeofgame').forEach(element => {
      element.checked = false;
    });

    document.getElementsByName('stayInTouch').forEach(element => {
      element.checked = false;
    });
    document.getElementsByName('recommendation').forEach(element => {
      element.checked = false;
    });
    document.getElementsByName('nextEvent').forEach(element => {
      element.checked = false;
    });
    document.getElementsByName('eventFrequency').forEach(element => {
      element.checked = false;
    });
  }

  const checkButtonStep1Enabled = () => {
    return !(enjoyEvent !== "" && websiteQuality !== "" && easinessRegister !== "" && lookAndfeel !== "" && descriptionExpect !== "" &&  selectedWeekday !== "" && timeEventStart !== "" && eventDuration !== "" && questionsAsked !== "" && teamChat !== "" && onetooneChat !== "" && typeOfGame !== "");
  }

  const checkButtonSubmitEnabled = () => {
    return !(recommendation !== "" && nextEvent !== "" && eventFrequency !== "" && experienceImprovement !== "" && stayInTouch !== "");
  }
  const surveyModalEntered = () => {
    console.log("surveyModalEntered");
    setTimeout(() => {
      setshowSurveyModal(false);
    }, 3000);
  }

  const surveyModalExited = () => {
      console.log("surveyModalExited");
  }

  const renderSwitch = (param) => {
    switch(param){
      case 1:
        return (<div className="row s1">
                <div className="progressStep">
                  <div className="step-1"></div>
                </div>
                <h2 className="ttr">{t('opinion_important.title')}</h2>
                <p className="para">{t('answer_survey.title')} </p>
                <p className="para">{t('overall.title')} </p>
                <div className="form-group firstRadioBox">
                    {
                      [1, 2, 3, 4, 5].map(item => (
                        <label className="customRadio" key={"scale-" + item}>
                          <input id="enjoyevent" type="radio" name="enjoyevent" value={item} onChange={event => setenjoyEvent(event.target.value)} />
                          <span className="num">{item}</span>
                          <span className="checkmark"></span>
                        </label>
                      ))
                    }
                </div>
                <div className="form-group d-flex">
                  <button className="btn btn-primary" disabled={enjoyEvent === ""} onClick={() => setmobileStep(2)}>{t('continue.title')}</button>
                </div>
              </div>);
      case 2:
        return (<div className="row s2">
                <div className="progressStep">
                  <div className="step-2"></div>
                </div>
                <p className="para">{t('before_attending.title')} : </p>
                <p className="small">{t('scale.title')}</p>
                
                <div className="form-group firstRadioBox">
                  <p className="para">{t('quality_website.title')}</p>
                  {
                    satifactions.map((item, index) => (
                      <label className="customRadio" key={"scale-qualitywebsite-" + item.value}>
                        <input type="radio" name="qualitywebsite" id={"qualitywebsite-" + item.value} value={item.value} onChange={event => setwebsiteQuality(event.target.value)} />
                        <span className="num">{index + 1}</span>
                        <span className="checkmark"></span>
                      </label>
                    ))
                  }
                </div>
                <div className="form-group firstRadioBox">
                  <p className="para">{t('easiness.title')}</p>
                  {
                    satifactions.map((item, index) => (
                      <label className="customRadio" key={"scale-easinessregister-" + item.value}>
                        <input type="radio" name="easinessregister" id={"easinessregister-" + item.value} value={item.value} onChange={event => seteasinessRegister(event.target.value)} />
                        <span className="num">{index + 1}</span>
                        <span className="checkmark"></span>
                      </label>
                    ))
                  }
                </div>
                <div className="form-group firstRadioBox">
                  <p className="para">{t('look_feel.title')}</p>
                  {
                    satifactions.map((item, index) => (
                      <label className="customRadio" key={"scale-lookfeel-" + item.value}>
                        <input type="radio" name="lookfeel" id={"lookfeel-" + item.value} value={item.value} onChange={event => setlookAndfeel(event.target.value)} />
                        <span className="num">{index + 1}</span>
                        <span className="checkmark"></span>
                      </label>
                    ))
                  }
                </div>
                <div className="form-group firstRadioBox">
                  <p className="para">{t('desc_expect.title')}</p>
                  {
                    satifactions.map((item, index) => (
                      <label className="customRadio" key={"scale-descriptionexpect-" + item.value}>
                        <input type="radio" name="descriptionexpect" id={"descriptionexpect-" + item.value} value={item.value} onChange={event => setdescriptionExpect(event.target.value)} />
                        <span className="num">{index + 1}</span>
                        <span className="checkmark"></span>
                      </label>
                    ))
                  }
                </div>
                <div className="form-group d-flex">
                  <button className="btn btn-primary" disabled={websiteQuality === "" || easinessRegister === "" || lookAndfeel === "" || descriptionExpect === ""} onClick={() => setmobileStep(3)}>{t('continue.title')}</button>
                </div>
              </div>);
      case 3:
        return (<div className="row s3">
                <div className="progressStep">
                  <div className="step-3"></div>
                </div>
                <p className="ttr">{t('during_event.title')} : </p>
                <p className="small">{t('scale.title')}</p>
                
                <div className="form-group firstRadioBox">
                  <p className="para">{t('selected_weekday.title')}</p>
                  {
                    satifactions.map((item, index) => (
                      <label className="customRadio" key={"scale-" + item.value}>
                        <input type="radio" name="selectedweekday" id={"selectedweekday-" + item.value} value={item.value} onChange={event => setselectedWeekday(event.target.value)} />
                        <span className="num">{index + 1}</span>
                        <span className="checkmark"></span>
                      </label>
                    ))
                  }
                </div>
                <div className="form-group firstRadioBox">
                  <p className="para">{t('time_event.title')}</p>
                  {
                    satifactions.map((item, index) => (
                      <label className="customRadio" key={"scale-" + item.value}>
                        <input type="radio" name="timeventstart" id={"timeventstart-" + item.value} value={item.value} onChange={event => settimeEventStart(event.target.value)} />
                        <span className="num">{index + 1}</span>
                        <span className="checkmark"></span>
                      </label>
                    ))
                  }
                </div>
                <div className="form-group firstRadioBox">
                  <p className="para">{t('duration_event.title')}</p>
                  {
                    satifactions.map((item, index) => (
                      <label className="customRadio" key={"scale-" + item.value}>
                        <input type="radio" name="eventduration" id={"eventduration-" + item.value} value={item.value} onChange={event => seteventDuration(event.target.value)} />
                        <span className="num">{index + 1}</span>
                        <span className="checkmark"></span>
                      </label>
                    ))
                  }
                </div>
                <div className="form-group firstRadioBox">
                  <p className="para">{t('question_asked.title')}</p>
                  {
                    satifactions.map((item, index) => (
                      <label className="customRadio" key={"scale-" + item.value}>
                        <input type="radio" name="questionsasked" id={"questionsasked-" + item.value} value={item.value} onChange={event => setquestionsAsked(event.target.value)} />
                        <span className="num">{index + 1}</span>
                        <span className="checkmark"></span>
                      </label>
                    ))
                  }
                </div>
                <div className="form-group firstRadioBox">
                  <p className="para">{t('team_chat_exchange.title')}</p>
                  {
                    satifactions.map((item, index) => (
                      <label className="customRadio" key={"scale-" + item.value}>
                        <input type="radio" name="teamchat" id={"teamchat-" + item.value} value={item.value} onChange={event => setteamChat(event.target.value)} />
                        <span className="num">{index + 1}</span>
                        <span className="checkmark"></span>
                      </label>
                    ))
                  }
                </div>
                <div className="form-group firstRadioBox">
                  <p className="para">{t('o2o_chat_exchange.title')}</p>
                  {
                    satifactions.map((item, index) => (
                      <label className="customRadio" key={"scale-" + item.value}>
                        <input type="radio" name="onetoone" id={"onetoone-" + item.value} value={item.value} onChange={event => setonetooneChat(event.target.value)} />
                        <span className="num">{index + 1}</span>
                        <span className="checkmark"></span>
                      </label>
                    ))
                  }
                </div>
                <div className="form-group firstRadioBox">
                  <p className="para">{t('type_game.title')}</p>
                  {
                    satifactions.map((item, index) => (
                      <label className="customRadio" key={"scale-" + item.value}>
                        <input type="radio" name="typeofgame" id={"typeofgame-" + item.value} value={item.value} onChange={event => settypeOfGame(event.target.value)} />
                        <span className="num">{index + 1}</span>
                        <span className="checkmark"></span>
                      </label>
                    ))
                  }
                </div>
                <div className="form-group d-flex">
                  <button className="btn btn-primary" disabled={selectedWeekday === "" || timeEventStart === "" || eventDuration === "" || questionsAsked === "" || teamChat === "" || onetooneChat === "" || typeOfGame === ""} onClick={() => setmobileStep(4)}>{t('continue.title')}</button>
                </div>
              </div>);
      case 4:
        return (<div className="row s4">
                  <div className="progressStep">
                    <div className="step-4"></div>
                  </div>
                  <div className="contents">
                    <p className="para">{t('merrier.title')}</p>
                    <div className="form-group firstRadioBox">
                        {
                              recommendations.map(item => (
                                <label className="customRadio" key={"scale-" + item.value}>
                                  <input type="radio" name="recommendation" value={item.value} onChange={event => setrecommendation(event.target.value)} />
                                  <span className="num">{item.label}</span>
                                  <span className="checkmark"></span>
                                </label>
                              ))
                            }
                    </div>
                    <div className="form-group d-flex">
                      <button className="btn btn-primary" disabled={recommendation === ""} onClick={() => setmobileStep(5)}>{t('continue.title')}</button>
                    </div>
                  </div>
              </div>);
      case 5:
        return (<div className="row s5">
                <div className="progressStep">
                  <div className="step-5"></div>
                </div>
                <div className="contents">
                  <p className="para">{t('tell_us_experience.title')}</p>
                  <div className="form-group firstRadioBox">
                    <textarea className="form-control" placeholder={t('write_here.title') + "..."} cols="10" rows="2" onChange={event => setexperienceImprovement(event.target.value)} value={experienceImprovement}></textarea>
                  </div>
                  <div className="form-group d-flex">
                    <button className="btn btn-primary" disabled={experienceImprovement === ""} onClick={() => setmobileStep(6)}>{t('continue.title')}</button>
                  </div>
                </div>
              </div>);
      case 6:
        return (<div className="row s6">
                <div className="progressStep">
                  <div className="step-6"></div>
                </div>
                <div className="contents">
                  <p className="para">{t('will_participate.title')}</p>
                  <div className="form-group firstRadioBox">
                    {
                      recommendations.map(item => (
                          <label className="customRadio" key={"scale-" + item.value}>
                            <input type="radio" name="nextEvent" value={item.value} onChange={event => setnextEvent(event.target.value)} />
                            <span className="num">{item.label}</span>
                            <span className="checkmark"></span>
                          </label>
                        ))
                      }
                  </div>
                  <div className="form-group d-flex">
                    <button className="btn btn-primary" disabled={nextEvent === ""} onClick={() => setmobileStep(7)}>{t('continue.title')}</button>
                  </div>
                </div>
              </div>);
      case 7:
        return (<div className="row s7">
                <div className="progressStep">
                  <div className="step-7"></div>
                </div>
                <div className="contents">
                  <p className="para">{t('how_often.title')}</p>
                  <div className="form-group firstRadioBox">
                  {
                    events.map(item => (
                      <label className="customRadio" key={"scale-" + item.value}>
                        <input type="radio" name="eventFrequency" value={item.value} onChange={event => seteventFrequency(event.target.value)} />
                        <span className="num">{item.label}</span>
                        <span className="checkmark"></span>
                      </label>
                    ))
                  }
                  </div>
                  <div className="form-group d-flex">
                    <button className="btn btn-primary" disabled={eventFrequency === ""} onClick={() => setmobileStep(8)}>{t('continue.title')}</button>
                  </div>
                </div>
              </div>);
      case 8:
        return (<div className="row s8">
                <div className="progressStep">
                  <div className="step-8"></div>
                </div>
                <div className="contents">
                  <p className="para">{t('stay_in_touch.title')}</p>
                  <div className="form-group firstRadioBox">
                  {
                    stayTouch.map(item => (
                      <label className="customRadio" key={"scale-" + item.value}>
                        <input type="radio" name="stayInTouch" value={item.value} onChange={event => setstayInTouch(event.target.value)} />
                        <span className="num">{item.label}</span>
                        <span className="checkmark"></span>
                      </label>
                    ))
                  }
                  </div>
                  <div className="form-group d-flex">
                      {
                      user ? <button type="submit" className="btn btn-primary" disabled={checkButtonSubmitEnabled()}>{t('submit.title')}</button> : ''
                    }
                  </div>
                  <div class="alert-success" id="alert-survey-success" role="alert">
                    <h4 class="alert-heading">{t('well_done.title')}</h4>
                    <p>{t('submitted.title')}</p>
                  </div>
                  <h5 className="ttr">{t('nice_evening.title')} <br/> {t('meetic_team.title')}</h5>
                </div>
              </div>);
        case 9:
          return (<div className="s8 m-auto">
                  <div className="contents">
                    <p className="para">{t('thank_feedbacks.title')}</p>
                  </div>
                </div>);
    }
  }

  return (
      <div className="survey container">
        {
          width > breakpoint && !showFinaleMessage ? 
          <h2 className="ttr">{t('opinion_important.title')} {t('answer_survey.title')} </h2>
          : ''
        }
        { 
          !showFinaleMessage ? 
          (

            showStep1 ? (
              <div className="progressStep">
                <div className="step-1"></div>
              </div>
            ) : 
            (
              <div className="progressStep">
                <div className="step-2"></div>
              </div>
            )
          )
          : ''
        }
        {
          width < breakpoint ?           
          <Modal className={site} backdrop="static" show={showSurveyModal} size="sm" onExited={surveyModalExited} onEntered={surveyModalEntered} centered onHide={() => setshowSurveyModal(false)}>
            <Modal.Body>
            <div className="ranking">
              <div className="statement">
                <p className="para">{t('thank_feedbacks.title')}</p>
              </div>
            </div>
            </Modal.Body>
          </Modal>
          : ''
        }
        
        

        {
          width > breakpoint ? 
        <form className="form .col-12" onSubmit={checkForm}>
            {
              !showFinaleMessage ? 
              (
                showStep1 ? 
                (
                  <div className="step1">
                    <div className="row">
                      <p className="para">{t('overall.title')} </p>
                      <div className="form-group firstRadioBox">
                          {
                            [1, 2, 3, 4, 5].map(item => (
                              <label className="customRadio" key={"scale-" + item}>
                                <input id="enjoyevent" type="radio" name="enjoyevent" value={item} onChange={event => setenjoyEvent(event.target.value)} />
                                <span className="num">{item}</span>
                                <span className="checkmark"></span>
                              </label>
                            ))
                          }
                      </div>
                      <div className="survey-alert" id="alert-enjoyevent-empty">
                        <p>*Please fill this field before submiting</p>
                      </div>
                    </div>
                    <div className="row">
                      <p className="para">{t('before_attending.title')} : </p>
                      <div className="form-group">
                          <table className="table">
                            <thead>
                              <tr>
                                <th>&nbsp;</th>
                                <th>{t('very_dissatisfied.title')}</th>
                                <th>{t('dissatisfied.title')}</th>
                                <th>{t('neither.title')}</th>
                                <th>{t('satisfied.title')}</th>
                                <th>{t('very_satisfied.title')}</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr id="line-qualitywebsite">
                                <td>{t('quality_website.title')}</td>
                                {
                                  satifactions.map(item => (
                                    <td><label className="customRadio" key={"scale-" + item.value}>
                                      <input type="radio" name="qualitywebsite" id={"qualitywebsite-" + item.value} value={item.value} onChange={event => setwebsiteQuality(event.target.value)} />
                                      <span className="checkmark"></span>
                                    </label></td>
                                  ))
                                }
                              </tr>
                              <tr id="line-easinessregister">
                                <td>{t('easiness.title')}</td>
                                {
                                  satifactions.map(item => (
                                    <td><label className="customRadio" key={"scale-" + item.value}>
                                      <input type="radio" name="easinessregister" id={"easinessregister-" + item.value} value={item.value} onChange={event => seteasinessRegister(event.target.value)} />
                                      <span className="checkmark"></span>
                                    </label></td>
                                  ))
                                }
                              </tr>
                              <tr id="line-lookfeel">
                                <td>{t('look_feel.title')}</td>
                                {
                                  satifactions.map(item => (
                                    <td><label className="customRadio" key={"scale-" + item.value}>
                                      <input type="radio" name="lookfeel" id={"lookfeel-" + item.value} value={item.value} onChange={event => setlookAndfeel(event.target.value)} />
                                      <span className="checkmark"></span>
                                    </label></td>
                                  ))
                                }
                              </tr>
                              <tr id="line-descriptionexpect">
                                <td>{t('desc_expect.title')}</td>
                                {
                                  satifactions.map(item => (
                                    <td><label className="customRadio" key={"scale-" + item.value}>
                                      <input type="radio" name="descriptionexpect" id={"descriptionexpect-" + item.value} value={item.value} onChange={event => setdescriptionExpect(event.target.value)} />
                                      <span className="checkmark"></span>
                                    </label></td>
                                  ))
                                }
                              </tr>
                            </tbody>
                          </table>
                      </div>
                      <div className="survey-alert" id="alert-websitequality-empty">
                        <p>*Please fill this field before submiting</p>
                      </div>
                    </div>
                    <div className="row">
                      <p className="para">{t('during_event.title')} : </p>
                      <div className="form-group">
                          <table className="table">
                            <thead>
                              <tr>
                                <th>&nbsp;</th>
                                <th>{t('very_dissatisfied.title')}</th>
                                <th>{t('dissatisfied.title')}</th>
                                <th>{t('neither.title')}</th>
                                <th>{t('satisfied.title')}</th>
                                <th>{t('very_satisfied.title')}</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr id="line-selectedweekday">
                                <td>{t('selected_weekday.title')}</td>
                                {
                                  satifactions.map(item => (
                                    <td><label className="customRadio" key={"scale-" + item.value}>
                                      <input type="radio" name="selectedweekday" id={"selectedweekday-" + item.value} value={item.value} onChange={event => setselectedWeekday(event.target.value)} />
                                      <span className="checkmark"></span>
                                    </label></td>
                                  ))
                                }
                              </tr>
                              <tr id="line-timeventstart">
                                <td>{t('time_event.title')}</td>
                                {
                                  satifactions.map(item => (
                                    <td><label className="customRadio" key={"scale-" + item.value}>
                                      <input type="radio" name="timeventstart" id={"timeventstart-" + item.value} value={item.value} onChange={event => settimeEventStart(event.target.value)} />
                                      <span className="checkmark"></span>
                                    </label></td>
                                  ))
                                }
                              </tr>
                              <tr id="line-eventduration">
                                <td>{t('duration_event.title')}</td>
                                {
                                  satifactions.map(item => (
                                    <td><label className="customRadio" key={"scale-" + item.value}>
                                      <input type="radio" name="eventduration" id={"eventduration-" + item.value} value={item.value} onChange={event => seteventDuration(event.target.value)} />
                                      <span className="checkmark"></span>
                                    </label></td>
                                  ))
                                }
                              </tr>
                              <tr id="line-questionsasked">
                                <td>{t('question_asked.title')}</td>
                                {
                                  satifactions.map(item => (
                                    <td><label className="customRadio" key={"scale-" + item.value}>
                                      <input type="radio" name="questionsasked" id={"questionsasked-" + item.value} value={item.value} onChange={event => setquestionsAsked(event.target.value)} />
                                      <span className="checkmark"></span>
                                    </label></td>
                                  ))
                                }
                              </tr>
                              <tr id="line-teamchat">
                                <td>{t('team_chat_exchange.title')}</td>
                                {
                                  satifactions.map(item => (
                                    <td><label className="customRadio" key={"scale-" + item.value}>
                                      <input type="radio" name="teamchat" id={"teamchat-" + item.value} value={item.value} onChange={event => setteamChat(event.target.value)} />
                                      <span className="checkmark"></span>
                                    </label></td>
                                  ))
                                }
                              </tr>
                              <tr id="line-onetoone">
                                <td>{t('o2o_chat_exchange.title')}</td>
                                {
                                  satifactions.map(item => (
                                    <td><label className="customRadio" key={"scale-" + item.value}>
                                      <input type="radio" name="onetoone" id={"onetoone-" + item.value} value={item.value} onChange={event => setonetooneChat(event.target.value)} />
                                      <span className="checkmark"></span>
                                    </label></td>
                                  ))
                                }
                              </tr>
                              <tr id="line-typeofgame">
                                <td>{t('type_game.title')}</td>
                                {
                                  satifactions.map(item => (
                                    <td><label className="customRadio" key={"scale-" + item.value}>
                                      <input type="radio" name="typeofgame" id={"typeofgame-" + item.value} value={item.value} onChange={event => settypeOfGame(event.target.value)} />
                                      <span className="checkmark"></span>
                                    </label></td>
                                  ))
                                }
                              </tr>
                            </tbody>
                          </table>
                      </div>
                    </div>
                    <div className="form-group d-flex">
                      <button className="btn btn-primary" disabled={checkButtonStep1Enabled()} onClick={submitStep1}>{t('continue.title')}</button>
                    </div>
                  </div>
                )
                : (
                  <div className="step2">
                    <div className="row">
                      <p className="para">{t('merrier.title')}</p>
                      <div className="form-group">
                          {
                            recommendations.map(item => (
                              <label className="customRadio" key={"scale-" + item.value}>
                                <input type="radio" name="recommendation" value={item.value} onChange={event => setrecommendation(event.target.value)} />
                                <div className="label">{item.label}</div>
                                <span className="checkmark"></span>
                              </label>
                            ))
                          }
                      </div>
                      <div className="survey-alert" id="alert-recommendation-empty">
                        <p>*Please fill this field before submiting</p>
                      </div>
                    </div>
                    <div className="row">
                      <p className="para">{t('tell_us_experience.title')}</p>
                      <div className="form-group">
                          <textarea className="form-control" placeholder={t('write_here.title') + "..."} cols="10" rows="3" onChange={event => setexperienceImprovement(event.target.value)} value={experienceImprovement}></textarea>
                      </div>
                      <div className="survey-alert" id="alert-experienceimprovement-empty">
                        <p>*Please fill this field before submiting</p>
                      </div>
                    </div>
                    <div className="row">
                      <p className="para">{t('will_participate.title')}</p>
                      <div className="form-group">
                          {
                            recommendations.map(item => (
                              <label className="customRadio" key={"scale-" + item.value}>
                                <input type="radio" name="nextEvent" value={item.value} onChange={event => setnextEvent(event.target.value)} />
                                <div className="label">{item.label}</div>
                                <span className="checkmark"></span>
                              </label>
                            ))
                          }
                      </div>
                      <div className="survey-alert" id="alert-nextevent-empty">
                        <p>*Please fill this field before submiting</p>
                      </div>
                    </div>
                    <div className="row">
                      <p className="para">{t('how_often.title')}</p>
                      <div className="form-group">
                          {
                            events.map(item => (
                              <label className="customRadio" key={"scale-" + item.value}>
                                <input type="radio" name="eventFrequency" value={item.value} onChange={event => seteventFrequency(event.target.value)} />
                                <div className="label">{item.label}</div>
                                <span className="checkmark"></span>
                              </label>
                            ))
                          }
                      </div>
                      <div className="survey-alert" id="alert-eventfrequency-empty">
                        <p>*Please fill this field before submiting</p>
                      </div>
                    </div>
                    <div className="row">
                      <p className="para">{t('stay_in_touch.title')}</p>
                      <div className="form-group last">
                          {
                            stayTouch.map(item => (
                              <label className="customRadio" key={"scale-" + item.value}>
                                <input type="radio" name="stayInTouch" value={item.value} onChange={event => setstayInTouch(event.target.value)} />
                                <div className="label">{item.label}</div>
                                <span className="checkmark"></span>
                              </label>
                            ))
                          }
                      </div>
                      <div className="survey-alert" id="alert-stayintouch-empty">
                        <p>*Please fill this field before submiting</p>
                      </div>
                    </div>
                    <Modal className={site} backdrop="static" show={showSurveyModal} size="sm" onExited={surveyModalExited} onEntered={surveyModalEntered} centered onHide={() => setshowSurveyModal(false)}>
                      <Modal.Body>
                      <div className="ranking">
                        <div className="statement">
                          <p className="para">{t('thank_feedbacks.title')}</p>
                        </div>
                      </div>
                      </Modal.Body>
                    </Modal>
                    <div className="form-group d-flex">
                      {
                        user ? <button type="submit" className="btn btn-primary" disabled={checkButtonSubmitEnabled()}>{t('submit.title')}</button> : ''
                      }
                    </div>
                  </div>
                ) 
              )
              :
              <div className="ranking">
                <div className="statement">
                  <p className="para">{t('thank_feedbacks.title')}</p>
                </div>
              </div>
            }
        </form>
        : 
        <form className="form col-12" onSubmit={checkForm}>
          {renderSwitch(mobileStep)}
        </form>
        }
      </div>
  )
}