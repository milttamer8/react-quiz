import React, {useState, useEffect, createRef} from 'react';
import { Tabs, Tab, Button, Table, Badge } from 'react-bootstrap';
import DatePicker from "react-datepicker";
import * as firebase from 'firebase';
import axios from "axios";
import * as Settings from '../../../settings/constants.js';
import './Home.css';

import Select from 'react-select';
import { CSVReader } from 'react-papaparse'
import { useHistory } from "react-router-dom";
 
import "react-datepicker/dist/react-datepicker.css";
import CanvasJSReact from '../../../assets/canvasjs.react';
var CanvasJSChart = CanvasJSReact.CanvasJSChart;

/*
 *   For admin purpose
 *   Contains variety of functions to create sessions, create session questions, display user lists, make Development actions
*/
export default function Home() {
    let history = useHistory();
    const [key, setkey] = useState('session');
    const [sessionform, setsessionform] = useState(false);
    const [sessions, setsessions] = useState([]);
    const [startdate, setstartdate] = useState(new Date());
    const [quizzoptionschecked, setquizzoptionschecked] = useState([]);
    const [countryoptionschecked, setcountryoptionschecked] = useState([]);
    const countries = ['fr', 'nl', 'gm', 'it', 'uk', 'us', 'sw', 'sp', 'ir'];
    const countryObjects = [
        {
            label: 'France',
            key: 'fr'
        },
        {
            label: 'Pays-bas',
            key: 'nl'
        },
        {
            label: 'Allemagne',
            key: 'gm'
        },
        {
            label: 'Italie',
            key: 'it'
        },
        {
            label: 'Royaume-Uni',
            key: 'uk'
        },
        {
            label: 'Etats-unis',
            key: 'us'
        },
        {
            label: 'Suède',
            key: 'sw'
        },
        {
            label: 'Spain',
            key: 'sp'
        },
        {
            label: 'Ireland',
            key: 'ir'
        }
    ];
    const db = firebase.firestore();
    const [updatingsession, setupdatingsession] = useState(null);
    const [country, setcountry] = useState("");
    const [region, setregion] = useState("");
    const [agemin, setagemin] = useState("");
    const [agemax, setagemax] = useState("");
    const [countryconfigs, setcountryconfigs] = useState([]);
    const [initialsubscribers, setinitialsubscribers] = useState([]);
    const [subscribers, setsubscribers] = useState([]);
    const [sessionfilter, setsessionfilter] = useState("");
    const [genderfilter, setgenderfilter] = useState("");
    const [ageminfilter, setageminfilter] = useState("");
    const [agemaxfilter, setagemaxfilter] = useState("")
    const [sitefilter, setsitefilter] = useState("");
    const [countryfilter, setcountryfilter] = useState("")
    const [subscribersoptions, setsubscribersoptions] = useState({
        title: {
            text: "Inscris"
        },
        data: [
        {
            // Change type to "doughnut", "line", "splineArea", etc.
            type: "column",
            dataPoints: []
        }
        ]
    });
    const sites = ["core", "senior"];
    const [regions, setregions] = useState([]);
    const [initialregions, setinitialregions] = useState([]);

    // quizz
    const [countryQuizz, setcountryQuizz] = useState("");
    const [regionsQuizz, setregionsQuizz] = useState([]);
    const [regionsQuizzOptionsChecked, setregionsQuizzOptionsChecked] = useState([]);
    const [ageQuizzMin, setageQuizzMin] = useState("");
    const [ageQuizzMax, setageQuizzMax] = useState("");
    const [agesQuizzSelected, setagesQuizzSelected] = useState([]);
    const [quizzRounds, setquizzRounds] = useState([]);
    const [quizzFinaleRounds, setquizzFinaleRounds] = useState([]);
    const [quizzStatement, setquizzStatement] = useState("");
    const [quizzExplanation, setquizzExplanation] = useState("");
    const [quizzPoints, setquizzPoints] = useState(30);
    const [quizzFilename, setquizzFilename] = useState("");
    const [quizzAnswers, setquizzAnswers] = useState([]);
    const [quizzAnswerItem, setquizzAnswerItem] = useState("");
    const [quizzActiveRoundItem, setquizzActiveRoundItem] = useState("0");
    const [quizzCorrectAnswer, setquizzCorrectAnswer] = useState("");
    const [quizzSeniorSeries, setquizzSeniorSeries] = useState([]);
    const [isFinale, setisFinale] = useState(false);
    const [quizzCoreSeries, setquizzCoreSeries] = useState([]);
    const [quizzIllustration, setquizzIllustration] = useState("");
    const [quizzTheme, setquizzTheme] = useState("");
    const [quizzSession, setquizzSession] = useState("");

    const timeoptions = [
        { value: '20:00', label: '20:00' },
        { value: '20:30', label: '20:30' },
        { value: '21:00', label: '21:00' },
        { value: '21:30', label: '21:30' },
        { value: '22:00', label: '22:00' },
        { value: '22:30', label: '22:30' },
    ];
    const [starttime, setstarttime] = useState(timeoptions[0]);
    const buttonRefCore = createRef();
    const buttonRefSenior = createRef();
    const buttonQuestionsSenior = createRef();
    const [complaints, setcomplaints] = useState(null);
    const auth = firebase.auth();

    useEffect(() => {
        checkLoggedIn();
        
        return () => {
            
        }
    }, []);

    useEffect(() => {
        if(document.getElementById("session-form") != null && updatingsession != null){
            quizzoptionschecked.forEach(element => {
                document.getElementById(element).checked = true;
            });
            countryoptionschecked.forEach(element => {
                document.getElementById('country-' + element).checked = true;
            });
        }
    })

    const checkLoggedIn = () => {
      auth.onAuthStateChanged(firebaseUser => {
            if(firebaseUser){
                console.log("logged in");
                console.log(firebaseUser);
                setstartdate(addDays(new Date(), 5));
                loadSessions();
                loadCountries();
                loadUsers();
                loadRegions();
                loadSeniorSeries();
                loadCoreSeries();
                loadComplaints();
            }
            else {
                console.log("not logged in");
                history.push('/admin-login');
            }
        })
    }

    const loadSessions = () => {
        db.collection("sessions")
            .orderBy("date", "desc")
            .onSnapshot(function(querySnapshot) {
                let tempArray = [];
                querySnapshot.forEach(function(doc) {
                    let session = {};
                    session.id = doc.id;
                    session.sites = doc.data().sites;
                    session.countries = doc.data().countries;
                    session.time = doc.data().time;
                    session.rawdate = new Date(doc.data().date.toDate());
                    let date = new Date(doc.data().date.toDate());
                    session.date = ("0" + date.getDate()).slice(-2) + "." + ("0" + (date.getMonth() + 1)).slice(-2) + "." + date.getFullYear();
                    session.time = {
                        label: ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2),
                        value: ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2)
                    };
                    //session.date = ("0" + date.getDate()).slice(-2) + "." + ("0" + (date.getMonth() + 1)).slice(-2) + "." + date.getFullYear() + " " + ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2);
                    
                    tempArray.push(session);
                });
                setsessions(tempArray);
            });
    }

    const loadCountries = () => {
        db.collection("countries")
            .onSnapshot(function(querySnapshot) {
                let tempArray = [];
                querySnapshot.forEach(function(doc) {
                    let element = doc.data();
                    element.name = doc.id;
                    tempArray.push(element);
                });
                setcountryconfigs(tempArray);
            });
    }

    const loadComplaints = () => {
        db.collection("complaints")
            .onSnapshot(function(querySnapshot) {
                let tempArray = [];
                querySnapshot.forEach(function(doc) {
                    let element = doc.data();
                    element.id = doc.id;
                    let date = new Date(doc.data().date.toDate());
                    element.date = ("0" + date.getDate()).slice(-2) + "." + ("0" + (date.getMonth() + 1)).slice(-2) + "." + date.getFullYear() + " " + ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2);
                    tempArray.push(element);
                });
                setcomplaints(tempArray);
            });
    }

    const loadSeniorSeries = () => {
        db.collection("series")
            .where('site', '==', 'senior')
            .onSnapshot(function(querySnapshot) {
                let tempArray = [];
                querySnapshot.forEach(function(doc) {
                    let element = doc.data();
                    element.id = doc.id;
                    tempArray.push(element);
                });
                setquizzSeniorSeries(tempArray);
            });
    }

    const loadCoreSeries = () => {
        db.collection("series")
            .where('site', '==', 'core')
            .onSnapshot(function(querySnapshot) {
                let tempArray = [];
                querySnapshot.forEach(function(doc) {
                    let element = doc.data();
                    element.id = doc.id;
                    tempArray.push(element);
                });
                setquizzCoreSeries(tempArray);
            });
    }

    const loadRegions = () => {
        db.collection("regions")
            .onSnapshot(function(querySnapshot) {
                let tempArray = [];
                querySnapshot.forEach(function(doc) {
                    tempArray.push(doc.data());
                });
                setregions(tempArray);
                setinitialregions(tempArray);
            });
    }

    const loadUsers = () => {
        db.collection("users")
            .onSnapshot(function(querySnapshot) {
                let tempArray = [];
                querySnapshot.forEach(function(doc) {
                    tempArray.push(doc.data());
                });
                setinitialsubscribers(tempArray);
                setsubscribers(tempArray);
                setOptions(tempArray);
            });
    }

    const setOptions = (userArray) => {
        let optionsCountry = [];
        for (let i = 0; i < countryObjects.length; i++) {
            let countryCount = 0;
            for (let j = 0; j < userArray.length; j++) {
                if(userArray[j].country === countryObjects[i].key){
                    countryCount++;
                }
            }
            optionsCountry.push({
                label: countryObjects[i].label,
                y: countryCount
            });
        }

        let optionsSite = [];
        for (let i = 0; i < sites.length; i++) {
            let siteCount = 0;
            for (let j = 0; j < userArray.length; j++) {
                if(userArray[j].site === sites[i]){
                    siteCount++;
                }
            }
            optionsSite.push({
                label: sites[i],
                y: siteCount
            });
        }
        
        setsubscribersoptions({
            title: {
                text: "Inscris"
            },
            data: [
                {
                    // Change type to "doughnut", "line", "splineArea", etc.
                    type: "column",
                    dataPoints: optionsCountry.concat(optionsSite)
                }
            ]
        });
    }

    const filterSubscribers = () => {
        if(ageminfilter !== "" && agemaxfilter !== "" && parseInt(ageminfilter) < parseInt(agemaxfilter)){
            console.log('error');
        }
        else {
            let list = initialsubscribers;
            list = list.filter(function(item){
                console.log("session : " + item.session.id);
                return ((sessionfilter !== "") ? item.session.id === sessionfilter : true) && 
                ((genderfilter !== "") ? item.gender === genderfilter : true) && 
                ((sitefilter !== "") ? item.site === sitefilter : true) && 
                ((countryfilter !== "") ? item.country === countryfilter : true) && 
                ((ageminfilter !== "") ? (parseInt(item.age) >= parseInt(ageminfilter)) : true) && 
                ((agemaxfilter !== "") ? (parseInt(item.age) <= parseInt(agemaxfilter)) : true);
            });
            setsubscribers(list);
            setOptions(list);
        }
    }

    const showUpdateSessionForm = (session) => {
        setsessionform(true);
        console.log("showUpdateSessionForm");
        setupdatingsession(session);

        setquizzoptionschecked(session.sites);
        setcountryoptionschecked(session.countries);

        setstartdate(new Date(session.rawdate));
        setstarttime(session.time);

    }

    const cancelForm = () => {
        resetFields();
        setsessionform(false);
    }

    const checkSessionForm = (event) => {
        event.preventDefault();
        console.log("checkSessionForm");
        if(startdate !== "" && starttime !== null && quizzoptionschecked.length > 0 && countryoptionschecked.length > 0){
            console.log("checkSessionForm2");
            let tempDate = startdate;
            let tempTime = starttime.value;
            let id = ("0" + tempDate.getDate()).slice(-2) + ("0" + (tempDate.getMonth() + 1)).slice(-2) + tempDate.getFullYear() + tempTime.replace(":", "");
            console.log("id : " + id)
            db.collection('sessions').where('sessionid', '==', id).get().then((querySession) => {
                if(querySession.empty){
                    console.log("empty");
                    saveSession();
                }
                else {
                    if(updatingsession === null){
                        console.log("not empty");
                        document.getElementById('alert-session-exist').style.display = 'block';
                        setTimeout(() => {
                        document.getElementById('alert-session-exist').style.display = 'none';
                        }, 3000);
                    }
                    else {
                        saveSession();
                    }
                }
            }).catch(function (error) {
                console.log("Error getting document:", error);
            });
        }
        else {
            console.log("checkSessionForm3");
            if(startdate === ""){
                document.getElementById('alert-date-empty').style.display = 'block';
                setTimeout(() => {
                    document.getElementById('alert-date-empty').style.display = 'none';
                }, 3000);
            }
            if(starttime === null){
                document.getElementById('alert-times-empty').style.display = 'block';
                setTimeout(() => {
                    document.getElementById('alert-times-empty').style.display = 'none';
                }, 3000);
            }
            if(quizzoptionschecked.length === 0){
                document.getElementById('alert-quizz-empty').style.display = 'block';
                setTimeout(() => {
                    document.getElementById('alert-quizz-empty').style.display = 'none';
                }, 3000);
            }
            if(countryoptionschecked.length === 0){
                document.getElementById('alert-country-empty').style.display = 'block';
                setTimeout(() => {
                    document.getElementById('alert-country-empty').style.display = 'none';
                }, 3000);
            }
        }
    }

    const saveSession = () => {
        let timesplit = starttime.value.split(":");
        let tempDate = startdate;
        tempDate.setHours(parseInt(timesplit[0]));
        tempDate.setMinutes(parseInt(timesplit[1]));
        if(updatingsession == null){
            let id = ("0" + tempDate.getDate()).slice(-2) + ("0" + (tempDate.getMonth() + 1)).slice(-2) + tempDate.getFullYear() + ("0" + tempDate.getHours()).slice(-2) + ("0" + tempDate.getMinutes()).slice(-2);
            let dayId = ("0" + tempDate.getDate()).slice(-2) + ("0" + (tempDate.getMonth() + 1)).slice(-2) + tempDate.getFullYear();
            db.collection("sessions").add({
                date : tempDate,
                sites: quizzoptionschecked,
                countries: countryoptionschecked,
                sessionid: id,
                dayId,
                rooms: []
            })
            .then((querySnap) => {
                resetFields();
                setsessionform(false);
            }).catch(function (error) {
                console.log("Error adding session:", error);
            });
        }
        else {
            db.collection("sessions").doc(updatingsession.id).set({
                date : tempDate,
                sites: quizzoptionschecked,
                countries: countryoptionschecked
            })
            .then((querySnap) => {
                resetFields();
                setsessionform(false);
            }).catch(function (error) {
                console.log("Error updating session:", error);
            });
            
            setupdatingsession(null);
        }
    }

    const handleQuizzTypeChange = (event) => {
        let checkedArray = quizzoptionschecked;
        let selectedValue = event.target.value;
            
        if (event.target.checked === true) {
            checkedArray.push(selectedValue);
            setquizzoptionschecked(checkedArray);
        } else {
            let valueIndex = checkedArray.indexOf(selectedValue);
            checkedArray.splice(valueIndex, 1);
            setquizzoptionschecked(checkedArray)
        }
    }

    const handleregionQuizzChange = (event) => {
        let checkedArray = regionsQuizzOptionsChecked;
        let selectedValue = event.target.value;
            
        if (event.target.checked === true) {
            checkedArray.push(selectedValue);
            setregionsQuizzOptionsChecked(checkedArray);
        } else {
            let valueIndex = checkedArray.indexOf(selectedValue);
            checkedArray.splice(valueIndex, 1);
            setregionsQuizzOptionsChecked(checkedArray);
        }
    }

    const checkAllRegionsQuizzOptions = (list) => {
        let listTemp = [];
        for (let i = 0; i < list.length; i++) {
            listTemp.push(list[i].name);
        }
        setregionsQuizzOptionsChecked(listTemp);
    }

    const handleCountrySessionChange = (event) => {
        let checkedArray = countryoptionschecked;
        let selectedValue = event.target.value;
            
        if (event.target.checked === true) {
            checkedArray.push(selectedValue);
            setcountryoptionschecked(checkedArray);
        } else {
            let valueIndex = checkedArray.indexOf(selectedValue);
            checkedArray.splice(valueIndex, 1);
            setcountryoptionschecked(checkedArray);
        }
    }

    const resetFields = () => {
        setquizzoptionschecked([]);
        ['core', 'senior'].forEach(element => {
            document.getElementById(element).checked = false;
        });

        setcountryoptionschecked([]);
        countries.forEach(element => {
            document.getElementById('country-' + element).checked = false;
        });

        setstartdate(addDays(new Date(), 5));
        setupdatingsession(null);
    }

    const addDays = (date, days) =>  {
        const copy = new Date(Number(date));
        copy.setDate(date.getDate() + days);
        return copy;
    }

    const deleteSession = (id) =>  {
        db.collection("sessions").doc(id).delete().then(function() {
            console.log("Session successfully deleted!");
        }).catch(function(error) {
            console.error("Error removing document: ", error);
        });
    }

    const deleteCountry = (id) =>  {
        db.collection("countries").doc(id).delete().then(function() {
            console.log("Country successfully deleted!");
        }).catch(function(error) {
            console.error("Error removing document: ", error);
        });
    }

    const addUniqueElementToRegionsArray = (array) =>  {
        let contains = false;
        let sameRegion = null;
        for (let i = 0; i < array.length; i++) {
            const element = array[i];
            if(element.name === region){
                sameRegion = i;
                let ranges = element.ageRanges;
                for (let j = 0; j < ranges.length; j++) {
                    if(ranges[j].min === agemin && ranges[j].max === agemax){
                        contains = true;
                        return array;
                    }
                }
                break;
            }
        }
        if(!contains){
            if(sameRegion != null){
                array[sameRegion].ageRanges.push({
                    min: agemin,
                    max: agemax
                });
            }
            else {
                array.push({
                    name: region,
                    ageRanges: [
                        {
                            min: agemin,
                            max: agemax
                        }
                    ]
                })
            }
            return array;
        }
    }

    const submitCountryForm = () => {
        if(country !== "" && region !== "" && agemin !== "" && agemax !== "" && agemin < agemax){
            db.collection('countries').doc(country).get().then((doc) => {
                if (doc.exists) {
                    db.collection("countries").doc(country).set({
                        regions: addUniqueElementToRegionsArray(doc.data().regions)
                    })
                    .then((querySnap) => {
                        console.log('updated');
                        resetCountryForm();
                        
                    }).catch(function (error) {
                        console.log("Error updating session:", error);
                    });
                } else {
                    db.collection("countries").doc(country).set({
                        name : country,
                        regions: [
                            {
                                name: region,
                                ageRanges: [
                                    {
                                        min: agemin,
                                        max: agemax
                                    }
                                ]
                            }
                        ]
                    })
                    .then((querySnap) => {
                        console.log('created');
                        resetCountryForm();
                        
                    }).catch(function (error) {
                        console.log("Error updating session:", error);
                    });
                }
            }).catch(function (error) {
                console.log("Error getting document:", error);
            });
        }
        else {
            if(country === ""){
                document.getElementById('alert-country-required').style.display = 'block';
                setTimeout(() => {
                    document.getElementById('alert-country-required').style.display = 'none';
                }, 3000);
            }
            if(region === ""){
                document.getElementById('alert-region-required').style.display = 'block';
                setTimeout(() => {
                    document.getElementById('alert-region-required').style.display = 'none';
                }, 3000);
            }
            if(agemin === ""){
                document.getElementById('alert-age1-required').style.display = 'block';
                setTimeout(() => {
                    document.getElementById('alert-age1-required').style.display = 'none';
                }, 3000);
            }
            if(agemax === ""){
                document.getElementById('alert-age2-required').style.display = 'block';
                setTimeout(() => {
                    document.getElementById('alert-age2-required').style.display = 'none';
                }, 3000);
            }
            if(agemin !== "" && agemax !== "" && agemin >= agemax){
                document.getElementById('alert-ages-novalid').style.display = 'block';
                setTimeout(() => {
                    document.getElementById('alert-ages-novalid').style.display = 'none';
                }, 3000);
            }
        }
    }

    const resetCountryForm = () => {
        setcountry('');
        setregion('');
        setagemin('');
        setagemax('');
    }

    const cancelCountryForm = () => {
        resetCountryForm();
    }

    const getCountryLabelFromKey = (keyItem) => {
        for (let i = 0; i < countryObjects.length; i++) {
            if(countryObjects[i].key === keyItem){
                return countryObjects[i].label;
            }
        }
    }

    const handleCountryChange = (event) => {
        setcountry(event.target.value);
        showCountryRegions(event.target.value);
    }

    const handleCountryQuizzChange = (event) => {
        setcountryQuizz(event.target.value);

        // get country regions
        //regionsQuizz
        let allRegions = initialregions;
        let id = event.target.value;
        if(id !== ""){
            allRegions = allRegions.filter(function(item){
                return item.country === id;
            });
        }
        setregionsQuizz(allRegions)
    }

    const showCountryRegions = (id) => {
        let allRegions = initialregions;
        if(id !== ""){
            allRegions = allRegions.filter(function(item){
                return item.country === id;
            });
        }
        setregions(allRegions);
    }

    const deleteAgeRange = (countryId, regionId, ageMin, ageMax) => {
        db.collection('countries').doc(countryId).get().then((doc) => {
            let tempRegions = doc.data().regions;
            for (let i = 0; i < tempRegions.length; i++) {
                if(tempRegions[i].name === regionId){
                    let tempRanges = tempRegions[i].ageRanges;
                    let rangeFound = false;
                    for (let j = 0; j < tempRanges.length; j++) {
                        if(tempRanges[j].min === ageMin && tempRanges[j].max === ageMax){
                            rangeFound = true;
                            tempRanges.splice(j, 1);
                            break;
                        }
                    } 
                    if(rangeFound){
                        tempRegions[i].ageRanges = tempRanges;
                        break;
                    }
                }
            }
            db.collection("countries").doc(countryId).update({
                regions: tempRegions
            })
            .then(function() {
                console.log("Country range updated.");
            })
            .catch(function(error) {
                console.error("Error updating country ranges: ", error);
            });
        }).catch(function (error) {
            console.log("Error getting country:", error);
        });
    }

    const handleTimeChange = selectedOption => {
        setstarttime(selectedOption);
    };

    const addAgeQuizz = () => {
        if(ageQuizzMin !== "" && ageQuizzMax !== ""){
            let list = agesQuizzSelected;
            let found = false;
            for (let i = 0; i < list.length; i++) {
                if(list[i].min === ageQuizzMin && list[i].max === ageQuizzMax){
                    found = true;
                    break;
                }
            }
            if(!found){
                setagesQuizzSelected([...agesQuizzSelected, {
                    min: ageQuizzMin,
                    max: ageQuizzMax
                }]);
                setageQuizzMin("");
                setageQuizzMax("");
            }
        }
        else {
            if(ageQuizzMin === ""){
                document.getElementById('alert-agequizzmin-empty').style.display = 'block';
                setTimeout(() => {
                    document.getElementById('alert-agequizzmin-empty').style.display = 'none';
                }, 3000);
            }
            if(ageQuizzMax === ""){
                document.getElementById('alert-agequizzmax-empty').style.display = 'block';
                setTimeout(() => {
                    document.getElementById('alert-agequizzmax-empty').style.display = 'none';
                }, 3000);
            }
        }
    };

    const addQuizzAnswer = () => {
        if(quizzAnswerItem !== ""){
            let answers = quizzAnswers;
            let found = false;
            for (let i = 0; i < answers.length; i++) {
                if(answers[i].label === quizzAnswerItem){
                    found = true;
                    break;
                }
            }
            if(!found){
                // add answer to list
                setquizzAnswers([...quizzAnswers, {
                    label: quizzAnswerItem,
                    value: answers.length > 0 ? answers[answers.length - 1].value + 1 : 1
                }]);
                setquizzAnswerItem("");
            }
        }
        else {
            let suffix = "";
            if(key === "quizz-core"){
                suffix = "-core"
            }
            document.getElementById('alert-answer'+ suffix +'-empty').style.display = 'block';
            setTimeout(() => {
            document.getElementById('alert-answer'+ suffix +'-empty').style.display = 'none';
            }, 3000);
        }
    }

    function makeid(length) {
        var result           = '';
        var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for ( var i = 0; i < length; i++ ) {
           result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

    const executeAddQuizzQuestion = (question) => {
        // id
        let tempRounds;
        if(isFinale){
            tempRounds = quizzFinaleRounds;
        }
        else {
            tempRounds = quizzRounds;
        }

        let foundRound = false;
        for (let i = 0; i < tempRounds.length; i++) {
            if(parseInt(quizzActiveRoundItem) === i){
                foundRound = true;
                if(tempRounds[i].questions){
                    if(tempRounds[i].questions.length > 0){
                        let id = tempRounds[i].questions[tempRounds[i].questions.length - 1].id + 1;
                        question.id = id;
                        tempRounds[i].questions.push(question);
                    }
                    else {
                        question.id = 1;
                        tempRounds[i].questions = [
                            question
                        ];
                    }
                }
                else {
                    question.id = 1;
                    tempRounds[i].questions = [
                        question
                    ];
                }
                break;
            }
        }

        if(!foundRound){
            let idRound = tempRounds.length + 1;
            question.id = 1;
            tempRounds.push({
                id: idRound,
                theme: question.theme,
                questions: [
                    question
                ]
            })
        }

        if(isFinale){
            setquizzFinaleRounds(tempRounds);
        }
        else {
            setquizzRounds(tempRounds);
        }
        resetQuizzQuestionForm();
    }

    const addQuizzQuestion = (type) => {
        let suffix = "";
        if(key === "quizz-core"){
            suffix = "-core"
        }
        if(type === "senior"){
            if(quizzStatement !== "" && 
            quizzExplanation !== "" && 
            quizzPoints !== "" && 
            quizzIllustration !== "" && 
            quizzCorrectAnswer !== "" && 
            quizzTheme !== "" && 
            quizzAnswers.length > 1
            ) {
                let question = {
                    statement: quizzStatement,
                    explanation: quizzExplanation,
                    points: quizzPoints,
                    illustration: quizzIllustration,
                    correctAnswer: quizzCorrectAnswer,
                    theme: quizzTheme,
                    answers: quizzAnswers,
                    type: "quizz",
                    uniqueId: makeid(10)
                }
                executeAddQuizzQuestion(question);
            }
            else {
                if(quizzIllustration === ""){
                    document.getElementById('alert-illustration'+ suffix +'-empty').style.display = 'block';
                    setTimeout(() => {
                    document.getElementById('alert-illustration'+ suffix +'-empty').style.display = 'none';
                    }, 3000);
                }
            }   
        }
        else {
            if(quizzStatement !== "" && 
            quizzExplanation !== "" && 
            quizzPoints !== "" && 
            quizzFilename !== "" && 
            quizzCorrectAnswer !== "" && 
            quizzTheme !== "" && 
            quizzAnswers.length > 1
            ) {
                let question = {
                    statement: quizzStatement,
                    explanation: quizzExplanation,
                    points: quizzPoints,
                    fileName: quizzFilename,
                    correctAnswer: quizzCorrectAnswer,
                    theme: quizzTheme,
                    answers: quizzAnswers,
                    type: "blind",
                    uniqueId: makeid(10)
                }
                executeAddQuizzQuestion(question);
            }
            else {
                if(quizzFilename === ""){
                    document.getElementById('alert-filename'+ suffix +'-empty').style.display = 'block';
                    setTimeout(() => {
                    document.getElementById('alert-filename'+ suffix +'-empty').style.display = 'none';
                    }, 3000);
                }
            } 
        }
        if(quizzStatement === ""){
            document.getElementById('alert-statement'+ suffix +'-empty').style.display = 'block';
            setTimeout(() => {
            document.getElementById('alert-statement'+ suffix +'-empty').style.display = 'none';
            }, 3000);
        }
        if(quizzExplanation === ""){
            document.getElementById('alert-explanation'+ suffix +'-empty').style.display = 'block';
            setTimeout(() => {
            document.getElementById('alert-explanation'+ suffix +'-empty').style.display = 'none';
            }, 3000);
        }
        if(quizzPoints === ""){
            document.getElementById('alert-points'+ suffix +'-empty').style.display = 'block';
            setTimeout(() => {
            document.getElementById('alert-points'+ suffix +'-empty').style.display = 'none';
            }, 3000);
        }
        if(quizzCorrectAnswer === ""){
            document.getElementById('alert-correctanswer'+ suffix +'-empty').style.display = 'block';
            setTimeout(() => {
            document.getElementById('alert-correctanswer'+ suffix +'-empty').style.display = 'none';
            }, 3000);
        }
        if(quizzAnswers.length < 2){
            document.getElementById('alert-answers'+ suffix +'-notvalid').style.display = 'block';
            setTimeout(() => {
            document.getElementById('alert-answers'+ suffix +'-notvalid').style.display = 'none';
            }, 3000);
        }
        if(quizzTheme === ""){
            document.getElementById('alert-theme'+ suffix +'-empty').style.display = 'block';
            setTimeout(() => {
            document.getElementById('alert-theme'+ suffix +'-empty').style.display = 'none';
            }, 3000);
        }
    }

    const checkQuizzForm = (event, type) => {
        event.preventDefault();
        console.log("type : " + type);
        if(
        countryQuizz !== "" && 
        quizzSession !== "" && 
        agesQuizzSelected.length > 0 && 
        regionsQuizzOptionsChecked.length > 0 && 
        quizzRounds.length > 0
        ){
            db.collection('series').add({
                ageRanges: agesQuizzSelected,
                country: countryQuizz,
                session: quizzSession,
                regions: regionsQuizzOptionsChecked,
                site: type,
                rounds: quizzRounds
            })
            .then(() => {
                console.log("serie added");
                resetQuizzSerieForm();
            }).catch(function (error) {
                console.log("Error adding serie:", error);
            });
        }
        else {
            let suffix = "";
            if(key === "quizz-core"){
                suffix = "-core"
            }
            if(countryQuizz === ""){
                document.getElementById('alert-countryquizz'+ suffix +'-empty').style.display = 'block';
                setTimeout(() => {
                    document.getElementById('alert-countryquizz'+ suffix +'-empty').style.display = 'none';
                }, 3000);
            }
            if(quizzSession === ""){
                document.getElementById('alert-sessionquizz'+ suffix +'-empty').style.display = 'block';
                setTimeout(() => {
                    document.getElementById('alert-sessionquizz'+ suffix +'-empty').style.display = 'none';
                }, 3000);
            }
            if(agesQuizzSelected.length < 1){
                document.getElementById('alert-agerangesquizz'+ suffix +'-empty').style.display = 'block';
                setTimeout(() => {
                    document.getElementById('alert-agerangesquizz'+ suffix +'-empty').style.display = 'none';
                }, 3000);
            }
            if(regionsQuizzOptionsChecked.length < 1){
                document.getElementById('alert-regionsquizz'+ suffix +'-empty').style.display = 'block';
                setTimeout(() => {
                    document.getElementById('alert-regionsquizz'+ suffix +'-empty').style.display = 'none';
                }, 3000);
            }
            if(quizzRounds.length < 1){
                document.getElementById('alert-roundsquizz'+ suffix +'-empty').style.display = 'block';
                setTimeout(() => {
                    document.getElementById('alert-roundsquizz'+ suffix +'-empty').style.display = 'none';
                }, 3000);
            }
        }
    }

    const resetQuizzQuestionForm = () => {
        setquizzStatement("");
        setquizzExplanation("");
        setquizzPoints(30);
        setquizzFilename("");
        setquizzIllustration("");
        setquizzAnswers([]);
        setquizzCorrectAnswer("");
        setquizzTheme("");
        setquizzActiveRoundItem("0");
        setisFinale(false);
    }

    const resetQuizzSerieForm = () => {
        setquizzSession("");
        setcountryQuizz("");
        setregionsQuizz([]);
        setregionsQuizzOptionsChecked([]);
        setagesQuizzSelected([]);
        setquizzRounds([]);
        setquizzStatement("");
        setquizzExplanation("");
        setquizzPoints(30);
        setquizzFilename("");
        setquizzIllustration("");
        setquizzAnswers([]);
        setquizzCorrectAnswer("");
        setquizzTheme("");
        setquizzActiveRoundItem("0");
        setisFinale(false);
    }

    const deleteQuizzAgeRange = (min, max) => {
        let ageRangesTemp = agesQuizzSelected;
        let newAgeRangesTemp = [];
        for (let i = 0; i < ageRangesTemp.length; i++) {
            if(ageRangesTemp[i].min !== min || ageRangesTemp[i].max !== max){
                newAgeRangesTemp.push(ageRangesTemp[i]);
            }
        }
        setagesQuizzSelected(newAgeRangesTemp);
    }
    
    const deleteQuizzAnswer = (key) => {
        let answersTemp = quizzAnswers;
        let newAnswersTemp = [];
        for (let i = 0; i < answersTemp.length; i++) {
            if(answersTemp[i].value !== key){
                newAnswersTemp.push(answersTemp[i]);
            }
        }
        if(quizzCorrectAnswer === key.toString()){
            setquizzCorrectAnswer("");
        }
        setquizzAnswers(newAnswersTemp);
        
    }

    const deleteQuizzQuestion = (isMainRound, roundIndex, questionUniqueId) => {
        console.log("isMainRound : " + isMainRound);
        console.log("roundIndex : " + roundIndex);
        console.log("questionUniqueId : " + questionUniqueId);
        let tempRounds;
        if(!isMainRound){
            tempRounds = quizzFinaleRounds;
        }
        else {
            tempRounds = quizzRounds;
        }
        console.log("old tempRounds");
        console.log(tempRounds);

        for (let i = 0; i < tempRounds.length; i++) {
            if(i === roundIndex){
                let questionsTemp = tempRounds[i].questions;
                for (let j = 0; j < questionsTemp.length; j++) {
                    if(questionsTemp[j].uniqueId === questionUniqueId){
                        tempRounds[i].questions.splice(j, 1);
                        console.log("new tempRounds");
                        console.log(tempRounds[i].questions);
                        if(!isMainRound){
                            setquizzFinaleRounds(tempRounds);
                        }
                        else {
                            setquizzRounds(tempRounds);
                        }
                        break;
                    }
                }
                
            }
        }
    }

    const deleteQuizzSerie = (id) => {
        db.collection("series").doc(id).delete().then(function() {
            console.log("Serie successfully deleted!");
        }).catch(function(error) {
            console.error("Error removing document: ", error);
        });
    }

    // ------------------- file CORE -------------------------
    const handleOpenDialogCore = (e) => {
        // Note that the ref is set async, so it might be null at some point 
        if (buttonRefCore.current) {
            buttonRefCore.current.open(e)
        }
    }

    const handleOnFileLoadCore = (data) => {
        console.log('-------------handleOnFileLoadCore--------------');
        console.log(data);
        console.log('---------------------------');
        let tempMainRounds = quizzRounds;
        let tempFinaleRounds = quizzFinaleRounds;
        for (let i = 1; i < data.length - 1; i++) {
            // main round
            if(data[i].data[0] === "0"){
                if(typeof tempMainRounds[parseInt(data[i].data[1]) - 1] === 'undefined'){
                    tempMainRounds.push({
                        id: data[i].data[1],
                        theme: data[i].data[2] + " - " + data[i].data[4],
                        questions: [
                            getQuestionToAddCore(1, data[i])
                        ]
                    })
                }
                else {
                    tempMainRounds[parseInt(data[i].data[1]) - 1].questions.push(getQuestionToAddCore(parseInt(tempMainRounds[parseInt(data[i].data[1]) - 1].questions.length) + 1, data[i]));
                }
            }
            // finale round
            else {
                if(typeof tempFinaleRounds[parseInt(data[i].data[1]) - 1] === 'undefined'){
                    tempFinaleRounds.push({
                        id: data[i].data[1],
                        theme: data[i].data[2] + " - " + data[i].data[4],
                        questions: [
                            getQuestionToAddCore(1, data[i])
                        ]
                    })
                }
                else {
                    tempFinaleRounds[parseInt(data[i].data[1]) - 1].questions.push(getQuestionToAddCore(parseInt(tempFinaleRounds[parseInt(data[i].data[1]) - 1].questions.length) + 1, data[i]));
                }
            }
        }
        setquizzFinaleRounds(tempFinaleRounds);
        setquizzRounds(tempMainRounds);
      }
    
    const handleOnErrorCore = (err, file, inputElem, reason) => {
        console.log(err)
    }
    
    const handleOnRemoveFileCore = (data) => {
        console.log('---------------------------')
        console.log(data)
        console.log('---------------------------')
    }
    
    const handleRemoveFileCore = (e) => {
        // Note that the ref is set async, so it might be null at some point
        if (buttonRefCore.current) {
          buttonRefCore.current.removeFile(e)
        }
    }

    // ------------------- file SENIOR -------------------------
    const handleOpenDialogSenior = (e) => {
        // Note that the ref is set async, so it might be null at some point 
        if (buttonRefSenior.current) {
          buttonRefSenior.current.open(e)
        }
    }

    const handleOnFileLoadSenior = (data) => {
        console.log('------------handleOnFileLoadSenior---------------')
        console.log(data)
        console.log('---------------------------');
        let tempMainRounds = quizzRounds;
        let tempFinaleRounds = quizzFinaleRounds;
        for (let i = 1; i < data.length - 1; i++) {
            // main round
            if(data[i].data[0] === "0"){
                if(typeof tempMainRounds[parseInt(data[i].data[1]) - 1] === 'undefined'){
                    tempMainRounds.push({
                        id: data[i].data[1],
                        //theme: data[i].data[2] + " - " + data[i].data[4],
                        theme: data[i].data[4],
                        questions: [
                            getQuestionToAdd(1, data[i])
                        ]
                    })
                }
                else {
                    tempMainRounds[parseInt(data[i].data[1]) - 1].questions.push(getQuestionToAdd(parseInt(tempMainRounds[parseInt(data[i].data[1]) - 1].questions.length) + 1, data[i]));
                }
            }
            else {
                if(typeof tempFinaleRounds[parseInt(data[i].data[1]) - 1] === 'undefined'){
                    tempFinaleRounds.push({
                        id: data[i].data[1],
                        theme: data[i].data[2] + " - " + data[i].data[4],
                        questions: [
                            getQuestionToAdd(1, data[i])
                        ]
                    })
                }
                else {
                    tempFinaleRounds[parseInt(data[i].data[1]) - 1].questions.push(getQuestionToAdd(parseInt(tempFinaleRounds[parseInt(data[i].data[1]) - 1].questions.length) + 1, data[i]));
                }
            }
        }
        setquizzFinaleRounds(tempFinaleRounds);
        setquizzRounds(tempMainRounds);
    }

    const getQuestionToAdd = (id, data) => {
        let tmpAnswers = data.data[8].split("|");
        let answers = [];
        for (let i = 0; i < tmpAnswers.length; i++) {
            answers.push({
                label: tmpAnswers[i],
                value: i + 1
            });
        }
        return {
            id,
            statement: data.data[7],
            explanation: data.data[10],
            points: parseInt(data.data[6]),
            illustration: data.data[11],
            correctAnswer: data.data[9],
            theme: data.data[4],
            answers,
            type: "quizz",
            uniqueId: makeid(10)
        }
    }

    const getQuestionToAddCore = (id, data) => {
        let answers = data.data[8].split("|");
        let results = [];
        for (let i = 0; i < answers.length; i++) {
            results.push({
                label: answers[i],
                value: i + 1
            })
            
        }
        return {
            id,
            statement: data.data[7],
            explanation: data.data[10],
            points: parseInt(data.data[6]),
            fileName: data.data[11],
            correctAnswer: data.data[9],
            theme: data.data[2] + " - " + data.data[4],
            answers: results,
            type: "blind",
            uniqueId: makeid(10)
        }
    }
    
    const handleOnErrorSenior = (err, file, inputElem, reason) => {
        console.log(err)
    }
    
    const handleOnRemoveFileSenior = (data) => {
        console.log('---------------------------')
        console.log(data)
        console.log('---------------------------')
    }
    
    const handleRemoveFileSenior = (e) => {
        // Note that the ref is set async, so it might be null at some point
        if (buttonRefSenior.current) {
          buttonRefSenior.current.removeFile(e)
        }
    }

    // -------------------- begin questions senior ----------------------------
    const handleOpenDialogQuestionsSenior = (e) => {
        // Note that the ref is set async, so it might be null at some point 
        if (buttonQuestionsSenior.current) {
            buttonQuestionsSenior.current.open(e)
        }
    }

    const handleOnFileLoadQuestionsSenior = (data) => {
        console.log('------------handleOnFileLoadQuestionsSenior---------------')
        console.log(data)
        console.log('---------------------------');
        for (let i = 1; i < data.length - 1; i++) {
            let answers = data[i].data[6].split("|");
            let results = [];
            for (let i = 0; i < answers.length; i++) {
                results.push({
                    label: answers[i],
                    value: i + 1
                })
            }
            db.collection("questionsSenior").add({
                statement: data[i].data[5],
                explanation: data[i].data[8],
                points: parseInt(data[i].data[4]),
                illustration: data[i].data[9],
                correctAnswer: data[i].data[7],
                theme: data[i].data[0] + " - " + data[i].data[2],
                answers: results,
                type: "quizz",
                country: "fr",
                uniqueId: makeid(10)
            })
            .then(() => {
                console.log("Done question senior add")
            }).catch(function (error) {
                console.log("Error adding question senior:", error);
            });
        }
    }
    
    const handleOnErrorQuestionsSenior = (err, file, inputElem, reason) => {
        console.log(err)
    }
    
    const handleOnRemoveFileQuestionsSenior = (data) => {
        console.log('---------------------------')
        console.log(data)
        console.log('---------------------------')
    }
    
    const handleRemoveFileQuestionsSenior = (e) => {
        // Note that the ref is set async, so it might be null at some point
        if (buttonQuestionsSenior.current) {
            buttonQuestionsSenior.current.removeFile(e)
        }
    }

    // -------------------- end questions senior ----------------------------

    const initAll = () => {
        db.collection('users').get()
        .then((queryUser) => {
            let idList = [];
            queryUser.forEach(function(doc) {
                idList.push(doc.id);
            });
            var newUserRef;
            var batch = db.batch();
            for (let i = 0; i < idList.length; i++) {
                newUserRef = db.collection("users").doc(idList[i]);
                batch.update(newUserRef, {
                    room: firebase.firestore.FieldValue.delete(),
                    team: firebase.firestore.FieldValue.delete()
                });
            }
            batch.commit();
            console.log("Done init users");

            db.collection("teams")
            .get()
            .then(res => {
                res.forEach(element => {
                    element.ref.delete();
                });
                console.log("Done inin team");
            });

            db.collection("rooms")
            .get()
            .then(res => {
                res.forEach(element => {
                    element.ref.delete();
                });
                console.log("Done inin room");
            });

            db.collection("sessions")
            .get()
            .then(res => {
                let idListSessions = [];
                res.forEach(function(doc) {
                    idListSessions.push(doc.id);
                });

                var newSessionRef;
                batch = db.batch();
                for (let i = 0; i < idListSessions.length; i++) {
                    newSessionRef = db.collection("sessions").doc(idListSessions[i]);
                    batch.update(newSessionRef, {
                        rooms: []
                    });
                }
                batch.commit();
                console.log("Done init sessions");
            });

        }).catch(function (error) {
            console.log("Error getting document:", error);
        });
    }

    const deleteAllUser = () => {
        db.collection("users")
        .get()
        .then(res => {
            res.forEach(element => {
                element.ref.delete();
            });
            console.log("Done delete all users");
            // https://us-central1-jeumeetic.cloudfunctions.net/deleteAllUsers
            axios.get(Settings.FIREBASE_FUNCTIONS_URL + "deleteAllUsers").then((res) => {
                console.log("Done clearing all user accounts");
                console.log(res);
            }).
            catch(error => console.log(error));

            
        });
    }

    const daySessions = () => {
        let tempDate = new Date("2020-10-20T15:00:00");
        while(tempDate < new Date("2020-10-20T19:05:00")){
            let id = ("0" + tempDate.getDate()).slice(-2) + ("0" + (tempDate.getMonth() + 1)).slice(-2) + tempDate.getFullYear() + ("0" + tempDate.getHours()).slice(-2) + ("0" + tempDate.getMinutes()).slice(-2);
            let dayId = ("0" + tempDate.getDate()).slice(-2) + ("0" + (tempDate.getMonth() + 1)).slice(-2) + tempDate.getFullYear();
            db.collection("sessions").add({
                date : tempDate,
                sites: ["senior"],
                countries: ["fr"],
                sessionid: id,
                dayId,
                rooms: []
            })
            .then((querySnap) => {
                console.log("Done sesssion add");

            }).catch(function (error) {
                console.log("Error adding session:", error);
            });
            tempDate.setMinutes(tempDate.getMinutes() + 20);
        }
    }

    const addSeries = () => {
        let exclude = ["l5dNnxc3sTlt975A6jOo"];
        db.collection("series")
            .doc("Yw3B7UlP7AasswCEODNk")
            .get()
            .then(function(doc) {
                db.collection("sessions")
                .get()
                .then(function(querySnapshot) {
                    querySnapshot.forEach(function(docSession) {
                        if(exclude.indexOf(docSession.id) === -1){
                            let serie = doc.data();
                            serie.session = docSession.id;
                            db.collection('series').add(serie)
                            .then(() => {
                                console.log("serie added");
                            }).catch(function (error) {
                                console.log("Error adding serie:", error);
                            });
                        }
                    });
                });
            });
        
    }

    const addSeniorSessions = () => {
        let tmpCountry = "fr";
        db.collection("questionsSenior")
        .where("type", "==", "quizz")
        .where("country", "==", tmpCountry)
        .get()
        .then(res => {
            let allQuestions = []
            res.forEach(doc => {
                allQuestions.push(doc.data());
            });
            console.log("allQuestions");
            console.log(allQuestions);

            let tempDate = new Date("2020-11-07T10:00:00");
            while(tempDate < new Date("2020-11-07T13:00:00")){
                let id = ("0" + tempDate.getDate()).slice(-2) + ("0" + (tempDate.getMonth() + 1)).slice(-2) + tempDate.getFullYear() + ("0" + tempDate.getHours()).slice(-2) + ("0" + tempDate.getMinutes()).slice(-2);
                let dayId = ("0" + tempDate.getDate()).slice(-2) + ("0" + (tempDate.getMonth() + 1)).slice(-2) + tempDate.getFullYear();
                db.collection("sessions").add({
                    date : tempDate,
                    sites: ["senior"],
                    countries: [tmpCountry],
                    sessionid: id,
                    dayId,
                    rooms: []
                })
                .then(docRef => {
                    console.log("Done session senior add");
                    let tmpRounds = [];
                    let pickedQuestions = [];
                    for (let i = 0; i < 3; i++) {
                        let tmpQuestions = [];
                        let count = 1;
                        for (let i = 0; i < 15; i++) {
                            let question = {};
                            do {
                                question = allQuestions[Math.floor(Math.random() * allQuestions.length)];
                            } while (pickedQuestions.indexOf(question.uniqueId) !== -1);

                            pickedQuestions.push(question.uniqueId);
                            question.id = count;
                            console.log("c : " + count);
                            console.log("id : " + question.id);
                            tmpQuestions.push(question);
                            count++;
                        }
                        tmpRounds.push({
                            id: i + 1,
                            theme: "",
                            questions: tmpQuestions
                        });
                    }
                    db.collection('series').add({
                        country: tmpCountry,
                        site: "senior",
                        session: docRef.id,
                        rounds: tmpRounds
                    })
                    .then(() => {
                        console.log("serie senior added");
                    }).catch(function (error) {
                        console.log("Error adding serie senior:", error);
                    });
                    
                }).catch(function (error) {
                    console.log("Error adding session senior:", error);
                });
                tempDate.setMinutes(tempDate.getMinutes() + 5);
            }
        });
    }

    const deleteSessionsSeries = () => {
        db.collection("sessions")
        .get()
        .then(res => {
            res.forEach(element => {
                element.ref.delete();
            });
            console.log("Done delete all sessions");
            db.collection("series")
                .get()
                .then(res => {
                    res.forEach(element => {
                        element.ref.delete();
                    });
                    console.log("Done delete all series");
                });
        });
        
    }

    const deleteSurveys = () => {
        db.collection("survey")
        .get()
        .then(res => {
            res.forEach(element => {
                element.ref.delete();
            });
            console.log("Done delete all surveys");
        });
        
    }

    const deleteQuestions = () => {
        db.collection("questionsSenior")
        .get()
        .then(res => {
            res.forEach(element => {
                element.ref.delete();
            });
            console.log("Done delete all questions");
        });
        
    }

    const deleteUserStatus = () => {
        db.collection("status")
        .get()
        .then(res => {
            res.forEach(element => {
                element.ref.delete();
            });
            console.log("User status deleted");
        });
        
    }

    return (
        <Tabs
            id="controlled-tab-example"
            activeKey={key}
            onSelect={(k) => {
                resetQuizzSerieForm();
                setkey(k);
            }}>
            <Tab eventKey="session" title="Programmation des sessions de jeu">
                {
                    sessionform === false ? <Button variant="secondary" onClick={() => setsessionform(true)}>Créer une session de jeu</Button> : ''
                }
                
                {
                    sessions.length > 0 ? 
                    <Table responsive>
                        <thead>
                            <tr>
                                <th>Id</th>
                                <th>Date</th>
                                <th>Heure</th>
                                <th>Sites</th>
                                <th>Pays</th>
                                <th>&nbsp;</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                sessions.map((session) => (
                                    <tr key={session.id}>
                                        <td>{session.id}</td>
                                        <td>{session.date}</td>
                                        <td><Badge variant="warning" key={session.time.value}>{session.time.value}</Badge></td>
                                        <td>
                                            {
                                                session.sites.map((site) => (
                                                    <Badge variant="secondary" key={site}>{site}</Badge>
                                                ))
                                            }
                                        </td>
                                        <td>
                                            {
                                                session.countries.map((country) => (
                                                    <Badge variant="secondary" key={country}>{country}</Badge>
                                                ))
                                            }
                                        </td>
                                        <td>
                                            <Button variant="primary" onClick={() => showUpdateSessionForm(session)}>Modifier</Button>
                                            <Button variant="warning" onClick={() => deleteSession(session.id)}>Supprimer</Button>
                                        </td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </Table>
                    : ''
                }

                {
                    sessionform === true ? 
                        (<form className="form-session" id="session-form" onSubmit={checkSessionForm}>
                            <DatePicker
                                selected={startdate}
                                onChange={date => setstartdate(date)}
                                dateFormat="dd.MM.yyyy"
                                minDate={addDays(new Date(), 5)}
                            />
                            <Select
                                defaultValue={starttime}
                                onChange={handleTimeChange}
                                options={timeoptions}
                                className="basic-multi-select"
                                classNamePrefix="select"
                            />
                            
                            <div className="alert" id="alert-date-empty">
                              <p>Date de session obligatoire</p>
                            </div>
                            <div className="alert" id="alert-times-empty">
                              <p>Heures de session obligatoire</p>
                            </div>
                            <div className="alert" id="alert-session-exist">
                                <p>Cette session existe déjà</p>
                            </div>
                            <div className="form-group contentRadio">
                                <div className="custom-control custom-checkbox">
                                    <input type="checkbox" className="custom-control-input" id="senior" value="senior" onChange={event => handleQuizzTypeChange(event)}/>
                                    <label className="custom-control-label" htmlFor="senior">Quizz Senior</label>
                                </div>
                                <div className="custom-control custom-checkbox">
                                    <input type="checkbox" className="custom-control-input" id="core" value="core" onChange={event => handleQuizzTypeChange(event)} />
                                    <label className="custom-control-label" htmlFor="core">Quizz Core</label>
                                </div>
                                <Button variant="primary" onClick={() => {
                                    setquizzoptionschecked(['core', 'senior']);
                                    ['core', 'senior'].forEach(element => {
                                        document.getElementById(element).checked = true;
                                    });
                                }}>Séléctionner tout</Button>
                                <div className="alert" id="alert-quizz-empty">
                                  <p>Vous devez séléctionner au moins un site</p>
                                </div>
                            </div>
                            <div className="country-group">
                                <div className="country">
                                    {
                                        countries.map((country) => (
                                            <div className="custom-control custom-checkbox" key={country}>
                                                <input type="checkbox" className="custom-control-input" id={'country-' + country} value={country} onChange={event => handleCountrySessionChange(event)} />
                                                <label className="custom-control-label" htmlFor={'country-' + country}>{country}</label>
                                            </div>
                                        ))
                                    }
                                    
                                </div>
                                <Button variant="primary" onClick={() => {
                                    setcountryoptionschecked(countries);
                                    countries.forEach(element => {
                                        document.getElementById('country-' + element).checked = true;
                                    });
                                }}>Séléctionner tout</Button>
                                <div className="alert" id="alert-country-empty">
                                  <p>Vous devez séléctionner au moins un pays</p>
                                </div>
                            </div>
                            <Button variant="primary" type="submit">Valider</Button>
                            <Button variant="danger" onClick={cancelForm}>Annuler</Button>
                        </form>)
                    : ''
                }
            </Tab>
            <Tab eventKey="quizz-senior" title="Quizz Senior">
                <div className="quizz-senior-list">
                    <Table responsive>
                        <thead>
                            <tr>
                                <th>Id</th>
                                <th>Session</th>
                                <th>Pays</th>
                                <th>&nbsp;</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                quizzSeniorSeries ? 
                                quizzSeniorSeries.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.id}</td>
                                        <td>{item.session}</td>
                                        <td>{getCountryLabelFromKey(item.country)}</td>
                                        <td>
                                            <Button variant="danger" onClick={() => deleteQuizzSerie(item.id)} >Supprimer série</Button>
                                        </td>
                                    </tr>
                                ))
                                : ''
                            }
                        </tbody>
                    </Table>
                </div>
                <form className="form-quizz-senior" onSubmit={event => checkQuizzForm(event, "senior")} >
                    <div className="form-group">
                        <select value={quizzSession} onChange={event => setquizzSession(event.target.value)}>
                            <option value="" disabled>Session</option>
                            {
                                sessions.map((session) => (
                                    <option key={session.id} value={session.id}>{session.date} {session.time.value}</option>
                                ))
                            }
                        </select>
                        <div className="alert" id="alert-sessionquizz-core-empty">
                            <p>Session requis</p>
                        </div>
                    </div>
                    <div className="form-group">
                        <select value={countryQuizz} onChange={handleCountryQuizzChange}>
                            <option value="" disabled>Pays</option>
                            {
                                countryObjects.map((item) => (
                                    <option key={item.key} value={item.key}>{item.label}</option>
                                ))
                            }
                        </select>
                        <div className="alert" id="alert-countryquizz-core-empty">
                            <p>Pays requis</p>
                        </div>
                    </div>
                    <div className="form-group">
                            <div className="country">
                                {
                                    regionsQuizz.map((regionItem) => (
                                        <div className="custom-control custom-checkbox" key={"quizz-" + regionItem.name}>
                                            <input type="checkbox" className="custom-control-input" id={'region-senior-' + regionItem.name.replace(/\s+/g, '-').toLowerCase()} value={regionItem.name} onChange={event => handleregionQuizzChange(event)} />
                                            <label className="custom-control-label" htmlFor={'region-senior-' + regionItem.name.replace(/\s+/g, '-').toLowerCase()}>{regionItem.name}</label>
                                        </div>
                                    ))
                                }
                            </div>
                            <Button variant="primary" onClick={() => {
                                checkAllRegionsQuizzOptions(regionsQuizz);
                                regionsQuizz.forEach(element => {
                                    document.getElementById('region-senior-' + element.name.replace(/\s+/g, '-').toLowerCase()).checked = true;
                                });
                            }}>Séléctionner tout</Button>
                            <div className="alert" id="alert-regionsquizz-core-empty">
                                <p>Vous devez séléctionner au moins une région</p>
                            </div>
                    </div>
                    <div className="form-group">
                        <div className="age-quizz-list">
                            {
                                agesQuizzSelected.map((item) => (
                                    <div className="age-item">
                                        <span>{item.min}</span> à <span>{item.max}</span> ans <Button variant="danger" onClick={() => deleteQuizzAgeRange(item.min, item.max)} >Supprimer tranche d'age</Button>
                                    </div>
                                ))
                            }
                        </div>
                        <div className="alert" id="alert-agerangesquizz-core-empty">
                            <p>Tranche d'age requis</p>
                        </div>
                        <div className="age-range">
                            <span>de </span>
                            <input type="number" min="18" value={ageQuizzMin} onChange={event => setageQuizzMin(event.target.value)}/>
                            <span> à </span>
                            <input type="number" value={ageQuizzMax} onChange={event => setageQuizzMax(event.target.value)}/>
                            <Button variant="primary" onClick={addAgeQuizz} >Ajouter</Button>
                        </div>
                        <div className="alert" id="alert-agequizzmin-core-empty">
                            <p>Age min requis</p>
                        </div>
                        <div className="alert" id="alert-agequizzmax-core-empty">
                            <p>Age max requis</p>
                        </div>
                    </div>
                    <CSVReader
                        ref={buttonRefSenior}
                        onFileLoad={handleOnFileLoadSenior}
                        onError={handleOnErrorSenior}
                        noClick
                        noDrag
                        onRemoveFile={handleOnRemoveFileSenior}
                    >
                        {({ file }) => (
                        <aside
                            style={{
                            display: 'flex',
                            flexDirection: 'row',
                            marginBottom: 10
                            }}
                        >
                            <button
                            type='button'
                            onClick={handleOpenDialogSenior}
                            style={{
                                borderRadius: 0,
                                marginLeft: 0,
                                marginRight: 0,
                                width: '40%',
                                paddingLeft: 0,
                                paddingRight: 0
                            }}
                            >
                            Chargez le fichier contenant les questions
                            </button>
                            <div
                            style={{
                                borderWidth: 1,
                                borderStyle: 'solid',
                                borderColor: '#ccc',
                                height: 45,
                                lineHeight: 2.5,
                                marginTop: 5,
                                marginBottom: 5,
                                paddingLeft: 13,
                                paddingTop: 3,
                                width: '60%'
                            }}
                            >
                            {file && file.name}
                            </div>
                            <button
                            style={{
                                borderRadius: 0,
                                marginLeft: 0,
                                marginRight: 0,
                                paddingLeft: 20,
                                paddingRight: 20
                            }}
                            onClick={handleRemoveFileSenior}
                            >
                            Supprimer
                            </button>
                        </aside>
                        )}
                    </CSVReader>
                    {/*
                    <div className="questions-group">
                        <div className="form-group">
                            <div className="questions-quizz-list">
                                <h4>Rounds pour la partie principale</h4>
                                {
                                    quizzRounds.map((item, index) => (
                                        <div className="age-item">
                                            <span>Round {index + 1}</span>
                                            {
                                                item.questions ? 
                                                <ul>
                                                    {
                                                        item.questions.map((itemQuestion) => (
                                                            <li key={itemQuestion.id}>{itemQuestion.statement} <Button variant="danger" onClick={() => deleteQuizzQuestion(true, index, itemQuestion.uniqueId)} >Supprimer question</Button></li>
                                                        ))
                                                    }
                                                </ul>
                                                : ''
                                            }
                                        </div>
                                    ))
                                }
                            </div>
                            <div className="alert" id="alert-roundsquizz-core-empty">
                                <p>Main rounds requis</p>
                            </div>
                        </div>
                        <div className="form-group">
                            <div className="questions-quizz-list">
                                <h4>Rounds pour la finale</h4>
                                {
                                    quizzFinaleRounds.map((item, index) => (
                                        <div className="age-item">
                                            <span>Round {index + 1}</span>
                                            {
                                                item.questions ? 
                                                <ul>
                                                    {
                                                        item.questions.map((itemQuestion) => (
                                                            <li key={itemQuestion.id}>{itemQuestion.statement} <Button variant="danger" onClick={() => deleteQuizzQuestion(false, index, itemQuestion.uniqueId)} >Supprimer question</Button></li>
                                                        ))
                                                    }
                                                </ul>
                                                : ''
                                            }
                                        </div>
                                    ))
                                }
                            </div>
                            <div className="alert" id="alert-finaleroundsquizz-core-empty">
                                <p>Finale rounds requis</p>
                            </div>
                        </div>
                        <div className="quizz-question">
                            <div className="form-group">
                                <input type="text" name="quizz-theme" id="quizz-theme" value={quizzTheme} onChange={event => setquizzTheme(event.target.value)}/>
                                <label htmlFor="quizz-theme">Theme</label>
                                <div className="alert" id="alert-theme-core-empty">
                                    <p>Thème requis</p>
                                </div>
                            </div>
                            <div className="form-group">
                                <input type="text" name="quizz-statement" id="quizz-statement" value={quizzStatement} onChange={event => setquizzStatement(event.target.value)}/>
                                <label htmlFor="quizz-statement">Statement</label>
                                <div className="alert" id="alert-statement-core-empty">
                                    <p>Statement requis</p>
                                </div>
                            </div>
                            <div className="form-group">
                                <input type="text" name="quizz-explanation" id="quizz-explanation" value={quizzExplanation} onChange={event => setquizzExplanation(event.target.value)}/>
                                <label htmlFor="quizz-explanation">Explanation</label>
                                <div className="alert" id="alert-explanation-core-empty">
                                    <p>Explication requise</p>
                                </div>
                            </div>
                            <div className="form-group">
                                <input type="number" name="quizz-points" id="quizz-points" value={quizzPoints} onChange={event => setquizzPoints(parseInt(event.target.value))}/>
                                <label htmlFor="quizz-points">Points</label>
                                <div className="alert" id="alert-points-core-empty">
                                    <p>Points requis</p>
                                </div>
                            </div>
                            <div className="form-group">
                                <input type="text" name="quizz-illustration" id="quizz-illustration" value={quizzIllustration} onChange={event => setquizzIllustration(event.target.value)}/>
                                <label htmlFor="quizz-illustration">Illustration</label>
                                <div className="alert" id="alert-illustration-core-empty">
                                    <p>Photo requise</p>
                                </div>
                            </div>
                            <div className="form-group">
                                <input type="checkbox" name="quizz-isfinale" id="quizz-isfinale" checked={isFinale} onChange={event => setisFinale(event.target.value === "on" ? true : false)}/>
                                <label htmlFor="quizz-isfinale">Finale?</label>
                            </div>
                            <div className="form-group">
                                {
                                    !isFinale ? 
                                    <select value={quizzActiveRoundItem} name="quizz-round" id="quizz-round" onChange={event => setquizzActiveRoundItem(event.target.value)}>
                                        {
                                            quizzRounds.map((item, index) => (
                                                <option key={"quizz-round-" + index} value={index}>{index + 1}</option>
                                            ))
                                        }
                                        <option key={"quizz-round-" + quizzRounds.length} value={quizzRounds.length}>{quizzRounds.length + 1}</option>
                                    </select> : 
                                    <select value={quizzActiveRoundItem} name="quizz-round" id="quizz-round" onChange={event => setquizzActiveRoundItem(event.target.value)}>
                                        {
                                            quizzFinaleRounds.map((item, index) => (
                                                <option key={"quizz-round-" + index} value={index}>{index + 1}</option>
                                            ))
                                        }
                                        <option key={"quizz-round-" + quizzFinaleRounds.length} value={quizzFinaleRounds.length}>{quizzFinaleRounds.length + 1}</option>
                                    </select>
                                }
                                <label htmlFor="quizz-round">Round</label>
                            </div>
                            <div className="answers-group">
                                <div className="form-group">
                                    <div className="answers-list">
                                        <h4>Réponses : </h4>
                                        <ul>
                                            {
                                                quizzAnswers.map((item) => (
                                                <li key={item.value}>{item.label} {item.value === quizzCorrectAnswer ? <Badge variant="info">Bonne réponse</Badge> : <Button variant="warning" onClick={() => setquizzCorrectAnswer(item.value)}>Marquer comme bonne réponse</Button> } <Button variant="danger" onClick={() => deleteQuizzAnswer(item.value)}>Supprimer réponse</Button></li>
                                                ))
                                            }
                                        </ul>
                                        <div className="alert" id="alert-answers-core-notvalid">
                                            <p>Donnez 2 choix de réponse au minimum</p>
                                        </div>
                                        <div className="alert" id="alert-correctanswer-core-empty">
                                            <p>Une bonne réponse est requise</p>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <input type="text" name="quizz-quizz-answer" id="quizz-quizz-answer" value={quizzAnswerItem} onChange={event => setquizzAnswerItem(event.target.value)}/>
                                        <label htmlFor="quizz-quizz-answer">Réponse</label>
                                        <div className="alert" id="alert-answer-core-empty">
                                            <p>Réponse requise</p>
                                        </div>
                                    </div>
                                    <Button variant="primary" onClick={addQuizzAnswer}>Ajouter réponse</Button>
                                </div>
                            </div>
                            <Button variant="success" onClick={() => addQuizzQuestion("senior")}>Ajouter question</Button>
                        </div>
                    </div>
                    */}
                    <Button variant="primary" type="submit">Valider</Button>
                </form>
            </Tab>
            <Tab eventKey="quizz-core" title="Quizz Core">
                <div className="quizz-core-list">
                    <Table responsive>
                        <thead>
                            <tr>
                                <th>Id</th>
                                <th>Session</th>
                                <th>Pays</th>
                                {/*<th>Main rounds</th>*/}
                                <th>&nbsp;</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                quizzCoreSeries.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.id}</td>
                                        <td>{item.session}</td>
                                        <td>{getCountryLabelFromKey(item.country)}</td>
                                        <td>
                                            <Button variant="danger" onClick={() => deleteQuizzSerie(item.id)} >Supprimer série</Button>
                                        </td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </Table>
                </div>
                <form className="form-quizz-core" onSubmit={event => checkQuizzForm(event, "core")} >
                
                    <div className="form-group">
                        <select value={quizzSession} onChange={event => setquizzSession(event.target.value)}>
                            <option value="" disabled>Session</option>
                            {
                                sessions.map((session) => (
                                    <option value={session.id}>{session.date} {session.time.value}</option>
                                ))
                            }
                        </select>
                        <div className="alert" id="alert-sessionquizz-empty">
                            <p>Session requis</p>
                        </div>
                    </div>
                    <div className="form-group">
                        <select value={countryQuizz} onChange={handleCountryQuizzChange}>
                            <option value="" disabled>Pays</option>
                            {
                                countryObjects.map((item) => (
                                    <option key={item.key} value={item.key}>{item.label}</option>
                                ))
                            }
                        </select>
                        <div className="alert" id="alert-countryquizz-empty">
                            <p>Pays requis</p>
                        </div>
                    </div>
                    <div className="form-group">
                            <div className="country">
                                {
                                    regionsQuizz.map((regionItem) => (
                                        <div className="custom-control custom-checkbox" key={"quizz-" + regionItem.name}>
                                            <input type="checkbox" className="custom-control-input" id={'region-core-' + regionItem.name.replace(/\s+/g, '-').toLowerCase()} value={regionItem.name} onChange={event => handleregionQuizzChange(event)} />
                                            <label className="custom-control-label" htmlFor={'region-core-' + regionItem.name.replace(/\s+/g, '-').toLowerCase()}>{regionItem.name}</label>
                                        </div>
                                    ))
                                }
                            </div>
                            <Button variant="primary" onClick={() => {
                                checkAllRegionsQuizzOptions(regionsQuizz);
                                regionsQuizz.forEach(element => {
                                    document.getElementById('region-core-' + element.name.replace(/\s+/g, '-').toLowerCase()).checked = true;
                                });
                            }}>Séléctionner tout</Button>
                            <div className="alert" id="alert-regionsquizz-empty">
                                <p>Vous devez séléctionner au moins une région</p>
                            </div>
                    </div>
                    <div className="form-group">
                        <div className="age-quizz-list">
                            {
                                agesQuizzSelected.map((item) => (
                                    <div className="age-item">
                                        <span>{item.min}</span> à <span>{item.max}</span> ans <Button variant="danger" onClick={() => deleteQuizzAgeRange(item.min, item.max)} >Supprimer tranche d'age</Button>
                                    </div>
                                ))
                            }
                        </div>
                        <div className="alert" id="alert-agerangesquizz-empty">
                            <p>Tranche d'age requis</p>
                        </div>
                        <div className="age-range">
                            <span>de </span>
                            <input type="number" min="18" value={ageQuizzMin} onChange={event => setageQuizzMin(event.target.value)}/>
                            <span> à </span>
                            <input type="number" value={ageQuizzMax} onChange={event => setageQuizzMax(event.target.value)}/>
                            <Button variant="primary" onClick={addAgeQuizz} >Ajouter</Button>
                        </div>
                        <div className="alert" id="alert-agequizzmin-empty">
                            <p>Age min requis</p>
                        </div>
                        <div className="alert" id="alert-agequizzmax-empty">
                            <p>Age max requis</p>
                        </div>
                    </div>
                    <CSVReader
                        ref={buttonRefCore}
                        onFileLoad={handleOnFileLoadCore}
                        onError={handleOnErrorCore}
                        noClick
                        noDrag
                        onRemoveFile={handleOnRemoveFileCore}
                    >
                        {({ file }) => (
                        <aside
                            style={{
                            display: 'flex',
                            flexDirection: 'row',
                            marginBottom: 10
                            }}
                        >
                            <button
                            type='button'
                            onClick={handleOpenDialogCore}
                            style={{
                                borderRadius: 0,
                                marginLeft: 0,
                                marginRight: 0,
                                width: '40%',
                                paddingLeft: 0,
                                paddingRight: 0
                            }}
                            >
                            Chargez le fichier contenant les questions
                            </button>
                            <div
                            style={{
                                borderWidth: 1,
                                borderStyle: 'solid',
                                borderColor: '#ccc',
                                height: 45,
                                lineHeight: 2.5,
                                marginTop: 5,
                                marginBottom: 5,
                                paddingLeft: 13,
                                paddingTop: 3,
                                width: '60%'
                            }}
                            >
                            {file && file.name}
                            </div>
                            <button
                            style={{
                                borderRadius: 0,
                                marginLeft: 0,
                                marginRight: 0,
                                paddingLeft: 20,
                                paddingRight: 20
                            }}
                            onClick={handleRemoveFileCore}
                            >
                            Supprimer
                            </button>
                        </aside>
                        )}
                    </CSVReader>
                    {/*
                    <div className="questions-group">
                        <div className="form-group">
                            <div className="questions-quizz-list">
                                <h4>Rounds pour la partie principale</h4>
                                {
                                    quizzRounds.map((item, index) => (
                                        <div className="age-item">
                                            <span>Round {index + 1}</span>
                                            {
                                                item.questions ? 
                                                <ul>
                                                    {
                                                        item.questions.map((itemQuestion) => (
                                                            <li key={itemQuestion.id}>{itemQuestion.statement} {itemQuestion.fileName}<Button variant="danger" onClick={() => deleteQuizzQuestion(true, index, itemQuestion.uniqueId)} >Supprimer question</Button></li>
                                                        ))
                                                    }
                                                </ul>
                                                : ''
                                            }
                                        </div>
                                    ))
                                }
                            </div>
                            <div className="alert" id="alert-roundsquizz-empty">
                                <p>Main rounds requis</p>
                            </div>
                        </div>
                        <div className="form-group">
                            <div className="questions-quizz-list">
                                <h4>Rounds pour la finale</h4>
                                {
                                    quizzFinaleRounds.map((item, index) => (
                                        <div className="age-item">
                                            <span>Round {index + 1}</span>
                                            {
                                                item.questions ? 
                                                <ul>
                                                    {
                                                        item.questions.map((itemQuestion) => (
                                                            <li key={itemQuestion.id}>{itemQuestion.statement} {itemQuestion.fileName} <Button variant="danger" onClick={() => deleteQuizzQuestion(false, index, itemQuestion.uniqueId)} >Supprimer question</Button></li>
                                                        ))
                                                    }
                                                </ul>
                                                : ''
                                            }
                                        </div>
                                    ))
                                }
                            </div>
                            <div className="alert" id="alert-finaleroundsquizz-empty">
                                <p>Finale rounds requis</p>
                            </div>
                        </div>
                        <div className="quizz-question">
                            <div className="form-group">
                                <input type="text" name="quizz-theme" id="quizz-theme" value={quizzTheme} onChange={event => setquizzTheme(event.target.value)}/>
                                <label htmlFor="quizz-theme">Theme</label>
                                <div className="alert" id="alert-theme-empty">
                                    <p>Thème requis</p>
                                </div>
                            </div>
                            <div className="form-group">
                                <input type="text" name="quizz-statement" id="quizz-statement" value={quizzStatement} onChange={event => setquizzStatement(event.target.value)}/>
                                <label htmlFor="quizz-statement">Statement</label>
                                <div className="alert" id="alert-statement-empty">
                                    <p>Statement requis</p>
                                </div>
                            </div>
                            <div className="form-group">
                                <input type="text" name="quizz-explanation" id="quizz-explanation" value={quizzExplanation} onChange={event => setquizzExplanation(event.target.value)}/>
                                <label htmlFor="quizz-explanation">Explanation</label>
                                <div className="alert" id="alert-explanation-empty">
                                    <p>Explication requise</p>
                                </div>
                            </div>
                            <div className="form-group">
                                <input type="number" name="quizz-points" id="quizz-points" value={quizzPoints} onChange={event => setquizzPoints(parseInt(event.target.value))}/>
                                <label htmlFor="quizz-points">Points</label>
                                <div className="alert" id="alert-points-empty">
                                    <p>Points requis</p>
                                </div>
                            </div>
                            <div className="form-group">
                                <input type="text" name="quizz-filename" id="quizz-filename" value={quizzFilename} onChange={event => setquizzFilename(event.target.value)}/>
                                <label htmlFor="quizz-filename">Filename</label>
                                <div className="alert" id="alert-filename-empty">
                                    <p>Nom de fichier requis</p>
                                </div>
                            </div>
                            <div className="form-group">
                                <input type="checkbox" name="quizz-isfinale" id="quizz-isfinale" checked={isFinale} onChange={event => setisFinale(event.target.value === "on" ? true : false)}/>
                                <label htmlFor="quizz-isfinale">Finale?</label>
                            </div>
                            <div className="form-group">
                                {
                                    !isFinale ? 
                                    <select value={quizzActiveRoundItem} name="quizz-round" id="quizz-round" onChange={event => setquizzActiveRoundItem(event.target.value)}>
                                        {
                                            quizzRounds.map((item, index) => (
                                                <option key={"quizz-round-" + index} value={index}>{index + 1}</option>
                                            ))
                                        }
                                        <option key={"quizz-round-" + quizzRounds.length} value={quizzRounds.length}>{quizzRounds.length + 1}</option>
                                    </select> : 
                                    <select value={quizzActiveRoundItem} name="quizz-round" id="quizz-round" onChange={event => setquizzActiveRoundItem(event.target.value)}>
                                        {
                                            quizzFinaleRounds.map((item, index) => (
                                                <option key={"quizz-round-" + index} value={index}>{index + 1}</option>
                                            ))
                                        }
                                        <option key={"quizz-round-" + quizzFinaleRounds.length} value={quizzFinaleRounds.length}>{quizzFinaleRounds.length + 1}</option>
                                    </select>
                                }
                                <label htmlFor="quizz-round">Round</label>
                            </div>
                            <div className="answers-group">
                                <div className="form-group">
                                    <div className="answers-list">
                                        <h4>Réponses : </h4>
                                        <ul>
                                            {
                                                quizzAnswers.map((item) => (
                                                <li key={item.value}>{item.label} {item.value === quizzCorrectAnswer ? <Badge variant="info">Bonne réponse</Badge> : <Button variant="warning" onClick={() => setquizzCorrectAnswer(item.value)}>Marquer comme bonne réponse</Button> } <Button variant="danger" onClick={() => deleteQuizzAnswer(item.value)}>Supprimer réponse</Button></li>
                                                ))
                                            }
                                        </ul>
                                        <div className="alert" id="alert-answers-notvalid">
                                            <p>Donnez 2 choix de réponse au minimum</p>
                                        </div>
                                        <div className="alert" id="alert-correctanswer-empty">
                                            <p>Une bonne réponse est requise</p>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <input type="text" name="quizz-quizz-answer" id="quizz-quizz-answer" value={quizzAnswerItem} onChange={event => setquizzAnswerItem(event.target.value)}/>
                                        <label htmlFor="quizz-quizz-answer">Réponse</label>
                                        <div className="alert" id="alert-answer-empty">
                                            <p>Réponse requise</p>
                                        </div>
                                    </div>
                                    <Button variant="primary" onClick={addQuizzAnswer}>Ajouter réponse</Button>
                                </div>
                            </div>
                            <Button variant="success" onClick={() => addQuizzQuestion("core")}>Ajouter question</Button>
                        </div>
                    </div>
                    */}
                    <Button variant="primary" type="submit">Valider</Button>
                </form>
            </Tab>
            <Tab eventKey="translations" title="Traductions">
                Traductions
            </Tab>
            <Tab eventKey="configuration" title="Config pays">
                {
                    countryconfigs.length > 0 ? 
                    <Table responsive>
                        <tbody>
                            {
                                countryconfigs.map((item) => (
                                    <tr key={item.name}>
                                        <td>{getCountryLabelFromKey(item.name)}</td>
                                        <td>
                                            {
                                                item.regions.map((itemRegion) => (
                                                    <tr>
                                                        <td>{itemRegion.name}</td>
                                                        <td>
                                                            {
                                                                itemRegion.ageRanges.map((itemAge) => (
                                                                    <tr>
                                                                        <td>{itemAge.min} à {itemAge.max} ans</td>
                                                                        <td>
                                                                            <Button variant="danger" onClick={() => deleteAgeRange(item.name, itemRegion.name, itemAge.min, itemAge.max)}>Supprimer</Button>
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            }
                                                        </td>
                                                    </tr>
                                                ))
                                            }
                                        </td>
                                        <td>
                                            <Button variant="warning" onClick={() => deleteCountry(item.name)}>Supprimer</Button>
                                        </td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </Table>
                    : ''
                }
                <Table responsive id="config-country">
                    <tbody>
                        <tr>
                            <td>
                                <select value={country} onChange={handleCountryChange}>
                                    <option value="" disabled>Pays</option>
                                    {
                                        countryObjects.map((item) => (
                                            <option key={item.key} value={item.key}>{item.label}</option>
                                        ))
                                    }
                                </select>
                                <div className="alert" id="alert-country-required">
                                    <p>Pays requis</p>
                                </div>
                            </td>
                            <td>
                                <select value={region} onChange={event => setregion(event.target.value)}>
                                    <option value="" disabled>Région</option>
                                    {
                                        regions.map((item) => (
                                            <option className={"option" + item.country} value={item.name}>{item.name}</option>
                                        ))
                                    }
                                </select>
                                <div className="alert" id="alert-region-required">
                                    <p>Région requis</p>
                                </div>
                            </td>
                            <td>
                                <div className="age-range">
                                    <span>de </span>
                                    <input type="number" min="18" value={agemin} onChange={event => setagemin(event.target.value)}/>
                                    <span> à </span>
                                    <input type="number" value={agemax} onChange={event => setagemax(event.target.value)}/>
                                </div>
                                <div className="alert" id="alert-age1-required">
                                    <p>Age 1 requis</p>
                                </div>
                                <div className="alert" id="alert-age2-required">
                                    <p>Age 2 requis</p>
                                </div>
                                <div className="alert" id="alert-ages-novalid">
                                    <p>Age 1 doit être inférieur à age 2</p>
                                </div>
                            </td>
                            <td>
                                <Button variant="primary" onClick={submitCountryForm}>Valider</Button>
                                <Button variant="danger" onClick={cancelCountryForm}>Annuler</Button>
                            </td>
                        </tr>
                    </tbody>
                </Table>
            </Tab>
            <Tab eventKey="subscription" title="Inscris">
                <div className="filter-group">
                    <div className="filter-item">
                        <label htmlFor="session-filter">Session</label>
                        <select name="session-filter" value={sessionfilter} onChange={event => setsessionfilter(event.target.value)}>
                            <option value="">Tous</option>
                            {
                                sessions.map((session) => (
                                    <option value={session.id}>{session.date}</option>
                                ))
                            }
                        </select>
                    </div>
                    <div className="filter-item">
                        <label htmlFor="gender-filter">Sexe</label>
                        <select name="gender-filter" value={genderfilter} onChange={event => setgenderfilter(event.target.value)}>
                            <option value="">Tous</option>
                            <option value="male">Homme</option>
                            <option value="female">Femme</option>
                        </select>
                    </div>
                    <div className="filter-item">
                        <label htmlFor="site-filter">Pays</label>
                        <select name="site-filter" value={countryfilter} onChange={event => setcountryfilter(event.target.value)}>
                            <option value="">Tous</option>
                            {
                                countryObjects.map((country) => (
                                    <option key={country.key} value={country.key}>{country.label}</option>
                                ))
                            }
                        </select>
                    </div>
                    <div className="filter-item">
                        <label htmlFor="site-filter">Site</label>
                        <select name="site-filter" value={sitefilter} onChange={event => setsitefilter(event.target.value)}>
                            <option value="">Tous</option>
                            <option value="core">Core</option>
                            <option value="senior">Senior</option>
                        </select>
                    </div>
                    <div className="filter-item">
                        <label htmlFor="age-filter">Age min</label>
                        <input type="number" min="18" value={ageminfilter} onChange={event => setageminfilter(event.target.value)}/>
                    </div>
                    <div className="filter-item">
                        <label htmlFor="age-filter">Age max</label>
                        <input type="number" value={agemaxfilter} onChange={event => setagemaxfilter(event.target.value)}/>
                    </div>
                    <div className="filter-item">
                        <Button variant="primary" onClick={filterSubscribers}>Filtrer</Button>
                    </div>
                </div>
                <CanvasJSChart options = {subscribersoptions} /* onRef={ref => this.chart = ref} */ />
                {
                    subscribers.length > 0 ? 
                    <Table responsive>
                        <thead>
                            <tr>
                                <th>Photo</th>
                                <th>Pseudo</th>
                                <th>Genre</th>
                                <th>Site</th>
                                <th>Pays</th>
                                <th>Age</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                subscribers.map((subscriber) => (
                                    <tr key={subscriber.alias}>
                                        <td><img src={process.env.PUBLIC_URL + '/assets/images/avatars/' + (subscriber.avatar !== "" ? subscriber.avatar : 'default.png')} alt=""/></td>
                                        <td>{subscriber.alias}</td>
                                        <td><Badge variant={subscriber.gender === 'male' ? "secondary" : "warning"}>{subscriber.gender}</Badge></td>
                                        <td><Badge variant={subscriber.site === 'core' ? "secondary" : "warning"}>{subscriber.site}</Badge></td>
                                        <td><Badge variant="info">{getCountryLabelFromKey(subscriber.country)}</Badge></td>
                                        <td>{subscriber.age}</td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </Table>
                    : ''
                }
            </Tab>
            <Tab eventKey="moderation" title="Modération">
                <Table responsive>
                    <thead>
                        <tr>
                            <th>Timing</th>
                            <th>Alerte sur</th>
                            <th>Qui alerte</th>
                            <th>Déclaration</th>
                        </tr>
                    </thead>
                {
                    complaints ? 
                    <tbody>
                        {
                            complaints.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.date}</td>
                                    <td>{item.accused}</td>
                                    <td>{item.complainant}</td>
                                    <td>{item.declaration}</td>
                                </tr>
                            ))
                        }
                    </tbody>
                    : ''
                }
                </Table>
            </Tab>
            <Tab eventKey="questions" title="Questions">
              <h1>Senior</h1>
              <CSVReader
                        ref={buttonQuestionsSenior}
                        onFileLoad={handleOnFileLoadQuestionsSenior}
                        onError={handleOnErrorQuestionsSenior}
                        noClick
                        noDrag
                        onRemoveFile={handleOnRemoveFileQuestionsSenior}
                    >
                        {({ file }) => (
                        <aside
                            style={{
                            display: 'flex',
                            flexDirection: 'row',
                            marginBottom: 10
                            }}
                        >
                            <button
                            type='button'
                            onClick={handleOpenDialogQuestionsSenior}
                            style={{
                                borderRadius: 0,
                                marginLeft: 0,
                                marginRight: 0,
                                width: '40%',
                                paddingLeft: 0,
                                paddingRight: 0
                            }}
                            >
                            Chargez le fichier contenant les questions
                            </button>
                            <div
                            style={{
                                borderWidth: 1,
                                borderStyle: 'solid',
                                borderColor: '#ccc',
                                height: 45,
                                lineHeight: 2.5,
                                marginTop: 5,
                                marginBottom: 5,
                                paddingLeft: 13,
                                paddingTop: 3,
                                width: '60%'
                            }}
                            >
                            {file && file.name}
                            </div>
                            <button
                            style={{
                                borderRadius: 0,
                                marginLeft: 0,
                                marginRight: 0,
                                paddingLeft: 20,
                                paddingRight: 20
                            }}
                            onClick={handleRemoveFileQuestionsSenior}
                            >
                            Supprimer
                            </button>
                        </aside>
                        )}
                    </CSVReader>

            </Tab>
            <Tab eventKey="sessions" title="Sessions programmées">
                <h1>Senior</h1>       
                <button type="text" className="btn btn-primary" onClick={addSeniorSessions}>Add sessions senior</button>
            </Tab>
            <Tab eventKey="actiondev" title="Actions dev">
              <button type="text" className="btn btn-primary" onClick={initAll}>Initialiser tout</button>
              <button type="text" className="btn btn-primary" onClick={deleteAllUser}>Supprimer tout les users</button>
              <button type="text" className="btn btn-primary" onClick={daySessions}>Add day session</button>
              <button type="text" className="btn btn-primary" onClick={addSeries}>Add series</button>
              <button type="text" className="btn btn-primary" onClick={deleteSessionsSeries}>Supprimer toutes les sessions et séries</button>
              <button type="text" className="btn btn-primary" onClick={deleteUserStatus}>Delete user status</button>
              <button type="text" className="btn btn-primary" onClick={deleteSurveys}>Delete surveys</button>
              <button type="text" className="btn btn-primary" onClick={deleteQuestions}>Delete questions</button>
            </Tab>
        </Tabs>
    )
}
