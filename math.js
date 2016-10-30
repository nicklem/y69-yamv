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

  var rotComplex = function rotComplex( c , rot ) {
    var curPixRotOffset = ( c[ 0 ] + xRotBoundOffset ) + ( c[ 1 ] + yRotBoundOffset ) * xPixWidth ;
    //var rotTransform = rot + toPixPhi[ curPixRotOffset ] ;
    var rotTransform = rot ;
    return  [
      Math.floor( xPixWidth / 2 + Math.cos( rotTransform ) * toPixMod[ curPixRotOffset ] ) ,
      Math.floor( yPixWidth / 2 + Math.sin( rotTransform ) * toPixMod[ curPixRotOffset ] ) ,
    ];
  } ;

  var API = {
    "bezier4"    : bezier4 ,
    "toRad"      : toRad ,
    "toDeg"      : toDeg ,
    "modulus"    : modulus ,
    "rotComplex" : rotComplex ,
  } ;

  return API ;
} () ) ; // END MATH

