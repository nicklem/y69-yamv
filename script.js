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
      this.MAX = 255 ,         // max mandelbrot walue after which we conclude function diverges
      this.WHITE = 255 ,
      this.ZOOM_FACTOR = 1.5 ; // zoom factor upon click
      return this ;
    }.bind( {} ) () ) ;

    var $mBrot = ( function $mBrot() {

      // SETTINGS

      // UTILITY VARS

      var canvas = document.querySelector( "canvas" ) ;
      var ctx = canvas.getContext( "2d" ) ;
      var pixel = ctx.createImageData(1,1);
      var pData = pixel.data;

      // INIT PRIVATE VARS

      var zoom = 1 ;
      var numIter = 30 ;
      var xCenter = yCenter = 0 ;
      // TODO: remove magic constants. These are good starting values to envelop fractal
      var xMin = -2 , xMax = 1 , yMin = -1.5 , yMax = 1.5 ;
      var xCoordArr = [] ,
      yCoordArr = [] ;
      var xRes , yRes , xCanvasCenter , yCanvasCenter , screenRatio ;

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

      // VIEW
      var colors = [] ;

      // TODO: create save() function
      //xMin = -0.4899598471158813 ; yMin = -0.6323218318998093 ; xMax = -0.47625789755275433 ; yMax = -0.6186198823366823 ;

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
        for( var i = 1 ; i <= numIter ; i ++ ) {
          z = this.complexSum( this.complexMult( z , z ) , c ) ;
          modZ = this.modulus( z ) ;
          if( modZ > $mBrotOptions.MAX ) return colors[ i ] ;
        }
        return colors[ numIter ] ;
      } ;

      this.pixRender = function pixRender( pixRGB , xCanvasCoord , yCanvasCoord ) {
        pData[0] = pData[1] = pData[2] = pixRGB ;
        pData[3] = 255 ;
        ctx.putImageData( pixel, xCanvasCoord , yCanvasCoord ); 
      } ;

      this.updateColorArr = function() {
        colors = [] ;
        for( var col = numIter ; col >= 0 ; col-- ) {
          //for( var col = 0 ; col <= numIter ; col++ ) {
          colors.push( $mBrotOptions.WHITE / Math.exp( col / 10 ) ) ;
          //colors.push( WHITE / Math.exp( col * ( zoom / 10 ) ) ) ;
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

        this.updateConditions = function updateConditions() {

          zoom *= $mBrotOptions.ZOOM_FACTOR ;
          numIter += 2 ;
          this.updateColorArr() ;
          xCenter = ( ( xCanvasCenter / xRes ) * ( xMax - xMin ) ) + xMin ;
          yCenter = ( ( yCanvasCenter / yRes ) * ( yMax - yMin ) ) + yMin ;

          xMin = xCenter - screenRatio * ( 2 / zoom ) ;
          xMax = xCenter + screenRatio * ( 2 / zoom ) ;
          yMin = yCenter - ( 2 / zoom ) ;
          yMax = yCenter + ( 2 / zoom ) ;

          return this ;
        } ;

        this.render = function render() {
          this.populateCoordArrays() ;

          var that = this ;
          yCoordArr.forEach( function( yCoord , yCanvasCoord ) { 
            xCoordArr.forEach( function( xCoord , xCanvasCoord ) { 
              that.pixRender( that.mandelDot( xCoord , yCoord ) , xCanvasCoord , yCanvasCoord ) ;
            } ) ;
          } ) ;
        } ;

        this.init = function init() {
          this.updateColorArr() ;
          this.render() ;
          return this ;
        } ;

        this.listen = function listen() {
          var that = this ;
          canvas.addEventListener( 'click' , function( ev ) {
            xCanvasCenter = ev.layerX - canvas.offsetLeft ;
            yCanvasCenter = ev.layerY - canvas.offsetTop ;
            that.updateConditions().render() ;
          } ) ;
          return this ;
        } ;

        return this ;

      }.bind({}) () ) ;

      var $mBrotControls = ( function() {
        // private
        var form = document.querySelector( "#ctrl" ) ;
        // public
        this.init = function() {
          form.addEventListener( "submit" , function( ev ) {
            ev.preventDefault() ;
            var invertColors = this.elements[ "invert-colors" ].checked ;
            $mBrot.initCanvas().init().listen() ;
            console.log( invertColors ) ;
          } ) ;
        } ;
        return this ;
      }.bind({}) () ) ; 

      // Let's Roll!
      $mBrotControls.init() ;

    }
  }
