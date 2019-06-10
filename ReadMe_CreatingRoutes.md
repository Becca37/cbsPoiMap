Generating A Route for ChasingBlueSky Maps

Many ways to do this, but here's our process. It's a bit convoluted, I suppose, because we want high definition route paths for use with the CBS map display, but can't pass those routes to Furkot due to their size. The best solution we found for our needs was to then create a Furkot TripShot and work from there. See <a href="FurkotLinkExamples.html">additional notes about interacting with Furkot</a> to see why we went this direction.

START A NEW ENTRY in the data/routes.json file. See the entry template at end of this file.

CREATE FURKOT TRIPSHOT 

	(1) Create the route at Furkot.ui.com and <a href="https://help.furkot.com/widgets/embed.html">publish it as a tripshot</a>. This opens the tripshot page. 

	(2) Click the embed option for the tripshot and grab the tripshot id, e.g. the IOwQ6N portion of /ts/IOwQ6N in the two urls in the embed code, and save that as the routeFurkotId in the new routes.json entry.

	(3) "Back" your browser to the Furkot UI, export the trip <i>tracks</i> as <i>GPS exchange file (.gpx)</i>, and save it to your computer.

CREATE WAYPOINT COORDINATES JSON SNIPPET

	(4) Access GPS Visualizer's Convert Input page (http://www.gpsvisualizer.com/convert_input), load the saved file, use <i>Plain Text</i> and <i>Plain text delimiter pipe(|)</i>, click the Convert button then copy the converted data.

	(5) Open Excel and paste the converted data then on the Data menu use TextToColums to process the pipe(|)-delimited data.

		Change latitude and longitude header text for waypoints (W) to lat and lng.
		
		After lat and lng columns, add column with header "waypointType" and add a type value to each waypoint.
		
		Change header value "name" to "waypointName".
		
			You should now have something like this (columns will vary depending on your tools):
			
				type	time	lat	lng	waypointType	waypointName	desc	city	state	country
				W	6/8/2019 12:00	38.153026	-107.760071	end	Ridgway		Ridgway	CO	United States
				W	6/8/2019 14:18	37.691976	-108.031578	via	Rico		Rico	CO	United States
				W	6/8/2019 17:03	37.288327	-107.880923	via	Durango		Durango	CO	United States
				W	6/8/2019 19:50	38.153026	-107.760071	via	Ridgway		Ridgway	CO	United States
				
			And should copy this section:
			
				lat	lng	waypointType	waypointName
				38.153026	-107.760071	end	Ridgway
				37.691976	-108.031578	via	Rico
				37.288327	-107.880923	via	Durango
				38.153026	-107.760071	via	Ridgway

		Copy the lat, lng, waypointType, and waypointName column headers and row values, not the TRACK rows at the this time, for any waypoints you actually want called out on the map.*
	
		Using Mr Data Converter (https://shancarter.github.io/mr-data-converter/) (or similar), convert the waypoint data to JSON format.
		
			The result should be something like:
			
				[{"lat":38.153026,"lng":-107.760071,"waypointType":"end","waypointName":"Ridgway"},
				{"lat":37.691976,"lng":-108.031578,"waypointType":"via","waypointName":"Rico"},
				{"lat":37.288327,"lng":-107.880923,"waypointType":"via","waypointName":"Durango"},
				{"lat":38.153026,"lng":-107.760071,"waypointType":"via","waypointName":"Ridgway"}]

		Copy the JSON formatted data and paste it into the routeWaypoints array of the data/routes.json for the new entry you're making. 

CREATE HIGH DEF TRACK COORDINATES JSON ** OPTIONAL -- This produces a much more "high def" or "on the road" version of the track. If you prefer to use the Furkot .gps, skip to Step 8. **

	(5) In the RideWithGPS.com Route Planner, create the same route with <i>Follow Roads</li> selected, save it, and view the resultant route.
	
		After it is processed, view the route the export a GPX file using <i>more export options</i> and GPX Track (.gpx), and save it to your computer. 

	(6) Access GPS Visualizer's Convert Input page (http://www.gpsvisualizer.com/convert_input), load the saved .gpx file for the route, use <i>Plain Text</i> and <i>Plain text delimiter pipe(|)</i>, click the Convert button, then copy the converted data.

	(7) Open Excel and paste the converted data then on the Data menu use TextToColums to process the pipe(|)-delimited data.

	Additional Notes: the RideWithGPS.com route version can be deleted after you export the .gpx, if desired. If I use this high def version, I also update the lat/lon of the start and end waypoint with the start and end values from this .gpx file so that the waypoint markers are located with the route ends. Sadly, I imagine that once we have a lot of routes we'll have to back off from using the high def path versions for performance reasons. 
	
CONVERT ROUTE to COORDINATES

	(8) In Excel, change latitude and longitude header text for tracks (T) to lat and lng.
	
		You should now have something like this (columns will vary depending on your tools):
		
			type	time	lat	lng	name	desc	city	state	country
			T	6/8/2019 12:00	38.153026	-107.760148	Day 1 - Sat, Jun 8, 2019				
			T		38.153026	-107.760148					
			T		38.151424	-107.760155					
			T		38.151657	-107.765076					
			T		38.156738	-107.769181		
		
		And should copy this section:			

			lat	lng
			38.153026	-107.760148
			38.153026	-107.760148
			38.151424	-107.760155
			38.151657	-107.765076
			38.156738	-107.769181

		Copy the TRACK (T) lat and lng column header and row values.

		Using your data converter tool, convert the track data to a JSON format.
		
			The result should be something like:
		
				[{"lat":38.153026,"lng":-107.760148},
				{"lat":38.153026,"lng":-107.760148},
				{"lat":38.151424,"lng":-107.760155},
				{"lat":38.151657,"lng":-107.765076},
				{"lat":38.156738,"lng":-107.769181}]

		Copy the JSON formatted data and paste it into a text file on your computer then save the file with the name of the route and with a .json extension in the data/routes directory.**

	(5) Add the name of the route file, minus the ".json", to the routes.json file for your new route entry, complete additional properties as desired, then upload the new data/routes/*.json file(s) and the updated date/routes.json file.
	
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

NOTEs: 
	
	* Personally, I'm going to use two (2) end waypoints per route unless any via waypoints are required in order to "force" the route. 
	
		TIP: if route is one-way, put the TURN-AROUND waypoint as the LAST waypoint in the waypoints listing.

	** Main file (routes.json) certainly could have included the route path data along with the route name and waypoint data. However, I explicitly chose to split them out for ease of reading the routes.json file when adding routes as path coordinates can be quite long.
	
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

ENTRY TEMPLATE
	
	[
		{
			  "routeId": 
			, "routeName": ""
			, "routeFileName": "" 
			, "routeTaken": ""
			, "routeUrl": ""
			, "routeTags": 
			, "routeNotes": ""
			, "routeType":  "",
			, "routeFurkotId": "",
			, "routeWaypoints":
				[
					{"lat":, "lng":, "waypointType": "", "waypointName": ""},
					{"lat":, "lng":, "waypointType": "", "waypointName": ""}
				]
		}
	]

	routeTaken = Y for yes (both of us), N for no (neither of us), U for undocumented or unknown, or 1 for yes (one of us) 
	
		[BTW if you're not now, at least mentally if not aloud, chanting "One of us! One of us!" (<a href="https://movies.stackexchange.com/questions/24068/where-does-the-one-of-us-one-of-us-chant-originate">whatever your cultural reference for that might be</a>), you're dead to me.]

	routeTags = an array, e.g. ["tag1", "tag2"]

	routeType = Through for can be accessed from either end, Loop for a closed loop, In-and-Out for "no outlet" / "turn around at the end and come back the way you went"

	waypointType = end for an end waypoint or via for a routing-only waypoint; End is the default if not provided

	waypointName = will be added to route name in each waypoint marker, e.g. Route Name (waypointName)

	Example	 (note that example values do not necessarily correlate to one another, i.o.w. this probably isn't a "working example"!)
	
		[
			{
				  "routeId": 3
				, "routeName": "Million Dollar Highway"
				, "routeFileName": "CO-MillionDollaryHighway" 
				, "routeTaken": "Y"
				, "routeUrl": "https://www.durango.com/million-dollar-highway/"
				, "routeTags": ["Scenic Byway"]
				, "routeNotes": "The part of route 550 between Ouray and Silverton in Colorado. Fun!"
				, "routeType":  "Through",
				, "routeFurkotId": "IOwQ6N",
				, "routeWaypoints":
					[
						{"lat":38.031876, "lng":-107.67558, "waypointType": "end", "waypointName": "Ouray"},
						{"lat":37.810294, "lng":-107.665649, "waypointType": "end", "waypointName": "Silverton"}
					]
			}
		]