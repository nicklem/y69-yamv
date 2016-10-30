/*
 ************************
 ** By                 **
 ** Nicola Klemenc     **
 ** github.com/nicklem **
 ** http://y69.tech    **
 ** nick@y69.tech      **
 ************************
 */

var UTIL = ( function() {

  var timeExec = function( f , context ) {
    const VALUE = 0 , UNIT = 1 ;
    var c = context || this ;
    var initTime = performance.now();
    f.bind( c )() ;
    var endTime = performance.now();
    var t = ( endTime - initTime ) ;
    var mSecOrSec = t > 1000 ? [ 1 , "&nbsp;&nbsp;s" ] : [ 1000 ,  "&nbsp;ms" ] ;
    var delta = Math.round( mSecOrSec[ VALUE ] * t ) / 1000 ;
    return delta + mSecOrSec[ UNIT ] ;
  } ;

  var consoleLog = function( msg , data ) {
    var renderContainer = document.querySelector( "#console" ) ;
    formattedMsg =  "<div class=\"console-msg\">" + msg + "</div>" ;
    formattedData = data ? "<div class=\"console-data\">" + data + "</div>" : "" ;
    renderContainer.innerHTML = renderContainer.innerHTML + formattedMsg + formattedData ;
  } ;

  var API = {
    "timeExec" : timeExec ,
    "consoleLog" : consoleLog ,
  } ;

  return API ;
} () ) ; // END util
