import React, {useEffect, useState} from "react";
import { CountdownCircleTimer } from "react-countdown-circle-timer";
import UserProfile from "../../session/UserProfile/index.js";
import * as Settings from '../../settings/constants.js';
import { useTranslation } from "react-i18next";

const minuteSeconds = 60;
const hourSeconds = 3600;
const daySeconds = 86400;

const addLeadingZeros = (value) => {
  value = String(value);
  while (value.length < 2) {
    value = '0' + value;
  }
  return value;
}

const getTimeSeconds = time => {
  return Math.floor(minuteSeconds - time);
}
const getTimeMinutes = time => {
  return Math.floor(time / minuteSeconds);
}
const getTimeHours = time => {
  return Math.floor(time / hourSeconds);
}
const getTimeDays = time => {
  return Math.floor(time / daySeconds);
}
const parseISOLocal = (s) => {
  var b = s.split(/\D/);
  return new Date(b[0], b[1]-1, b[2], b[3], b[4], b[5]);
}

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

export default function Countdown(props) {
  //const remainingTime = (Date.parse(parseISOLocal(props.date)) - Date.parse(new Date())) / 1000;
  const [remainingTime, setremainingTime] = useState((Date.parse(parseISOLocal(props.date)) - Date.parse(new Date())) / 1000);
  const [isPlaying, setisPlaying] = useState(true);
  const days = Math.ceil(remainingTime / daySeconds);
  const daysDuration = days * daySeconds;
  const color = UserProfile.getSite() === 'core' ? '#ed147d' : '#e55573';
  const {t} = useTranslation('common');

  const renderTime = (time, remainingTime) => {
    let timeLeft = (Date.parse(parseISOLocal(props.date)) - Date.parse(new Date())) / 1000;
    if(timeLeft === 0){
      console.log("dateReached");
      props.dateReached();
    }
    return (
      <div className="time-wrapper">
        <div className="time">{addLeadingZeros(time)}</div>
      </div>
    );
  };

  useEffect(() => {
    console.log("Countdown");
    return () => {
    }
  }, [])
  const { width } = useViewport();
  const breakpoint = Settings.MOBILE_BREAKPOINT;

  const timerProps = {
    isPlaying: true,
    size: width < breakpoint ? 50 : 60,
    strokeWidth: width < breakpoint ? 3 : 5
  };

  return (
    <div className="countdown" key={props.date}>
      <div className="countdown-item">
        <CountdownCircleTimer
          {...timerProps}
          colors={[[color]]}
          duration={daysDuration}
          trailColor={"#ffffff"}
          rotation={"counterclockwise"}
          initialRemainingTime={remainingTime}
          >
          {({ remainingTime }) =>
            renderTime(getTimeDays(remainingTime), remainingTime)
          }
        </CountdownCircleTimer>
        <span className="dimension">{t('days.title')}</span>
      </div>
      <div className="countdown-item">
        <CountdownCircleTimer
          {...timerProps}
          colors={[[color]]}
          duration={daySeconds}
          trailColor={"#ffffff"}
          rotation={"counterclockwise"}
          initialRemainingTime={remainingTime % daySeconds}
          onComplete={totalElapsedTime => [
            remainingTime - totalElapsedTime > hourSeconds
          ]}
        >
          {({ remainingTime }) =>
            renderTime(getTimeHours(remainingTime), remainingTime)
          }
        </CountdownCircleTimer>
        <span className="dimension">{t('hours.title')}</span>
      </div>
      <div className="countdown-item">
        <CountdownCircleTimer
          {...timerProps}
          colors={[[color]]}
          duration={hourSeconds}
          trailColor={"#ffffff"}
          rotation={"counterclockwise"}
          initialRemainingTime={remainingTime % hourSeconds}
          onComplete={totalElapsedTime => [
            remainingTime - totalElapsedTime > minuteSeconds
          ]}
        >
          {({ remainingTime }) =>
            renderTime(getTimeMinutes(remainingTime), remainingTime)
          }
        </CountdownCircleTimer>
        <span className="dimension">{t('minutes.title')}</span>
      </div>
      <div className="countdown-item">
        <CountdownCircleTimer
          {...timerProps}
          colors={[[color]]}
          isPlaying={isPlaying}
          duration={minuteSeconds}
          trailColor={"#ffffff"}
          rotation={"counterclockwise"}
          initialRemainingTime={remainingTime % minuteSeconds}
          onComplete={totalElapsedTime => [remainingTime - totalElapsedTime > 0]}
        >
          {({ elapsedTime, remainingTime }) =>
            renderTime(getTimeSeconds(elapsedTime), remainingTime)
          }
        </CountdownCircleTimer>
        <span className="dimension">{t('seconds.title')}</span>
      </div>
    </div>
  );
}
