import React from 'react';
import $ from 'jquery';

export default class CircleProgressBarReal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      running: true,
    }
  }

  componentDidMount(){
    console.log("componentDidMount CircleProgressBarReal");
    this.handleStart();
  }
  
  componentDidUpdate(prevProps, prevState) {
    if(this.state.running !== prevState.running){
      switch(this.state.running) {
        case true:
          this.handleStart();
      }
    }
  }

  componentWillUnmount() {
    console.log("Greeting unmounted...");
    clearInterval(this.timer);
  }
  
  handleStart() {
    var date = this.props.date;
    let countdown = (Date.parse(this.parseISOLocal(date)) - Date.parse(new Date())) / 1000;
    this.timer = setInterval(() => {
      countdown = (Date.parse(this.parseISOLocal(date)) - Date.parse(new Date())) / 1000;

      if(this.props.withCounter === true && countdown >= 0){
        if($("#counter-numbers-timer")){
          $("#counter-numbers-timer").html(this.renderFormattedRemainingTime(countdown));
        }
      }

      if(countdown < 1){
        console.log("timeup");
        this.handleTimeUp();
        clearInterval(this.timer);
      }
    }, 1000);
    document.querySelector("#circle-countdown svg circle").style.animationDuration = countdown + "s";
  }

  parseISOLocal(s) {
    var b = s.split(/\D/);
    return new Date(b[0], b[1]-1, b[2], b[3], b[4], b[5]);
  }

  renderFormattedRemainingTime(totalSeconds) {
    if(this.props.symbol === "letter"){
      let seconds = totalSeconds % 60;
      return seconds + "s";
    }
    else if(this.props.symbol === "number"){
      let hours = Math.floor(totalSeconds / 3600);
      totalSeconds %= 3600;
      let minutes = Math.floor(totalSeconds / 60);
      let seconds = totalSeconds % 60;
      let textHour = '';
      if(hours > 0){
          textHour = hours + "'''";
      }
      return textHour + (minutes !== 0 ? minutes + "'" + this.addLeadingZeros(seconds) + "''" : this.addLeadingZeros(seconds) + "''");
    }
  }

  addLeadingZeros(value) {
    value = String(value);
    while (value.length < 2) {
      value = '0' + value;
    }
    return value;
  }
  
  handleStop() {
    if(this.timer) {
      clearInterval(this.timer);
      this.setState(
        {running:false}
      );      
    }
  }

  handleTimeUp(){
    this.handleStop();
    this.props.timeUp();
  }
  
  render() {
    return (
      <div id="circle-countdown">
        <div id="countdown-number"></div>
        <svg>
          <circle r="35" cx="40" cy="40"></circle>
        </svg>
      </div>
    )
  }
}