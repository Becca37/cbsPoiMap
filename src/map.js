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
var markersCategoryDataArray = [];
var thisMarkerCategoryData = [];

var markerDataSource = 'data/markers.json';
var markersCategoryDataSource = 'data/markersCategoryData.json';
var weatherDataSource = 'https://api.openweathermap.org/data/2.5/weather?&appid=11be7e069a8c86553c0daf1eae697cd9&units=imperial';

function loadJSON(jsonDataUrl, callback, asyncPref) 
{  
	try
	{  
		//https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
		//https://codepen.io/KryptoniteDove/post/load-json-file-locally-using-pure-javascript
		var xobj = new XMLHttpRequest();
		xobj.overrideMimeType("application/json");
		xobj.open('GET', jsonDataUrl, asyncPref);
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

function getMarkersDataFromFile()
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
		handleError('Get Markers Data (json)', e);
	}
}

function getMarkersCategoryDataFromFile()
{
	try
	{    
		loadJSON
		(markersCategoryDataSource, function(response) 
			{
				markersCategoryDataArray = JSON.parse(response);
			}
			, false
		);		
		if(isATest)
		{
			console.warn('TESTING: Marker Category Data Array Length: ' + markersCategoryDataArray.length);
			console.log('TESTING: Category #1 Category: ' + markersCategoryDataArray[0].cbsMainCategory);
			console.log('TESTING: Category #1 Map Marker: ' + markersCategoryDataArray[0].mapMarkerIcon);
			console.log('TESTING: Category #1 Furkot Pin: ' + markersCategoryDataArray[0].furkotPinName);
		}
	}
	catch (e)
	{
		handleError('Get Markers Category Data (json)', e);
	}
}

function getWeatherDataFromApi(markerLatitude, markerLongitude)
{
	var weatherDataCurrent = '';
	var weatherDataTemps = '';
	var weatherDataLocation = '';
	var weatherDataSun = '';
	
	try
	{    
		var weatherDataSourceUrl = weatherDataSource + '&lat=' + markerLatitude + '&lon=' + markerLongitude;
		
		loadJSON
		(weatherDataSourceUrl, function(response) 
			{
				weatherDataResult = JSON.parse(response);
			}
			, false
		);
		
		weatherDataCurrent = '';		
		weatherDataCurrentIcons = '';
		weatherDataCurrentText = '';
		
		weatherDataResult.weather.forEach
			(function(weatherType, i) 
				{
					weatherDataCurrentIcons += '<img src="http://openweathermap.org/img/w/' + weatherDataResult.weather[i].icon + '.png" alt=' + weatherDataResult.weather[i].main + '/> ';
					
					if (i > 0)
					{
						weatherDataCurrentText += '<i>mixed with</i> ';
					}
					weatherDataCurrentText += '<b>' + weatherDataResult.weather[i].main + '</b> (' + weatherDataResult.weather[i].description + ') ';
				}
			);
		weatherDataCurrent = weatherDataCurrentIcons + '<div class="weatherCurrent">' + weatherDataCurrentText + '</div>';
		
		weatherDataTemps = ''
			+ '<table><tr style="border: 1px;"><th>Now</th><th>High</th><th>Low</td></tr><tr><td>'
			+ Math.round(weatherDataResult.main.temp) + ' &deg;F</td><td>' 
			+ Math.round(weatherDataResult.main.temp_max) + ' &deg;F</td><td>' 
			+ Math.round(weatherDataResult.main.temp_min) + ' &deg;F</td></tr></table>';
			
		weatherDataLocation = weatherDataResult.name + ', ' + weatherDataResult.sys.country;
		
		var sunriseTime = (new Date((weatherDataResult.sys.sunrise) * 1000));
		var sunsetTime = (new Date((weatherDataResult.sys.sunset) * 1000));
		weatherDataSunrise = sunriseTime;
		weatherDataSunset = sunsetTime;
		
		if(isATest)
		{
			console.log('TESTING: Weather: ' + weatherDataCurrent);
			console.log('TESTING: Temps: ' + weatherDataTemps);
			console.log('TESTING: Location: ' + weatherDataLocation);
			console.log('TESTING: Sunrise: ' + weatherDataSunrise);
			console.log('TESTING: Sunset: ' + weatherDataSunset);
		}
		
		return [weatherDataCurrent, weatherDataTemps, weatherDataLocation, weatherDataSunrise, weatherDataSunset];
	}
	catch (e)
	{
		handleError('Get Markers Data (json)', e);
		weatherDataCurrent = 'ERROR: Unable to process weather data: ' + e;
		weatherDataTemps = 'Unknown';
		weatherDataLocation = 'Unknown';
		weatherDataSunrise = 'Unknown';
		weatherDataSunset = 'Unknown';
		return [weatherDataCurrent, weatherDataTemps, weatherDataLocation, weatherDataSunrise, weatherDataSunset];
	}
}

function getMarkerCategoryDataFromArray(thisMarkerCategory)
{	
	var categoryData = 
	{ 
		  cbsMainCategory: thisMarkerCategory
		, mapMarkerIcon: '/map/images/icons/mic/flag-export.png'
		, furkotPinName: 'stop' 
	};	
	
	try
	{ 			
		var index = markersCategoryDataArray.findIndex(entry => entry.cbsMainCategory === thisMarkerCategory);
		var thisMarkerCategoryData = markersCategoryDataArray[index];
		if (thisMarkerCategoryData)
		{		
			categoryData = 
			{ 
				  cbsMainCategory: thisMarkerCategory
				, mapMarkerIcon: thisMarkerCategoryData.mapMarkerIcon
				, furkotPinName: thisMarkerCategoryData.furkotPinName 
			};
		}			
		
		return categoryData;
	}
	catch (e)
	{
		handleError('Get Marker Category Data (array)', e);
		return categoryData;
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

function setMarkersCategoryData()
{
	try
	{				
		//Get the distinct categories from the marker data array then populate the markerCategoryArray
		//https://jsperf.com/distinct-values-from-array
		loop1: for (var i = 0; i < markerDataArray.length; i++) 
		{				
			var categoryName = markerDataArray[i].cbsMainCategory;

			for (var i2 = 0; i2 < markerCategoriesArray.length; i2++) 
			{
				if (markerCategoriesArray[i2] == categoryName) 
				{
					continue loop1;
				}
			}
			markerCategoriesArray.push(categoryName);
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
		getMarkersDataFromFile();
		getMarkersCategoryDataFromFile();
		setMarkersCategoryData();
		
		var bounds = new google.maps.LatLngBounds();
		
		for (var i = 0; i < markerDataArray.length; i++) 
		{		
			// Ran into the issue of every marker displaying the content for the LAST marker added
			// To make each marker display its own data, use an "immediately-invoked function expression"
			// https://stackoverflow.com/a/19324832/4407150
			(function(index) //an "immediately-invoked function expression"
				{
					var thisMarker = markerDataArray[i];
					var thisMarkerCategoryData = getMarkerCategoryDataFromArray(thisMarker.cbsMainCategory);
					var thisMarkerPosition = 
						{
							lat: thisMarker.latitude,
							lng: thisMarker.longitude
						};	
					
					var addThisMarker = new google.maps.Marker
					(
						{
							position: thisMarkerPosition,
							map: map,
							title:  thisMarker.cbsTitle,
							icon: thisMarkerCategoryData.mapMarkerIcon,
							cbsCategory: thisMarker.cbsMainCategory,
							cbsId: thisMarker.cbsId
						}
					);

					bounds.extend(thisMarkerPosition);	
					
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
		
		// Zoom to fit the bounds of all markers
		// https://stackoverflow.com/a/22712105/4407150
		google.maps.event.addListenerOnce
		(map, 'bounds_changed', function(event) 
			{
				this.setZoom(map.getZoom()-1);

				if (this.getZoom() > 8) 
				{
					this.setZoom(8);
				}
			}
		);
		map.fitBounds(bounds);	
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
							locationElevation =  Math.ceil(results[0].elevation *  3.28084).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' feet (' + Math.ceil(results[0].elevation).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' meters)';
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
					var thisMarkerCategoryData = getMarkerCategoryDataFromArray(thisMarker.cbsMainCategory);
					
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
					
					var markerStopNameForFurkot = thisMarkerCategoryData.furkotPinName
						? '&stop[pin]=' + thisMarkerCategoryData.furkotPinName
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

					var [weatherDataCurrent, weatherDataTemps, weatherDataLocation, weatherDataSunrise, weatherDataSunset] = getWeatherDataFromApi(thisMarker.latitude, thisMarker.longitude);
											
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
					var furkotLinkIcons = '<i class="ff-icon-furkot"></i><i class="ff-icon-' + thisMarkerCategoryData.furkotPinName + '"></i>';
					
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
								+ '<div class="markerQuickFactLabel">Location</div>'
								+ '<div class="markerQuickFactData">' + weatherDataLocation + '</div>'
							+ '</div>'
							+ '<div class="markerQuickFact">'
								+ '<div class="markerQuickFactLabel">Coordinates</div>'
								+ '<div class="markerQuickFactData">' + thisMarker.latitude + ', ' + thisMarker.longitude + '</div>'
							+ '</div>'
							+ '<div class="markerQuickFact">'
								+ '<div class="markerQuickFactLabel">Elevation</div>'
								+ '<div class="markerQuickFactData">' + locationElevation + '</div>'
							+ '</div>'
							+ '<div class="markerQuickFact">'
								+ '<div class="markerQuickFactLabel">Weather</div>'
								+ '<div class="markerQuickFactData">' + weatherDataCurrent + '</div>'
							+ '</div>'
							+ '<div class="markerQuickFact">'
								+ '<div class="markerQuickFactLabel">Temps</div>'
								+ '<div class="markerQuickFactData"><div class="weatherTemps">' + weatherDataTemps + '</div></div>'
							+ '</div>'
							+ '<div class="markerQuickFact">'
								+ '<div class="markerQuickFactLabel">Sunrise</div>'
								+ '<div class="markerQuickFactData"><div class="weatherSun">' + weatherDataSunrise + '</div></div>'
							+ '</div>'
							+ '<div class="markerQuickFact">'
								+ '<div class="markerQuickFactLabel">Sunset</div>'
								+ '<div class="markerQuickFactData"><div class="weatherSun">' + weatherDataSunset + '</div></div>'
							+ '</div>'
						+ '</div>'
						+ '<div class="markerNotes">' 
							+ thisMarker.cbsNotes 
						+ '</div>';
					
					if(isATest)
					{
						console.log('TESTING: Marker Content: ' + contentString);
					}		
					
					markerInfoContainer.style.display = 'table';					
					
					markerIconImage.src = thisMarkerCategoryData.mapMarkerIcon;
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
			var thisMarkerCategoryData = markerCategoryDataArray[index];
			
			var controlUI = document.createElement('div');
			controlUI.id = 'ToggleCategory' + filterCategory;
			controlUI.className = 'control-filter controlInactive';
			controlUI.innerHTML = 
				'<div><img src="' + thisMarkerCategoryData.mapMarkerIcon + '" alt="' + filterCategory + ' Filter"/> ' + filterCategory + '</div>';
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

						var currentLocationSvg = document.getElementById('svgIcon').innerHTML;
						
						if(!currentLocationMarker)
						{
							currentLocationMarker = new google.maps.Marker
							(
								{
									position: pos,
									map: map,
									title:  'Approximate Current Location',
									icon: 
									{ 
										  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(currentLocationSvg)
										, scaledSize: new google.maps.Size(50, 50)
									}
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
			if (!currentLocationMarker.animating)
			{
				currentLocationMarker.setAnimation(4);
			}
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
