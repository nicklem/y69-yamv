/*
 ************************
 ** By                 **
 ** Nicola Klemenc     **
 ** github.com/nicklem **
 ** http://y69.tech    **
 ** nick@y69.tech      **
 ************************
 */

var MATH = ( function() {

  var bezier4 = function( P0 , P1 , P2 , P3 , t ) {
    var tN = 1 - t , tN2 = tN * tN , t2  =  t *  t ;
    return tN2 * tN * P0 + 3 * tN2 * t * P1 + 3 * tN * t2 * P2 + t * t2 * P3 ;
  } ;
  var toRad = function( deg ) { return ( Math.PI / 180 ) * deg ; } ;
  var toDeg = function( rad ) { return ( 180 / Math.PI ) * rad ; } ;
  var modulus = function( val ) { return val * Math.sign( val ) ; } ;

  var xRotOffset = function( x , y  , theta ) {
    return ( x - ( x * Math.cos( theta ) + y * Math.sin( theta ) ) ) ;
  } ;

  var yRotOffset = function( x , y , theta ) {
    return ( y + ( x * Math.sin( theta ) - y * Math.cos( theta ) ) ) ;
  } ;

  var xRot = function( x , y , theta ) {
    return ( x * Math.cos( theta ) - y * Math.sin( theta ) ) ;
  } ;

  var yRot = function( x , y , theta ) {
    return ( x * Math.sin( theta ) + y * Math.cos( theta ) ) ;
  } ;

  var rotComplex = function rotComplex( c , rot ) {
    var x = c[ 0 ] , y = c[ 1 ] ;
    return [ xRot( x , y , rot ) , yRot( x , y , rot ) ] ;
  } ;

  var API = {
    "bezier4"    : bezier4 ,
    "toRad"      : toRad ,
    "toDeg"      : toDeg ,
    "modulus"    : modulus ,
    "rotComplex" : rotComplex ,
    "xRotOffset" : xRotOffset ,
    "yRotOffset" : yRotOffset ,
  } ;

  return API ;
} () ) ; // END MATH

