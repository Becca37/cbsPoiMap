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
var incidentsLayer = null;

var currentLocationMarker = null;
var currentLocationMarkerArray = [];
var currentLocationLatitude;
var currentLocationLongitude;
var currentLocationTitleString = 'Current Location';
var watchCurrentLocationId = null;
var devicePositionKnown = false;
	
var markerDataArray = [];					//holds the Chasing Blue Sky POIs and Inciweb data
var incidentDataObject;						//holds the Inciweb data, ready for adding to markerDataArray

var markersArray = []; 						//holds the Google Maps Marker data after processing
var markersDistinctCategoriesArray = [];	//holds the distinct categories found in the markers
var markersCategoryDataArray = [];			//holds the data about categories (e.g. name, icon, and Furkot pin)
var thisMarkerCategoryData = [];			//holds the category data for a given marker

var quotesForFriends = '';					//holds the string for quotes about Friends to be used as CBS Notes
var quotesForFamily = '';					//holds the string for quotes about Family to be used as CBS Notes

var poisDataSource = 'data/pois.json';
var incidentsDataSource = 'https://inciweb.nwcg.gov/feeds/rss/incidents/';

var markersCategoryDataSource = 'data/markersCategoryData.json';
var markerClustering = null;

var quotesDataSource = 'data/quotes.json';

var weatherDataOject;
var weatherDataSource = 'https://api.openweathermap.org/data/2.5/weather?&appid=11be7e069a8c86553c0daf1eae697cd9&units=imperial';

var poiTimeDataObject;
var deviceTimeDataObject;
var timeDataSource = 'https://secure.geonames.org/timezoneJSON?username=ChasingBlueSky';

var rssToJsonConverterUrl =  'https://api.rss2json.com/v1/api.json?api_key=wg0c3jzbgwcwf2eu7uwgm7bgguhkwqlpvzflsoxm&count=1000&rss_url=';

function loadData(dataUrl, callback, dataType, asyncPref) 
{  
	try
	{  
		//https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
		//https://codepen.io/KryptoniteDove/post/load-json-file-locally-using-pure-javascript
		var xobj = new XMLHttpRequest();
		if (dataType === 'json')
		{
			xobj.overrideMimeType("application/json");
		}
		xobj.open('GET', dataUrl, asyncPref);
		xobj.onreadystatechange = function () 
		{
			if (xobj.readyState == 4)
			{
				callback(xobj.responseText);
			}
			else
			{
				console.log('Data Request State: ' + xobj.readyState + ' and Status: ' + xobj.statusText + ';' + currentTimestamp());
			}
		};
		xobj.send(null);  
	}
	catch (e)
	{
		handleError('Show/Hide Instructions', e);
	}
}

function getData(dataCaller, dataSource, dataType)
{
	try
	{    
		var returnData;
		
		loadData
		(dataSource, function(response) 
			{
				if (dataType === 'json')
				{
					returnData = JSON.parse(response);
				}
				else
				{
					returnData = response;
				}
			}
			, dataType, false
		);	
		
		if (dataCaller === 'pois')
		{			
			markerDataArray = returnData;
			if(isATest)
			{
				console.warn('TESTING: CBS POI Marker Data Array Length: ' + markerDataArray.length);
				console.log('TESTING: CBS POI Marker #1: ' + markerDataArray[0].cbsTitle);
				console.log('TESTING: CBS POI Marker #1 ID: ' + markerDataArray[0].cbsId);
				console.log('TESTING: CBS POI Marker #1 Category: ' + markerDataArray[0].cbsMainCategory);
			}
			//getIncidentsData();
		}	
		else if (dataCaller === 'incidents')
		{
			incidentDataObject = returnData;
			if(isATest)
			{
				console.warn('TESTING: Incident Data');
				console.log(incidentDataObject);
			}
		}
		else if (dataCaller === 'markersCategory')
		{
			markersCategoryDataArray = returnData.sort(compareValues('cbsMainCategory', 'asc'));
			
			if(isATest)
			{
				console.warn('TESTING: Marker Category Data Array Length: ' + markersCategoryDataArray.length);
				console.log('TESTING: Category #1 Category: ' + markersCategoryDataArray[0].cbsMainCategory);
				console.log('TESTING: Category #1 Map Marker: ' + markersCategoryDataArray[0].mapMarkerIcon);
				console.log('TESTING: Category #1 Furkot Pin: ' + markersCategoryDataArray[0].furkotPinName);
			}
		}
		else if (dataCaller === 'weather')
		{
			weatherDataOject = returnData;	
			if(isATest)
			{
				console.warn('TESTING: Weather Data');
				console.log(weatherDataOject);
			}
		}
		else if (dataCaller === 'times')
		{
			timeDataObject = returnData;	
			if(isATest)
			{
				console.warn('TESTING: Time Data');
				console.log(timeDataObject);
			}
		}
		else if (dataCaller === 'quotes')
		{	
			var quotesArray = [];	
		
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
	}
	catch (e)
	{
		handleError('Get Data', e);
	}
}

function getIncidentsData()
{
	try
	{
		var dataSource = incidentsDataSource;
		//rssToJsonConverterUrl + encodeURIComponent(incidentsDataSource);
		//getData('incidents', dataSource, 'xml');		
		
		fetch(dataSource).then
		((res) => 
			{
				res.text().then
				((xmlTxt) => 
					{
						var domParser = new DOMParser()
						let doc = domParser.parseFromString(xmlTxt, 'text/xml')
						doc.querySelectorAll('item').forEach
						((item) => 
							{
								let h1 = document.createElement('h1')
								h1.textContent = item.querySelector('title').textContent
								document.querySelector('output').appendChild(h1)
							}
						)
					}
				)
			}
		)
		
		
		if (incidentDataObject.status === 'ok')
		{
			if (isATest)
			{
				console.log('TESTING: Incident Data Item Count: ' + incidentDataObject.items.length);
			}
			
			for (var i = 0; i < markerDataArray.length; i++) 
			{
				// var incidentTitle = incidentDataObject.items[i].title;
				// var incidentUrl = incidentDataObject.items[i].guid;
				// var incidentLatitude = incidentDataObject.items[i].title;
			}
		}	
	}
	catch (e)
	{
		handleError('Get Data (' + dataCaller + ', ' + dataType + '): ', e);
	}
}

function getWeatherData(markerLatitude, markerLongitude)
{
	var weatherDataResult = '';
	
	try
	{    
		var weatherDataSourceUrl = weatherDataSource + '&lat=' + markerLatitude + '&lon=' + markerLongitude;
		
		getData('weather', weatherDataSourceUrl, 'json');
		
		weatherDataCurrent = '';		
		weatherDataCurrentIcons = '';
		weatherDataCurrentText = '';
		
		weatherDataOject.weather.forEach
			(function(weatherType, i) 
				{
					weatherDataCurrentIcons += '<img src="https://openweathermap.org/img/w/' + weatherDataOject.weather[i].icon + '.png" alt=' + weatherDataOject.weather[i].main + '/> ';
					
					if (i > 0)
					{
						weatherDataCurrentText += '<i>mixed with</i> ';
					}
					weatherDataCurrentText += '<b>' + weatherDataOject.weather[i].main + '</b> (' + weatherDataOject.weather[i].description + ') ';
				}
			);
		weatherDataCurrent = weatherDataCurrentIcons + '<div class="weatherCurrent">' + weatherDataCurrentText + '</div>';
		
		weatherDataTemps = ''
			+ '<table><tr style="border: 1px;"><th>Now</th><th>High</th><th>Low</td></tr><tr><td>'
			+ Math.round(weatherDataOject.main.temp) + ' &deg;F</td><td>' 
			+ Math.round(weatherDataOject.main.temp_max) + ' &deg;F</td><td>' 
			+ Math.round(weatherDataOject.main.temp_min) + ' &deg;F</td></tr></table>';
			
		weatherDataLocation = weatherDataOject.name + ', ' + weatherDataOject.sys.country;
		
		// var sunriseTime = (new Date((weatherDataOject.sys.sunrise) * 1000));
		// var sunsetTime = (new Date((weatherDataOject.sys.sunset) * 1000));
		// weatherDataSunrise = sunriseTime;
		// weatherDataSunset = sunsetTime;
		
		weatherDataResult = ''
			+ '<div class="markerQuickFact">'
				+ '<div class="markerQuickFactLabel">Location</div>'
				+ '<div class="markerQuickFactData">' + weatherDataLocation + '</div>'
			+ '</div>'
			+ '<div class="markerQuickFact">'
				+ '<div class="markerQuickFactLabel">Weather*</div>'
				+ '<div class="markerQuickFactData">' + weatherDataCurrent + '</div>'
			+ '</div>'
			+ '<div class="markerQuickFact">'
				+ '<div class="markerQuickFactLabel">Temps*</div>'
				+ '<div class="markerQuickFactData"><div class="weatherTemps">' + weatherDataTemps + '</div></div>'
			+ '</div>';
		
		if(isATest)
		{
			console.log('TESTING: Weather: ' + weatherDataResult);
		}
		
		return weatherDataResult;
	}
	catch (e)
	{
		handleError('Get Weather Data', e);
		weatherDataResult = ''
			+ '<div class="markerQuickFact">'
				+ '<div class="markerQuickFactLabel">Weather</div>'
				+ '<div class="markerQuickFactData"><div class="weatherSun">ERROR: Unable to process weather data: ' + e + '</div></div>'
			+ '</div>';
		return weatherDataResult;
	}
}

function getTimeData(markerLatitude, markerLongitude)
{
	var timeDataResult = '';
	
	try
	{   var deviceDateTime;
		var deviceLatitude;
		var deviceLongitude;
		if(devicePositionKnown)
		{
			deviceLatitude = currentLocationLatitude;
			deviceLongitude = currentLocationLongitude;
		}
	
		var poiTimeDataSourceUrl = timeDataSource + '&lat=' + markerLatitude + '&lng=' + markerLongitude;
		var deviceTimeDataSourceUrl = timeDataSource + '&lat=' + deviceLatitude + '&lng=' + deviceLongitude;
		
		getData('times', poiTimeDataSourceUrl, 'json');	
		poiTimeDataObject = timeDataObject;
		
		if (devicePositionKnown)
		{
			getData('times', deviceTimeDataSourceUrl, 'json');	
			deviceTimeDataObject = timeDataObject;	
			if ('status' in deviceTimeDataObject)//.status.message.includes('the hourly limit'))
			{
				deviceDateTime = new Date();
			}
			else
			{
				deviceDateTime = deviceTimeDataObject.time;
			}
		}
		else
		{		
			deviceDateTime = new Date();
		}
		
		if ('status' in poiTimeDataObject)//poiTimeDataObject.status.message.includes('the hourly limit'))
		{
			timeDataResult = ''
				+ '<div class="markerQuickFact">'
					+ '<div class="markerQuickFactLabel">Times</div>'
					+ '<div class="markerQuickFactData"><div class="weatherSun">ERROR: Unable to process time data.</div></div>'
				+ '</div>';
		}
		else
		{			
			var poiDateTime = poiTimeDataObject.time;
			var timeDateDifferenceExists = true;
			
			if (moment(poiDateTime).format('dddd YYYY-MM-DD hh') === moment(deviceDateTime).format('dddd YYYY-MM-DD hh'))
			{
				timeDateDifferenceExists = false;
			}
			
			var poiDate = moment(poiDateTime).format('dddd YYYY-MM-DD');
			var poiTime = moment(poiDateTime).format('hh:mm a');
			var poiTimezoneAbbrv = moment(poiDateTime).tz(poiTimeDataObject.timezoneId).format('z');
			
			var poiSunriseTime = moment(poiTimeDataObject.sunrise).format('hh:mm a');
			var poiSunsetTime = moment(poiTimeDataObject.sunset).format('hh:mm a');
			
			var deviceDate = moment(deviceDateTime).format('dddd YYYY-MM-DD');
			var deviceTime = moment(deviceDateTime).format('hh:mm a');
			var deviceTimezoneAbbrv = '';
			if (devicePositionKnown)
			{
				deviceTimezoneAbbrv	= moment(deviceDateTime).tz(deviceTimeDataObject.timezoneId).format('z');	
			}
			
			timeDataResult = ''
				+ '<div class="markerQuickFact">'
					+ '<div class="markerQuickFactLabel">Sunrise<br/>Sunset</div>'
					+ '<div class="markerQuickFactData"><div class="weatherSun">' + poiSunriseTime  + ' ' + poiTimezoneAbbrv + '<br/>' + poiSunsetTime + ' ' + poiTimezoneAbbrv + '</div></div>'
				+ '</div>'
				+ '<div class="markerQuickFact">'
					+ '<div class="markerQuickFactLabel">POI\'s Time*</div>'
					+ '<div class="markerQuickFactData"><div class="weatherSun">' + poiTime + ' ' + poiTimezoneAbbrv + '<br/>on ' + poiDate + '</div></div>'
				+ '</div>';
				
			if (timeDateDifferenceExists)
			{
				var timeDateDifference = moment(deviceDateTime).from(poiDateTime).toString();
				if (timeDateDifference.includes('in '))
				{
					timeDateDifference = timeDateDifference.replace('in ', '')
					timeDateDifference += ' ahead of POI';
				}
				else if (timeDateDifference.includes(' ago'))
				{
					timeDateDifference = timeDateDifference.replace(' ago', '')
					timeDateDifference += ' behind POI';
				}
				
				timeDataResult += ''
					+ '<div class="markerQuickFact">'
						+ '<div class="markerQuickFactLabel">Device\'s Time*</div>'
						+ '<div class="markerQuickFactData"><div class="weatherSun">' + deviceTime + ' ' + deviceTimezoneAbbrv + '<br/>which is ' + timeDateDifference + '<br/>on ' + deviceDate + '</div></div>'
					+ '</div>'
			}
			else
			{
				timeDataResult += ''
					+ '<div class="markerQuickFact">'
						+ '<div class="markerQuickFactLabel">Device\'s Time*</div>'
						+ '<div class="markerQuickFactData"><div class="weatherSun">Same as POI.</div></div>'
					+ '</div>'
			}
		}
			
		return timeDataResult;
	}
	catch (e)
	{
		handleError('Get Time Data', e);
		timeDataResult = ''
			+ '<div class="markerQuickFact">'
				+ '<div class="markerQuickFactLabel">Times</div>'
				+ '<div class="markerQuickFactData"><div class="weatherSun">ERROR: Unable to process time data: ' + e + '</div></div>'
			+ '</div>';
		return timeDataResult;
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
			
		getData('markersCategory', markersCategoryDataSource, 'json');
		getData('pois', poisDataSource, 'json');
		getDistinctCategories();
		
		addCustomControlsTo(map);
		
		getData('quotes', quotesDataSource, 'json');
		
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

		// Add custom control for VISITED
		var visitedControlDiv = document.createElement('div');
		var visitedControl = new VisitedControl(visitedControlDiv, map);	
		visitedControlDiv.index = 1;
		map.controls[google.maps.ControlPosition.LEFT_CENTER].push(visitedControlDiv);

		// Add custom control for NOT VISITED
		var notVisitedControlDiv = document.createElement('div');
		var notVisitedControl = new NotVisitedControl(notVisitedControlDiv, map);	
		notVisitedControlDiv.index = 1;
		map.controls[google.maps.ControlPosition.LEFT_CENTER].push(notVisitedControlDiv);

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

		// Add custom control for INCIDENTS
		// var incidentsControlDiv = document.createElement('div');
		// var incidentsControl = new IncidentsControl(incidentsControlDiv, map);	
		// incidentsControlDiv.index = 1;
		// map.controls[google.maps.ControlPosition.TOP_CENTER].push(incidentsControlDiv);
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
				if (markersDistinctCategoriesArray[i2].categoryName == categoryName) 
				{
					continue loop1;
				}
			}			
		
			var inThisCategoryArray = workingArray.filter
			(
				function(filterOn) 
				{
					return filterOn.cbsMainCategory == categoryName;
				}
			);			
			var countTotal = inThisCategoryArray.length;
			
			var visitedInThisCategoryArray = inThisCategoryArray.filter
			(
				function(filterOn) 
				{
					return filterOn.cbsVisited === 'Y';
				}
			);			
			var countVisited = visitedInThisCategoryArray.length;
			
			var notVisitedInThisCategoryArray = inThisCategoryArray.filter
			(
				function(filterOn) 
				{
					return filterOn.cbsVisited === 'N';
				}
			);			
			var countNotVisited = notVisitedInThisCategoryArray.length;
			
			var countVisitStatusUnknown = countTotal - countVisited - countNotVisited;	
			
			var categoryObject = {"categoryName": categoryName, "countTotal": countTotal, "countVisited": countVisited, "countNotVisited": countNotVisited, "countVisitStatusUnknown": 			countVisitStatusUnknown};
			
			markersDistinctCategoriesArray.push(categoryObject);
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


					var thisMarkerLabel = '<i class="far fa-question-circle" title="Unknown"></i>';	
					var thisMarkerLabelClass = 'poiUnknown';
					var thisMarkerLabelTitleAddOn = ' ; Visited? Unknown';
					var thisMarkerVisited = 'U';
					if (thisMarker.cbsVisited)
					{
						thisMarkerVisited = thisMarker.cbsVisited;
						switch(thisMarker.cbsVisited)
						{
							case "Y":
								thisMarkerLabel = '<i class="far fa-eye" title="Visited"></i>';
								thisMarkerLabelClass = 'poiVisited';
								thisMarkerLabelTitleAddOn = ' ; Visited? Yes';
							break;
							
							case "N":
								thisMarkerLabel = '<i class="far fa-eye-slash" title="Someday"></i>';
								thisMarkerLabelClass = 'poiSomeday';
								thisMarkerLabelTitleAddOn = ' ; Visited? Someday';
							break;
						}
					}
					
					var addThisMarker = new MarkerWithLabel
					(
						{
							map: map,
							position: thisMarkerPosition,
							title:  thisMarker.cbsTitle + thisMarkerLabelTitleAddOn,
							icon: thisMarkerCategoryData.mapMarkerIcon,
							cbsCategory: thisMarker.cbsMainCategory,
							cbsVisited: thisMarker.cbsVisited,
							labelContent: thisMarkerLabel,
							labelAnchor: new google.maps.Point(25, 50),
							labelInBackground: true,
							labelClass: thisMarkerLabelClass
						}
					);

					bounds.extend(thisMarkerPosition);
					
					addThisMarker.addListener
					('click', function()
						{ 
							displayInfoPanelFor(thisMarker, 'cbsPoi', thisMarker.latitude, thisMarker.longitude, '');
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
				, maxZoom: 12
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

function displayInfoPanelFor(thisMarker, thisMarkerType, thisMarkerLatitude, thisMarkerLongitude, extraInfo)
{	
	try
	{	
		if(isATest)
		{
			console.warn('Processing marker for display.');
		}

		if (thisMarkerType != 'cbsPoi' || (thisMarker.cbsTitle
			&& thisMarker.cbsMainCategory 
			&& thisMarker.latitude
			&& thisMarker.longitude))
		{
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
						var thisMarkerCategory;					
						var thisMarkerCategoryData;
						var thisMarkerCategoryIconImage;
						var markerShowWebsite;
						var markerStartNavigation;
						var markerNotesForFurkot;
						var markerUrlForFurkot;
						var markerStopNameForFurkot;
						var furkotLinkText;
						var furkotLinkIcons;
						var markerVisitedIcon;
						var thisMarkerTags;
						var thisMarkerCbsNotes;
						var weatherDataDisplay;
						var timeDataDisplay;
						
						if(thisMarkerType === 'cbsPoi')
						{
							thisMarkerTitle = thisMarker.cbsTitle;
							
							thisMarkerCategory = thisMarker.cbsMainCategory;
							thisMarkerCategoryData = getMarkerCategoryDataFromArray(thisMarkerCategory);
							thisMarkerCategoryIconImage = '<img src="' + thisMarkerCategoryData.mapMarkerIcon + '" alt="Marker Icon"/>';
							
							markerShowWebsite = thisMarker.cbsReferenceUrl 
								? '<a href="' + thisMarker.cbsReferenceUrl + '" title="Website" target="_blank"><i class="fas fa-globe fa-2x"></i></a>' 
								: '<i class="fas fa-globe fa-2x disabled"></i>';
							
							//https://developers.google.com/maps/documentation/urls/guide
							markerStartNavigation = '<a href="https://www.google.com/maps/dir/?api=1'
								+ '&destination=' + encodeURIComponent(thisMarker.latitude + ',' + thisMarker.longitude) 
								+ '&travelmode=driving'
								+ '&dir_action=navigate'
								+ '" target="googleMaps" title="Navigate"><i class="far fa-compass fa-2x"></i></a>';
							
							markerNotesForFurkot = '';
							if (thisMarker.cbsNotes)
							{
								markerNotesForFurkot = '&stop[notes]=' + encodeURIComponent(thisMarker.cbsNotes);
							}	
							
							markerUrlForFurkot = '';
							if (thisMarker.cbsReferenceUrl)
							{
								markerUrlForFurkot = '&stop[url]=' + encodeURIComponent(thisMarker.cbsReferenceUrl);
							}
							
							markerStopNameForFurkot = '';
							if (thisMarkerCategoryData.furkotPinName)
							{
								markerStopNameForFurkot = '&stop[pin]=' + thisMarkerCategoryData.furkotPinName;
							}
							markerVisitedIcon = '<i class="far fa-question-circle fa-2x" title="Unknown"></i>';
							if (thisMarker.cbsVisited)
							{
								switch(thisMarker.cbsVisited)
								{
									case "Y":
										markerVisitedIcon = '<i class="far fa-eye fa-2x visited" title="We HAVE seen this with our own eyes!"></i>';
									break;
									
									case "N":
										markerVisitedIcon = '<i class="far fa-eye-slash fa-2x" title="We have NOT yet seen this with our own eyes."></i>';
									break;
								}
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
							
							thisMarkerTags = '';
							if(thisMarkerTags)
							{
								thisMarkerTags = thisMarker.cbsTags.toString().replace(/,/g, ', ');
							}
							
							if (thisMarker.cbsNotes)
							{
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
								else
								{
									thisMarkerCbsNotes = thisMarker.cbsNotes;
								}
							}
							else
							{
								thisMarkerCbsNotes = '';
							}
							
							thisMarkerLatitude = thisMarker.latitude;
							thisMarkerLongitude = thisMarker.longitude;
						}
						
						if (thisMarkerType === 'cbsPoi' || (thisMarkerType === 'gMap' && markerTitleText.innerHTML != currentLocationTitleString))
						{
							weatherDataDisplay = getWeatherData(thisMarkerLatitude, thisMarkerLongitude);
							timeDataDisplay = getTimeData(thisMarkerLatitude, thisMarkerLongitude);
						}
							
						if (thisMarkerType === 'gMap')
						{
							thisMarkerTitle = currentLocationTitleString;
							thisMarkerCategory = 'You Are Here';
							thisMarkerCategoryIconImage = document.getElementById('svgIcon').innerHTML;
							thisMarkerTags = 'Approximately';
							
							thisMarkerCbsNotes = extraInfo;
							markerVisitedIcon = '';
							markerShowWebsite = '';
							markerStartNavigation = '';					
							furkotLinkIcons = '';
						}
						
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
								+ weatherDataDisplay
								+ timeDataDisplay
								+ '<div class="markerQuickFact">'
									+ '<div class="markerQuickFactLabel"><div class="weatherSun">Note: </div></div>'
									+ '<div class="markerQuickFactData"><div class="weatherSun">* <i>When marker info loaded.</i></div></div>'
								+ '</div>'
							+ '</div>'
							+ '<div class="markerNotes">' 
								+ thisMarkerCbsNotes 
							+ '</div>';
						
						if(isATest)
						{
							console.log('TESTING: Marker Content: ' + contentString);
						}		
						
						markerInfoContainer.style.display = 'table';					
						
						markerIconImage.innerHTML = thisMarkerCategoryIconImage;
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
		else
		{
			if(isATest)
			{
				console.log('TESTING: Marker Does Not Meet Requirements, Skipping It');
			}
		}
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
		controlUI.innerHTML = ''
			+ '<div id="currentLocationIcon" onclick="goToCurrentLocation()"><i class="fas fa-crosshairs fa-2x"></i></div>'
			+ '<div id="currentLocationInfo" onclick="goToCurrentLocation()">Click to show current location info.</div>'
			+ '<div id="currentLocationOffIcon" onclick="stopWatchingCurrentLocation()" class="isNotVisible"><i class="far fa-window-close fa-2x"></i></i></div>';
		controlUI.title = 'Current location info.';
		controlDiv.appendChild(controlUI);
	}
	catch (e)
	{		
		handleError('Adding Locator Control', e);
	}
}

function MarkerCategoryFilterControl(controlDiv, map)
{
	try
	{	
		var filterCategoryLegendText = '<div class="filterOption">'
			+ '<div class="filterItem">'
				+ '<div class="filterHeader">Icon</div>'
				+ '<div class="filterHeader">Category</div>'
				+ '<div class="filterHeader">Count<br/>Total</div>'
				+ '<div class="filterHeader">Count<br/>Visited</div>'
				+ '<div class="filterHeader">Count<br/>Not Visited</div>'
				+ '<div class="filterHeader">Count<br/>Status Unknown</div>'
			+ '</div>';	

		var	filterCategoryLegendTextTemp = '';

		var countAllTotal = 0;
		var countAllVisited = 0;
		var countAllNotVisited = 0;
		var countAllVisitStatusUnknown = 0;
		
		for (var i = 0; i < markersDistinctCategoriesArray.length; i++)
		{		
			(function(index) //an "immediately-invoked function expression"
				{					
					var filterCategory = markersDistinctCategoriesArray[i].categoryName;
					var filterCategoryCountTotal = markersDistinctCategoriesArray[i].countTotal;
					var filterCategoryCountVisited = markersDistinctCategoriesArray[i].countVisited;
					var filterCategoryCountNotVisited = markersDistinctCategoriesArray[i].countNotVisited;
					var filterCategoryCountVisitStatusUnknown = markersDistinctCategoriesArray[i].countVisitStatusUnknown;
					var filterRowOdd = (i + 1) %2 === 1 ? ' odd' : '';
					
								
					countAllTotal += filterCategoryCountTotal;
					countAllVisited += filterCategoryCountVisited;
					countAllNotVisited += filterCategoryCountNotVisited;
					countAllVisitStatusUnknown += filterCategoryCountVisitStatusUnknown;
					
					var thisMarkerCategoryData = getMarkerCategoryDataFromArray(filterCategory);				
								
					var controlUI = document.createElement('div');
					controlUI.id = 'ToggleCategory ' + filterCategory;
					controlUI.className = 'control-filter controlActive';
					
					filterCategoryLegendTextTemp += ''
						+ '<div class="filterItem' + filterRowOdd + '">'
							+ '<div class="filterIcon"><img src="' + thisMarkerCategoryData.mapMarkerIcon + '" alt="' + filterCategory + ' Filter"/></div>'
							+ '<div class="filterText"> ' + filterCategory + '</div>'
							+ '<div class="filterCount"> ' + filterCategoryCountTotal + '</div>'
							+ '<div class="filterCount"> ' + filterCategoryCountVisited + '</div>'
							+ '<div class="filterCount"> ' + filterCategoryCountNotVisited + '</div>'
							+ '<div class="filterCount"> ' + filterCategoryCountVisitStatusUnknown + '</div>'
						+ '</div>';					
					
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
		
		filterCategoryLegendText +=  ''
			+ '<div class="filterItem">'
				+ '<div class="filterIcon">&nbsp;</div>'
				+ '<div class="filterText">All POIs</div>'
				+ '<div class="filterCount"> ' + countAllTotal + '</div>'
				+ '<div class="filterCount"> ' + countAllVisited + '</div>'
				+ '<div class="filterCount"> ' + countAllNotVisited + '</div>'
				+ '<div class="filterCount"> ' + countAllVisitStatusUnknown + '</div>'
			+ '</div>'
			+ filterCategoryLegendTextTemp
			+ '</div>';
		
		filterCategoryLegend.innerHTML = filterCategoryLegendText;
	}
	catch (e)
	{		
		handleError('Adding Category Filter Control', e);
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
		handleError('Adding IsATest Control', e);
	}
}

function TrafficControl(controlDiv, map)
{
	try
	{
		trafficLayer = new google.maps.TrafficLayer();
		
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
					handleError('Adding Traffic Control', e);
				}
			}
		);
	}
	catch (e)
	{		
		handleError('Adding Traffic Control', e);
	}
}

function ClusteringControl(controlDiv, map)
{
	try
	{	
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
					handleError('Adding Clustering Control', e);
				}
			}
		);
	}
	catch (e)
	{		
		handleError('Adding Clustering Control', e);
	}
}

function VisitedControl(controlDiv, map)
{
	try
	{		
		var controlUI = document.createElement('div');
		controlUI.className = 'control-visited controlActive';
		controlUI.id = 'ToggleCategory Visited';
		controlUI.innerHTML = '<i class="far fa-eye" title="Visited"></i>';
		controlUI.title = 'Click to toggle POIs we have visited.';
		controlDiv.appendChild(controlUI);	

		controlUI.addEventListener
		('click', function() 
			{	
				toggleMarkers(map, 'Visited');
			}
		);
	}
	catch (e)
	{		
		handleError('Adding Visited Control', e);
	}
}

function NotVisitedControl(controlDiv, map)
{
	try
	{		
		var controlUI = document.createElement('div');
		controlUI.className = 'control-notvisited controlActive';
		controlUI.id = 'ToggleCategory NotVisited';
		controlUI.innerHTML = '<i class="far fa-eye-slash" title="Someday"></i>';
		controlUI.title = 'Click to toggle POIs we have not yet visited.';
		controlDiv.appendChild(controlUI);	

		controlUI.addEventListener
		('click', function() 
			{	
				toggleMarkers(map, 'NotVisited');
			}
		);
	}
	catch (e)
	{		
		handleError('Adding Not Visited Control', e);
	}
}

function IncidentsControl(controlDiv, map)
{
	try
	{	
		incidentsLayer = new google.maps.KmlLayer();	
		
		var controlUI = document.createElement('div');
		controlUI.className = 'control-incidents controlInactive';
		controlUI.id = 'ToggleIncidents';
		controlUI.innerHTML = '<i class="fas fa-fire-alt"></i>&nbsp;Incidents';
		controlUI.title = 'Click to toggle incidents overlay display.';
		controlDiv.appendChild(controlUI);	

		controlUI.addEventListener
		('click', function() 
			{	try
				{	
					if(typeof(incidentsLayer.getMap()) === 'undefined' || incidentsLayer.getMap() == null)
					{
						incidentsLayer = new google.maps.KmlLayer({url: incidentsDataSource});
						incidentsLayer.setMap(map);
						document.getElementById('ToggleIncidents').className = 'control-incidents controlInactive';
					}
					else
					{
						incidentsLayer.setMap(null);					
						document.getElementById('ToggleIncidents').className = 'control-incidents controlInactive';
						
					}
				}
				catch (e)
				{	
					handleError('Incidents', e);
				}
			}
		);
	}
	catch (e)
	{		
		handleError('Adding Incidents Control', e);
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
						currentLocationLatitude = position.coords.latitude;
						currentLocationLongitude = position.coords.longitude;
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
									  id: 'Current Location Marker'
									, position: pos
									, map: map
									, title:  'Approximate Current Location'
									, icon: 
									{ 
										  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(currentLocationSvg)
										, scaledSize: new google.maps.Size(50, 50)
									}
								}
							);
					
							currentLocationMarker.addListener
							('click', function()
								{ 
									displayInfoPanelFor(currentLocationMarker, 'gMap', currentLocationLatitude, currentLocationLongitude, '');
								}
							);
							
							currentLocationMarkerArray.push(currentLocationMarker);
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

						var extraInfo = '<span style="font-size: smaller;">Accuracy ~ ' + accuracyInFeet + accuracyInMeters + '. ' + currentTimestamp() + '</span>';

						if (document.getElementById('currentLocationInfo'))
						{								
							var controlUI = document.getElementById('currentLocationInfo');
							controlUI.innerHTML = 'Click to pan/zoom to: <b>' + position.coords.latitude + ', ' + position.coords.longitude + '</b><br/>' + extraInfo;
						}
						
						if (markerTitleText.innerHTML === currentLocationTitleString)
						{
							displayInfoPanelFor(currentLocationMarker, 'gMap', position.coords.latitude, position.coords.longitude, extraInfo);								
						}
						
						document.getElementById('currentLocationOffIcon').className = 'isVisible';
						
						devicePositionKnown = true;	
					}
					catch(e)
					{
						devicePositionKnown = false;	
						handleError('Watch Location', e);
					}
				}
				, function(error) 
				{	
					// callback to handle ERROR
					try
					{
						// if timeout is much shorter than 20000, FIREFOX location watch will BOTH succeed and fail AND THEN also ignore the elementById in favor of the toast for writing the message for the user; annoying!
						
						devicePositionKnown = false;	
						
						var locationMessage = 'The Geolocation service failed: (' + error.code + ' - ' + error.message + '.) '
						
						switch (error.code)
						{
							case 1:
							locationMessage += ' Geolocation cannot function unless you allow use of location in your browser.';
							break;
							
							case 3:
							locationMessage += ' It will continue to try at intervals.';
							break;							
						}
						
						locationMessage += currentTimestamp();
							
						if (document.getElementById('CurrentLocationInfo'))
						{							
							document.getElementById('currentLocationInfoContainer').title = 'Unable to Obtain Location';
							
							var controlUI = document.getElementById('currentLocationInfo');
							controlUI.innerHTML = locationMessage;
						}
						else
						{
							console.error('GEOLOCATION: ' + locationMessage);
						}
					}
					catch(e)
					{
						devicePositionKnown = false;	
						handleError('Watch Location', e);
					}
				}
				, {maximumAge:10000, timeout:200000, enableHighAccuracy: true}
			);
		}
		else
		{ 
			devicePositionKnown = false;	
			
			var locationMessage = 'Your browser doesn\'t support geolocation.' + currentTimestamp();
			
			if (document.getElementById('CurrentLocationInfo'))
			{						
				document.getElementById('currentLocationInfoContainer').title = 'Geolocation Not Supported';
							
				var controlUI = document.getElementById('currentLocationInfo');
				controlUI.innerHTML = locationMessage;
			}
			else
			{
				console.error('GEOLOCATION: ' + locationMessage);
			}
		}
	}
	catch(e)
	{
		devicePositionKnown = false;	
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

function stopWatchingCurrentLocation()
{
	try
	{	
		//marker count in this array should always be one or none
		//but 'just in case' we're cycling through it anyhow
		for (var i = 0; i < currentLocationMarkerArray.length; i++)
		{
			currentLocationMarkerArray[i].setMap(null);
		}
		navigator.geolocation.clearWatch(watchCurrentLocationId);
		watchCurrentLocationId = null;
		currentLocationMarker = null;
		currentLocationMarkerArray = [];
		devicePositionKnown = false;
		document.getElementById('currentLocationOffIcon').className = 'isNotVisible';
							
		document.getElementById('currentLocationInfoContainer').title = 'Click to show current location info.';		
		var controlUI = document.getElementById('currentLocationInfo');
		controlUI.innerHTML = 'Click to show current location info.';
	}
	catch(e)
	{
		handleError('Stop Watching Current Location', e);
	}
}

function toggleMarkers(map, toggleCategory)
{
	try
	{		
		var showVisited = true;	
		var showNotVisited = true;
		var elementId = 'ToggleCategory ' + toggleCategory;
		var classExtender = toggleCategory.toLowerCase();
		
		if (document.getElementById('ToggleCategory Visited').classList.contains('controlInactive'))
		{	
			showVisited = false;
		}
		
		if (document.getElementById('ToggleCategory NotVisited').classList.contains('controlInactive'))
		{	
			showNotVisited = false;
		}
		
		if (toggleCategory === 'Visited' || toggleCategory === 'NotVisited' )
		{		
			if (document.getElementById(elementId).classList.contains('controlActive'))
			{	
				document.getElementById(elementId).className = 'control-' + classExtender + ' controlInactive';
				if (toggleCategory === 'Visited') showVisited = false;
				if (toggleCategory === 'NotVisited') showNotVisited = false;
			}
			else
			{	
				document.getElementById(elementId).className = 'control-' + classExtender + ' controlActive';
				if (toggleCategory === 'Visited') showVisited = true;
				if (toggleCategory === 'NotVisited') showNotVisited = true;
			}	
			
			for (var i = 0; i < markersDistinctCategoriesArray.length; i++)
			{
				var toggleThisCategory = markersDistinctCategoriesArray[i].categoryName;	
				setVisibilityOnMarkersInArray(toggleThisCategory, showVisited, showNotVisited, 'all');
			}
		}
		else
		{	
			setVisibilityOnMarkersInArray(toggleCategory, showVisited, showNotVisited, 'category');
		}
		
		markerClustering.repaint();	
	}
	catch(e)
	{
		handleError('Toggle Markers', e);
	}
}

function setVisibilityOnMarkersInArray(toggleCategory, showVisited, showNotVisited, callType)
{
	try
	{
		var elementID = 'ToggleCategory ' + toggleCategory;	
		var controlIsCurrentlyActive = document.getElementById(elementID).classList.contains('controlActive');
		var desiredStateIsVisible = true;	
		
		var markersInThisCategoryArray = markersArray.filter
		(
			function(filterOn) 
			{
				return filterOn.cbsCategory == toggleCategory;
			}
		);
		
		for (var i = 0; i < markersInThisCategoryArray.length; i++) 
		{		
			var cbsVisitedThisMarker = markersInThisCategoryArray[i].cbsVisited;	
						
			if 
			(
				(callType === 'category' && controlIsCurrentlyActive)
				|| (callType === 'all' && !controlIsCurrentlyActive)
				|| (cbsVisitedThisMarker === 'Y' && !showVisited)
				|| (cbsVisitedThisMarker === 'N' && !showNotVisited)
			)
			{
				desiredStateIsVisible = false;
			}
			else if
			(
				((callType === 'category' && !controlIsCurrentlyActive)
				|| (callType === 'all' && controlIsCurrentlyActive))
				&& 
				(
					(cbsVisitedThisMarker === 'Y' && showVisited)
					|| (cbsVisitedThisMarker === 'N' && showNotVisited)
				)
			)
			{
				desiredStateIsVisible = true;
			}
			markersInThisCategoryArray[i].setVisible(desiredStateIsVisible);
		}	
			
		if (callType === 'category')
		{			
			var controlStatusClass = 'controlActive';
			
			if (controlIsCurrentlyActive)
			{
				controlStatusClass = 'controlInactive';
			}
			
			document.getElementById(elementID).className = 'control-filter ' + controlStatusClass;
		}
	}
	catch(e)
	{
		handleError('Set Visibility on Markers in Array', e);
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