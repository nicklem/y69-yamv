/*
 ************************
 ** By                 **
 ** Nicola Klemenc     **
 ** github.com/nicklem **
 ** http://y69.tech    **
 ** nick@y69.tech      **
 ************************
 */

document.onreadystatechange = function() {
  if( document.readyState == 'interactive' ) {

    "use strict" ;

    var $mBrotOptions = ( function() {
      this.MAX   = 255 , // max mandelbrot value after which we conclude function diverges
      this.WHITE = 255 ,
      this.ZOOM  = 1.5 ; // zoom factor upon click
      this.ITER  = 30  ;
      //this.AA    = false ;
      return this ;
    }.bind( {} ) () ) ;

    var $mBrot = ( function $mBrot() {

      // UTILITY VARS
      //
      var canvas = document.querySelector( "canvas" ) ;
      var ctx = canvas.getContext( "2d" ) ;
      var pixel = ctx.createImageData(1,1);
      var pData = pixel.data;

      // INIT PRIVATE VARS

      var zoom = 1 ;
      var xCenter = yCenter = 0 ;
      // TODO: remove magic constants. These are good starting values to envelop fractal
      var xMin = -2 , xMax = 1 , yMin = -1.5 , yMax = 1.5 ;
      var xCoordArr = [] ,
      yCoordArr = [] ;
      var xRes , yRes , xCanvasCenter , yCanvasCenter , screenRatio ;

      // VIEW

      var colors = [] ;

      // INIT

      this.initCanvas = function() {
        var initHeight = function() { var idealX = ( yMax - yMin ) * ( xRes / yRes ) ; xMin = -3/5 * idealX ; xMax = 2/5 * idealX ; }
        var initWidth = function() { var idealY = ( yMax - yMin ) * ( yRes / xRes ) ; yMin = - idealY / 2 ; yMax = idealY / 2 ; }

        var vWidth = window.innerWidth || 300 ;
        var vHeight = window.innerHeight || 300 ;

        canvas.width = xRes = vWidth ;
        canvas.height = yRes = vHeight ;
        screenRatio = vWidth / vHeight ;

        ( vWidth > vHeight ? initHeight : initWidth )() ;

        return this ;
      } ;

      // UTILITY FUNCTIONS

      this.complexMult = function complexMult( c1 , c2 ) {
        var a = c1[ 0 ] , b = c1[ 1 ] , c = c2[ 0 ] , d = c2[ 1 ] ;
        return [ ( a*c - b*d ) , ( a*d + b*c ) ] ;
      } ;

      this.complexSum = function complexSum( c1 , c2 ) {
        var a = c1[ 0 ] , b = c1[ 1 ] , c = c2[ 0 ] , d = c2[ 1 ] ;
        return [ ( a + c ) , ( b + d ) ] ;
      } ;

      this.modulus = function modulus( c1 ) {
        var a = c1[ 0 ] , b = c1[ 1 ] ;
        return Math.sqrt( a*a + b*b ) ;
      } ;

      this.mandelDot = function mandelDot( x , y ) {
        var z = [ 0 , 0 ] , modZ = 0 , c = [ x , y ] ;
        for( var i = 1 ; i <= $mBrotOptions.ITER ; i ++ ) {
          z = this.complexSum( this.complexMult( z , z ) , c ) ;
          modZ = this.modulus( z ) ;
          if( modZ > $mBrotOptions.MAX ) return colors[ i ] ;
        }
        return colors[ $mBrotOptions.ITER ] ;
      } ;

      this.pixRender = function pixRender( pixRGB , xCanvasCoord , yCanvasCoord ) {
        pData[0] = pData[1] = pData[2] = pixRGB ; pData[3] = 255 ;
        ctx.putImageData( pixel, xCanvasCoord , yCanvasCoord ); 
      } ;

      this.updateColorArr = function() {
        colors = [] ;
        for( var col = $mBrotOptions.ITER ; col >= 0 ; col-- ) {
          colors.push( $mBrotOptions.WHITE / Math.exp( col / 10 ) ) ;
        }
      } ;

      this.populateCoordArrays = function populateCoordArrays() {
        var deltaX = ( xMax - xMin ) / xRes ,
        deltaY = ( yMax - yMin ) / yRes ;
        for( var i = 0 ; i <= xRes ; i ++ ) {
          xCoordArr[i] = xMin + ( deltaX * i ) ;
        }
        for( var i = 0 ; i <= yRes ; i ++ ) {
          yCoordArr[i] = yMin + ( deltaY * i ) ;
        }
        return this;
      } ;

      this.updateColors = function updateColors() {
        this.updateColorArr() ;
        return this ;
      } ;

      this.updatePosition = function updatePosition( ev ) {
        xCanvasCenter = ev.layerX - canvas.offsetLeft ;
        yCanvasCenter = ev.layerY - canvas.offsetTop ;
        zoom *= $mBrotOptions.ZOOM ;
        $mBrotOptions.ITER += 2 ;
        xCenter = ( ( xCanvasCenter / xRes ) * ( xMax - xMin ) ) + xMin ;
        yCenter = ( ( yCanvasCenter / yRes ) * ( yMax - yMin ) ) + yMin ;
        xMin = xCenter - screenRatio * ( 2 / zoom ) ;
        xMax = xCenter + screenRatio * ( 2 / zoom ) ;
        yMin = yCenter - ( 2 / zoom ) ;
        yMax = yCenter + ( 2 / zoom ) ;
        return this ; 
      } ;

      this.draw = function draw() {
        this.populateCoordArrays() ;
        var that = this ;
        yCoordArr.forEach( function( yCoord , yCanvasCoord ) { 
          xCoordArr.forEach( function( xCoord , xCanvasCoord ) { 
            that.pixRender( that.mandelDot( xCoord , yCoord ) , xCanvasCoord , yCanvasCoord ) ;
          } ) ;
        } ) ;
      } ;

      this.render = function render() {
        this.updateColors().draw() ;
      } ;

      this.init = function init() {
        this.updateColorArr() ;
        this.draw() ;
        return this ;
      } ;

      this.listen = function listen() {
        var that = this ;
        canvas.addEventListener( 'click' , function( ev ) {
          that.updatePosition( ev ).render() ;
          $mBrotControls.render() ;
        } ) ;
        return this ;
      } ;

      return this ;

    }.bind({}) () ) ;

    var $mBrotControls = ( function() {

      // private
      var form = document.querySelector( "#ctrl" ) ;
      var optionDisplay = document.querySelector( "#option-display" ) ;
      var controls = [] ;

      // public
      this.init = function() {
        this.render() ;
        return this ;
      } ;

      this.createControls = function() {
        // TODO improve this
        controls = [] ;
        for( var opt in $mBrotOptions ) {
          var n = document.createElement( "span" ) ;
          n.id = opt ;
          var txt = document.createTextNode( opt ) ;
          var i = document.createElement( "input" ) ;
          i.type = "text" ;
          i.name = opt ;
          i.value = $mBrotOptions[ opt ] ;
          i.size = 4 ;
          //n.innerHTML = "" ;
          n.appendChild( txt ) ;
          n.appendChild( document.createElement( "br" ) ) ;
          n.appendChild( i ) ;
          n.appendChild( document.createElement( "br" ) ) ;
          controls.push( n ) ;
        }
        return this ;
      }

      this.listen = function() {
        form.addEventListener( "submit" , function( ev ) {
          ev.preventDefault() ;
          for( var opt in $mBrotOptions ) {
            if( form.hasOwnProperty( opt ) ) {
              $mBrotOptions[ opt ] = parseFloat( form.elements[ opt ].value ) ;
            }
          }
          $mBrot.render() ;
        } ) ;
        return this ;
      } ;

      this.render = function() {
        //TODO improve this
        this.createControls() ;
        optionDisplay.innerHTML = "" ;
        controls.forEach( function( el ) {
          optionDisplay.appendChild( el ) ;
        } ) ; 
        return this;
      } ;

      return this ;

    }.bind({}) () ) ; 

    $mBrot.initCanvas().init().listen() ;
    $mBrotControls.init().listen() ;
  }
}
