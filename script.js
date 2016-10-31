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
//

var APP = ( function APP() {

  var updateOptions = function( ev ) {
    CONTROLS.mapToOptions() ;
    OPT.updateIterOnClick() ;
    PLANE.updateDrawParams( ev ) ;
  } ;

  var initControls = function() {
    CONTROLS.init();
    CONTROLS.listen() ;
  } ;
  
  var updateControls = function() {
    CONTROLS.createControls() ;
    CONTROLS.render() ;
  } ;
  
  var logSettings = function() {
    UTIL.consoleLog( "Web workers" , ITER.hasWorkers ? "Present" : "Not present" ) ;
    UTIL.consoleLog( "Max threads" , ITER.hasWorkers ? ITER.maxThreads() : 1 ) ;
  } ;
  
  var render = function render() {
    CANVAS.init() ;
    PLANE.setPixWidths( CANVAS.getWidth() , CANVAS.getHeight() ) ;
    PLANE.setDeltasPerPixel() ;
    PLANE.setPToCArrays() ;
    ITER.initCalc( PLANE.getTotalPixelNumber() ) ;
    ITER.execCalc() ;
    return this ;
  } ;

  var listen = function listen() {
    CANVAS.getCanvas().addEventListener( "click" , function( ev ) {
      updateOptions( ev ) ;
      render() ;
      updateControls() ;
    }.bind( this ) ) ;
    return this ;
  } ;

  var main = function() {
    logSettings() ;
    initControls() ;
    render() ;
    listen() ;
    return this ;
  } ;

  return {
    "main" : main 
  } ;

} () ) ;
