import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { CountdownCircleTimer } from "react-countdown-circle-timer";

const renderTime = (dimension, time) => {
  return (
    <div className="time-wrapper">
      <div className="time">{time}</div>
      <div>{dimension}</div>
    </div>
  );
};

const timerProps = {
  isPlaying: true,
  size: 100,
  strokeWidth: 6
};

class CountdownSession extends Component {
  constructor(props) {
    super(props);

    this.state = {
      days: 0,
      hours: 0,
      min: 0,
      sec: 0,
    }
  }

  componentDidMount() {
    // update every second
    this.interval = setInterval(() => {
      const date = this.calculateCountdown(this.props.date);
      if(date){
        this.setState(date);
      }
      else {
        this.stop();
        if(this.props.from === "waiting-room" || this.props.from === "home" || this.props.from === "matchmaking-failure"){
          console.log("stop");
          this.props.dateReached();
        }
      }
      //date ? this.setState(date) : this.stop();
    }, 1000);
  }

  componentWillUnmount() {
    this.stop();
  }

  parseISOLocal(s) {
    var b = s.split(/\D/);
    return new Date(b[0], b[1]-1, b[2], b[3], b[4], b[5]);
  }
  

  calculateCountdown(endDate) {
    let diff = (Date.parse(this.parseISOLocal(endDate)) - Date.parse(new Date())) / 1000;

    // clear countdown when date is reached
    if (diff <= 0) return false;
    
    // 1h before => open sign in
    if(diff === 3600){
      if(this.props.from === "home"){
        this.props.openEvent();
      }
    }

    const timeLeft = {
      years: 0,
      days: 0,
      hours: 0,
      min: 0,
      sec: 0,
      millisec: 0,
    };

    // calculate time difference between now and expected date
    if (diff >= (365.25 * 86400)) { // 365.25 * 24 * 60 * 60
      timeLeft.years = Math.floor(diff / (365.25 * 86400));
      diff -= timeLeft.years * 365.25 * 86400;
    }
    if (diff >= 86400) { // 24 * 60 * 60
      timeLeft.days = Math.floor(diff / 86400);
      diff -= timeLeft.days * 86400;
    }
    if (diff >= 3600) { // 60 * 60
      timeLeft.hours = Math.floor(diff / 3600);
      diff -= timeLeft.hours * 3600;
    }
    if (diff >= 60) {
      timeLeft.min = Math.floor(diff / 60);
      diff -= timeLeft.min * 60;
    }
    timeLeft.sec = diff;

    return timeLeft;
  }

  stop() {
    clearInterval(this.interval);
  }

  addLeadingZeros(value) {
    value = String(value);
    while (value.length < 2) {
      value = '0' + value;
    }
    return value;
  }

  render() {
    const countDown = this.state;

    return (
      <div className="Countdown">
        <span className="Countdown-col">
          <span className="Countdown-col-element">
              <strong>{this.addLeadingZeros(countDown.days)}</strong>
              <span>{countDown.days === 1 ? 'Day' : 'Days'}</span>
          </span>
        </span>

        <span className="Countdown-col">
          <span className="Countdown-col-element">
            <strong>{this.addLeadingZeros(countDown.hours)}</strong>
            <span>Hours</span>
          </span>
        </span>


        <span className="Countdown-col">
          <span className="Countdown-col-element">
            <strong>{this.addLeadingZeros(countDown.min)}</strong>
            <span>Min</span>
          </span>
        </span>

        <span className="Countdown-col">
          <span className="Countdown-col-element">
            <strong>{this.addLeadingZeros(countDown.sec)}</strong>
            <span>Sec</span>
          </span>
        </span>
        <CountdownCircleTimer
          {...timerProps}
          colors={[["#218380"]]}
          duration={countDown.sec}
        >
          {({ elapsedTime }) =>
            renderTime("seconds", elapsedTime)
          }
        </CountdownCircleTimer>
      </div>
    );
  }
}

CountdownSession.propTypes = {
  date: PropTypes.string.isRequired
};

CountdownSession.defaultProps = {
  date: new Date()
};

export default CountdownSession;