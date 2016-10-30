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
    var c = context || window ;
    var initTime = performance.now();
    f.bind( c )() ;
    var endTime = performance.now();
    return Math.round( endTime - initTime ) + "&nbsp;ms";
  } ;

  var consoleLog = function( msg , data ) {
    var renderContainer = document.querySelector( "#console" ) ;
    formattedMsg =  "<div class=\"console-msg\">" + msg + "</div>" ;
    formattedData = data ? "<div class=\"console-data\">" + data + "</div>" : "" ;
    renderContainer.innerHTML = renderContainer.innerHTML + formattedMsg + formattedData ;
  } ;

  var API = {
    "timeExec"    : timeExec ,
    "consoleLog"  : consoleLog ,
  } ;

  return API ;
} () ) ; // END util
