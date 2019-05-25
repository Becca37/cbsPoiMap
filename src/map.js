var funcs = [];
var map = null;
var mapCenter = {lat: 39.219422, lng: -105.530727}; // Colorado

var trafficLayer = null;

var currentLocationMarker = null;
var watchCurrentLocationId = null;

var isATest = true;
	
var markersArray = [];

// TODO: Ideally, we'll want to pull the marker data from a file or database, but for now ...
var markerDataArray = [
	{ 
		cbsTitle: 'Title 1'
		, cbsId: 1
		, cbsVisited: 'N'
		, cbsMainCategory: 'Test'
		, cbsTags: ['Test Tag 1', 'Test Tag 2', 'Test Tag 3']
		, latitude: 39.33847
		, longitude: -106.78838
		, cbsNotes: 'stuffff', website: 'https://anywhere.com' 
	}
	, { 
		cbsTitle: 'Title 2'
		, cbsId: 2
		, cbsVisited: 'N'
		, cbsMainCategory: 'Test'
		, cbsTags: ['Test Tag 12', 'Test Tag 23', 'Test Tag 33']
		, latitude: 39.32992
		, longitude: -106.81623
		, cbsNotes: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Diam sit amet nisl suscipit adipiscing bibendum est. Tortor id aliquet lectus proin nibh nisl condimentum id venenatis. Dolor purus non enim praesent elementum facilisis leo vel fringilla. Sociis natoque penatibus et magnis. Proin sed libero enim sed faucibus turpis. Ut tristique et egestas quis ipsum suspendisse. Odio ut enim blandit volutpat maecenas volutpat blandit aliquam etiam. At imperdiet dui accumsan sit amet nulla facilisi morbi tempus. Amet risus nullam eget felis eget nunc lobortis mattis aliquam. Ultricies tristique nulla aliquet enim tortor at. In arcu cursus euismod quis viverra nibh cras pulvinar mattis. Risus nullam eget felis eget nunc lobortis mattis. Dictum non consectetur a erat. Sed vulputate mi sit amet mauris commodo. Amet cursus sit amet dictum sit. Porttitor massa id neque aliquam vestibulum. Habitant morbi tristique senectus et. Interdum consectetur libero id faucibus nisl tincidunt.</p><p>Malesuada fames ac turpis egestas integer eget aliquet. Justo donec enim diam vulputate ut pharetra sit amet. Justo laoreet sit amet cursus sit amet dictum. Leo a diam sollicitudin tempor. Nunc lobortis mattis aliquam faucibus purus in massa tempor nec. Ultricies mi quis hendrerit dolor magna eget est lorem ipsum. Feugiat sed lectus vestibulum mattis ullamcorper velit. Imperdiet nulla malesuada pellentesque elit eget gravida. Erat nam at lectus urna. Mauris a diam maecenas sed enim. Facilisi morbi tempus iaculis urna id volutpat. Euismod lacinia at quis risus sed vulputate odio ut enim. Netus et malesuada fames ac turpis egestas sed. Libero justo laoreet sit amet cursus sit amet. Egestas dui id ornare arcu odio ut sem nulla. Justo nec ultrices dui sapien eget mi proin sed. Leo a diam sollicitudin tempor id eu nisl nunc mi. Duis at tellus at urna. Nulla aliquet porttitor lacus luctus accumsan tortor.</p><p>Tempor orci eu lobortis elementum nibh. Euismod lacinia at quis risus sed vulputate. Cras pulvinar mattis nunc sed blandit libero. Mi ipsum faucibus vitae aliquet nec ullamcorper sit amet risus. Donec et odio pellentesque diam volutpat commodo sed. Et ultrices neque ornare aenean. Sit amet commodo nulla facilisi nullam vehicula ipsum a arcu. Rutrum quisque non tellus orci ac auctor augue mauris. Nibh mauris cursus mattis molestie. Duis at tellus at urna condimentum mattis pellentesque. Suspendisse interdum consectetur libero id faucibus nisl tincidunt eget. Non odio euismod lacinia at quis risus sed. Sapien eget mi proin sed libero enim sed faucibus turpis. Vehicula ipsum a arcu cursus vitae congue.</p><p>Elit at imperdiet dui accumsan sit. Adipiscing vitae proin sagittis nisl rhoncus mattis rhoncus urna neque. Nibh ipsum consequat nisl vel pretium lectus quam id leo. Neque laoreet suspendisse interdum consectetur libero id. Lacus vestibulum sed arcu non. Urna et pharetra pharetra massa. Morbi tincidunt augue interdum velit euismod in pellentesque. Lorem ipsum dolor sit amet consectetur adipiscing elit duis. Erat velit scelerisque in dictum non consectetur a erat. Et tortor consequat id porta. Quis enim lobortis scelerisque fermentum dui faucibus in ornare quam. Tellus id interdum velit laoreet id donec ultrices. Magna fringilla urna porttitor rhoncus dolor purus non enim praesent. Iaculis nunc sed augue lacus viverra.<p>Quisque egestas diam in arcu cursus euismod quis viverra nibh. Proin fermentum leo vel orci porta non pulvinar neque laoreet. Tristique nulla aliquet enim tortor at. Massa sapien faucibus et molestie ac feugiat sed lectus vestibulum. Diam maecenas sed enim ut sem viverra aliquet eget. Platea dictumst vestibulum rhoncus est pellentesque. Eu lobortis elementum nibh tellus molestie nunc non. Rutrum quisque non tellus orci ac auctor augue mauris. Commodo sed egestas egestas fringilla phasellus faucibus scelerisque eleifend. Ac tortor dignissim convallis aenean et tortor at risus. In hac habitasse platea dictumst. Adipiscing elit pellentesque habitant morbi tristique senectus et netus. Consectetur libero id faucibus nisl tincidunt eget nullam.</p>" 
	}
	, { 
		cbsTitle: 'Hoosier Pass'
		, cbsId: 3
		, cbsVisited: 'Y'
		, cbsMainCategory: 'Pass'
		, cbsTags: '(none)'
		, latitude: 39.361670
		, longitude: -106.062663
		, cbsNotes: "Who's your pass, baby, who's your pass?"
		, cbsReferenceUrl: 'https://en.wikipedia.org/wiki/Hoosier_Pass'
	}	
	, { 
		cbsTitle: 'Mount Evans'
		, cbsId: 4
		, cbsVisited: 'Y'
		, cbsMainCategory: 'Paved High Point'
		, cbsTags: ['Scenic Byway', '14er', 'USDA', 'Forest Service', 'Lincoln National Forest']
		, latitude: 39.587795
		, longitude: -105.642439
		, cbsNotes: "Paved scenic byway to the top at 14,130 feet. Note that while it is paved, sometimes the road is still ... rough. "
		, cbsReferenceUrl: 'https://www.fs.usda.gov/wps/portal/fsinternet/cs/recarea?ss=110308&navtype=BROWSEBYSUBJECT&cid=FSE_003738&navid=110240000000000&pnavid=110000000000000&position=generalinfo&recid=28508&ttype=recarea&pname=Mount%20Evans%20Scenic%20Byway'
	}

]; 

var markerCategoriesArray = [];
var markerCategoryDataArray = [];
		
function handleError(useTitle, e)
{	
	if(isATest || isALocationWatchTest)
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

function showHideInstructions()
{
	try
	{ 
		if (instructionsText.style.display === 'none')
		{
			instructionsText.style.display = 'block';
			toggleInstructions.value = '<i class="far fa-question-circle"> Hide Instructions';
		}
		else
		{
			instructionsText.style.display = 'none';
			toggleInstructions.value = '<i class="far fa-question-circle"> Show Instructions';
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
		markerInfoHeader.style.display = 'none';
		map = new google.maps.Map
		(
			document.getElementById('mapContainer'), 
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
		// Add custom control for CREDITS	
		var creditsControlDiv = document.createElement('div');
		var creditsControl = new CreditsControl(creditsControlDiv, map);	
		creditsControlDiv.index = 1;
		map.controls[google.maps.ControlPosition.BOTTOM_LEFT].push(creditsControlDiv);

		// Add custom control for MARKER INFO	
		// var markerInfoControlDiv = document.createElement('div');
		// var markerInfoControl = new MarkerInfoControl(markerInfoControlDiv, map);	
		// markerInfoControlDiv.index = 1;
		// map.controls[google.maps.ControlPosition.LEFT_CENTER].push(markerInfoControlDiv);

		// Add custom control for LOCATION INFO	
		var locationInfoControlDiv = document.createElement('div');
		var locationInfoControl = new LocationInfoControl(locationInfoControlDiv, map);	
		locationInfoControlDiv.index = 1;
		map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(locationInfoControlDiv);

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
			console.error('TESTING: Marker Category count: ' + markerCategoriesArray.length.toString());			
			markerCategoriesArray.forEach
			(function(category, i) 
				{
					console.log('TESTING: Category', i, 'is', category);
				}
			);
			
			console.error('TESTING: Marker Category Data count: ' + markerCategoryDataArray.length.toString());					
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
					
					addThisMarker.addListener('closeclick', function() { closeInfoPanel();});

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
			console.error('Processing marker for display.');
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
		// via another process (i.o.w. not on every map initialization and marker display) and write it
		// to the file or database to store with the marker data, but for now ...
		
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
						? '<a href="' + thisMarker.cbsReferenceUrl + '" title="Website"><i class="fas fa-globe fa-2x"></i></a>' 
						: '<i class="fas fa-globe fa-2x disabled"></i>';
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
						  '<div class="markerInfoShelf">'
							+ '<div class="markerInfoShelfIcon">' + markerVisitedIcon + '</div>' 
							+ '<div class="markerInfoShelfIcon">' + markerShowWebsite + '</div>'
						+ '</div>'
						+ '<div class="markerInfoQuickFacts">'
							+ '<div class="markerInfoQuickFact">'
								+ '<div class="markerInfoQuickFactLabel">Category</div>'
								+ '<div class="markerInfoQuickFactData">' + thisMarker.cbsMainCategory + '</div>'
							+ '</div>'
							+ '<div class="markerInfoQuickFact">'
								+ '<div class="markerInfoQuickFactLabel">Tags</div>'
								+ '<div class="markerInfoQuickFactData">' + thisMarker.cbsTags.toString().replace(/,/g, ', ') + '</div>'
							+ '</div>'
							+ '<div class="markerInfoQuickFact">'
								+ '<div class="markerInfoQuickFactLabel">Coordinates</div>'
								+ '<div class="markerInfoQuickFactData">' + thisMarker.latitude + ', ' + thisMarker.longitude + '</div>'
							+ '</div>'
							+ '<div class="markerInfoQuickFact">'
								+ '<div class="markerInfoQuickFactLabel">Elevation</div>'
								+ '<div class="markerInfoQuickFactData">' + locationElevation + '</div>'
							+ '</div>'
						+ '</div>'
						+ '<div class="markerInfoCbsNotes">' 
							+ thisMarker.cbsNotes 
						+ '</div>';
					
					if(isATest)
					{
						console.log('TESTING: Marker Icon: ' + thisMarkersCategoryIcon);
						console.log('TESTING: Marker Furkot Icons: ' + furkotLinkIcons);
						console.log('TESTING: Marker Furkot Link: ' + furkotLinkText);
						console.log('TESTING: Marker Content: ' + contentString);
					}		
					
					markerInfoHeader.style.display = 'block';						
					
					markerInfoHeaderIconImage.src = thisMarkersCategoryIcon;
					markerInfoHeaderTitle.innerHTML = thisMarker.cbsTitle;
					markerInfoData.innerHTML = contentString;
					
					planWithFurkotLink.innerHTML = furkotLinkIcons;
					planWithFurkotLink.href = furkotLinkText;
					
					markerInfoContainer.style.display = 'block';
					// ------------------------------------------------------------------
				}
		);
	}
	catch (e)
	{
		handleError('Display Marker Info', e);
	}
}

function closeInfoPanel()
{
	try
	{
		markerInfoContainer.style.display = 'none';
	}
	catch(e)
	{
		handleError('Add Markers', e);
	}
}

function CreditsControl(controlDiv, map)
{
	try
	{
		var controlUI = document.createElement('div');
		controlUI.id = 'credits';
		controlUI.innerHTML = 
			'<div><img src="/map/images/logos/CBS_Logo.png" alt="Logo"/></div>'
			+ '<div><b>Oh the Places We Will Go</b> <i>by <a href="/">Chasing Blue Sky</a></i></div>'
			+ '<div>See website for the numerous <a href="https://chasingbluesky.net/credits/" title="Credits">credits</a>, and for terms of use.</div>';
		controlUI.title = 'Credits';
		controlDiv.appendChild(controlUI);			
	}
	catch (e)
	{		
		handleError('Credits', e);
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
					console.error(messageToUserGeneralOFF);
					isATest = false;
					controlUI.className = 'control-test controlTestInactive';
					iziToast.info({title: 'Testing Ended', message: messageToUserGeneralOFF,});
				}
				else
				{
					console.error(messageToUserGeneralON);
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
			console.error('TESTING: All Markers count: ' + markersArray.length.toString());
			for (var i = 0; i < 1; i++) 
			{
				var markerData = markersArray[i];		
				console.log('TESTING: Marker Data', i, 'is', markerData);
			}
		}
		
		if(isATest)
		{
			console.error('TESTING: Marker count in category "' + toggleCategory + '": ' + markersInThisCategoryArray.length.toString());
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
