/*! fep-keepinview - v1.0.0-alpha - 2013-12-18
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
			elem.className += ( ( elem.className === "" ) ? "" : " " )+ classNameString
		}
	};	

	var setStyle = function( elem, obj ){
		for ( var key in obj ) { 
			elem.style[key] = obj[key]; 
		}
	};

	FEP.KeepInView.object = {
	
		namespace : "kiv",
		ticking: false,
		index : 0,
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
		box: {},
		toggleElem: function(){

			//  Making sure that $elem doesn't fire if it is taller than the window (like a sidebar)
			//  To prevent elastic scrolling fireing set the body in css to 'overflow: hidden'.
			//  Then wrap your content in a div with 'overflow: auto'.
						
			if( this.box.height > window.innerHeight && !this.options.scrollable || this.options.fixed ){
				return false;
			}
			this.elem.scrolledOutAt = false;
			this.box.top = !this.box.top || this.options.edgeOffset;
			if( this.options.trigger !== 'bottom' && this.elem.boundry.topOffset - this.options.edgeOffset < window.pageYOffset  ){
				this.elem.scrolledOutAt = "top";
			console.log(this.elem.nodeName + ": " + this.elem.scrolledOutAt);
			} 
			if( this.options.trigger !== 'top' && window.innerHeight <= this.box.bottom ){
				this.elem.scrolledOutAt = "bottom";
			} 
			if( !this.options.customClass ){
			
				if( this.elem.scrolledOutAt !== false ){

					if( !this.elem.isSticky ){
						this.elem.style.position = "fixed";
						this.elem.style.display = this.elem.orginalRenderedState.display;
						this.elem.style[this.elem.scrolledOutAt] = this.elem.boundry[this.elem.scrolledOutAt];
						if( this.options.scrollable ){
							this.elem.style.top = this.box.top + "px";
							this.elem.style.height = (window.innerHeight - this.box.top ) + "px";
						}
						this.elem.isSticky = true;
					} 
					
				} else {
					if( this.elem.isSticky ){
						this.elem.style.position = this.elem.orginalRenderedState.position;
						this.elem.style.display = ( this.options.cloned ) ? "none" : this.elem.orginalRenderedState.display;
						this.elem.isSticky = false;
					} else {
						if( this.options.scrollable ){
							this.elem.style.height = ( window.innerHeight - this.box.top) + "px";
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
		getDimensions: function( dimObj ){
		
			dimObj = dimObj || this.stickyElem.getBoundingClientRect()
			
			var dims = {};
			
			for( var key in dimObj ){
				dims[key] = dimObj[key];
			}
	
			return dims;
			
		},
		getDimOffset: function( prop ){
			var propVal = new Number( getComputedStyle( this.elem )[prop].replace( /\D+$/, "") ).valueOf();
			return propVal;
		},
		renderObject: function(){
						
			var marginTop = this.getDimOffset( "marginTop" );
			var marginBottom = this.getDimOffset( "marginBottom" );
			var marginLeft = this.getDimOffset( "marginLeft" );
			var scrollXPos = window.pageXOffset;
			var scrollYPos = window.pageYOffset;
			
			//	resetting view to get initial or new state
			window.scroll( 0, 0 );
			this.elem.style.width = null;
			this.box = this.getDimensions();

			this.elem.boundry = {
				zIndex : this.options.zindex,
				display: getComputedStyle( this.elem )["display"],
				position: ( this.options.cloned ) ? "fixed" : this.elem.orginalRenderedState.position,
				overflow: ( this.options.scrollable ) ? 'auto' : 'visible',
				left: this.box.left - marginLeft + "px",
				width: this.box.width + "px"
			};

			if( !this.options.fixed ){
				if( this.options.scrollable ){
					this.elem.style.height = window.innerHeight - this.box.top - this.options.edgeOffset + "px";
					this.elem.boundry["top"] = this.box.top + marginTop + "px";
				} else {
					this.elem.boundry["height"] = this.box.height + "px";
				}
				this.elem.boundry["width"] = this.box.width + "px";
			} else {
				this.elem.isSticky = true;
				this.elem.boundry.position = "fixed";
				this.elem.boundry.top = this.options.edgeOffset + marginTop + "px";
			}
			
			//	restoring view
			setStyle( this.elem, this.elem.boundry );
			this.anchorShifter();
			
			//	Setting top and bottom styles
			this.elem.boundry["top"] = this.options.edgeOffset + marginTop + "px";
			this.elem.boundry["bottom"] = this.options.edgeOffset + marginBottom + "px";
			this.elem.boundry["topOffset"] = this.box.top + marginTop;
			this.elem.boundry["bottomOffset"] = this.box.bottom + marginBottom;
			//	restoring position
			window.scroll( scrollXPos, scrollYPos );
		},
		
		
		//	Custom events
		update: createCustomEvent( "update" ),
		unstick: createCustomEvent( "unstick" ),
		set: createCustomEvent( "set" ),
	
		stickyFunction: function( update ){

			if( update ){
				this.elem.isSticky = false;
				this.renderObject();
			} else {
				this.box = this.getDimensions();
			}
			if(!this.ticking) {
				requestAnimationFrame( this.toggleElem.bind( this ) );
				this.ticking = true;
			}
		},
		killSticky: function(){
			this.elem.removeEventListener( 'update', this, true );
			this.elem.removeEventListener( 'set', this, true );
			this.elem.removeAttribute( "style" );
			this.elem.isSticky = false;
		},
				
		//	Special object member function:
		//	http://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-EventListener-handleEvent
		
		handleEvent: function( event ) {
		
			event.preventDefault();
			
			switch(event.type) {
		    	case 'update':
		        	this.stickyFunction( true );
					break;
				case 'set':
		        	this.stickyFunction( false );
					break;
		        case 'unstick':
		        	this.killSticky();
					break;
		        case 'resize':
		        	this.elem.dispatchEvent( this.update );
					break;
				case 'scroll':
					this.elem.dispatchEvent( this.set );
					break;
		    }
		},
		
		anchorShifter : function(){
		
			if( this.options.offsetAnchor ){
			
				// It is possible that there a lot of anchors!
				// Using an array instead of a loop by 'shifting' the array
				// This speeds up the iterations and setTimeout prevents the browser from locking up.

				var that = this;
				
				// put all the dom elements collected by jQuery in to an array
				var anchorArray = selectorArray( "a[name]", this.stickyElem.parentNode );
				var anchor;
				
				var arrayShifter = function(){

					var start = +new Date();
					
					do {
						anchor = anchorArray.shift();
						setStyle( anchor, { position: "relative", display: "block", top: "-" + that.box.height + "px" } );
					} while( anchorArray[0] !== void 0 && (+new Date() - start < 50) ); // increase to 100ms if needed.

					if( anchorArray[0] !== void 0 ){
						setTimeout( arrayShifter, 0 );
					}

				};
				arrayShifter();
			}
		},
		
		init: function( f ){
					
			if( this.options.cloned ){
				this.elem = this.stickyElem.cloneNode( true );
				this.stickyElem.parentNode.insertBefore( this.elem, this.stickyElem );
				addClassName( this.elem, this.namespace + "-cloned" );
				addClassName( this.stickyElem, this.namespace + "-original" );
 				this.elem.style.display = "none";
			} else {
				this.elem = this.stickyElem;
			}
			
			this.elem.orginalRenderedState = {
				position: getComputedStyle( this.elem )["position"],
				display: getComputedStyle( this.elem )["display"]
			}
			
			addClassName( this.elem, this.namespace + "-" + this.index );
			
			//	"this" triggers the special object member function 'handleEvent'
			this.elem.addEventListener( 'update', this, true );
			this.elem.addEventListener( 'unstick', this, true );
			this.elem.addEventListener( 'set', this, true );
				
			window.addEventListener( 'resize', this, true );
			window.addEventListener( 'scroll', this, true );
			
			this.elem.dispatchEvent( this.update );
				
			if( typeof f === "function"){
				f( this );
			}
		}

	};

	FEP.KeepInView.unstick = FEP.KeepInView.object.unstick;

} ));
