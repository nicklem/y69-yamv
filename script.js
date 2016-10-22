/*
 ************************
 ** By                 **
 ** Nicola Klemenc     **
 ** github.com/nicklem **
 ** http://y69.tech    **
 ** nick@y69.tech      **
 ************************
 */

//  TODO:
//  1d color picker
//  1d display coord bounds and save coord history vector
// .5d image export
//  2d mobile styles
//     publish!
//  ?d refactor

document.onreadystatechange = function() {
  if( document.readyState == 'interactive' ) {

    "use strict" ;

    var $mBrotOptions = ( function() {
      this.MAX         =   2 ,   // max mandelbrot value after which we conclude function diverges
      this.WHITE       = 255 ,
      this.ZOOM        =   3 ;   // zoom factor upon click
      this.ITER        =  25 ;   // initial iter value
      this.OUT_DIM_FAC =  10 ;
      //this.AA    = false ;
      return this ;
    }.bind( {} ) () ) ;

    var $mBrotUtil = ( function() {
      this.performanceExec = function( f , msg ) {
        var initDraw = performance.now();
        f() ;
        var endDraw = performance.now();
        var t = ( endDraw - initDraw ) ;
        var millisecondsOrSeconds = t > 1000 ? [ 1 , "s" ] : [ 1000 , "ms" ] ;
        var ms = Math.round( millisecondsOrSeconds[ 0 ] * t ) / 1000 ;
        console.log( msg + ": " + ms + " " + millisecondsOrSeconds[ 1 ] + ".") ;
      } ;
      return this ;
    }.bind( {} ) () ) ;

    var $mBrot = ( function $mBrot() {

      // UTILITY VARS
      //
      var canvas = document.querySelector( "canvas" ) ;
      var ctx , imgData ;

      // INIT PRIVATE VARS

      var zoom = 1 ;
      var maxSq = $mBrotOptions.MAX * $mBrotOptions.MAX ; // squared for efficiency
      var xCenter = yCenter = 0 ;
      // TODO: remove magic constants. These are good starting values to envelop fractal
      var xMin = -2 , xMax = 1 , yMin = -1.5 , yMax = 1.5 ;
      var xCoordArr = [] ,
      yCoordArr = [] ;
      var xRes , yRes , xCanvasCenter , yCanvasCenter , screenRatio , windowWidth , windowHeight ;
        windowHeight = window.innerHeight || 300 ;

      // VIEW

      var intensityRGB = [] , colorRGB = [] ;
      var R = 0 , G = 1 , B = 2 ;

      // INIT

      this.initCanvas = function() {
        var initHeight = function() { var idealX = ( yMax - yMin ) * ( xRes / yRes ) ; xMin = -3/5 * idealX ; xMax = 2/5 * idealX ; }
        var initWidth = function() { var idealY = ( yMax - yMin ) * ( yRes / xRes ) ; yMin = - idealY / 2 ; yMax = idealY / 2 ; }

        windowWidth = window.innerWidth || 300 ;
        windowHeight = window.innerHeight || 300 ;

        canvas.width = xRes = windowWidth ;
        canvas.height = yRes = windowHeight ;
        screenRatio = windowWidth / windowHeight ;

        ( windowWidth > windowHeight ? initHeight : initWidth )() ;

        ctx = canvas.getContext( "2d" ) ;
        imgData = ctx.getImageData( 0 , 0 , canvas.width , canvas.height ) ;

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

      this.modulusSquared = function modulus( c1 ) {
        var a = c1[ 0 ] , b = c1[ 1 ] ;
        return a*a + b*b ;
      } ;

      this.mandelDot = function mandelDot( x , y ) {
        var z = [ 0 , 0 ] , modZSq = 0 , c = [ x , y ] ;
        for( var i = 1 ; i <= $mBrotOptions.ITER ; i ++ ) {
          z = this.complexSum( this.complexMult( z , z ) , c ) ;
          modZSq = this.modulusSquared( z ) ;
          if( modZSq > maxSq ) return intensityRGB[ i ] ;
        }
        return intensityRGB[ $mBrotOptions.ITER ] ;
      } ;

      //this.pixRender = function pixRender( pixRGB , xCanvasCoord , yCanvasCoord ) {
      //var pixOffset = ( xCanvasCoord + yCanvasCoord * windowWidth ) * 4 ;
      //imgData.data[ pixOffset ] = imgData.data[ pixOffset + 1 ] = imgData.data[ pixOffset + 2 ] = pixRGB ; imgData.data[ pixOffset + 3 ] = 255 ;
      //} ;


      this.bezierInterpolate = function( P0 , P1 , P2 , t ) {
        return ( 1 - t ) * ( 1 - t ) * P0 + 2 * (1 - t ) * t * P1 + t * t * P2 ;
      } ;

      this.updateColorArr = function() {

        intensityRGB = [] ;
        colorRGB = [] ;

        var init = [ 255 , 255 , 255 ] ; // static init set to red    corresponds to Bezier P0
        var mid  = [   0 , 255 ,   0 ] ; // static mid set to green   corresponds to Bezier P1
        var end  = [   0 ,   0 , 255 ] ; // static mid set to blue    corresponds to Bezier P2

        for( var col = $mBrotOptions.ITER ; col >= 0 ; col-- ) {
          var curIntensity = $mBrotOptions.WHITE / Math.exp( col / $mBrotOptions.OUT_DIM_FAC ) ;
          var outerDimmingFactor = curIntensity / $mBrotOptions.WHITE ;
          //var outerDimmingFactor = 1 ;
          intensityRGB.push( curIntensity ) ;
          var bezierFactor = col / $mBrotOptions.ITER ;
          colorRGB.push( [
              this.bezierInterpolate( init[ R ] , mid[ R ] , end[ R ] , bezierFactor ) * outerDimmingFactor ,
              this.bezierInterpolate( init[ G ] , mid[ G ] , end[ G ] , bezierFactor ) * outerDimmingFactor ,
              this.bezierInterpolate( init[ B ] , mid[ B ] , end[ B ] , bezierFactor ) * outerDimmingFactor
          ] ) ;
        }
        console.log( colorRGB ) ;
        return this ;
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

      this.updateParams = function updateParams( ev ) {

        zoom *= $mBrotOptions.ZOOM ;
        maxSq = $mBrotOptions.MAX * $mBrotOptions.MAX ;
        $mBrotOptions.ITER += 2 ;

        if( !! ev ) { // onClick update, as opposed to form submit update
          // update center
          xCanvasCenter = ev.layerX - canvas.offsetLeft ;
          yCanvasCenter = ev.layerY - canvas.offsetTop ;
          // remap center to complex plane
          xCenter = ( ( xCanvasCenter / xRes ) * ( xMax - xMin ) ) + xMin ;
          yCenter = ( ( yCanvasCenter / yRes ) * ( yMax - yMin ) ) + yMin ;
          xMin = xCenter - screenRatio * ( 2 / zoom ) ;
          xMax = xCenter + screenRatio * ( 2 / zoom ) ;
          yMin = yCenter - ( 2 / zoom ) ;
          yMax = yCenter + ( 2 / zoom ) ;
        }
        return this ; 
      } ;

      this.draw = function draw() {
        this.populateCoordArrays() ;
        var yCoord = xCoord = 0 ;
        var lenY = yCoordArr.length ;
        var lenX = xCoordArr.length ;

        for( yCoord = 0 ; yCoord < lenY ; yCoord++ ) {
          for( xCoord = 0 ; xCoord < lenX ; xCoord++ ) {

              var pixOffset = ( xCoord + yCoord * windowWidth ) * 4 ;
              var curIntensityRGB = 0 ;
              var curColorRGB = [] ;
              var z = [ 0 , 0 ] , modZSq = 0 , c = [ xCoordArr[ xCoord ] , yCoordArr[ yCoord ] ] ;

              for( var i = 1 ; i <= $mBrotOptions.ITER ; i ++ ) {
                z = this.complexSum( this.complexMult( z , z ) , c ) ;
                modZSq = this.modulusSquared( z ) ;
                if( modZSq > maxSq ) {
                  curIntensityRGB = intensityRGB[ i ] ;
                  curColorRGB = colorRGB[ i ] ;
                  break;
                }
              }
              if( i > $mBrotOptions.ITER ) {
                curIntensityRGB = intensityRGB[ $mBrotOptions.ITER ] ;
                curColorRGB = colorRGB[ $mBrotOptions.ITER ] ;
              }

              //imgData.data[ pixOffset ] = imgData.data[ pixOffset + 1 ] = imgData.data[ pixOffset + 2 ] = curIntensityRGB ;
              imgData.data[ pixOffset ]     = curColorRGB[ R ] ;
              imgData.data[ pixOffset + 1 ] = curColorRGB[ G ] ;
              imgData.data[ pixOffset + 2 ] = curColorRGB[ B ] ;
                //= this.mandelDot( xCoordArr[ xCoord ] , yCoordArr[ yCoord ] );
              imgData.data[ pixOffset + 3 ] = 255 ;
              //this.pixRender( this.mandelDot( xCoordArr[ xCoord ] , yCoordArr[ yCoord ] ) , xCoord , yCoord  ) ;
          }
        }

        //console.log( imgData ) ;
        ctx.putImageData( imgData, 0 , 0 ); 
      } ;

      this.render = function render() {
        $mBrotUtil.performanceExec( function() {
          this.updateColors().draw() ;
        }.bind( this ) , "$mBrot.render()") ;
        return this ;
      } ;

      this.init = function init() {
        $mBrotUtil.performanceExec( function() {
          this.initCanvas().updateColorArr().draw() ;
        }.bind( this ) , "$mBrot.init()") ;
        return this ;
      } ;

      this.listen = function listen() {
        canvas.addEventListener( 'click' , function( ev ) {
          $mBrotControls.mapControls() ;
          this.updateParams( ev ) ;
          this.render() ;
          $mBrotControls.render() ;
        }.bind( this ) ) ;
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
          n.appendChild( txt ) ;
          n.appendChild( document.createElement( "br" ) ) ;
          n.appendChild( i ) ;
          n.appendChild( document.createElement( "br" ) ) ;
          controls.push( n ) ;
        }
        return this ;
      } ;

      this.mapControls = function() {
          for( var opt in $mBrotOptions ) {
            if( form.hasOwnProperty( opt ) ) {
              $mBrotOptions[ opt ] = parseFloat( form.elements[ opt ].value ) ;
            }
          }
          return this ;
      } ;

      this.listen = function() {
        form.addEventListener( "submit" , function( ev ) {
          ev.preventDefault() ;
          this.mapControls() ;
          $mBrot.updateParams().render() ;
        }.bind( this ) ) ;
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

    // Let's Roll!
    
    $mBrot
      .init()
      .listen() ;
    $mBrotControls
      .init()
      .listen() ;
  }
}
