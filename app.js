/*
 ************************
 ** By                 **
 ** Nicola Klemenc     **
 ** github.com/nicklem **
 ** http://y69.tech    **
 ** nick@y69.tech      **
 ************************
 */

// TODO:
// display coord bounds and save coord history vector
// antialiasing
// image export
// mobile styles

var APP = ( function APP() {

  var initControls = function() {
    CONTROLS.init();
    CONTROLS.listen() ;
  } ;

  var initCanvas = function() {
    CANVAS.init() ;
  } ;
  
  var initOptions = function() {
    OPT.optFromGET() ;
    OPT.autoThread() ;
  } ;

  var updateControls = function() {
    CONTROLS.createControls() ;
    CONTROLS.render() ;
  } ;

  var updateOptions = function( ev ) {
    CONTROLS.mapToOptions() ;
    OPT.updateIterOnClick() ;
    PLANE.updateDrawParams( ev ) ;
  } ;

  var setClickOnCanvas = function( f ) {
    CANVAS.getCanvas().addEventListener( "click" , f.bind( this ) ) ;
  } ;
  
  var setPlane = function() {
    PLANE.setPixWidths( CANVAS.getWidth() , CANVAS.getHeight() ) ;
    PLANE.setDeltasPerPixel() ;
    PLANE.setPToCArrays() ;
  } ;
  
  var execCalc = function() {
    ITER.initCalc() ;
    ITER.execCalc() ;
  } ;
  
  var logSettings = function() {
    UTIL.consoleLog( "Web workers" , ITER.hasWorkers ? "Present" : "Not present" ) ;
    UTIL.consoleLog( "Max threads" , ITER.hasWorkers ? ITER.maxThreads() : 1 ) ;
  } ;
  
  var render = function render() {
    initCanvas() ;
    setPlane() ;
    execCalc() ;
  } ;

  var listen = function listen() {
    setClickOnCanvas( function( ev ) {
      updateOptions( ev ) ;
      updateControls() ;
      render() ;
    } ) ;
  } ;

  var main = function() {
    logSettings() ;
    initOptions() ;
    initControls() ;
    render() ;
    listen() ;
    return this ;
  } ;

  return { "main" : main } ;
} () ) ;
