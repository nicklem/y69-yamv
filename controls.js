/*
 ************************
 ** By                 **
 ** Nicola Klemenc     **
 ** github.com/nicklem **
 ** http://y69.tech    **
 ** nick@y69.tech      **
 ************************
 */

var CONTROLS = ( function() {

  var form ;
  var optionDisplay ;
  var controls = [] ;
  
  var recalcOnSubmit = 0 ;
  var resetRecalcOnSubmit = function() { recalcOnSubmit = 0 ; } ;
  var shouldRecalcOnSubmit = function() { return recalcOnSubmit !== 0 ; } ;
  var updateRecalcOnSubmit = function( plusOne ) { recalcOnSubmit += plusOne ; } ;

  var init = function() {
    if( typeof form === "undefined" ) form = document.querySelector( "#ctrl" ) ;
    if( typeof optionDisplay === "undefined" ) optionDisplay = document.querySelector( "#option-display" ) ;
    render() ;
    return this ;
  } ;

  var createControls = function() {
    controls = [] ;
    // TODO: improve getting options
    var currentOptions = OPT.getOptionData() ;
    for( var option in currentOptions ) {
      switch( currentOptions[ option ].type ) {
        case( "text" ) :
          var inputElement = document.createElement( "input" ) ;
          inputElement.setAttribute( "type" , currentOptions[ option ].type ) ;
          inputElement.setAttribute( "value" , currentOptions[ option ].value ) ;
          inputElement.setAttribute( "name" , option ) ;
          break ;
        case( "select" ) :
          var inputElement = document.createElement( "select" ) ;
          var dropDownOpts = currentOptions[ option ].options ;
          var curOption = currentOptions[ option ].value ;
            // console.log( dropDownOpts ) ;
          inputElement.setAttribute( "name" , option ) ;
          for( var dropDownO in dropDownOpts ) {
            var curOpt = document.createElement( "option" ) ;
            curOpt.setAttribute( "value" , dropDownO ) ;
            if( dropDownO === curOption ) curOpt.setAttribute( "selected" , "" ) ;
            curOpt.innerHTML = dropDownO ;
            inputElement.appendChild( curOpt ) ;
          }
      }

      var container = document.createElement( "div" ) ;
      var label = document.createElement( "div" ) ;
      var txt = document.createTextNode( currentOptions[ option ].labelText ) ;

      container.setAttribute( "id" , option ) ;
      label.setAttribute( "class" , "control-input label" ) ;
      inputElement.setAttribute( "class" , "control-input field" ) ;

      container.appendChild( inputElement ) ;
      label.appendChild( txt ) ;
      container.appendChild( label ) ;

      // if( currentOptions[ option ].devStatus ) {
      //   var devStatus = document.createElement( "div" ) ;
      //   var devStatusTxt = document.createTextNode( currentOptions[ option ].devStatus ) ;
      //   devStatus.setAttribute( "class" , "control-input dev-status " + currentOptions[ option ].devStatus ) ;
      //   devStatus.appendChild( devStatusTxt ) ;
      //   container.appendChild( devStatus ) ;
      // }

      controls.push( container ) ;
    }
    return this ;
  } ;

  var mapToOptions = function() {
    // TODO: improve getting options
    var currentOptions = JSON.parse( JSON.stringify( OPT.getOptionData() ) ) ;
    for( var option in currentOptions ) {
      if( form.hasOwnProperty( option ) ) {
        var curOpt = form.elements[ option ].value ;
        curOpt = isNaN( parseFloat( curOpt ) ) ? curOpt : parseFloat( curOpt ) ;
        if( currentOptions[ option ].value !== curOpt ) {
          // console.log( option , curOpt ) ;
          updateRecalcOnSubmit( currentOptions[ option ].recalcNeeded ) ;
          OPT.setOption( option , curOpt ) ;
        }
      }
    }
    return this ;
  } ;

  var listen = function() {
    form.addEventListener( "submit" , function( ev ) {
      ev.preventDefault() ;
      resetRecalcOnSubmit() ;
      mapToOptions() ;
      if( shouldRecalcOnSubmit() ) {
        ITER.initCalc() ;
        ITER.execCalc() ;
      } else {
        UTIL.consoleLog( "Redraw" , UTIL.timeExec( CANVAS.redraw ) ) ;
      }
    }.bind( this ) ) ;
    return this ;
  } ;

  var render = function() {
    //TODO improve control rendering
    createControls() ;
    optionDisplay.innerHTML = "" ;
    controls.forEach( function( el ) {
      optionDisplay.appendChild( el ) ;
    } ) ; 
    return this;
  } ;

  return {
    "mapToOptions"    : mapToOptions ,
    "createControls"  : createControls ,
    "init"            : init ,
    "listen"          : listen ,
    "render"          : render ,
  } ;

} () ) ; 
