/*
 ************************
 ** By                 **
 ** Nicola Klemenc     **
 ** github.com/nicklem **
 ************************
 */

var UTIL = ( function() {

  var timeExec = function( f , context ) {
    var initTime = performance.now();
    // f.bind( context || window )() ;
    f() ;
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
