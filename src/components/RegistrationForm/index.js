import React, {useEffect, useState} from 'react';
import './RegistrationForm.css';
import * as firebase from 'firebase';
import { useHistory, Link } from "react-router-dom";
import * as Settings from '../../settings/constants.js';
import UserProfile from '../../session/UserProfile';
import nicknames from '../../settings/nicknames.json';
import $ from 'jquery';
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
 *   Display the registration form, create a new firebase auth session
*/
export default function RegistrationForm(props) {
    const [age, setAge] = useState("");
    const [region, setRegion] = useState("");
    const [isMember, setIsMember] = useState("");
    const [gender, setgender] = useState("");
    const [validTerms, setValidTerms] = useState(false);
    const db = firebase.firestore();
    let history = useHistory();
    const [regions, setregions] = useState([]);
    const auth = firebase.auth();

    const site = props.site;
    const country = props.country;
    const [ages, setages] = useState([]);

    const { width } = useViewport();
    const breakpoint = Settings.MOBILE_BREAKPOINT;
    const { t, i18n } = useTranslation('common');
    const [language, setLanguage] = useState(UserProfile.getLang() ? UserProfile.getLang() : "uk");

    useEffect(() => {
        loadRegions();
        loadAges();
        return () => {
            
        }
    }, []);

    const loadRegions = () => {
        db.collection("regions")
            .where('country', '==', props.country)
            .onSnapshot(function(querySnapshot) {
                let tempArray = [];
                querySnapshot.forEach(function(doc) {
                    tempArray.push(doc.data());
                });
                setregions(tempArray);
            });
    }

    const loadAges = () => {
      let list = [];
      let start = 18;
      let end = 91;
      if(site === "senior"){
        start = 50;
      }
      
      for (let i = start; i < end; i++) {
        list.push(i);
      }

      setages(list);
    }

    const checkForm = (event) => {
      event.preventDefault();
      
      
      if(age !== "" && region !== "" && gender !== "" && isMember !== "" && validTerms !== false){
        // check unique and save user
        register();
      }
      else {
        if(age === "") {
          if(width < breakpoint){
            document.querySelector('.blocErrorMobile #alert-age-empty').style.display = 'block'; 
          } else {
            document.querySelector('#age #alert-age-empty').style.display = 'block'; 
          }
          
          $('#age.form-group').addClass('error');
          $('#age.form-group select').change(function (){
            $('#age.form-group').removeClass('error');
          })          
        }

        if(region === "") {
          if(width < breakpoint){
            document.querySelector('.blocErrorMobile #alert-region-empty').style.display = 'block';
          } else {
            document.querySelector('#region #alert-region-empty').style.display = 'block';
          }

          $('#region.form-group').addClass('error');
          $('#region.form-group select').change(function (){
            $('#region.form-group').removeClass('error');
          })
        }

        if(gender === "") {
          if(width < breakpoint){
            document.querySelector('.blocErrorMobile #alert-gender-empty').style.display = 'block';
          } else {
            document.querySelector('#gender #alert-gender-empty').style.display = 'block';
          }

          $('#gender.form-group').addClass('error');
          $('#gender.form-group select').change(function (){
            $('#gender.form-group').removeClass('error');
          })
        }

        if(isMember === "") {
          if(width < breakpoint){
            document.querySelector('.blocErrorMobile #alert-ismember-empty').style.display = 'block';
          } else {
            document.querySelector('#member #alert-ismember-empty').style.display = 'block';
          }

          $('#member.form-group').addClass('error');
          $('#member.form-group select').change(function (){
            $('#member.form-group').removeClass('error');
          })
        }

        if(validTerms === false) {
          if(width < breakpoint){
            document.querySelector('.blocErrorMobile #alert-terms-empty').style.display = 'block';
          } else {
            document.querySelector('#term #alert-terms-empty').style.display = 'block';
          }
        }
      }

    }

    function getRandomInt(max) {
      return Math.floor(Math.random() * Math.floor(max));
    }

    const register = () => {
      let names = [];
      for (let i = 0; i < nicknames.length; i++) {
          if(nicknames[i].lang === UserProfile.getCountry()){
              if(UserProfile.getSite() === "senior"){
                  names = nicknames[i].names_senior;
              }
              else {
                  names = nicknames[i].names_core;
              }
          }
      }
      let nickname = names[Math.floor(Math.random() * names.length)].replace(/\s/g,'');
      checkNicknameUnique(nickname);
    }

    const checkNicknameUnique = (param) => {
      props.changeLoaderStatus();
      let user = {
        alias: param,
        gender,
        age: parseInt(age),
        region,
        isVideoSeen: false,
        isMember: isMember === "member" ? true : false,
        avatar: gender === "male" ? "default-male.png" : "default-female.png",
        country: props.country,
        site: props.site,
        sessions: props.sessionids,
        likes: []
      };
      delete user.room;
      delete user.team;
      insertUser(user);
    }

    function insertUser(user) {
      console.log("insertUser : ");
      console.log(user);
      auth.signInAnonymously().then(response => {
        console.log("response");
        console.log(response);
        history.push('/profile', { user });
      })
      .catch(error => console.log(error));
    }

    const handleLangChange = evt => {
      const lang = evt.target.value;
      console.log(lang);
      setLanguage(lang);
      UserProfile.setLang(lang);
      i18n.changeLanguage(lang);
    };

    const renderSwitchAgreement = (param) => {
      switch (param) {
        case 'fr':
          return <label className="label" htmlFor="terms">En cliquant sur "inscription", j'accepte les <Link className="link" to="terms-conditions" target="_blank">Conditions Générales des événements en ligne</Link>. Pour en savoir plus sur la manière dont nous traitons vos données, consultez notre <Link className="link" to="privacy-policy" target="_blank">Politique de confidentialité</Link>, <Link className="link" to="cookie-policy" target="_blank">Charte d’utilisation des cookies</Link></label>;
        case 'uk':
          return <label className="label" htmlFor="terms">By clicking on "register", I accept <Link className="link" to="terms-conditions" target="_blank">Online Events terms and conditions</Link>. Learn about how we process your data in our <Link className="link" to="privacy-policy" target="_blank">Privacy Policy</Link>, <Link className="link" to="cookie-policy" target="_blank">Cookie Policy</Link></label>;
        case 'it':
          return <label className="label" htmlFor="terms">Cliccando su "Registrati", accetto termini e <Link className="link" to="terms-conditions" target="_blank">Condizioni degli Eventi online</Link>. Scopri come trattiamo i tuoi dati consultando la nostra <Link className="link" to="privacy-policy" target="_blank">Informativa sulla privacy</Link>, <Link className="link" to="cookie-policy" target="_blank">Politica sui cookie</Link></label>;
        case 'sp':
          return <label className="label" htmlFor="terms">Al hacer clic en "Inscribirse", acepto los términos y <Link className="link" to="terms-conditions" target="_blank">Condiciones de los eventos online</Link>. Obtén más información acerca de cómo procesamos tus datos leyendo nuestra <Link className="link" to="privacy-policy" target="_blank">Política de privacidad</Link>, <Link className="link" to="cookie-policy" target="_blank">Política de cookies</Link></label>;
        case 'gm':
          return <label className="label" htmlFor="terms">Durch den Klick auf "Registrieren" akzeptieren Sie die <Link className="link" to="terms-conditions" target="_blank">Allgemeinen Geschäftsbedingungen für Online-Events</Link>. Informationen darüber, wie wir Ihre Daten verarbeiten, finden Sie in unseren <Link className="link" to="privacy-policy" target="_blank">Datenschutzerklärung</Link>, <Link className="link" to="cookie-policy" target="_blank">Cookie-Richtlinie</Link></label>;
        case 'sw':
          return <label className="label" htmlFor="terms">Genom att klicka på "registrera dig" godkänner jag de <Link className="link" to="terms-conditions" target="_blank">allmänna villkoren för event online</Link>. Ta reda på hur vi behandlar dina personuppgifter i vår <Link className="link" to="privacy-policy" target="_blank">Integritetspolicy</Link>, <Link className="link" to="cookie-policy" target="_blank">Cookiepolicy</Link></label>;
        case 'nl':
          return <label className="label" htmlFor="terms">Door op "Aanmelden" te klikken, ga ik akkoord met de <Link className="link" to="terms-conditions" target="_blank">Voorwaarden van de online events</Link>. Lees in ons <Link className="link" to="privacy-policy" target="_blank">Privacybeleid</Link> en ons <Link className="link" to="cookie-policy" target="_blank">Geslacht</Link> hoe we jouw gegevens verwerken.</label>;
      }
    }

    return (
      <div className="registration">
        <form className="form-row" onSubmit={checkForm}>
          <h1 className="ttr">{t('register_now.title')}</h1>

            <div className="blocErrorMobile d-sm-none d-block">
              <div className="alert" id="alert-age-empty">
                <p>*{t('fill_form.title')}</p>
              </div>
              <div className="alert" id="alert-region-empty">
                <p>*{t('fill_form.title')}</p>
              </div>
              <div className="alert" id="alert-gender-empty">
                <p>*{t('fill_form.title')}</p>
              </div>
              <div className="alert" id="alert-ismember-empty">
                <p>*{t('fill_form.title')}</p>
              </div>
              <div className="alert" id="alert-terms-empty">
                <p>*{t('agree_terms.title')}</p>
              </div>
            </div>

            <div id="age" className="form-group selectContent">
              <div className="puce" htmlFor="age"><i className="fa fa-angle-down" aria-hidden="true"></i></div>
              <select className="form-control custom-select" name="age" value={age} onChange={event => setAge(event.target.value)}>
                <option value="" disabled>{t('age.title')}</option>
                {
                    ages.map((item) => (
                        <option key={item} className={"option" + item} value={item}>{item !== 90 ? item : t('90_more.title')}</option>
                    ))
                }
              </select>
              <div className="alert" id="alert-age-empty">
                <p>*{t('fill_form.title')}</p>
              </div>
            </div>
            <div id="region" className="form-group selectContent">
              <div className="puce" htmlFor="region"><i className="fa fa-angle-down" aria-hidden="true"></i></div>
              <select className="form-control custom-select" name="region" value={region} onChange={event => setRegion(event.target.value)}>
                <option value="" disabled>{t('region.title')}</option>
                {
                    regions.map((item) => (
                        <option key={item.name} className={"option" + item.country} value={item.name}>{item.name}</option>
                    ))
                }
              </select>
              <div className="alert" id="alert-region-empty">
                <p>*{t('fill_form.title')}</p>
              </div>
            </div>

            <div id="gender" className="form-group selectContent">
              <div className="puce" htmlFor="gender"><i className="fa fa-angle-down" aria-hidden="true"></i></div>
              <select className="form-control custom-select" name="gender" value={gender} onChange={event => setgender(event.target.value)}>
                <option value="" disabled>{t('gender.title')}</option>
                <option key={"male"} value={"male"}>{t('male.title')}</option>
                <option key={"female"} value={"female"}>{t('female.title')}</option>
              </select>
              <div className="alert" id="alert-gender-empty">
                <p>*{t('fill_form.title')}</p>
              </div>
            </div>

            <div id="member" className="form-group selectContent">
              <div className="puce" htmlFor="member"><i className="fa fa-angle-down" aria-hidden="true"></i></div>
              <select className="form-control custom-select" name="member" value={isMember} onChange={event => setIsMember(event.target.value)}>
                <option value="" disabled>{t('member.title')}</option>
                <option key={"member"} value={"member"}>{t('member.title')}</option>
                <option key={"non-member"} value={"non-member"}>{t('non_member.title')}</option>
              </select>
              <div className="alert" id="alert-ismember-empty">
                <p>*{t('fill_form.title')}</p>
              </div>
            </div>

            <div id="term" className="form-group contentCheckbox">
              <input type="checkbox" id="terms" name="terms" onChange={event => setValidTerms(!validTerms)}/>
              {/*<label className="label" htmlFor="terms">{t('by_clicking_register.title')} <Link to="#">{t('privacy_policy.title')}</Link> {t('and.title')} <Link to="#"> {t('cookie_policy.title')}</Link>.</label>*/}
              {renderSwitchAgreement(UserProfile.getCountry())}
              <div className="alert" id="alert-terms-empty">
                <p>*{t('agree_terms.title')}</p>
              </div>
            </div>
            <div className="form-group d-flex flex-column">
              <button type="submit" className="btn btn-primary">{t('register.title')}</button><br/>
              {/*
              <div className="form-group selectContent">
                <div className="puce" htmlFor="lang"><i className="fa fa-angle-down" aria-hidden="true"></i></div>
                <select className="form-control custom-select" name="lang" onChange={handleLangChange} value={language}>
                  <option value="uk">United-Kingdom</option>
                  <option value="fr">France</option>
                  <option value="gm">Germany</option>
                  <option value="sp">Spain</option>
                  <option value="nl">Netherlands</option>
                  <option value="sw">Sweden</option>
                  <option value="it">Italy</option>
                </select>
              </div>
              */}
            </div>
        </form>
      </div>
    );
}
