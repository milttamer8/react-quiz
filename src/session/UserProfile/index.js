var UserProfile = (function() {  
    var getAlias = function() {
      return localStorage.getItem('user_alias');    // Or pull this from cookie/localStorage
    };
  
    var setAlias = function(alias) {
        localStorage.setItem('user_alias', alias);    
      // Also set this in cookie/localStorage
    };

    var getAge = function() {
      return localStorage.getItem('user_age');
    };
  
    var setAge = function(age) {
      localStorage.setItem('user_age', age); 
    };

    var getRegion = function() {
      return localStorage.getItem('user_region');
    };
  
    var setRegion = function(region) {
        localStorage.setItem('user_region', region); 
    };

    var getAvatar = function() {
      return localStorage.getItem('user_avatar');
    };
  
    var setAvatar = function(avatar) {
        localStorage.setItem('user_avatar', avatar);  
    };

    var getEmail = function() {
      return localStorage.getItem('user_email');
    };
  
    var setEmail = function(email) {
        localStorage.setItem('user_email', email);  
    };

    var getGender = function() {
      return localStorage.getItem('user_gender');
    };
  
    var setGender = function(gender) {
        localStorage.setItem('user_gender', gender); 
    };

    var getRoom = function() {
      return localStorage.getItem('user_room');
    };
  
    var setRoom = function(room) {
        localStorage.setItem('user_room', room); 
    };

    var getTeam = function() {
      return localStorage.getItem('user_team');
    };
  
    var setTeam = function(team) {
        localStorage.setItem('user_team', team); 
    };

    var getSessionDate = function() {
      return localStorage.getItem('user_session_date');
    };
  
    var setSessionDate = function(session) {
        localStorage.setItem('user_session_date', session); 
    };

    var getSessionId = function() {
      return localStorage.getItem('user_session_id');
    };
  
    var setSessionId = function(id) {
        localStorage.setItem('user_session_id', id); 
    };

    var getLikes = function() {
      return JSON.parse(localStorage.getItem('user_likes'));
    };
  
    var setLikes = function(likes) {
        localStorage.setItem('user_likes', JSON.stringify(likes)); 
    };

    var getActiveChat = function() {
      return localStorage.getItem('user_chat');
    };
  
    var setActiveChat = function(chat) {
        localStorage.setItem('user_chat', chat); 
    };

    var getTeamSerie = function() {
      return localStorage.getItem('team_serie');
    };
  
    var setTeamSerie = function(serie) {
        localStorage.setItem('team_serie', serie); 
    };

    var getSite = function() {
      return localStorage.getItem('app_site');
    };
  
    var setSite = function(site) {
        localStorage.setItem('app_site', site); 
    };

    var getCountry = function() {
      return localStorage.getItem('app_country');
    };
  
    var setCountry = function(country) {
        localStorage.setItem('app_country', country); 
    };

    var getLang = function() {
      return localStorage.getItem('app_lang');
    };
  
    var setLang = function(lang) {
        localStorage.setItem('app_lang', lang); 
    };

    var getUserIdInTeam = function() {
      return localStorage.getItem('user_id_team');
    };
  
    var setUserIdInTeam = function(id) {
        localStorage.setItem('user_id_team', id); 
    };

    var getUserUid = function() {
      return localStorage.getItem('user_uid');
    };
  
    var setUserUid = function(id) {
        localStorage.setItem('user_uid', id); 
    };
  
    var initialize = function(alias ,age, avatar, gender, region, uid) {
        localStorage.setItem('user_alias', alias); 
        localStorage.setItem('user_age', age); 
        localStorage.setItem('user_avatar', avatar); 
        localStorage.setItem('user_gender', gender); 
        localStorage.setItem('user_region', region); 
        localStorage.setItem('user_uid', uid); 
    };
  
    var clearUser = function() {
        let site = localStorage.getItem('app_site');
        let country = localStorage.getItem('app_country');
        let session_id = localStorage.getItem('user_session_id');
        let session_date = localStorage.getItem('user_session_date');
        let app_lang = localStorage.getItem('app_lang');
        localStorage.clear();
        localStorage.setItem('app_site', site);
        localStorage.setItem('app_country', country); 
        localStorage.setItem('user_session_id', session_id);
        localStorage.setItem('user_session_date', session_date); 
        localStorage.setItem('app_lang', app_lang); 
    };

    var getUser = function() {
      return {
        age: localStorage.getItem('user_age'),
        alias: localStorage.getItem('user_alias'),
        avatar: localStorage.getItem('user_avatar'),
        email: localStorage.getItem('user_email'),
        gender: localStorage.getItem('user_gender'),
        region: localStorage.getItem('user_region'),
        room: localStorage.getItem('user_room'),
        team: localStorage.getItem('user_team')
      };
    };

    const getSiteType = () => {
      let host = window.location.hostname;
      if(host !== "localhost" && host !== "jeumeetic.web.app"){
          let domain = host.split(".");
          if(domain[1] === "livegameevents"){
              return "core";
          }
          else {
              return "senior";
          }
      }
      else {
          return "senior";
      }
    }

    const getSiteLang = () => {
        let host = window.location.hostname;
        if(host !== "localhost" && host !== "jeumeetic.web.app"){
            let domain = host.split(".");
            switch(domain[0]){
              case "meetic-fr":
              case "fr":
                return "fr";
              case "meetic-it":
              case "it":
                return "it";
              case "match-uk":
              case "uk":
                return "uk";
              case "meetic-es":
              case "es":
                return "sp";
              case "match-se":
              case "se":
                return "sw";
              case "lovescout24":
              case "de":
                return "gm";
              case "lexa":
              case "nl":
                return "nl";
              default:
                return "fr";
            }
        }
        else {
            return "fr";
        }
    }
  
    return {
        getAlias: getAlias,
        setAlias: setAlias,
        getAge: getAge,
        setAge: setAge,
        getRegion: getRegion,
        setRegion: setRegion,
        getAvatar: getAvatar,
        setAvatar: setAvatar,
        getEmail: getEmail,
        setEmail: setEmail,
        getGender: getGender,
        setGender: setGender,
        getUser: getUser,
        getRoom: getRoom,
        setRoom: setRoom,
        getTeam: getTeam,
        setTeam: setTeam,
        getSessionDate: getSessionDate,
        setSessionDate: setSessionDate,
        getSessionId: getSessionId,
        setSessionId: setSessionId,
        getLikes: getLikes,
        setLikes: setLikes,
        clearUser: clearUser,
        initialize: initialize,
        getActiveChat: getActiveChat,
        setActiveChat: setActiveChat,
        getTeamSerie: getTeamSerie,
        setTeamSerie: setTeamSerie,
        getSite: getSite,
        setSite: setSite,
        getCountry: getCountry,
        setCountry: setCountry,
        getLang: getLang,
        setLang: setLang,
        getSiteType: getSiteType,
        getSiteLang: getSiteLang,
        getUserIdInTeam: getUserIdInTeam,
        setUserIdInTeam: setUserIdInTeam,
        getUserUid: getUserUid,
        setUserUid: setUserUid
    }
  
  })();
  
export default UserProfile;