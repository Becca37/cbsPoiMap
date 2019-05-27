var isATest = false;
		
function handleError(useTitle, e)
{	
	if(isATest)
	{
		console.error('TESTING: ERROR ENCOUNTERED: ' + e);
	}
	
	//iziToast.destroy();	
	iziToast.error(
		{
			title: useTitle,
			message: 'ERROR: ' + e.message + ".",
			//timeout: false,
		}	
	);
} 

var map = null;
var mapCenter = {lat: 39.219422, lng: -105.530727}; // Colorado

var trafficLayer = null;

var currentLocationMarker = null;
var watchCurrentLocationId = null;
	
var markersArray = [];
var markerDataArray = [];
var markerCategoriesArray = [];
var markerCategoryDataArray = [];

var markerDataSource = 'data/markers.json';

function loadJSON(jsonDataFile, callback, asyncPref) 
{  
	try
	{  
		//https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
		//https://codepen.io/KryptoniteDove/post/load-json-file-locally-using-pure-javascript
		var xobj = new XMLHttpRequest();
		xobj.overrideMimeType("application/json");
		xobj.open('GET', jsonDataFile, asyncPref);
		xobj.onreadystatechange = function () 
		{
			if (xobj.readyState == 4 && xobj.status == "200") 
			{
				callback(xobj.responseText);
			}
			else
			{
				console.log('JSON File Request State: ' + xobj.readyState + ' and Status: ' + xobj.statusText + ';' + currentTimestamp());
			}
		};
		xobj.send(null);  
	}
	catch (e)
	{
		handleError('Show/Hide Instructions', e);
	}
}

function getMarkerDataFromFile()
{
	try
	{    
		loadJSON
		(markerDataSource, function(response) 
			{
				markerDataArray = JSON.parse(response);
			}
			, false
		);		
		if(isATest)
		{
			console.warn('TESTING: Marker Array Length: ' + markerDataArray.length);
			console.log('TESTING: Marker #1: ' + markerDataArray[0].cbsTitle);
			console.log('TESTING: Marker #1 ID: ' + markerDataArray[0].cbsId);
			console.log('TESTING: Marker #1 Category: ' + markerDataArray[0].cbsMainCategory);
		}
	}
	catch (e)
	{
		handleError('Show/Hide Instructions', e);
	}
}

function showHideInstructions()
{
	try
	{ 
		if (instructionsContainer.classList.contains('isVisible'))
		{
			instructionsContainer.classList.remove('isVisible');
			instructionsContainer.classList.add('isNotVisible');
			toggleInstructions.innerHTML = '<span class="toggleInstructionsText"><i class="far fa-question-circle"></i> Hide Instructions</div></span>';
		}
		else
		{
			instructionsContainer.classList.remove('isNotVisible');
			instructionsContainer.classList.add('isVisible');
			toggleInstructions.innerHTML = '<span class="toggleInstructionsText"><i class="far fa-question-circle"></i> Show Instructions</div></span>';
		}
	}
	catch (e)
	{
		handleError('Show/Hide Instructions', e);
	}
}

function currentTimestamp()
{
	try
	{
		var timestamp = ' [' + new Date().toUTCString() + '] ';
		return timestamp;
	}
	catch (e)
	{
		handleError('Map Initialization', e);
		return '[Error setting timestamp.]'
	}
}

function initMap() 
{
	try
	{	
		map = new google.maps.Map
		(
			document.getElementById('mapPanel'), 
			{
				center: mapCenter,
				zoom: 8,
				mapTypeId: 'terrain',
				mapTypeControl: true,
				mapTypeControlOptions: 
				{
					style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
					position: google.maps.ControlPosition.TOP_LEFT
				},
				scrollwheel: true,
				scaleControl: true,
				streetViewControl: true
			}
		);		
		
		addCustomControlsTo(map);
		getMarkerDataFromFile();
		setMarkerCategoryData();
		addMarkersTo(map);
		//watchLocation(map); -- control is not available until page fully loads, so defer to user click to start the watch
	}
	catch (e)
	{
		handleError('Map Initialization', e);
	}	
}

function addCustomControlsTo(map)
{
	try
	{
		//https://developers.google.com/maps/documentation/javascript/controls#ControlPositioning

		// Add custom control for MARKER INFO	
		// var markerInfoControlDiv = document.createElement('div');
		// var markerInfoControl = new MarkerInfoControl(markerInfoControlDiv, map);	
		// markerInfoControlDiv.index = 1;
		// map.controls[google.maps.ControlPosition.LEFT_CENTER].push(markerInfoControlDiv);

		// Add custom control for FILTERs on CATEGORIES
		var markerCategoryFilterDiv = document.createElement('div');
		var markerCategoryFilter = new MarkerCategoryFilter(markerCategoryFilterDiv, map);	
		markerCategoryFilterDiv.index = 1;
		map.controls[google.maps.ControlPosition.LEFT_CENTER].push(markerCategoryFilterDiv);

		// Add custom control for ISATEST
		var isatestControlDiv = document.createElement('div');
		var isatestControl = new IsATestControl(isatestControlDiv, map);	
		isatestControlDiv.index = 1;
		map.controls[google.maps.ControlPosition.BOTTOM_LEFT].push(isatestControlDiv);

		// Add custom control for LOCATION INFO	
		var locationInfoControlDiv = document.createElement('div');
		var locationInfoControl = new LocationInfoControl(locationInfoControlDiv, map);	
		locationInfoControlDiv.index = 1;
		map.controls[google.maps.ControlPosition.BOTTOM_LEFT].push(locationInfoControlDiv);

		// Add custom control for TRAFFIC
		var trafficControlDiv = document.createElement('div');
		var trafficControl = new TrafficControl(trafficControlDiv, map);	
		trafficControlDiv.index = 1;
		map.controls[google.maps.ControlPosition.TOP_CENTER].push(trafficControlDiv);
	}
	catch (e)
	{
		handleError('Add Custom Controls', e);
	}	
}

function setMarkerCategoryData()
{
	try
	{		
		//Get the distinct categories from the marker data array then
		//populate both the markerCategoryArray and markerCategoryDataArray
		//https://jsperf.com/distinct-values-from-array
		loop1: for (var i = 0; i < markerDataArray.length; i++) 
		{
			var categoryName = markerDataArray[i].cbsMainCategory;		
		
			var mapMarkerIconValue = '/map/images/icons/mic/flag-export.png';
			var furkotPinNameValue = 'stop';
			
			// TODO: Ideally, we'll do this mapping in a file or data so that it that can
			// be updated as needed without having to modify and upload this javascript file
			switch (categoryName)
			{
				case 'Pass':
					mapMarkerIconValue = '/map/images/icons/mic/mountain-pass-locator-diagonal-reverse-export.png';
					furkotPinNameValue = 'mountains';
				break;
				
				case 'Paved High Point':
					mapMarkerIconValue = '/map/images/icons/mic/direction_up.png';
					furkotPinNameValue = 'one-way';
				break;
			}
			
			var categoryData = 
			{ 
				  name: categoryName
				, mapMarkerIcon: mapMarkerIconValue
				, furkotPinName: furkotPinNameValue 
			};			

			for (var i2 = 0; i2 < markerCategoriesArray.length; i2++) 
			{
				if (markerCategoriesArray[i2] == categoryName) 
				{
					continue loop1;
				}
			}
			markerCategoriesArray.push(categoryName);
			markerCategoryDataArray.push(categoryData);
		}
		
		if(isATest)
		{
			console.warn('TESTING: Marker Category count: ' + markerCategoriesArray.length.toString());			
			markerCategoriesArray.forEach
			(function(category, i) 
				{
					console.log('TESTING: Category', i, 'is', category);
				}
			);
			
			console.warn('TESTING: Marker Category Data count: ' + markerCategoryDataArray.length.toString());					
			markerCategoryDataArray.forEach
			(function(categoryData, i) 
				{
					console.log('TESTING: Category Data', i, 'is', categoryData);
				}
			);			
		}
	}
	catch(e)
	{
		handleError('Filter Markers', e);
	}
}

function addMarkersTo(map) 
{
	try
	{
		// Ran into the issue of every marker displaying the content for the LAST marker added
		// To make each marker display its own data, use an "immediately-invoked function expression"
		// https://stackoverflow.com/a/19324832/4407150
		
		for (var i = 0; i < markerDataArray.length; i++) 
		{
			(function(index)
				{
					var thisMarker = markerDataArray[i];
					var index = markerCategoryDataArray.findIndex(entry => entry.name === thisMarker.cbsMainCategory);
					var thisMarkersCategoryIcon = markerCategoryDataArray[index].mapMarkerIcon;
					
					var addThisMarker = new google.maps.Marker
					(
						{
							position: {lat: thisMarker.latitude, lng: thisMarker.longitude},
							map: map,
							title:  thisMarker.cbsTitle,
							icon: thisMarkersCategoryIcon,
							cbsCategory: thisMarker.cbsMainCategory,
							cbsId: thisMarker.cbsId
						}
					);
					
					addThisMarker.addListener('click', function(){ displayInfoPanelFor(thisMarker);});

					markersArray.push(addThisMarker);
				}
			)(i);
		}
		
		// Marker Clustering
		// https://github.com/googlemaps/v3-utility-library/blob/master/markerclustererplus/examples/events_example.htm
		var markerCluster = new MarkerClusterer
		(map, markersArray, 
			{ 
				  averageCenter: true
				, imagePath: 'images/icons/clusters/m' 
			}
		);

		google.maps.event.addListener
		(markerCluster, "click", function (c) 
			{
				var m = c.getMarkers();
				var p = [];
				for (var i = 0; i < m.length; i++ )
				{
					p.push(m[i].getPosition());
				}
			}
		);		
	}
	catch(e)
	{
		handleError('Add Markers', e);
	}
}

function displayInfoPanelFor(thisMarker)
{	
	try
	{	
		if(isATest)
		{
			console.warn('Processing marker for display.');
		}
		var index = markerCategoryDataArray.findIndex(entry => entry.name === thisMarker.cbsMainCategory);
		var thisMarkersCategoryData = markerCategoryDataArray[index];
		var thisMarkersCategoryIcon = thisMarkersCategoryData.mapMarkerIcon;
		if(isATest)
		{
			console.log('TESTING: Marker Title: ' + thisMarker.cbsTitle);
			console.log('TESTING: Marker ID: ' + thisMarker.cbsId);
			console.log('TESTING: Marker Category: ' + thisMarker.cbsMainCategory);
			console.log('TESTING: Marker Tags: ' + thisMarker.cbsTags.toString().replace(/,/g, ', '));
			console.log('TESTING: Marker Latitude: ' + thisMarker.latitude);
			console.log('TESTING: Marker Longitude: ' + thisMarker.longitude);
			//console.log('TESTING: Marker Notes: ' + thisMarker.cbsNotes);
			if (thisMarker.cbsMainCategory === thisMarkersCategoryData.name)
			{
				console.log('TESTING: markerCategoryDataArray match? YES');
			}
			else
			{
				console.log('TESTING: markerCategoryDataArray match? NO');
			}
		}
		
		// TODO: Ideally, we'll want to pull the ELEVATION data for every marker data ONE TIME
		// via another process (i.o.w. not every time we display the marker) and write it
		// to the file or database to store with the marker data, but Google Maps API terms
		// explicitly disallows saving of elevation data, so until/unless another source is found ...
		
		var elevator = new google.maps.ElevationService;
		var location = {lat: thisMarker.latitude, lng: thisMarker.longitude};
		var locationElevation = null;							
		elevator.getElevationForLocations
		(
			{
				'locations': [location]
			}, function(results, status) 
				{
					if (status === 'OK') 
					{
						if (results[0]) 
						{
							locationElevation =  Math.ceil(results[0].elevation *  3.28084).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' feet (' + Math.ceil(results[0].elevation).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' meters).';
						} 
						else 
						{
							locationElevation = 'No results found';
						}
					}
					else
					{
						locationElevation = 'Elevation service failed due to: ' + status;
					}
					
					if(isATest)
					{
						console.log('TESTING: Marker Elevation: ' + locationElevation);
					}
					
					// ------------------------------------------------------------------
					var markerShowWebsite = thisMarker.cbsReferenceUrl 
						? '<a href="' + thisMarker.cbsReferenceUrl + '" title="Website" target="_blank"><i class="fas fa-globe fa-2x"></i></a>' 
						: '<i class="fas fa-globe fa-2x disabled"></i>';
						
					var markerGooglePlaceId = thisMarker.googlePlaceId
						? '&destination_place_id=' + thisMarker.googlePlaceId
						: '';
					
					//https://developers.google.com/maps/documentation/urls/guide
					var markerStartNavigation = '<a href="https://www.google.com/maps/dir/?api=1'
						+ '&destination=' + encodeURIComponent(thisMarker.latitude + ',' + thisMarker.longitude) 
						+ markerGooglePlaceId
						+ '&travelmode=driving'
						+ '&dir_action=navigate'
						+ '" target="googleMaps" title="Navigate"><i class="far fa-compass fa-2x"></i></a>';
					
					var markerNotesForFurkot = thisMarker.cbsNotes
						? '&stop[notes]=' + encodeURIComponent(thisMarker.cbsNotes)
						: '';
					
					var markerUrlForFurkot = thisMarker.cbsReferenceUrl 
						? '&stop[url]=' + encodeURIComponent(thisMarker.cbsReferenceUrl) 
						: '';
					
					var markerStopNameForFurkot = thisMarkersCategoryData.furkotPinName
						? '&stop[pin]=' + thisMarkersCategoryData.furkotPinName
						: '';
					
					var markerVisitedIcon = '<i class="far fa-question-circle fa-2x" title="We still need to log whether or not we have visited this entry."></i>';
					switch(thisMarker.cbsVisited)
					{
						case "Y":
							markerVisitedIcon = '<i class="far fa-eye fa-2x visited" title="We HAVE seen this with our own eyes!"></i>';
						break;
						
						case "N":
							markerVisitedIcon = '<i class="far fa-eye-slash fa-2x" title="We have NOT yet seen this with our own eyes."></i>';
						break;
					}						
											
					//https://help.furkot.com/widgets/plan-with-furkot-buttons.html	
					var furkotLinkText = 
						'https://trips.furkot.com/trip?stop[name]=' 
								+ encodeURIComponent(thisMarker.cbsTitle)
							+ '&stop[coordinates][lat]=' 
								+ thisMarker.latitude 
							+ '&stop[coordinates][lon]=' 
								+ thisMarker.longitude 
							+ markerNotesForFurkot
							+ markerUrlForFurkot
							+ markerStopNameForFurkot
							+ '&uid=6VjRjO';
					var furkotLinkIcons = '<i class="ff-icon-furkot"></i><i class="ff-icon-' + thisMarkersCategoryData.furkotPinName + '"></i>';
					
					var contentString = 
						  '<div class="markerShelfIcons">'
							+ '<div class="markerShelfIcon" alt="CBS Visited?">' + markerVisitedIcon + '</div>' 
							+ '<div class="markerShelfIcon" alt="Website">' + markerShowWebsite + '</div>' 
							+ '<div class="markerShelfIcon" alt="Navigate">' + markerStartNavigation + '</div>'
						+ '</div>'
						+ '<div class="markerQuickFacts">'
							+ '<div class="markerQuickFact">'
								+ '<div class="markerQuickFactLabel">Category</div>'
								+ '<div class="markerQuickFactData">' + thisMarker.cbsMainCategory + '</div>'
							+ '</div>'
							+ '<div class="markerQuickFact">'
								+ '<div class="markerQuickFactLabel">Tags</div>'
								+ '<div class="markerQuickFactData">' + thisMarker.cbsTags.toString().replace(/,/g, ', ') + '</div>'
							+ '</div>'
							+ '<div class="markerQuickFact">'
								+ '<div class="markerQuickFactLabel">Coordinates</div>'
								+ '<div class="markerQuickFactData">' + thisMarker.latitude + ', ' + thisMarker.longitude + '</div>'
							+ '</div>'
							+ '<div class="markerQuickFact">'
								+ '<div class="markerQuickFactLabel">Elevation</div>'
								+ '<div class="markerQuickFactData">' + locationElevation + '</div>'
							+ '</div>'
						+ '</div>'
						+ '<div class="markerNotes">' 
							+ thisMarker.cbsNotes 
						+ '</div>';
					
					if(isATest)
					{
						console.log('TESTING: Marker Icon: ' + thisMarkersCategoryIcon);
						console.log('TESTING: Marker Furkot Icons: ' + furkotLinkIcons);
						console.log('TESTING: Marker Furkot Link: ' + furkotLinkText);
						console.log('TESTING: Marker Content: ' + contentString);
					}		
					
					markerInfoContainer.style.display = 'table';					
					
					markerIconImage.src = thisMarkersCategoryIcon;
					markerTitleText.innerHTML = thisMarker.cbsTitle;
					markerData.innerHTML = contentString;
					
					markerPlanWithFurkotLink.innerHTML = furkotLinkIcons;
					markerPlanWithFurkotLink.href = furkotLinkText;
					
					panels.style.gridTemplateColumns = '2fr 1fr';
					sidePanel.style.display = 'block';
					// ------------------------------------------------------------------
				}
		);
	}
	catch (e)
	{
		handleError('Display Marker Info', e);
	}
}

function closeSidePanel()
{
	try
	{
		panels.style.gridTemplateColumns = '1fr 0fr';
		sidePanel.style.display = 'none';
	}
	catch(e)
	{
		handleError('Add Markers', e);
	}
}

function MarkerInfoControl(controlDiv, map)
{
	// try
	// {
		// var controlUI = document.createElement('div');
		// controlUI.id = 'ToggleMarkerInfo';
		// controlUI.className = 'markerInfoContainer markerInfoContainerDisplayNone';
		// controlUI.innerHTML = '';
		// controlDiv.appendChild(controlUI);			
	// }
	// catch (e)
	// {		
		// handleError('Locator', e);
	// }
}

function LocationInfoControl(controlDiv, map)
{
	try
	{
		var controlUI = document.createElement('div');
		controlUI.id = 'currentLocationInfoContainer';
		controlUI.innerHTML = '<div id="currentLocationIcon"><i class="fas fa-crosshairs fa-2x"></i></div><div id="currentLocationInfo">Click to show current location info.</div>';
		controlUI.title = 'Click to show current location info.';
		controlDiv.appendChild(controlUI);	

		controlUI.addEventListener('click', goToCurrentLocation);			
	}
	catch (e)
	{		
		handleError('Locator', e);
	}
}

function MarkerCategoryFilter(controlDiv, map)
{
	try
	{		
		for (var i = 0; i < markerCategoriesArray.length; i++)
		{		
			var filterCategory = markerCategoriesArray[i];
			var index = markerCategoryDataArray.findIndex(entry => entry.name === filterCategory);
			var thisMarkersCategoryData = markerCategoryDataArray[index];
			
			var controlUI = document.createElement('div');
			controlUI.id = 'ToggleCategory' + filterCategory;
			controlUI.className = 'control-filter controlInactive';
			controlUI.innerHTML = 
				'<div><img src="' + thisMarkersCategoryData.mapMarkerIcon + '" alt="' + filterCategory + ' Filter"/> ' + filterCategory + '</div>';
			controlUI.title = 'Click to toggle display of all markers in the "' + filterCategory + '" category.';
			controlDiv.appendChild(controlUI);	

			controlUI.addEventListener
			('click', function()
				{ 
					toggleMarkers(map, filterCategory);
				}
			);		
		}
	}
	catch (e)
	{		
		handleError('Locator', e);
	}
}

function IsATestControl(controlDiv, map)
{
	try
	{
		var controlUI = document.createElement('div');
		controlUI.id = 'ToggleIsATest';
		if(isATest)
		{
			controlUI.className = 'control-test controlTestActive';
		} 
		else
		{
			controlUI.className = 'control-test controlTestInactive';
		}
		controlUI.innerHTML = 
			'<div><i class="fas fa-user-secret fa-1x"></i></i></i></div>';
		controlUI.title = 'Click to toggle general testing (then enable console: [F12]).';
		controlDiv.appendChild(controlUI);	
		
		var messageToUserGeneralON = 'TESTING: Testing has been turned ON.<br/><br/>Additional messages will be logged during use.<br/><br/>View them on desktop browser console or via mobile remote debugging options.';
		var messageToUserGeneralOFF = 'TESTING: General testing has been turned OFF.';		

		controlUI.addEventListener
		('click', function()
			{ 
				if(isATest)
				{
					console.warn(messageToUserGeneralOFF);
					isATest = false;
					controlUI.className = 'control-test controlTestInactive';
					iziToast.info({title: 'Testing Ended', message: messageToUserGeneralOFF,});
				}
				else
				{
					console.warn(messageToUserGeneralON);
					isATest = true;
					controlUI.className = 'control-test controlTestActive';
					iziToast.warning({title: 'Testing Started', message: messageToUserGeneralON + '<br/><br/>(Click to close this message.)', timeout: false, closeOnClick: true, closeOnEscape: true,});
				}
			}
		);		
	}
	catch (e)
	{		
		handleError('Locator', e);
	}
}

function TrafficControl(controlDiv, map)
{
	try
	{
		trafficLayer = new google.maps.TrafficLayer();
		
		// Set CSS for the control border.
		var controlUI = document.createElement('div');
		controlUI.className = 'control-traffic controlInactive';
		controlUI.id = 'ToggleTraffic';
		controlUI.innerHTML = '<i class="fas fa-traffic-light"></i>&nbsp;Traffic';
		controlUI.title = 'Click to toggle traffic overlay display.';
		controlDiv.appendChild(controlUI);	

		controlUI.addEventListener
		('click', function() 
			{	try
				{	
					if(typeof(trafficLayer.getMap()) === 'undefined' || trafficLayer.getMap() == null)
					{
						trafficLayer.setMap(map);					
						document.getElementById('ToggleTraffic').className = 'control-traffic controlActive';	
						iziToast.success(
							{
								title: 'Traffic',
								message: 'Traffic layer should now be displayed. You might need to zoom in or out to see the change.',
								
							}
						);
					}
					else
					{
						trafficLayer.setMap(null);					
						document.getElementById('ToggleTraffic').className = 'control-traffic controlInactive';	
						iziToast.success(
							{
								title: 'Traffic',
								message: 'Traffic layer should now be gone. If only it were that easy to get rid of the actual traffic, eh?!',
							}	
						);
						
					}
				}
				catch (e)
				{	
					handleError('Traffic', e);
				}
			}
		);
	}
	catch (e)
	{		
		handleError('Traffic', e);
	}
}

function watchLocation(map)
{
	//Perform geolocation via the browser HTML5 navigation functionality
	//https://developer.mozilla.org/en-US/docs/Web/API/Navigator/geolocation
	try
	{	
		if (navigator.geolocation) 
		{
			watchCurrentLocationId = navigator.geolocation.watchPosition
			(
				function(position)
				{
					// callback to handle SUCCESS
					try
					{
						var pos = 
						{
							lat: position.coords.latitude,
							lng: position.coords.longitude
						};
						
						var icon = 
						{
							path: "M27.648-41.399q0-3.816-2.7-6.516t-6.516-2.7-6.516 2.7-2.7 6.516 2.7 6.516 6.516 2.7 6.516-2.7 2.7-6.516zm9.216 0q0 3.924-1.188 6.444l-13.104 27.864q-.576 1.188-1.71 1.872t-2.43.684-2.43-.684-1.674-1.872l-13.14-27.864q-1.188-2.52-1.188-6.444 0-7.632 5.4-13.032t13.032-5.4 13.032 5.4 5.4 13.032z",
							fillColor: '#E32831',
							fillOpacity: .5,
							strokeWeight: 0,
							scale: 0.65
						}		
						
						if(!currentLocationMarker)
						{
							currentLocationMarker = new google.maps.Marker
							(
								{
									id: 'myCurrentPosition',
									position: pos,
									map: map,
									title:  'Approximate Current Location',
									icon: icon
								}
							);
						}
						else
						{
							currentLocationMarker.setPosition
							(
								new google.maps.LatLng
								(
									position.coords.latitude,
									position.coords.longitude
								)
							);
						}
						
						var accuracyInFeet = Math.ceil(position.coords.accuracy *  3.28084).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' feet';
						var accuracyInMeters = ' (' + Math.ceil(position.coords.accuracy).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' meters)';	

						if (document.getElementById('currentLocationInfo'))
						{							
							document.getElementById('currentLocationInfoContainer').title = 'Click to pan and zoom to current location.';
							
							var controlUI = document.getElementById('currentLocationInfo');
							controlUI.innerHTML = 'Click to pan/zoom to: <b>' + position.coords.latitude + ', ' + position.coords.longitude + '</b><br/><span style="font-size: smaller;">Accuracy ~ ' + accuracyInFeet + accuracyInMeters + '. ' + currentTimestamp() + '</span>';
						}
					}
					catch(e)
					{
						handleError('Watch Location', e);
					}
				}
				, function(browserHasGeolocation) 
				{	
					// callback to handle ERROR
					try
					{
						var locationMessage = null;
						
						if(browserHasGeolocation)
						{
							locationMessage = 'The Geolocation service failed. Did you allow use of location in your browser?' + currentTimestamp();
						}
						else
						{
							locationMessage = 'Your browser doesn\'t support geolocation.' + currentTimestamp();
						}
							
						if (document.getElementById('CurrentLocationInfo'))
						{
							document.getElementById('CurrentLocationInfo').innerHTML = 	locationMessage;
						}
						else
						{
							iziToast.warning({title: 'Location', message: locationMessage,});
						}
					}
					catch(e)
					{
						handleError('Watch Location', e);
					}
				}
				, {maximumAge:5000, timeout:4000, enableHighAccuracy: true}
			);
		}
		else
		{
			handleLocationError(false);
		}
	}
	catch(e)
	{
		handleError('Watch Location', e);
	}
}

function goToCurrentLocation()
{
	try
	{	
		if(currentLocationMarker)
		{
			var currentPosition = currentLocationMarker.position;
			map.zoom = 16;
			map.panTo(currentPosition);
		}
		else
		{		
			watchLocation(map);
		}
	}
	catch(e)
	{
		handleError('Go To Current Location', e);
	}
}

function toggleMarkers(map, toggleCategory)
{
	try
	{
		var desiredState = 'hide';
		
		var markersInThisCategoryArray = markersArray.filter
		(
			function(filterOn) 
			{
				return filterOn.cbsCategory == toggleCategory;
			}
		);
		
		if(isATest)
		{			
			console.warn('TESTING: All Markers count: ' + markersArray.length.toString());
			for (var i = 0; i < 1; i++) 
			{
				var markerData = markersArray[i];		
				console.log('TESTING: Marker Data', i, 'is', markerData);
			}
		}
		
		if(isATest)
		{
			console.warn('TESTING: Marker count in category "' + toggleCategory + '": ' + markersInThisCategoryArray.length.toString());
		}
		
		for (var i = 0; i < markersInThisCategoryArray.length; i++) 
		{
			if (desiredState = 'show')
			{
				markersInThisCategoryArray[i].setMap(map);
			}
			else
			{
				markersInThisCategoryArray[i].setMap(null);
			}	
		}
	}
	catch(e)
	{
		handleError('Filter Markers', e);
	}
}
