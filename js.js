/*jslint bitwise: true, browser: true, continue: true, white: true */
/**
 * @author dan entous contact@gmtplusone.com
 * @version 2012-11-15 22:53 gmt +1
 */
(function( window, document ) {
	'use strict';

	window.lib = {
		display_debug_output : true,
		original_console : window.console,
		empty_console : { log : function() { return; }, error : function() { return; } },

		setConsole : function() {
			if ( this.original_console === undefined || !this.display_debug_output ) {
				window.console = this.empty_console;
			}
		},

		detect : function( what ) {
			var elm,
				result = false;

			if ( document.createElement === undefined ) {
				return false;
			}

			switch ( what ) {
				case 'canvas':
					elm = document.createElement('canvas');
					result = !!( elm.getContext && elm.getContext('2d') );
					break;
			}

			return result;
		},

		/**
		 * ff detection
		 *
		 * test for Firefox/x.x or Firefox x.x (ignoring remaining digits)
		 * @link http://www.javascriptkit.com/javatutors/navigator.shtml
		 * @link http://www.quirksmode.org/js/detect.html
		 *
		 * @returns undefined|float
		 */
		fireFoxVersion : function() {
			var ffversion;

			if ( /Firefox[\/\s](\d+\.\d+)/.test( navigator.userAgent ) ) {
				ffversion = Number( RegExp.$1 ); // capture x.x portion and store as a number
			}

			return ffversion;
		}
	};

	window.lib.setConsole();

}( window, document ));


/**
 * algorithm author is unknown
 * @author dan entous contact@gmtplusone.com
 * @version 2013-10-23 05:20 gmt +1
 */
(function( window, document, $ ) {
	'use strict';

	var ffversion = $.fireFoxVersion(),

	Wave = {
		/**
		 * @param {object} options
		 * @param {string} options.image_src
		 * @param {string} options.canvas_id
		 * @param {int} options.image_padding
		 * @returns {int} a setInterval id
		 */
		addWavableImage : function( options ) {
			options = Wave.validateImageOptions( options );

			var image = new Image();
					image.src = options.image_src;

			image.onload = function() {
				var canvas = document.getElementById( options.canvas_id );

				canvas.width  = image.width;
				canvas.height = image.height + options.image_padding * 2;

				/**
				* @param HTMLImageElement|HTMLCanvasElement|HTMLVideoElement image
				*
				* @param double dx
				* image x offset inside the canvas
				*
				* @param double dy
				* image y offset inside the canvas
				*
				* @param double dw
				* image width stretched or compressed
				*
				* @param double dh
				* image height stretched or compressed
				*
				* @param double sx
				* @param double sy
				* @param double sw
				* @param double sh
				*
				* @example drawImage(image, dx, dy)
				* @example drawImage(image, dx, dy, dw, dh)
				* @example drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)
				*
				* @throws TypeMismatchError|InvalidStateError|IndexSizeError|InvalidStateError
				* @link http://www.w3.org/TR/2dcontext/#drawing-images-to-the-canvas
				*/
				canvas.getContext('2d').drawImage( image, 0, options.image_padding/2 );

				return Wave.waveImage({
					canvas : canvas,
					'vertical-wave': options['vertical-wave']
				});
			};
		},

		validateCanvasOptions : function( options ) {
			if ( options.canvas === undefined ) {
				throw new ReferenceError('options.canvas has not been defined');
			}

			if ( options.squeeze === undefined ) {
				options.squeeze = 0;
			}

			if ( options.shading === undefined ) {
				options.shading = 100;
			}

			if ( options.period === undefined ) {
				options.period = 200;
			}

			if ( options.amplitude === undefined ) {
				options.amplitude = 10;
			}

			if ( options.wavelength === undefined ) {
				options.wavelength = options.canvas.width/10;
			}

			if ( options.fps === undefined ) {
				options.fps = 30;
			}

			return options;
		},

		validateImageOptions : function( options ) {
			if ( options.image_src === undefined ) {
				throw new ReferenceError('options.image_src has not been defined');
			}

			if ( options.canvas_id === undefined ) {
				throw new ReferenceError('options.canvas_id has not been defined');
			}

			if ( options.image_padding === undefined ) {
				options.image_padding = 15;
			}

			return options;
		},

		/**
		 * @param {object} options
		 * @param {int} options.amplitude
		 * @param {int} options.canvas
		 * @param {int} options.fps
		 * @param {int} options.period
		 * @param {int} options.shading
		 * @param {int} options.squeeze
		 * @param {bool} options['vertical-wave']
		 * @param {float} options.wavelength
		 *
		 * avoid ff bug 564332 putImageData throws exception when drawing to a smaller canvas
		 * firefox should be >= 11
		 * @link http://www.mozilla.org/en-US/firefox/11.0/releasenotes/buglist.html
		 */
		waveImage : function( options ) {
			options = Wave.validateCanvasOptions( options );

			var ctx = options.canvas.getContext('2d'),
				w = options.canvas.width,
				h = options.canvas.height,
				od = ctx.getImageData( 0, 0, w, h ).data;

			return setInterval(
				function() {
					var id = ctx.getImageData( 0, 0, w, h ),
						d = id.data,
						now = ( new Date() )/options.period,
						y,
						x,
						lastO,
						shade,
						sq = ( y - h/2 ) * options.squeeze,
						px,
						pct,
						o,
						y2,
						opx;

					for ( y = 0; y < h; y += 1 ) {
						lastO = 0;
						shade = 0;
						sq = ( y - h/2 ) * options.squeeze;

						for ( x = 0; x < w; x += 1 ) {
							px  = ( y * w + x ) * 4;
							pct = x/w;
							o   = Math.sin( x/options.wavelength - now ) * options.amplitude * pct;
							y2  = y + ( o + sq * pct ) << 0;
							opx = ( y2 * w + x ) * 4;

							shade = (o-lastO) * options.shading;
							d[px  ] = od[opx  ]+shade;
							d[px+1] = od[opx+1]+shade;
							d[px+2] = od[opx+2]+shade;
							d[px+3] = od[opx+3];
							lastO = o;
						}
					}

					ctx.putImageData( id, 0, 0 );
				},

				1000/options.fps
			);
		}
	};

	function addWavableFlag() {
		var flag_horizontal = document.getElementById('flag-horizontal'),
		flag_vertical = document.getElementById('flag-vertical');

		flag_horizontal.style.backgroundImage = 'url(flag-left.png)';
		flag_horizontal.innerHTML = '<canvas id="flag-horizontal-canvas" title="wave a flag horizontally"></canvas>';

		flag_vertical.style.backgroundImage = 'url(flag-left.png)';
		flag_vertical.innerHTML = '<canvas id="flag-vertical-canvas" title="wave a flag vertically"></canvas>';

		try {
			Wave.addWavableImage({ image_src : 'flag-right.png', canvas_id: 'flag-horizontal-canvas' });
			Wave.addWavableImage({ image_src : 'flag-right.png', canvas_id: 'flag-vertical-canvas' });
		} catch( e ) {
			window.console.error( e.name + ': ' + e.message );
		}
	}

	/**
	 * avoid ff bug 564332 putImageData throws exception when drawing to a smaller canvas
	 * firefox should be >= 11
	 * @link http://www.mozilla.org/en-US/firefox/11.0/releasenotes/buglist.html
	 */
	if ( $.detect('canvas') && ( ffversion === undefined || ffversion >= 11 ) ) {
		addWavableFlag();
	}

}( window, document, window.lib ));
