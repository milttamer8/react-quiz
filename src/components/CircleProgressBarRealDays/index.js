import React from 'react';
import $ from 'jquery';

export default class CircleProgressBarRealDays extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      running: true,
    }
  }

  componentDidMount(){
    console.log("componentDidMount CircleProgressBarRealDays");
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

      if($("#countdown-number-days")){
        let rsDays = this.renderDays(countdown);
        if(rsDays >= 0){
          $("#countdown-number-days").html(rsDays);
        }
      }

      if($("#countdown-number-hours")){
        let rsHours = this.renderHours(countdown);
        if(rsHours >= 0){
          $("#countdown-number-hours").html(rsHours);
        }
      }

      if($("#countdown-number-minutes")){
        let rsMinutes = this.renderMinutes(countdown);
        if(rsMinutes >= 0){
          $("#countdown-number-minutes").html(rsMinutes);
        }
      }

      if($("#countdown-number-seconds")){
        let rsSeconds = this.renderSeconds(countdown);
        if(rsSeconds >= 0){
          $("#countdown-number-seconds").html(rsSeconds);
        }
      }

      if(countdown < 3600 && countdown > 3595){
        console.log("openevent");
        this.handleOpenEvent();
      }

      if(countdown < 1){
        clearInterval(this.timer);
        console.log("timeup");
        this.handleTimeUp();
      }
    }, 1000);
    //document.querySelector("#circle-countdown-minutes svg circle").style.animationDuration = Math.floor(3600 - (countdown / 60)) + "s";
    //document.querySelector("#circle-countdown-seconds svg circle").style.animationDuration = Math.floor(60 - (countdown % 60)) + "s";
  }

  parseISOLocal(s) {
    var b = s.split(/\D/);
    return new Date(b[0], b[1]-1, b[2], b[3], b[4], b[5]);
  }

  renderDays(totalSeconds) {
    let days = Math.floor(totalSeconds / 86400);
    return this.addLeadingZeros(days);
  }

  renderHours(totalSeconds) {
    let hours = Math.floor((totalSeconds % 86400) / 3600)
    return this.addLeadingZeros(hours);
  }

  renderMinutes(totalSeconds) {
    let minutes = Math.floor(((totalSeconds % 86400) % 3600) / 60);
    return this.addLeadingZeros(minutes);
  }

  renderSeconds(totalSeconds) {
    let seconds =  ((totalSeconds % 86400) % 3600) % 60;
    return this.addLeadingZeros(seconds);
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

  handleOpenEvent(){
    this.props.oneHourReached();
  }
  
  render() {
    const {langs} = this.props;
    return (
      <div className="countDownTimerContent">
        <div className="circle-countdown" id="circle-countdown-days">
          <p className="countdown-number" id="countdown-number-days"></p>
          <h4 className="sttr">{langs[0]}</h4>
        </div>
        
        <div className="circle-countdown" id="circle-countdown-hours">
          <p className="countdown-number" id="countdown-number-hours"></p>
          <h4 className="sttr">{langs[1]}</h4>
        </div>

        <div className="circle-countdown" id="circle-countdown-minutes">
          <p className="countdown-number" id="countdown-number-minutes"></p>
          <h4 className="sttr">{langs[2]}</h4>
        </div>

        <div className="circle-countdown" id="circle-countdown-seconds">
          <p className="countdown-number" id="countdown-number-seconds"></p>
          <h4 className="sttr">{langs[3]}</h4>
        </div>
      </div>
    )
  }
}