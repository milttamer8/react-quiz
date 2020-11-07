import React from 'react';
import $ from 'jquery';
import './CircleProgressBar.css';

export default class CircleProgressBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      count: this.props.allottedTime,
      running: true,
    }
  }

  componentDidMount(){
    console.log("componentDidMount");
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
    var countdown = this.props.allottedTime;
    this.timer = setInterval(() => {
      countdown--;

      if(this.props.withCounter === true){
        if($("#counter-numbers-timer") && countdown >= 0){
          $("#counter-numbers-timer").html(this.renderFormattedRemainingTime(countdown));
        }
      }

      if(countdown < 1){
        clearInterval(this.timer);
        console.log("timeup");
        this.handleTimeUp();
      }
    }, 1000);
    document.querySelector("#circle-countdown svg circle").style.animationDuration = countdown + "s";
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