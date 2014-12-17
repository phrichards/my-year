'use strict';

/* jshint ignore:start */

R.ready(function() {


	var dateArray = [];
	var trackKeyArray = [];
	var rdioTrackArray = [];
	var lastFmTrackArray = [];
	var playCountArray = [];
	var artistArray = [];
	var albumArray = [];
	var searchArray = [];
	var playlistExists = false;
	var trackName = '';
	var artistName = '';
	var userName = '';
	var date = Date.today().toString();
	var year = date.slice(11,15);


	// =====================================================
	//	On button click, activate loader and check the user
	// =====================================================

	$('form .btn').click(function(){
		console.log('clicked');
		userName = $('#username').val();
		console.log(year);
		$('.overlay').append('<div class="spinner">');
		$('.overlay').fadeIn();

		$(this).loaders({
			spinnerNumber: 8,
			backgroundColor: '#428BCA',
			top: '43%',
			left: '47%'
		});

		checkUser();
	});

	// ==========================================================
	//	Check username with last.fm to see if the account exists.
	//	If so, check user's playlists with Rdio.
	//	If not, call noLastFm function below
	// ==========================================================

	var checkUser = function(){
		$.ajax({
			url: 'http://ws.audioscrobbler.com/2.0/',
			type: 'GET',
			dataType: 'jsonp',
			data: {
				method: 'user.getInfo',
				user: userName,
				api_key: '24b34d830fbf38636b9d3779e61f469d',
				format: 'json'
			}, // end data
			success: function(result) {
				if (result.error != null) {
					console.log('no user');
					noLastFm();
				} else {
					console.log(result);
					checkPlaylists();
				}
			} // end success
		});
	};

	// ==============================================================
	//	If the lastfm account provided doesn't exist or no name is 
	//	entered, pop up an alert stating that an account is required
	// ==============================================================

  	var noLastFm = function(){
  		swal({   
  			title: "Sorry!",   
  			text: "A Last.FM account is required. Hopefully Rdio will improve their API one day.",   
  			type: "error",   
  			confirmButtonText: "Got It" 
  		});
  		$('.overlay').fadeOut();
		$('.overlay').empty();
  	};

	// ========================================================
	//	Check the playlists in the user's Rdio account
	//	If the user already has a My Year playlist, display it
	//	Otherwise, call the getAlbums function
	// ========================================================

	var checkPlaylists = function(){
		console.log('checkPlaylists is called');
		R.request({
			method: 'getPlaylists',
			content: {
				user: 's66839',
				ordered_list: true,
				extras: 'tracks'
			}, // end content
			success: function(response) {
				for (var i = 0; i < response.result.length; i++) {
					if (response.result[i].name == 'My Year: ' + year) {
						console.log(response.result[i]);
						displayPlaylist(response.result[i].embedUrl, response.result[i].url);
						playlistExists = true;
					}
				}
				if (playlistExists == false) {
					getAlbums();
				}
			} // end success
		}); // end R.request
	};

	// =====================================================
	//	Get the albums in the user's Rdio collection
	// =====================================================

	var getAlbums = function(){
		console.log('getAlbums is called');
		if (R.authenticated()) {
			R.request({
			  	method: 'getAlbumsInCollection',
			  	content: {
			  		user: 's66839',
			  		count: 1000,
			  		sort: 'dateAdded',
			  		extras: 'tracks'
			  	},
			  	success: function(response) {
			  		getDates(response)
			  	},
			  	error: function() {
			  		console.log('nope');
			  	}
		  	}); // end R.request
	  	};
	};

	// ===================================================================
	//	Get the release dates of the albums in the user's Rdio collection
	//	If the date is the current year, add the first song of the album
	//	to an array
	// ===================================================================

	var getDates = function(response){
		console.log('getDates called');
  		for (var i = 0; i < response.result.length; i++) {
	  		if (response.result[i].releaseDate.slice(0,4) == year) {
	  			if (response.result[i].length > 3) {
	  				trackName = response.result[i].tracks[0].name;
	  				artistName = response.result[i].artist;
	  				rdioTrackArray.push(response.result[i]);
	  			}; // end if length
	  		}; // end if slice
	 	} // end for
	 	console.log(rdioTrackArray);
	 	getPlays();
	 	
	 	
  	}; // end getDates

	// =============================================================
	//	Use lastfm to get the number of plays for each track in the 
	//	Rdio track array. If the number of plays is greater than 9,
	//	add the track to a new array
	// =============================================================

	var getPlays = function() {
		console.log('getPlays called');
		console.log(userName);
		var maxVal = rdioTrackArray.length;

		var counter = 0;
		for (var i = 0; i < rdioTrackArray.length; i++) {
			$.ajax({
				url: 'http://ws.audioscrobbler.com/2.0/',
				type: 'GET',
				dataType: 'jsonp',
				data: {
					method: 'track.getInfo',
					track: rdioTrackArray[i].tracks[0].name,
					artist: rdioTrackArray[i].artist,
					username: userName,
					api_key: '24b34d830fbf38636b9d3779e61f469d',
					format: 'json'
				}, // end data
				success: function(data) {
					counter++;
					if (data.track.userplaycount > 9) {
						lastFmTrackArray.push(data);
					};
					if (counter == rdioTrackArray.length) {
						sortArray();
					};
				} // end success
			});
		}
	};

	// =====================================================
	//	Sort the tracks in the lastfm array by playcount
	// =====================================================

  	var sortArray = function(){
  		console.log('sortArray called');
  		lastFmTrackArray.sort(function(a,b) {
  			return b.track.userplaycount - a.track.userplaycount;
  		});	
  		getTracks();
	};

	// ===============================================================
	//	Search for each track in the lastfm array on Rdio and add the
	//	resulting Rdio track object to an array
	// ==============================================================

  	var getTracks = function(){
  		console.log('getTracks called');
  		var counter = 0;
  		if (lastFmTrackArray.length > 0) {
  			for (var i = 0; i < lastFmTrackArray.length; i++) {
  				if (lastFmTrackArray[i].track.album != null) {
  					var query = lastFmTrackArray[i].track.name + ', ' + lastFmTrackArray[i].track.artist.name + ', ' + lastFmTrackArray[i].track.album.title;
  				} else {
  					var query = lastFmTrackArray[i].track.name + ', ' + lastFmTrackArray[i].track.artist.name;
  				}
	  			R.request ({
	  				method: 'search',
	  				content: {
	  					query: query,
	  					types: 'Track',
	  					count: '1'
	  				},
	  				success: function(response) {
	  					counter++;
	  					searchArray.push(response);
	  					if (counter == lastFmTrackArray.length) {
	  						getKeys(searchArray);	
	  					}
	  				}, // end success
	  				error: function() {
	  					console.log('error');
	  				}
	  			}); // end R.request
	  		} // end for
  		} // end if length > 0
  	}; // end getTracks

  	// =================================================================
	//	For each track in the search array returned above, pull out the 
	//	track key and add it to an array
	// =================================================================

  	var getKeys = function() {
  		console.log('getKeys called');
  		for (var i = 0; i < searchArray.length; i++) {

  			for (var j = 0; j < searchArray[i].result.results.length; j++) {
					if (searchArray[i].result.results[j].trackNum == 1) {
						trackKeyArray.push(searchArray[i].result.results[j].key)
					}
					
  			} // end for
  		}
  		console.log(trackKeyArray);
  		sortKeys();
  	}

  	// ===================================================================
	//	Sort the keys in the array to ensure that there are no duplicates
	// ===================================================================

  	// === this is stupid, fix it ===
  	var sortKeys = function(){
  		console.log('sortKeys called');
  		trackKeyArray.sort();	
  		for (var i = 0; i < trackKeyArray.length; i++) {
  			if (trackKeyArray[i+1] == trackKeyArray[i]) {
  				trackKeyArray.splice(i, 1);
  			}
  		}
  		for (var i = 0; i < trackKeyArray.length; i++) {
  			if (trackKeyArray[i+1] == trackKeyArray[i]) {
  				trackKeyArray.splice(i, 1);
  			}
  		}
  		console.log(trackKeyArray);
  		getPlaylists();
  	};

  	// ==============================================
	//	Get the playlists in the user's Rdio account
	// ==============================================

  	var getPlaylists = function(){
  		console.log('getPlaylists called');
  		R.request({
  			method: 'getPlaylists',
  			content: {
  				user: 's66839',
  				ordered_list: true
  			},
  			success: function(response) {
  				console.log(response);
  				matchPlaylists(response);
  			}
  		});
  	}; // end getPlaylists

  	// ===================================================
	//	Check to see if the user has a My Year playlist.
	//	If so, call function to add new songs.
	//	If not, create the playlist.
	// ===================================================

  	var matchPlaylists = function(response){
  		for (var i = 0; i < response.result.length; i++) {
  			if (response.result[i].name == 'My Year: ' + year) {
  				console.log('already there');
  				playlistExists = true;
  			} // end if
  		}; // end for 

		if (playlistExists) {
			R.request({
  			method: 'getPlaylists',
  			content: {
  				user: 's66839',
  				ordered_list: true,
  				extras: 'tracks'
  			}, // end content
  			success: function(response) {
  				for (var i = 0; i < response.result.length; i++) {
  					if (response.result[i].name == 'My Year: ' + year) {
  						addNewSongs(response.result[i]);
						}
  				}
				} // end success
			}); // end R.request
		} // end if 
		else {
			R.request({
				method: 'createPlaylist',
				content: {
					name: 'My Year: ' + year,
					description: 'Most-Played Albums in ' + year,
					tracks: trackKeyArray.toString()
				}, // end content
				success: function(response) {
					console.log(response);
					console.log(response.result.embedUrl);
					displayPlaylist(response.result.embedUrl, response.result.url);
				} // end success
			}); // end R.request
		} // end else
		
  	}; // end matchPlaylists

  	// ======================================================
	//	Add new songs with 10+ plays to an existing playlist
	// ======================================================

	// === This doesn't do anything yet, fix it ===  	
  	var addNewSongs = function(response) {
  		console.log('addnew is called');
  	} // end addNewSongs()

  	// =========================================================
	//	Display the playlist on the page and remove the loader.
	// =========================================================

  	var displayPlaylist = function(embedUrl, url){
  		console.log('displayPlaylist is called');
  		console.log(url);
  		$.ajax({
  			url: 'http://www.rdio.com/api/oembed/?format=json&url=' + embedUrl,
  			type: 'GET',
  			dataType: 'jsonp',
  			success: function(result) {
  				console.log('displayPlaylist success');
  				$('form').css('display', 'none');
  				$('#player').html(result.html);
  				$('.rdioLink').css('display', 'block');
  				$('.rdioLink a').attr('href', 'http://rdio.com' + url);
  				$('.overlay').fadeOut();
				$('.overlay').empty();

  			},
  			error: function() {
  				console.log('error');
  			}
  		});
  	};

	// end if authenticated

});
/* jshint ignore:end */


