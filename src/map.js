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
var mapCenter = { lat: 39.219422, lng: -105.530727 }; // Colorado, USA 39.219422, -105.530727
var mapBounds = null;
var mapInitialZoom = 8;

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

var routesDataArray = [];					//holds the data for the routes to be added to the map
var routeTrackArray = [];					//holds the track points for a specific route for processing
var routesArray = [];						//holds the Google Maps Routes data after processing
var routesDataSourceUrl = 'data/routes.json';
var routeDataSourceUrl = 'data/routes/';	
var routeColorOpacity = '.6';

var furkotRevenueId = '6VjRjO';
var furkotTripShotUrlPart1 = 'https://trips.furkot.com/widget/ts/';
var furkotTripShotUrlPart2 = 'https://trips.furkot.com/ts/';

var showMapIconArray = 
[
	  '<i class="fas fa-globe-europe fa-2x" title="Show Map"></i>'
	, '<i class="fas fa-globe-asia fa-2x" title="Show Map"></i>'
	, '<i class="fas fa-globe-americas fa-2x" title="Show Map"></i>'
	, '<i class="fas fa-globe-africa fa-2x" title="Show Map"></i>'
];
var filterOptionsPanelWasVisible = false;
var markerInfoPanelWasVisible = false;

var poisDataSource = 'data/pois.json';
var incidentsDataSource = 'https://inciweb.nwcg.gov/feeds/rss/incidents/';
var poiIconVisited = '<i class="far fa-eye visited" title="We HAVE seen this with our own eyes!"></i>';
var poiIconNotVisited = '<i class="far fa-eye-slash" title="We have NOT yet seen this with our own eyes."></i>';
var poiIconOneVisited = '<i class="fas fa-low-vision oneVisited" title="ONE of us has seen this with their own eyes."></i>';
var poiIconUnknown = '<i class="fas fa-question" title="Unknown"></i>';

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
		handleError('Load Data', e);
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
				console.log('TESTING: Category #1 Category Plural: ' + markersCategoryDataArray[0].cbsMainCategoryPlural);
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
		else if (dataCaller === 'routes')
		{
			routesDataArray = returnData;
		}
		else if (dataCaller === 'route')
		{
			routeTrackArray = [];
			routeTrackArray = returnData;
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
				+ '<div class="markerQuickFactLabel">Weather Location</div>'
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
						+ '<div class="markerQuickFactData"><div class="weatherSun">' + deviceTime + ' ' + deviceTimezoneAbbrv + '<br/>Device is ' + timeDateDifference + '<br/>on ' + deviceDate + '.</div></div>'
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

function getRouteData(map)
{
	try
	{		
		getData('routes', routesDataSourceUrl, 'json');	
		var lastColorUsed = '';
		//https://www.canva.com/learn/100-color-combinations/ for inspiration :0)
		//probably will need to weed through and remove ones which don't display well
		var routeColors = ['#011A27', '#063852', '#07575B', '#265C00', '#2D4262', '#2E4600', '#486824', '#4C3F54', '#4CB5F5', '#5BC8AC', '#662E1C', '#73605B', '#752A07', '#763626', '#7F152E', '#805A3B', '#867666', '#8D230F', '#9B4F0F', '#A10115', '#A11F0C', '#A43820', '#AF4425', '#B6452C', '#DE7A22', '#E73F0B', '#E94F08', '#F0810F', '#F18D9E', '#F25C00', '#F52549', '#FB6542'];
		if (isATest)
		{
			console.warn('TESTING: Route Colors');
			for (var c = 0; c < routeColors.length; c++)
			{
				var thisColor = routeColors[c];
				console.log('TESTING: Color ' + thisColor);
				console.log('%c     ', 'background-color: ' + thisColor + '; padding: 30px 50px 30px 50px;');
			}
		}
		
		for (var i = 0; i < routesDataArray.length; i++)
		{
			var routeId = routesDataArray[i].routeId;
			var routeName = routesDataArray[i].routeName;

			var routeFileName = routeDataSourceUrl + routesDataArray[i].routeFileName + '.json';			
			getData('route', routeFileName, 'json');	
			var routePathCoordinates = routeTrackArray;
			
			var useThisColor = routeColors[Math.floor(Math.random() * routeColors.length)];
			var cc = 0;
			do 
			{
				useThisColor = routeColors[Math.floor(Math.random() * routeColors.length)]
				cc++;
			}
			while (cc < 15 && useThisColor === lastColorUsed);
			
			lastColorUsed = useThisColor;			
			
			var routePath = new google.maps.Polyline
			(
				{
					  cbsRouteId: routeId
					, cbsRouteName: routeName
					, cbsVisited: routesDataArray[i].routeTaken
					, path: routePathCoordinates
					, geodesic: true
					, strokeColor: useThisColor
					, strokeOpacity: routeColorOpacity
					, strokeWeight: 8
				}
			);
			routePath.setMap(map);		
			routesArray.push(routePath);						
			
			var thisMarkerCategoryData = getMarkerCategoryDataFromArray('Route');
			
			//https://help.furkot.com/widgets/plan-with-furkot-buttons.html
			var furkotMultipleStopsText = ''
			
            var routeWaypoints = routesDataArray[i].routeWaypoints.sort(compareValues('waypointOrder', 'asc'));

            var routingPoints = '';
            			
			var routeTempArray = []; //to hold furkotMultipleStopsText for each route
			
			//------------------------------------------------------
			//we need to cycle through the waypoints twice
			//if we try to do in a single pass, only the LAST waypoint will have
			//all the needed furkotMultipleStopsText data and to build the 
            //routing points list for display
			//------------------------------------------------------
			//first time to generate the furkotMultipleStopsText
			for (var w = 0; w < routeWaypoints.length; w++)
            {				
				var routeWaypointName = routeName + ' (' + routeWaypoints[w].waypointName + ')';			
				var routeLatitude = routeWaypoints[w].lat;
				var routeLongitude = routeWaypoints[w].lng;
				var routeNotes = routesDataArray[i].routeNotes;
				var routeUrl = routesDataArray[i].routeUrl;
				
				var startText = w === 0 ? '?' : '&';
				
				var furkotPinName = thisMarkerCategoryData.furkotPinName;
				var waypointType = 'End';
				if (routeWaypoints[w].waypointType)
				{
					waypointType = routeWaypoints[w].waypointType;
					if (waypointType === 'Via')
					{
						furkotPinName = 'passthru';
					}
                }

                routingPoints += '<li>' + waypointType + ' - ' + routeWaypoints[w].waypointName + '</li>';
				
				furkotMultipleStopsText += ''
					+ startText + 'stops[' + w + '][name]=' + encodeURIComponent(routeWaypointName)
					+ '&stops[' + w + '][coordinates][lat]=' + routeLatitude
					+ '&stops[' + w + '][coordinates][lon]=' + routeLongitude					
					+ '&stops[' + w + '][notes]=' + encodeURIComponent(routeNotes + '<br/><br/><i>Source: </i> <a href="https://chasingBlueSky.net/" target="_blank">Chasing Blue Sky</a>')
					+ '&stops[' + w + '][url]=' + encodeURIComponent(routeUrl)
					+ '&stops[' + w + '][pin]=' + furkotPinName
					+ '&stops[' + w + '][duration]=0';
				
				routeTempArray.push({ "routeId": routeId, "furkotMultipleStopsText": furkotMultipleStopsText});
			}
			
			//second time to push the waypoints to the markersDataArray
			for  (var w = 0; w < routeWaypoints.length; w++)
            {
                var routeWaypointName = routeName + ' (' + routeWaypoints[w].waypointName + ')';				

				var thisRouteFurkotMultipleStopsText = (routeTempArray.filter(function(filterOn){return filterOn.routeId === routeId;}))[0].furkotMultipleStopsText;
				
				var waypointType = 'End';
				var furkotPinName = thisMarkerCategoryData.furkotPinName;
				if (routeWaypoints[w].waypointType)
				{
					waypointType = routeWaypoints[w].waypointType;
					if (waypointType === 'Via')
					{
						furkotPinName = 'passthru';
					}
                }	

				var routeColorRGB = hex2rgb(useThisColor);
				var routeColorRGBa = 'rgba(' + routeColorRGB + ',' + routeColorOpacity + ')';
				var showRoutecolor = '<div style="margin-top: 15px; border-bottom: 15px solid ' + routeColorRGBa + ';"><i>Route Color Used Here</i>: ' + useThisColor  + ' ' + routeColorRGBa + '</div>';

                var cbsNotes = routesDataArray[i].routeNotes
                    + '<hr><i>Route Name</i>: <b>' + routeName + '</b>'
                    + '<br/><br/><i>Route Type</i>: ' + routesDataArray[i].routeType
                    + '<br/><br/><i>Routing Points</i>: '
                    + '<ul>' + routingPoints + '</ul>';

				var furkotTripShot = '';
				if(routesDataArray[i].routeFurkotId) {
					var furkotTripShotId=routesDataArray[i].routeFurkotId;
					furkotTripShot+=''
						+ showRoutecolor 
						+ '<hr>'
						+ '<b>Add to a Furkot Trip</b>'
						+'<div style="left: 0; height: 0; position: relative; width: 100%; padding-bottom: 75%;">'
						+'<iframe frameborder="0" style="top: 0; height: 0; position: absolute; height: 100%; width: 100%;" src="'+furkotTripShotUrlPart1+furkotTripShotId+'?uid='+furkotRevenueId+'"></iframe>'
						+'</div>'
						+'Click the Plan with Furkot in the upper right corner to add route to your trip (see instructions below for details) or <a href="'+furkotTripShotUrlPart2+furkotTripShotId+'?uid='+furkotRevenueId+'" target="_blank">view route in a new window</a>.';
				}
				else 
				{
					cbsNotes += 'Plan with Furkot tripshot widget coming soon!';
				}
				
				var waypointObject = 
				{
					  "cbsTitle": routeWaypointName
					, "cbsMainCategory": 'Route Marker'
					, "cbsMainCategoryPlural": 'Route Markers'
					, "latitude": routeWaypoints[w].lat
					, "longitude": routeWaypoints[w].lng
					, "cbsTags": routesDataArray[i].routeTags
                    , "cbsNotes": cbsNotes
					, "cbsReferenceUrl": routesDataArray[i].routeUrl
					, "cbsVisited": routesDataArray[i].routeTaken
					, "addressCity": routeWaypoints[w].addressCity
					, "addressState": routeWaypoints[w].addressState
					, "addressCountry": routeWaypoints[w].addressCountry
					, "furkotMultipleStopsText": furkotMultipleStopsText
					, "furkotPinName" : furkotPinName
					, "furkotTripShot" : furkotTripShot
				};
				
				markerDataArray.push(waypointObject);
			}
		}
	}
	catch(e)
	{
		handleError('Add Routes', e);
	}
}

function getMarkerCategoryDataFromArray(thisMarkerCategory)
{	
	var categoryData = 
	{ 
		  cbsMainCategory: thisMarkerCategory
		, cbsMainCategoryPlural: thisMarkerCategory
		, mapMarkerIcon: 'images/icons/mic/flag-export.png'
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
				, cbsMainCategoryPlural: thisMarkerCategoryData.cbsMainCategoryPlural
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
		return '[Error setting timestamp.]';
	}
}

function initMap() 
{
	try
	{	
		map = new google.maps.Map
		(
			document.getElementById('map'), 
			{
				mapTypeId: 'terrain',
				mapTypeControl: true,
				mapTypeControlOptions: 
				{
					style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
					position: google.maps.ControlPosition.TOP_LEFT
				},
				scrollwheel: false,
				scaleControl: true,
				streetViewControl: true,
				center: mapCenter,
				zoom: mapInitialZoom
			}
		);
			
		getData('markersCategory', markersCategoryDataSource, 'json');
		getData('pois', poisDataSource, 'json');		
		getRouteData(map); // MUST be called AFTER getting POIs and BEFORE getting distinct categories
		getDistinctCategories();
		
		addCustomControlsTo(map);
		
		getData('quotes', quotesDataSource, 'json');
		
		addMarkersTo(map);
		
		//watchLocation(map); -- control is not available until page fully loads, so defer to user click to start the watch

		adjustContentHeight();
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

		// Add custom control for FILTER OPTIONS PANEL
		var filterOptionsPanelControlDiv = document.createElement('div');
		var filterOptionsPanelControl = new FilterOptionsPanelControl(filterOptionsPanelControlDiv, map);
		filterOptionsPanelControlDiv.index = 1;
		map.controls[google.maps.ControlPosition.LEFT_TOP].push(filterOptionsPanelControlDiv);
						
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

		// Add custom control for ZOOM TO BOUNDS
		var zoomToBoundsControlDiv = document.createElement('div');
		var zoomToBoundsControl = new ZoomToBoundsControl(zoomToBoundsControlDiv, map);
		zoomToBoundsControlDiv.index = 1;
		map.controls[google.maps.ControlPosition.TOP_CENTER].push(zoomToBoundsControlDiv);

		// Add custom control for RESET to CENTER
		var resetToCenterControlDiv = document.createElement('div');
		var resetToCenterControl = new ResetToCenterControl(resetToCenterControlDiv, map);
		zoomToBoundsControlDiv.index = 1;
		map.controls[google.maps.ControlPosition.TOP_CENTER].push(resetToCenterControlDiv);

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
				if (markersDistinctCategoriesArray[i2].categoryName === categoryName) 
				{
					continue loop1;
				}
			}
			
			var categoryObject = {"categoryName": categoryName};
			
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
		mapBounds = new google.maps.LatLngBounds();
		
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

					var thisMarkerLabel = poiIconUnknown;	
					var thisMarkerLabelClass = 'poiUnknown';
					var thisMarkerLabelTitleAddOn = ' ; Visited? Unknown';
					var thisMarkerVisited = 'U';
					if (thisMarker.cbsVisited)
					{
						thisMarkerVisited = thisMarker.cbsVisited;
						switch(thisMarker.cbsVisited)
						{
							case "Y":
								thisMarkerLabel = poiIconVisited;
								thisMarkerLabelClass = 'poiVisited';
								thisMarkerLabelTitleAddOn = ' ; Visited? Yes';
							break;
							
							case "N":
								thisMarkerLabel = poiIconNotVisited;
								thisMarkerLabelClass = 'poiSomeday';
								thisMarkerLabelTitleAddOn = ' ; Visited? Someday';
							break;
							
							case "1":
								thisMarkerLabel = poiIconOneVisited;
								thisMarkerLabelClass = 'poiOne';
								thisMarkerLabelTitleAddOn = ' ; Visited? One of Us';
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
							cbsCategoryPlural: thisMarkerCategoryData.cbsMainCategoryPlural,
							cbsVisited: thisMarker.cbsVisited,
							addressCity: thisMarker.addressCity,
							addressState: thisMarker.addressState,
							addressCountry: thisMarker.addressCountry,
							labelContent: thisMarkerLabel,
							labelAnchor: new google.maps.Point(25, 50),
							labelInBackground: true,
							labelClass: thisMarkerLabelClass
						}
					);

					mapBounds.extend(thisMarkerPosition);
					
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

		if (thisMarkerType !== 'cbsPoi' || (thisMarker.cbsTitle
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
						
						var	markerTitleForFurkot = '';
						var	markerLatitudeForFurkot = '';
						var	markerLongitudeForFurkot = '';
						var markerNotesForFurkot = '';
						var markerUrlForFurkot = '';
						var markerStopNameForFurkot = '';
						var markerMultipleStopsForFurkot = '';
						
						var furkotLinkText;
						var furkotLinkIcons;
						
						var markerVisitedIcon;
						var thisMarkerTags;
						var thisMarkerCbsNotes;
						var thisMarkerLocation = '';
						var weatherDataDisplay;
						var timeDataDisplay;

						if (thisMarker.addressCity) { thisMarkerLocation += thisMarker.addressCity + ' '; } 
						if (thisMarker.addressState) { thisMarkerLocation += thisMarker.addressState + ' '; } 
						if (thisMarker.addressCountry) { thisMarkerLocation += thisMarker.addressCountry + ' '; } 
						
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
															
							if (thisMarkerCategory === 'Route')
							{	
								if (thisMarker.furkotMultipleStopsText)
								{
									markerMultipleStopsForFurkot = thisMarker.furkotMultipleStopsText;
								}
							}
							else
							{ 
								markerTitleForFurkot = '?stop[name]=' + encodeURIComponent(thisMarker.cbsTitle);
								
								markerLatitudeForFurkot = ''
									+ '&stop[coordinates][lat]=' 
									+ thisMarker.latitude;
								
								markerLongitudeForFurkot = ''								
									+ '&stop[coordinates][lon]=' 
									+ thisMarker.longitude;
									
								if (thisMarker.cbsNotes)
								{
									markerNotesForFurkot = '&stop[notes]=' + encodeURIComponent(thisMarker.cbsNotes + '<br/><br/><i>Source: </i> <a href="https://chasingBlueSky.net/" target="_blank">Chasing Blue Sky</a>');
								}	
								
								if (thisMarker.cbsReferenceUrl)
								{
									markerUrlForFurkot = '&stop[url]=' + encodeURIComponent(thisMarker.cbsReferenceUrl);
								}
								
								if (thisMarkerCategoryData.furkotPinName)
								{
									markerStopNameForFurkot = '&stop[pin]=' + thisMarkerCategoryData.furkotPinName;
								}
							}
							
							markerVisitedIcon = poiIconUnknown;
							if (thisMarker.cbsVisited)
							{
								switch(thisMarker.cbsVisited)
								{
									case "Y":
										markerVisitedIcon = poiIconVisited;
									break;
									
									case "N":
										markerVisitedIcon = poiIconNotVisited;
									break;
									
									case "1":
										markerVisitedIcon = poiIconOneVisited;
									break;
								}
							}
							
							var useFurkotPinName = thisMarkerCategoryData.furkotPinName;
							if (thisMarkerCategory === 'Route' && thisMarker.furkotPinName)
							{
								useFurkotPinName = thisMarker.furkotPinName;
							}
												
							//https://help.furkot.com/widgets/plan-with-furkot-buttons.html	
							furkotLinkText = 
								'https://trips.furkot.com/trip'
									+ markerTitleForFurkot
									+ markerLatitudeForFurkot
									+ markerLongitudeForFurkot
									+ markerNotesForFurkot
									+ markerUrlForFurkot
									+ markerStopNameForFurkot
									+ markerMultipleStopsForFurkot
									+ '&uid=' + furkotRevenueId;
							furkotLinkIcons = '<i class="ff-icon-furkot"></i><i class="ff-icon-' + useFurkotPinName + '"></i>';
														
							if (markerPlanWithFurkotLink.classList.contains('isNotVisible'))
							{
								markerPlanWithFurkotLink.classList.remove('isNotVisible');
								markerPlanWithFurkotLink.classList.add('isVisible');
							}
							markerPlanWithFurkotRoute.className = 'isNotVisible';
							if(thisMarkerCategory==='Route Marker') 
							{
								markerPlanWithFurkotRoute.className = 'isVisible';
								markerPlanWithFurkotLink.classList.remove('isVisible');
								markerPlanWithFurkotLink.classList.add('isNotVisible');
							}
							
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
									if(thisMarkerCategory==='Route Marker') 
									{
										thisMarkerCbsNotes += thisMarker.furkotTripShot;
									}
								}
							}
							else
							{
								thisMarkerCbsNotes = '';
							}
							
							thisMarkerLatitude = thisMarker.latitude;
							thisMarkerLongitude = thisMarker.longitude;
						}
						
						if (thisMarkerType === 'cbsPoi' || (thisMarkerType === 'gMap' && markerTitleText.innerHTML !== currentLocationTitleString))
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
								+ '<div class="markerQuickFact">'
									+ '<div class="markerQuickFactLabel">Location</div>'
									+ '<div class="markerQuickFactData">' + thisMarkerLocation + '</div>'
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
						
						markerPlanWithFurkotLink.href = furkotLinkText;
						markerPlanWithFurkotLink.innerHTML = furkotLinkIcons;

						markerInfoPanel.classList.remove('isNotVisible');
						markerInfoPanel.classList.add('isVisible');
						adjustContentHeight();
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

function closeMarkerInfoPanel()
{
	try
	{
		markerInfoPanel.classList.remove('isVisible');
		markerInfoPanel.classList.add('isNotVisible');
		adjustContentHeight();
	}
	catch(e)
	{
		handleError('Close Marker Info Panel', e);
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

function FilterOptionsPanelControl(controlDiv, map) {
	try {
		var controlUI = document.createElement('div');
		controlUI.className = 'control-filterOptionsPanel';
		controlUI.id = 'FilterOptionsPanel';
		controlUI.innerHTML = '<i class="fas fa-filter"></i> Filters';
		controlUI.title = 'Click to toggle filter options panel display.';
		controlDiv.appendChild(controlUI);

		addMarkerCategoryFilters();

		controlUI.addEventListener
			('click', function () {
				toggleFilterOptionsPanel();
			}
			);
	}
	catch (e) {
		handleError('Adding Filter Options Panel Control', e);
	}
}

function addMarkerCategoryFilters()
{
	try
	{	
		var filtersByCategoryText = '';	

		var	filtersByCategoryTextTemp = '';

		var countAllTotal = 0;
		var countAllVisited = 0;
		var countAllOneVisited = 0;
		var countAllNotVisited = 0;
		var countAllVisitStatusUnknown = 0;
		var thisCategoryLegentIconAltRoutes = '';		
					
		var distinctCategoryArray = markersDistinctCategoriesArray.sort(compareValues('cbsMainCategory', 'asc'));
		
		for (var i = 0; i < distinctCategoryArray.length; i++)
		{		
			(function(index) //an "immediately-invoked function expression"
				{			
					var filterCategory = distinctCategoryArray[i].categoryName;	
					var thisMarkerCategoryData = getMarkerCategoryDataFromArray(filterCategory);
					
					var thisCategoryMarkerIcon = thisMarkerCategoryData.mapMarkerIcon;		
					var thisCategoryNamePlural = thisMarkerCategoryData.cbsMainCategoryPlural;	
					var thisCategoryLegendIcon = '<img src="' + thisCategoryMarkerIcon + '" alt="' + filterCategory + ' Filter"/>';
									
                    var workingArray = markerDataArray.filter(function (filterOn) { return filterOn.cbsMainCategory === filterCategory; });
					
					var filterRowOdd = (i + 1) %2 === 1 ? ' odd' : '';
					
                    if(filterCategory === 'Route Marker')
					{
						filtersByCategoryTextTemp += ''
							+ '<div class="filterItem' + filterRowOdd + '">'
								+ '<div class="filterDisplay">'
									+ '<input type="checkbox" checked id="ToggleCategory ' + thisCategoryNamePlural + '" onclick="toggleMarkers(\'' + thisCategoryNamePlural + '\');"/>'
								+ '</div>'
								+ '<div class="filterIcon">' + thisCategoryLegendIcon + '</div>'
								+ '<div class="filterName">'
									+ '<b>' + thisCategoryNamePlural + '</b>'
									+ '<div class="filterCounts">'
									+ '(Not Included in Counts)'
									+ '</div>'
								+ '</div>'
							+ '</div>';	

                        workingArray=routesDataArray;
                        thisCategoryNamePlural='Routes';
                        thisCategoryLegentIconAltRoutes=thisCategoryLegendIcon;
                        thisCategoryLegendIcon = '<i class="fas fa-map-marked-alt" title="Routes"></i>';

                        filterCategoryCountTotal = workingArray.length;
					
                        filterCategoryCountVisited = (workingArray.filter(function (filterOn) { return filterOn.routeTaken === 'Y';})).length;
					
                        filterCategoryCountOneVisited = (workingArray.filter(function (filterOn) { return filterOn.routeTaken === '1';})).length;
					
                        filterCategoryCountNotVisited = (workingArray.filter(function (filterOn) { return filterOn.routeTaken === 'N';})).length;
					
                        filterCategoryCountVisitStatusUnknown = (workingArray.filter(function (filterOn) { return filterOn.routeTaken === 'U';})).length;
                    }
                    else 
                    {
                        filterCategoryCountTotal = workingArray.length;
					
                        filterCategoryCountVisited = (workingArray.filter(function (filterOn) { return filterOn.cbsVisited === 'Y';})).length;
					
                        filterCategoryCountOneVisited = (workingArray.filter(function (filterOn) { return filterOn.cbsVisited === '1';})).length;
					
                        filterCategoryCountNotVisited = (workingArray.filter(function (filterOn) { return filterOn.cbsVisited === 'N';})).length;
					
                        filterCategoryCountVisitStatusUnknown = (workingArray.filter(function (filterOn) { return filterOn.cbsVisited === 'U';})).length;
                    }
								
					countAllTotal += filterCategoryCountTotal;
					countAllVisited += filterCategoryCountVisited;
					countAllOneVisited += filterCategoryCountOneVisited;
					countAllNotVisited += filterCategoryCountNotVisited;
					countAllVisitStatusUnknown += filterCategoryCountVisitStatusUnknown;
					
					filtersByCategoryTextTemp += ''
						+ '<div class="filterItem' + filterRowOdd + '">'
							+ '<div class="filterDisplay">'
								+ '<input type="checkbox" checked id="ToggleCategory ' + thisCategoryNamePlural + '" onclick="toggleMarkers(\'' + thisCategoryNamePlural + '\');"/>'
							+ '</div>'
							+ '<div class="filterIcon">' + thisCategoryLegendIcon + '</div>'
							+ '<div class="filterName">'
								+ '<b>' + thisCategoryNamePlural + '</b>'
								+ '<div class="filterCounts">'
									+ 'T:' + filterCategoryCountTotal
									+ ' V:' + filterCategoryCountTotal
									+ ' 1:' + filterCategoryCountTotal
									+ ' N:' + filterCategoryCountTotal
									+ ' U:' + filterCategoryCountTotal
								+ '</div>'
							+ '</div>'
						+ '</div>';	
				}
			)(i); // END "immediately-invoked function expression"
		}
		
		filtersByCategoryText +=  ''
			+ '<div class="filterItem">'
				+ '<div class="filterDisplay">&nbsp;</div>'
				+ '<div class="filterIcon">&nbsp;</div>'
				+ '<div class="filterName">'
					+ '<b>All POIs</b>'
					+ '<div class="filterCounts">'
						+ 'T:' + countAllTotal
						+ ' V:' + countAllVisited
						+ ' 1:' + countAllOneVisited
						+ ' N:' + countAllNotVisited
						+ ' U:' + countAllVisitStatusUnknown
					+ '</div>'
				+ '</div>'
			+ '</div>'
			+ filtersByCategoryTextTemp;
		
		filtersByCategory.innerHTML = filtersByCategoryText;
	}
	catch (e)
	{		
		handleError('Adding Category Filter Control', e);
	}
}

function toggleFilterOptionsPanel() 
{
	try 
	{
		if (filterOptionsPanel.classList.contains('isVisible')) 
		{
			filterOptionsPanel.classList.remove('isVisible');
			filterOptionsPanel.classList.add('isNotVisible');
		}
		else 
		{
			filterOptionsPanel.classList.remove('isNotVisible');
			filterOptionsPanel.classList.add('isVisible');
		}
		adjustContentHeight();
	}
	catch (e) 
	{
		handleError('Toggle Filter Options Panel', e);
	}
}

function toggleDataInstructionsMap(toggleThis)
{
	try 
	{
		var randomIndex = Math.floor(Math.random() * showMapIconArray.length);
		var reset = false;

		if (dataListPanel.classList.contains('isNotVisible') && instructionsPanel.classList.contains('isNotVisible'))
		{
			filterOptionsPanelWasVisible = filterOptionsPanel.classList.contains('isVisible');
			markerInfoPanelWasVisible = markerInfoPanel.classList.contains('isVisible');
		}

		mapPanel.classList.remove('isVisible');
		mapPanel.classList.add('isNotVisible');

		filterOptionsPanel.classList.remove('isVisible');
		filterOptionsPanel.classList.add('isNotVisible');

		markerInfoPanel.classList.remove('isVisible');
		markerInfoPanel.classList.add('isNotVisible');

		if (toggleThis === 'instructions')
		{
			if (instructionsPanel.classList.contains('isNotVisible'))
			{
				instructionsPanel.classList.remove('isNotVisible');
				instructionsPanel.classList.add('isVisible');
				toggleInstructionsMapIcon.innerHTML = showMapIconArray[randomIndex];

				dataListPanel.classList.remove('isVisible');
				dataListPanel.classList.add('isNotVisible');
				toggleDataMapIcon.innerHTML = '<i class="far fa-list-alt fa-2x" title="Show Data"></i>';
			}
			else
			{
				instructionsPanel.classList.remove('isVisible');
				instructionsPanel.classList.add('isNotVisible');
				toggleInstructionsMapIcon.innerHTML = '<i class="far fa-question-circle fa-2x" title="Show Instructions"></i>';

				mapPanel.classList.remove('isNotVisible');
				mapPanel.classList.add('isVisible');

				reset = true;
			}
		}
		else
		{
			if (dataListPanel.classList.contains('isNotVisible'))
			{
				dataListPanel.classList.remove('isNotVisible');
				dataListPanel.classList.add('isVisible');
				toggleDataMapIcon.innerHTML = showMapIconArray[randomIndex];

				instructionsPanel.classList.remove('isVisible');
				instructionsPanel.classList.add('isNotVisible');
				toggleInstructionsMapIcon.innerHTML = '<i class="far fa-question-circle fa-2x" title="Show Instructions"></i>';

				var dataListSortIcon = '&nbsp;<i class="fas fa-sort"></i>';
			
				var dataListContent = ''				
					+ '<input id="dataListSearch" class="search" placeholder="Search" />'
					+ '<table>'
						+ '<thead>'
							+ '<th><button type="button" class="sort" data-sort="dlVisited">Visited' + dataListSortIcon + '</button></th>'
							+ '<th><button type="button" class="sort" data-sort="dlIcon">Icon' + dataListSortIcon + '</button></th>'
							+ '<th><button type="button" class="sort" data-sort="dlTitle">Title' + dataListSortIcon + '</button></th>'
							+ '<th><button class="sort">Notes</button></th>'
							+ '<th><button class="sort"></button></th>'
							+ '<th><button class="sort" data-sort="dlCity">City' + dataListSortIcon + '</button></th>'
							+ '<th><button class="sort" data-sort="dlState">State' + dataListSortIcon + '</button></th>'
							+ '<th><button class="sort" data-sort="dlCountry">Country' + dataListSortIcon + '</button></th>'
							+ '<th><button class="sort" data-sort="dlImage">Image' + dataListSortIcon + '</button></th>'
						+ '</thead>'
						+ '<!-- IMPORTANT, class="list" have to be at tbody -->'
						+ '<tbody class="list">';

				var poiCountTotal = 0;
				var poiCountVisited = 0;
				var poiCountNotVisited = 0;
				var poiCountOneVisited = 0;
				var poiCountUnknown = 0;

				for (var i = 0; i < markerDataArray.length; i++)
				{
					var thisCategory =  markerDataArray[i].cbsMainCategory;
					var thisCategoryIsRoute = thisCategory === 'Route Marker';
					var thisCategoryData = getMarkerCategoryDataFromArray(thisCategory);
					var thisCategoryIcon = '<img src="' + thisCategoryData.mapMarkerIcon + '" title="' + thisCategory + '"/>';
					var thisCbsVisitedIcon = poiIconUnknown;
					if (markerDataArray[i].cbsVisited)
					{
						switch(markerDataArray[i].cbsVisited)
						{
							case "Y":
								thisCbsVisitedIcon = poiIconVisited;
								poiCountVisited++;
							break;
									
							case "N":
								thisCbsVisitedIcon = poiIconNotVisited;
								poiCountNotVisited++;
							break;
									
							case "1":
								thisCbsVisitedIcon = poiIconOneVisited;
								poiCountOneVisited++;
							break;

							default:
								poiCountUnknown++;
							break;
						}
					}
					var thisReferenceLink = '';
					if (markerDataArray[i].cbsReferenceUrl)
					{
						thisReferenceLink = '<a href="' + markerDataArray[i].cbsReferenceUrl + '" target="_blank"><i class="fas fa-external-link-alt"></i></a>';
					}

					var thisImage = '';
					if (markerDataArray[i].cbsImage)
					{
						thisImage = '<a href="' + markerDataArray[i].cbsImage + '" target="_blank"><img class="dataListImage" src="' + markerDataArray[i].cbsImage + '" alt="Image or Logo" /></a>';
					}

					dataListContent += ''
						+ '<tr>'
							+ '<td class="dlVisited">' + thisCbsVisitedIcon + '</td>'
							+ '<td class="dlIcon">' + thisCategoryIcon + '</td>'
							+ '<td class="dlTitle">' + markerDataArray[i].cbsTitle + '</td>'
							+ '<td class="dlNotes">' + markerDataArray[i].cbsNotes + '</td>'
							+ '<td class="dlUrl">' +thisReferenceLink + '</td>'
							+ '<td class="dlCity">' + markerDataArray[i].addressCity + '</td>'
							+ '<td class="dlState">' + markerDataArray[i].addressState + '</td>'
							+ '<td class="dlCountry">' + markerDataArray[i].addressCountry + '</td>'
							+ '<td class="dlImage">' + thisImage + '</td>'
						+ '</tr>';

					poiCountTotal++;
				}

				dataListContent += ''				
						+ '</tbody>'
					+ '</table>'
					+ '<div id="dataListNoSearchResult" class="isNotVisible">No Result</div>'
					+ '<div class="poiCounts">' 
						+ 'Total: ' +   poiCountTotal
						+ '; ' + poiIconVisited + ' Visited: ' +   poiCountVisited
						+ '; ' + poiIconNotVisited + ' Not Visited: ' +   poiCountNotVisited
						+ '; ' + poiIconOneVisited + ' One Visited: ' +   poiCountOneVisited
						+ '; ' + poiIconUnknown + ' Unknown: ' +   poiCountUnknown
					+ '</div>';

				document.getElementById('dataList').innerHTML = dataListContent;

				var options = { valueNames: [ 'dlVisited', 'dlIcon', 'dlTitle', 'dlNotes', 'dlUrl', 'dlCity', 'dlState', 'dlCountry', 'dlImage' ] };
				var dataListTable = new List('dataList', options);
				dataListTable.on
				('updated', function(list) 
					{
						if (list.matchingItems.length > 0) 
						{
							dataListNoSearchResult.className = 'isNotVisible';
						} 
						else 
						{
							dataListNoSearchResult.className = 'isVisible';
						}
					}
				);
			}
			else
			{
				dataListPanel.classList.remove('isVisible');
				dataListPanel.classList.add('isNotVisible');
				toggleDataMapIcon.innerHTML = '<i class="far fa-list-alt fa-2x" title="Show Data"></i>';

				mapPanel.classList.remove('isNotVisible');
				mapPanel.classList.add('isVisible');

				reset = true;
			}
		}

		if (reset && filterOptionsPanelWasVisible)
		{
			filterOptionsPanel.classList.remove('isNotVisible');
			filterOptionsPanel.classList.add('isVisible');
		}

		if (reset && markerInfoPanelWasVisible)
		{
			markerInfoPanel.classList.remove('isNotVisible');
			markerInfoPanel.classList.add('isVisible');
		}
	}
	catch (e) 
	{
		handleError('Toggle Data List Panel', e);
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

function ZoomToBoundsControl(controlDiv, map) {
	try {
		var controlUI = document.createElement('div');
		controlUI.className = 'control-zoom';
		controlUI.id = 'ZoomToBounds';
		controlUI.innerHTML = '<i class="fas fa-expand-arrows-alt"></i>';
		controlUI.title = 'Click to zoom to bounds of all markers.';
		controlDiv.appendChild(controlUI);

		controlUI.addEventListener
			('click', function () {
				try {

					map.fitBounds(mapBounds);
				}
				catch (e) {
					handleError('Zoom to Bounds Control', e);
				}
			}
			);
	}
	catch (e) {
		handleError('Adding Zoom to Bounds Control', e);
	}
}

function ResetToCenterControl(controlDiv, map) {
	try {
		var controlUI = document.createElement('div');
		controlUI.className = 'control-reset';
		controlUI.id = 'ResetToCenter';
		controlUI.innerHTML = '<i class="fas fa-compress-arrows-alt"></i>';
		controlUI.title = 'Click to reset to original map center.';
		controlDiv.appendChild(controlUI);

		controlUI.addEventListener
			('click', function () {
				try {
					map.zoom = mapInitialZoom;
					map.panTo(mapCenter);
				}
				catch (e) {
					handleError('Reset to Center Control', e);
				}
			}
			);
	}
	catch (e) {
		handleError('Adding Reset to Center Control', e);
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

function toggleMarkers(toggleCategory)
{
	try
	{	
		if (toggleCategory === 'ShowAll' || toggleCategory === 'HideAll')
		{
			var desiredState = toggleCategory === 'ShowAll' ? true : false;
			
			for (var i = 0; i < markersArray.length; i++) 
			{
				markersArray[i].setVisible(desiredState);
			}
			
			for (var i = 0; i < routesArray.length; i++) 
			{
				routesArray[i].setVisible(desiredState);
			}
			
			var visitedCheckbox = document.getElementById('ToggleCategory Visited');
			visitedCheckbox.checked = true;

			var notVisitedCheckbox = document.getElementById('ToggleCategory NotVisited');
			notVisitedCheckbox.checked = true;			
			
			var routesCheckbox = document.getElementById('ToggleCategory Routes');
			routesCheckbox.checked = desiredState;
							
			for (var i = 0; i < markersDistinctCategoriesArray.length; i++)
			{
				var toggleThisCategory = markersDistinctCategoriesArray[i].categoryName;
				var thisMarkerCategoryData = getMarkerCategoryDataFromArray(toggleThisCategory);
				var thisMarkerCategoryNamePlural = thisMarkerCategoryData.cbsMainCategoryPlural;
				var thisMarkerCategoryCheckbox = document.getElementById('ToggleCategory ' + thisMarkerCategoryNamePlural);
				thisMarkerCategoryCheckbox.checked = desiredState;			
			}
		}
		else
		{
			var showVisited = true;	
			var showNotVisited = true;

			var thisVisitedControl = document.getElementById('ToggleCategory Visited');
			var thisNotVisitedControl = document.getElementById('ToggleCategory NotVisited');
			
			showVisited = thisVisitedControl.checked;			
			showNotVisited = thisNotVisitedControl.checked;
			
			if (toggleCategory === 'Visited' || toggleCategory === 'NotVisited' )
			{					
				for (var i = 0; i < markersDistinctCategoriesArray.length; i++)
				{
					var toggleACategory = markersDistinctCategoriesArray[i].categoryName;	
					setVisibilityOnMarkersInArray(toggleACategory, showVisited, showNotVisited, 'all');
				}
			
				for (var i = 0; i < routesArray.length; i++) 
				{
					setVisibilityOnMarkersInArray('Routes', showVisited, showNotVisited, 'all');
				}
			}
			else
			{	
				setVisibilityOnMarkersInArray(toggleCategory, showVisited, showNotVisited, 'category');
			}
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
		var thisMarkerCategoryData = getMarkerCategoryDataFromArray(toggleCategory);
		toggleCategory = thisMarkerCategoryData.cbsMainCategoryPlural;

		var elementID = 'ToggleCategory ' + toggleCategory;	
		var checkBoxControl = document.getElementById(elementID);
		var controlIsCurrentlyActive = checkBoxControl.checked;
		if (callType === 'category')
		{
			controlIsCurrentlyActive = checkBoxControl.checked ? false : true;
		}
		var desiredStateIsVisible = true;	
		
		var markersInThisCategoryArray = [];
		
		if (toggleCategory === 'Routes')
		{
			markersInThisCategoryArray = routesArray;
		}
		else
		{
			markersInThisCategoryArray = markersArray.filter
			(
				function(filterOn) 
				{
					return filterOn.cbsCategoryPlural === toggleCategory;
				}
			);
		}
		
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

function hex2rgb(hex) 
{
	//https://stackoverflow.com/a/14101452/4407150
	return ['0x' + hex[1] + hex[2] | 0, '0x' + hex[3] + hex[4] | 0, '0x' + hex[5] + hex[6] | 0];
}

//***********************************************************
// RESIZE CONTENT PANELS BASED ON WINDOW - HEADER SIZE
//***********************************************************
//adapted from https://techstacker.com/building-a-get-viewport-dimensions-app-with-vanilla/ttDuoXKkNyx6Yqz5X
// throttled value before window event starts
var throttled;

// Delay function calls to 66ms (frame rate: 15fps)
var delay = 66;

// Declare empty variable for later use
var resizeTimeout;

function throttler() {
	// Only run code if�s block if we�re not throttled
	if (!throttled) {
		// Callback: the function we want to throttle
		adjustContentHeight();
		// We're currently throttled!
		throttled = true;
		// Reset throttled variable back to false after delay
		setTimeout(function () {
			throttled = false;
		}, delay);
	}
}

function adjustContentHeight() 
{
	var viewportOrientation = screen.orientation.angle;
	var viewportHeight = window.innerHeight;
	var viewportWidth = window.innerWidth;

	var headerHeight = document.getElementById('header').offsetHeight;
	var headerFooter = document.getElementById('footer').offsetHeight;
	var contentHeight = viewportHeight - headerHeight - headerFooter;
	document.getElementById('content').setAttribute("style", "height: " +  contentHeight + 'px');

	if (isATest)
	{
		viewportSize.innerHTML = viewportWidth.toString() + 'px wide, ' + viewportHeight.toString() + 'px high, ' + viewportOrientation;
		viewportSize.setAttribute("style", "font-weight: bold; font-style: normal; font-size: larger; display: block;");
	}
}
// Listen to resize and orientation change events, and run throttler()
window.addEventListener('resize', throttler);
window.addEventListener('deviceorientation', throttler);