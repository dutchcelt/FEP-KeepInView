/*! fep-keepinview - v1.0.0-alpha - 2013-12-12
* https://github.com/dutchcelt/fep-keepinview
* Copyright (c) 2013 Egor Kloos; Licensed GPL v3 */
/*! ###########################################################################

 Source: https://github.com/dutchcelt/FEP-KeepInView
 Version: 1.0.0-alpha

 Copyright (C) 2011 - 2013,  Lunatech Labs B.V., C. Egor Kloos. All rights reserved.
 GNU General Public License, version 3 (GPL-3.0)

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program.  If not, see http://www.opensource.org/licenses/gpl-3.0.html

 ########################################################################### */

	
// 	Uses AMD or browser globals to create a jQuery plugin. ##################

(function( factory ){

	if( typeof define === 'function' && define.amd ){
		// AMD. Register as an anonymous module.
		define( ['FEP-KeepInView'], factory );
	} else {
		// Browser globals
		factory( window );
	}

}( function(){
	
	//  Detect if the FEP namespace is available. (FEP = Front-end Patterns)
	window.FEP = ( window.FEP || {} );
	
	FEP.KeepInView = function( selector, settings, f ){
		
		//	Set options per invocation 
		var newKeepInView = Object.create( FEP.KeepInView.object );
		newKeepInView.options = Object.create( newKeepInView.defaults ); // Add 'defaults' to __proto__
		if( typeof settings === "object"){
			for (var key in settings) { newKeepInView.options[key] = settings[key]; }
		}
		return selectorArray( selector ).forEach( function( domElem ){
			//	Set DOM element for each item in nodeList
			var instanceKIV = Object.create( newKeepInView );
			instanceKIV.stickyElem = domElem;
			instanceKIV.index = FEP.KeepInView.object.index++;
			//	Make it stick!
			instanceKIV.init( f );
		} );
	};

	var createCustomEvent = function( eventName, data ){
		var newEvent;
		try {
			newEvent = new CustomEvent( eventName, {
			    'bubbles'	: true,
			    'cancelable': true,
			    'returnValue':false,
			    'detail'	: data
			});
		} catch (e) {
			newEvent = document.createEvent( 'CustomEvent' );
			newEvent.initCustomEvent( eventName, true, true, data);
		} finally {
			return newEvent;
		}
	};	
	
	var selectorArray = function( selector, domElem ){
		return Array.prototype.slice.call( ( domElem || document ).querySelectorAll( selector ) );
	};
	
	//	Regular expression function to help with HTML class attributes
	var classNameRegEx = function( classNameString ) {
		var newRegEx = new RegExp("(?:^|\\s)" + classNameString + "(?!\\S)","g");
		return newRegEx;
	};
	
	//	Invoke with call() to pass the DOM context via 'this'
	var stripClassName = function( classNameString, elem ){
		selectorArray( "." + classNameString, elem ).forEach( function( domElem ){
			domElem.className = domElem.className.replace( classNameRegEx( classNameString ), '' );
		} );
	};	
	var addClassName = function( elem, classNameString ){
		if( !classNameRegEx( classNameString ).test( elem.className ) ) {
			elem.className += " " + classNameString
		}
	};	
	var getDimensions = function( obj ){
		obj = obj || this.stickyElem.getBoundingClientRect();
		var dim = {};
		for( var key in obj ){
			dim[key] = Math.round( obj[key] );
			if( key === "top" ){
				dim[key] = dim[key] - ( parseInt( getComputedStyle( this.stickyElem )["marginTop"] ) || 0 );
			}
			if( key === "left" ){
				dim[key] = dim[key] - ( parseInt( getComputedStyle( this.stickyElem )["marginLeft"] ) || 0 );
			}
		}
		return dim;
	}
	var setStyle = function( elem, obj ){
		for ( var key in obj ) { 
			elem.style[key] = obj[key]; 
		}
	}

	//	Custom events
	FEP.KeepInView.update = createCustomEvent( "update" );
	FEP.KeepInView.unstick = createCustomEvent( "unstick" );
	FEP.KeepInView.set = createCustomEvent( "set" );


	FEP.KeepInView.object = {
	
		namespace : "KIV",
		ticking: false,
		index : 0,
		$elem: null,
		$parent: null,
		
		defaults: {

			// Position will be fixed regardless of scroll position when set to true
			fixed:        false, // boolean

			// Vertical offset that applies to both top and bottom;
			edgeOffset:   0, // Number

			// Override z-index if you can't or don't want to set this with CSS
			zindex:       "auto", // String

			// Override all scripted positions with your own custom CSS classname
			// The set classname will be triggered when element scrolls out of view
			// The Script will add a suffix of '-top' or '-bottom'
			customClass:  false, // boolean

			//  Only trigger this script on scrolling out at the 'top', 'bottom' the default is 'both'.
			trigger:      'both', // String

			// Scrollable box
			scrollable:   false,

			//  Set the height and width (user can override these if necessary)
			h:            0, // Number
			w:            0, // Number

			//  If a pageload scrolls to a hash you can use this to offset anchors if the 'sticky' element is covering the anchored content
			//  Beware that if the anchor itself contains content that it will also move up the page.
			//  This feature is best used with the clone feature below.
			offsetAnchor: false, // boolean.

			//  Clone the sticky element and prepend to its parent.
			//  Beware that the original item is not removed from the page so make sure that the cloned element will cover it.
			//  The cloned item can be styled via the classname "KIV-cloned"
			cloned:       false // boolean.

		},
		
		options: {},
		
		setElem: function(){

			//  Making sure that $elem doesn't fire if it is taller than the window (like a sidebar)
			//  To prevent elastic scrolling fireing set the body in css to 'overflow: hidden'.
			//  Then wrap your content in a div with 'overflow: auto'.
						
			if(  this.stickyElem.offsetHeight > window.innerHeight && !this.options.scrollable ){
				return false;
			}
			if( this.options.clearStyle ){
				this.elem.removeAttribute( "style" );
			}
			var scrolledOutAt = "";
			var windowHeight = window.innerHeight;
			var outerHeight = this.box.height;

			if( windowHeight < parseInt( this.box.top + this.box.height - Math.abs( window.pageYOffset ) + this.options.edgeOffset, 10 ) && !this.options.fixed ){
				scrolledOutAt = "bottom";
			}

			if( ( window.pageYOffset ) > this.box.top - this.options.edgeOffset && !this.options.fixed ){
				scrolledOutAt = "top";
			}

			if( !this.options.customClass ){

				if( this.options.scrollable ){
					this.prepCSS( {height: (windowHeight - this.box.top) + "px", overflow: "auto"} );
				} else {
					this.prepCSS();

				}
				if( scrolledOutAt === "bottom" && (this.options.trigger === 'both' || this.options.trigger === 'bottom') ){
					if( this.options.scrollable ){
						this.prepCSS( {height: windowHeight + "px", top: (windowHeight - this.box.height - this.options.edgeOffset) + "px", overflow: "auto" } );
					} else {
						this.fixCSS( (windowHeight - this.box.height - this.options.edgeOffset) );
					}

				} else if( scrolledOutAt === "top" && (this.options.trigger === 'both' || this.options.trigger === 'top') ){
					if( this.options.scrollable ){
						this.prepCSS( { height: windowHeight + "px", top: this.options.edgeOffset + "px", overflow: "auto" } );
					} else {
						this.fixCSS( this.options.edgeOffset );
					}

				} else if( this.options.fixed ){
					setStyle( this.elem, {top: this.options.edgeOffset + "px", left: this.box.left, height: "auto"} );
				} else {
					if( this.options.scrollable ){
						setStyle( this.elem, {position: this.position, top: this.box.top + "px", height: (windowHeight - this.box.top + window.pageYOffset ) + "px"} );
					} else {
						if( this.options.offsetAnchor ){
							setStyle( this.stickyElem, { visibility: "visible" } );
							setStyle( this.elem, { display: "none" } );
						} else {
							this.elem.removeAttribute( 'style' );
						}
					}
				}

			} else if( this.options.customClass ){
				if( this.options.trigger === 'both' ){
					if( scrolledOutAt === "bottom" || scrolledOutAt === "top" ){
						addClassName( this.elem, this.options.customClass + "-" + scrolledOutAt );
					} else if( !scrolledOutAt ){
						stripClassName( this.options.customClass + "-top", this.elem );
						stripClassName( this.options.customClass + "-bottom", this.elem );
					}
				} else if( scrolledOutAt === this.options.trigger ){
					addClassName( this.elem, this.options.customClass + "-" + this.options.trigger );
				} else if( !scrolledOutAt ){
					stripClassName( this.options.customClass + "-" + this.options.trigger, this.elem );
				}
			}
			this.ticking = false;
		},
		
		cssObject: function(){
			return {
				position: 'fixed',
				left: this.box.left + 'px',
				width: (this.options.scrollable) ? this.box.width - 15 + "px" : this.box.width + "px",
				height: (this.options.scrollable) ? ( window.innerHeight - this.box.top ) + "px" : this.box.height + "px",
				zIndex:   this.options.zindex
			}
		},
		
		prepCSS: function( cssSettings ){
				cssObj = Object.create( this.cssObject.call( this ) ); // Add 'defaults' to __proto__
				for (var key in cssSettings) { cssObj[key] = cssSettings[key]; }
				setStyle( this.elem, cssObj );
		},
		
		fixCSS: function( t ){
				this.elem.style.top = t + 'px';
				if( this.options.offsetAnchor ){
					this.stickyElem.style.visibility = 'hidden';
					this.elem.style.display = "block";
				}
			
		},

		staySticky: function( event ){
			event.preventDefault();
			this.box = getDimensions.call( this, event.target.getBoundingClientRect() );
			this.options.clearStyle = true;
			if(!this.ticking) {
				requestAnimationFrame( this.setElem.bind( this ) );
			}
			this.ticking = true;
		},
		
		setElemRequest : function( event ){
			event.preventDefault();
			this.options.clearStyle = false;
			if(!this.ticking) {
				requestAnimationFrame( this.setElem.bind( this ) );
			}
			this.ticking = true;
		},

		killSticky: function(){
			//	Very nasty hack!
		    var clone = this.elem.cloneNode(true);
			clone.removeAttribute( "style" );
			this.elem.parentNode.replaceChild(clone, this.elem);
		},
		
		windowEvent: function( event ){
			if( event.type === "resize"){
				this.elem.dispatchEvent( FEP.KeepInView.update );
			}
			if( event.type === "scroll"){
				this.elem.dispatchEvent( FEP.KeepInView.set );
			}
		},
		
		anchorShifter : function(){
		
			if( this.options.offsetAnchor ){

				// It is possible that there a lot of anchors!
				// Using an array instead of a loop by 'shifting' the array
				// This speeds up the iterations and setTimeout prevents the browser from locking up.

				// put all the dom elements collected by jQuery in to an array
				var anchorArray = selectorArray( "a[name]" );

				var arrayShifter = function(){

					var start = +new Date();

					do {

						var anchor = anchorArray.shift();
						//  Invoke lazyLoad method with the current item
						if( anchorArray[0] !== void 0 ){
							$( anchor ).css( { position: "relative", display: "block", top: "-" + this.box.height + "px" } );
						}

					} while( anchorArray[0] !== void 0 && (+new Date() - start < 50) ); // increase to 100ms if needed.

					if( anchorArray[0] !== void 0 ){
						setTimeout( arrayShifter, 0 );
					}

				};
				arrayShifter();
			}
		},
		
		init: function( f ){
		
			this.box = getDimensions.call( this );
			
			this.options.zindex = getComputedStyle( this.stickyElem )["zIndex"];

			if( this.options.cloned ){
				this.elem = this.stickyElem.cloneNode( true );
				this.stickyElem.parentNode.insertBefore( this.elem, this.stickyElem );
				addClassName( this.elem, this.namespace + "-cloned" );
				addClassName( this.stickyElem, this.namespace + "-original" );
			} else {
				this.elem = this.stickyElem;
			}
			
			this.elem.id = this.namespace + "_" + this.index;
			this.position = getComputedStyle( this.stickyElem )["position"];
			
			this.elem.addEventListener( 'update', this.staySticky.bind(this), true );
			this.elem.addEventListener( 'unstick', this.killSticky.bind(this), true );
			this.elem.addEventListener( 'set', this.setElemRequest.bind(this), true );
				
			window.addEventListener( 'resize', this.windowEvent.bind(this), false );
			window.addEventListener( 'scroll', this.windowEvent.bind(this), false );
			
			//	Trigger Keep In View when loaded.
			this.elem.dispatchEvent( FEP.KeepInView.set );
			
			this.anchorShifter();
			
			if( typeof f === "function"){
				f( this );
			}
		}

	};


} ));
