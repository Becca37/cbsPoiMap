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
	
var markerDataArray = [];			//holds the Chasing Blue Sky point of interest data
var markersArray = []; 				//holds the CBS POIs as Google Maps Marker data after processing

var markersDistinctCategoriesArray = [];		//holds the distinct categories found in the CBS POIs markers
var markersCategoryDataArray = [];	//holds the data about categories (e.g. name, icon, and Furkot pin)
var thisMarkerCategoryData = [];	//holds the category data for a given marker

var quotesForFriends = '';			//holds the string for quotes about Friends to be used as CBS Notes
var quotesForFamily = '';			//holds the string for quotes about Family to be used as CBS Notes

var markerDataSource = 'data/markers.json';
var markersCategoryDataSource = 'data/markersCategoryData.json';
var markerClustering = null;

var quotesDataSource = 'data/quotes.json';

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
			console.warn('TESTING: Marker Data Array Length: ' + markerDataArray.length);
			console.log('TESTING: Marker #1: ' + markerDataArray[0].cbsTitle);
			console.log('TESTING: Marker #1 ID: ' + markerDataArray[0].cbsId);
			console.log('TESTING: Marker #1 Category: ' + markerDataArray[0].cbsMainCategory);
		}
		getDistinctCategories();	
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
				markersCategoryDataArray = JSON.parse(response).sort(compareValues('cbsMainCategory', 'asc'));
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

function getQuotes()
{
	try
	{    
		var quotesArray = [];
		loadJSON
		(quotesDataSource, function(response) 
			{
				quotesArray = JSON.parse(response);
			}
			, false
		);		
		
		quotesArray.forEach
		(function(thisQuote, i) 
			{
				if (thisQuote.quoteType === 'Family')
				{
					quotesForFamily += '<div class="quoteText">' + thisQuote.quoteText + '<span class="quoteAttribution">' + thisQuote.quoteAttribution + '</span></div>'						
				}
				else if (thisQuote.quoteType === 'Friend')
				{
					quotesForFriends += '<div class="quoteText">' + thisQuote.quoteText + '<span class="quoteAttribution">' + thisQuote.quoteAttribution + '</span></div>'
				}
			}
		);
		
		quotesForFamily = '<div class="quotes">' + quotesForFamily + '</div>';
		quotesForFriends = '<div class="quotes">' + quotesForFriends + '</div>';
			
		if(isATest)
		{
			console.warn('TESTING: Quotes for Family: ' + quotesForFamily);
			console.warn('TESTING: Quotes for Friends: ' + quotesForFriends);
		}
	}
	catch (e)
	{
		handleError('Get Markers Data (json)', e);
	}
}

function getWeatherDataFromApi(markerLatitude, markerLongitude)
{
	var weatherDataResult = '';
	
	try
	{    
		var weatherDataSourceUrl = weatherDataSource + '&lat=' + markerLatitude + '&lon=' + markerLongitude;
		
		loadJSON
		(weatherDataSourceUrl, function(response) 
			{
				weatherData = JSON.parse(response);
			}
			, false
		);
		
		weatherDataCurrent = '';		
		weatherDataCurrentIcons = '';
		weatherDataCurrentText = '';
		
		weatherData.weather.forEach
			(function(weatherType, i) 
				{
					weatherDataCurrentIcons += '<img src="https://openweathermap.org/img/w/' + weatherData.weather[i].icon + '.png" alt=' + weatherData.weather[i].main + '/> ';
					
					if (i > 0)
					{
						weatherDataCurrentText += '<i>mixed with</i> ';
					}
					weatherDataCurrentText += '<b>' + weatherData.weather[i].main + '</b> (' + weatherData.weather[i].description + ') ';
				}
			);
		weatherDataCurrent = weatherDataCurrentIcons + '<div class="weatherCurrent">' + weatherDataCurrentText + '</div>';
		
		weatherDataTemps = ''
			+ '<table><tr style="border: 1px;"><th>Now</th><th>High</th><th>Low</td></tr><tr><td>'
			+ Math.round(weatherData.main.temp) + ' &deg;F</td><td>' 
			+ Math.round(weatherData.main.temp_max) + ' &deg;F</td><td>' 
			+ Math.round(weatherData.main.temp_min) + ' &deg;F</td></tr></table>';
			
		weatherDataLocation = weatherData.name + ', ' + weatherData.sys.country;
		
		var sunriseTime = (new Date((weatherData.sys.sunrise) * 1000));
		var sunsetTime = (new Date((weatherData.sys.sunset) * 1000));
		weatherDataSunrise = sunriseTime;
		weatherDataSunset = sunsetTime;
		
		weatherDataResult = ''
			+ '<div class="markerQuickFact">'
				+ '<div class="markerQuickFactLabel">Location</div>'
				+ '<div class="markerQuickFactData">' + weatherDataLocation + '</div>'
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
			+ '</div>';
		
		if(isATest)
		{
			console.log('TESTING: Weather: ' + weatherDataResult);
		}
		
		return weatherDataResult;
	}
	catch (e)
	{
		handleError('Get Markers Data (json)', e);
		weatherDataResult = 'ERROR: Unable to process weather data: ' + e;
		return weatherDataResult;
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
		
		getMarkersCategoryDataFromFile();
		getMarkersDataFromFile();
		addCustomControlsTo(map);
		addMarkersTo(map);
		getQuotes();
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
		var markerCategoryFilter = new MarkerCategoryFilterControl(markerCategoryFilterDiv, map);	
		markerCategoryFilterDiv.index = 1;
		map.controls[google.maps.ControlPosition.LEFT_CENTER].push(markerCategoryFilterDiv);

		// Add custom control for CLUSTERING
		var clusteringControlDiv = document.createElement('div');
		var clusteringControl = new ClusteringControl(clusteringControlDiv, map);	
		clusteringControlDiv.index = 1;
		map.controls[google.maps.ControlPosition.BOTTOM_LEFT].push(clusteringControlDiv);

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

function getDistinctCategories()
{
	try
	{	
		var workingArray = markerDataArray.sort(compareValues('cbsMainCategory', 'asc'));
		
		//Get the distinct categories from the marker data array then populate the markerCategoryArray
		//https://jsperf.com/distinct-values-from-array
		loop1: for (var i = 0; i < workingArray.length; i++) 
		{				
			var categoryName = workingArray[i].cbsMainCategory;

			for (var i2 = 0; i2 < markersDistinctCategoriesArray.length; i2++) 
			{
				if (markersDistinctCategoriesArray[i2] == categoryName) 
				{
					continue loop1;
				}
			}
			markersDistinctCategoriesArray.push(categoryName);
		}
				
		if(isATest)
		{
			console.warn('TESTING: Distinct Categories count: ' + markersDistinctCategoriesArray.length.toString());			
			markersDistinctCategoriesArray.forEach
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
					
					addThisMarker.addListener
					('click', function()
						{ 
							displayInfoPanelFor(thisMarker, 'cbsPoi', thisMarker.latitude, thisMarker.longitude);
						}
					);
					markersArray.push(addThisMarker);				
				}
			)(i); // END "immediately-invoked function expression"
		}
		
		// Marker Clustering
		// https://github.com/googlemaps/v3-utility-library/blob/master/markerclustererplus/examples/events_example.htm
		markerClustering = new MarkerClusterer
		(map, markersArray, 
			{ 
				  averageCenter: true
				, imagePath: 'images/icons/clusters/m' 
			}
		);
		markerClustering.setIgnoreHidden(true);

		google.maps.event.addListener
		(markerClustering, "click", function (c) 
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

function displayInfoPanelFor(thisMarker, thisMarkerType, thisMarkerLatitude, thisMarkerLongitude)
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
		var location = {lat: thisMarkerLatitude, lng: thisMarkerLongitude};
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
					var thisMarkerCategory = '';					
					var thisMarkerCategoryData = '';
					var thisMarkerrCategoryIconImage = '';
					var markerShowWebsite = '';
					var markerGooglePlaceId = '';
					var markerStartNavigation = '';
					var markerNotesForFurkot = '';
					var markerUrlForFurkot = '';
					var markerStopNameForFurkot = '';
					var furkotLinkText = '';
					var furkotLinkIcons = '';
					var markerVisitedIcon = '';
					var thisMarkerTags = '';
					var thisMarkerCbsNotes = '';
					var weatherData = '';
					
					if(thisMarkerType === 'cbsPoi')
					{
						thisMarkerTitle = thisMarker.cbsTitle;
						thisMarkerCategory = thisMarker.cbsMainCategory;
						thisMarkerCategoryData = getMarkerCategoryDataFromArray(thisMarkerCategory);
						thisMarkerrCategoryIconImage = '<img src="' + thisMarkerCategoryData.mapMarkerIcon + '" alt="Marker Icon"/>';
						
						markerShowWebsite = thisMarker.cbsReferenceUrl 
							? '<a href="' + thisMarker.cbsReferenceUrl + '" title="Website" target="_blank"><i class="fas fa-globe fa-2x"></i></a>' 
							: '<i class="fas fa-globe fa-2x disabled"></i>';
							
						markerGooglePlaceId = thisMarker.googlePlaceId
							? '&destination_place_id=' + thisMarker.googlePlaceId
							: '';
						
						//https://developers.google.com/maps/documentation/urls/guide
						markerStartNavigation = '<a href="https://www.google.com/maps/dir/?api=1'
							+ '&destination=' + encodeURIComponent(thisMarker.latitude + ',' + thisMarker.longitude) 
							+ markerGooglePlaceId
							+ '&travelmode=driving'
							+ '&dir_action=navigate'
							+ '" target="googleMaps" title="Navigate"><i class="far fa-compass fa-2x"></i></a>';
						
						markerNotesForFurkot = thisMarker.cbsNotes
							? '&stop[notes]=' + encodeURIComponent(thisMarker.cbsNotes)
							: '';
						
						markerUrlForFurkot = thisMarker.cbsReferenceUrl 
							? '&stop[url]=' + encodeURIComponent(thisMarker.cbsReferenceUrl) 
							: '';
						
						markerStopNameForFurkot = thisMarkerCategoryData.furkotPinName
							? '&stop[pin]=' + thisMarkerCategoryData.furkotPinName
							: '';
						
						markerVisitedIcon = '<i class="far fa-question-circle fa-2x" title="We still need to log whether or not we have visited this entry."></i>';
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
						furkotLinkText = 
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
						furkotLinkIcons = '<i class="ff-icon-furkot"></i><i class="ff-icon-' + thisMarkerCategoryData.furkotPinName + '"></i>';
						
						thisMarkerTags = thisMarker.cbsTags.toString().replace(/,/g, ', ');
						
						thisMarkerCbsNotes = thisMarker.cbsNotes;
						if (thisMarkerCbsNotes === 'useQuotes')
						{
							if (thisMarkerCategory === 'Friend(s)')
							{
								thisMarkerCbsNotes = quotesForFriends;
							}
							else if (thisMarkerCategory === 'Family')
							{
								thisMarkerCbsNotes = quotesForFamily;
							}
						}
						
						thisMarkerLatitude = thisMarker.latitude;
						thisMarkerLongitude = thisMarker.longitude;
					}
					else if (thisMarkerType === 'gMap')
					{
						thisMarkerTitle = 'Current Location';
						thisMarkerCategory = 'You Are Here';
						thisMarkerrCategoryIconImage = document.getElementById('svgIcon').innerHTML;
						thisMarkerTags = 'Approximately';
					}

					weatherData = getWeatherDataFromApi(thisMarkerLatitude, thisMarkerLongitude);
					
					var contentString = 
						  '<div class="markerShelfIcons">'
							+ '<div class="markerShelfIcon" alt="CBS Visited?">' + markerVisitedIcon + '</div>' 
							+ '<div class="markerShelfIcon" alt="Website">' + markerShowWebsite + '</div>' 
							+ '<div class="markerShelfIcon" alt="Navigate">' + markerStartNavigation + '</div>'
						+ '</div>'
						+ '<div class="markerQuickFacts">'
							+ '<div class="markerQuickFact">'
								+ '<div class="markerQuickFactLabel">Category</div>'
								+ '<div class="markerQuickFactData">' + thisMarkerCategory + '</div>'
							+ '</div>'
							+ '<div class="markerQuickFact">'
								+ '<div class="markerQuickFactLabel">Tags</div>'
								+ '<div class="markerQuickFactData">' + thisMarkerTags + '</div>'
							+ '</div>'
							+ '<div class="markerQuickFact">'
								+ '<div class="markerQuickFactLabel">Elevation</div>'
								+ '<div class="markerQuickFactData">' + locationElevation + '</div>'
							+ '</div>'
							+ '<div class="markerQuickFact">'
								+ '<div class="markerQuickFactLabel">Coordinates</div>'
								+ '<div class="markerQuickFactData">' + thisMarkerLatitude + ', ' + thisMarkerLongitude + '</div>'
							+ '</div>'
							+ weatherData
						+ '</div>'
						+ '<div class="markerNotes">' 
							+ thisMarkerCbsNotes 
						+ '</div>';
					
					if(isATest)
					{
						console.log('TESTING: Marker Content: ' + contentString);
					}		
					
					markerInfoContainer.style.display = 'table';					
					
					markerIconImage.innerHTML = thisMarkerrCategoryIconImage;
					markerTitleText.innerHTML = thisMarkerTitle;
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

function MarkerCategoryFilterControl(controlDiv, map)
{
	try
	{	
		var filterCategoryLegendText = '';
		
		for (var i = 0; i < markersDistinctCategoriesArray.length; i++)
		{		
			(function(index) //an "immediately-invoked function expression"
				{
					var filterCategory = markersDistinctCategoriesArray[i];
					var thisMarkerCategoryData = getMarkerCategoryDataFromArray(filterCategory);				
								
					var controlUI = document.createElement('div');
					controlUI.id = 'ToggleCategory' + filterCategory;
					controlUI.className = 'control-filter controlActive';
					filterCategoryLegendText += '<div class="filterOption"><div class="filterIcon"><img src="' + thisMarkerCategoryData.mapMarkerIcon + '" alt="' + filterCategory + ' Filter"/></div><div class="filterText"> ' + filterCategory + '</div></div>';
					controlUI.innerHTML = 
						'<div class="filterOption"><div class="filterIcon"><img src="' + thisMarkerCategoryData.mapMarkerIcon + '" alt="' + filterCategory + ' Filter"/></div></div>';
					controlUI.title = 'Click to toggle display of all markers in the "' + filterCategory + '" category.';
					controlDiv.appendChild(controlUI);	

					controlUI.addEventListener
					('click', function()
						{ 
							toggleMarkers(map, filterCategory);
						}
					);					
				}
			)(i); // END "immediately-invoked function expression"
		}
		
		filterCategoryLegend.innerHTML = filterCategoryLegendText;
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
			controlUI.className = 'control-test controlActive';
		} 
		else
		{
			controlUI.className = 'control-test controlInactive';
		}
		controlUI.innerHTML = 
			'<div><i class="fas fa-user-secret fa-1x"></i></div>';
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
					controlUI.className = 'control-test controlInactive';
					iziToast.info({title: 'Testing Ended', message: messageToUserGeneralOFF,});
				}
				else
				{
					console.warn(messageToUserGeneralON);
					isATest = true;
					controlUI.className = 'control-test controlActive';
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

function ClusteringControl(controlDiv, map)
{
	try
	{		
		// Set CSS for the control border.
		var controlUI = document.createElement('div');
		controlUI.className = 'control-clustering controlActive';
		controlUI.id = 'ToggleClustering';
		controlUI.innerHTML = '<i class="fas fa-map-marker-alt"></i>';
		controlUI.title = 'Click to toggle clustering of markers.';
		controlDiv.appendChild(controlUI);	

		controlUI.addEventListener
		('click', function() 
			{	try
				{	
					if(typeof(markerClustering.getMap()) === 'undefined' || markerClustering.getMap() == null)
					{	
						markerClustering.setOptions({map:map});//restores the clusterIcons				
						document.getElementById('ToggleClustering').className = 'control-clustering controlActive';
					}
					else
					{				
						markerClustering.setOptions({map:null});//hides the clusterIcons			
						document.getElementById('ToggleClustering').className = 'control-clustering controlInactive';							
					}
				}
				catch (e)
				{	
					handleError('Clustering', e);
				}
			}
		);
	}
	catch (e)
	{		
		handleError('Clustering', e);
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
						var currentLocationLatitude = position.coords.latitude;
						var currentLocationLongitude = position.coords.longitude;
						var pos = 
						{
							lat: currentLocationLatitude,
							lng: currentLocationLongitude
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
					
							currentLocationMarker.addListener
							('click', function()
								{ 
									displayInfoPanelFor(currentLocationMarker, 'gMap', currentLocationLatitude, currentLocationLongitude);
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
						
						console.error('GEOLOCATION: ' + locationMessage);
							
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
				, {maximumAge:10000, timeout:4000, enableHighAccuracy: true}
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
		var elementID = 'ToggleCategory' + toggleCategory;	
		var desiredState = document.getElementById(elementID).classList.contains('controlActive')
			? 'HIDING'
			: 'SHOWING';
		
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
			console.warn('TESTING: Marker count in category "' + toggleCategory + '": ' + markersInThisCategoryArray.length.toString());
			
			console.log('TESTING: ' + desiredState + ' markers in category ' + toggleCategory);
		}		
					
		if (desiredState === 'SHOWING')
		{			
			for (var i = 0; i < markersInThisCategoryArray.length; i++) 
			{
				markersInThisCategoryArray[i].setVisible(true);				
				document.getElementById(elementID).className = 'control-filter controlActive';
			}
		}
		else
		{				
			for (var i = 0; i < markersInThisCategoryArray.length; i++) 
			{
				markersInThisCategoryArray[i].setVisible(false);		
				document.getElementById(elementID).className = 'control-filter controlInactive';
			}
		}
		
		markerClustering.repaint();	
	}
	catch(e)
	{
		handleError('Filter Markers', e);
	}
}

function compareValues(key, order='asc')
{
	//https://www.sitepoint.com/sort-an-array-of-objects-in-javascript/
	
	return function(a, b) 
	{
		if(!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) 
		{
			return 0; 
		}

		const varA = (typeof a[key] === 'string') 
			? a[key].toUpperCase() 
			: a[key];
		const varB = (typeof b[key] === 'string') 
			? b[key].toUpperCase() 
			: b[key];

		let comparison = 0;
		
		if (varA > varB) 
		{
			comparison = 1;
		} 
		else if (varA < varB) 
		{
			comparison = -1;
		}
		return ((order == 'desc') 
			? (comparison * -1) 
			: comparison);
	};
}