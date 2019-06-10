<h1>Generating A Route for ChasingBlueSky Maps</h1>

Many ways to do this, but here's our process. It's a bit convoluted, I suppose, because we want high definition route paths for use with the CBS map display, but can't pass those routes to Furkot due to their size. The best solution we found for our needs was to then create a Furkot Tripshot and work from there. See <a href="examples/Furkot_Integration_Examples.html">additional notes about interacting with Furkot</a> to see why we went this direction.

<h3>START A NEW ENTRY</h3>

In the data/routes.json file. 

See the entry template at end of this file.

<h3>CREATE FURKOT TRIPSHOT </h3>

<ol>
	<li>Create the route at Furkot.ui.com and <a href="https://help.furkot.com/widgets/embed.html">publish it as a tripshot</a>. This opens the tripshot page. </li>
	<li>Click the embed option for the tripshot and grab the tripshot id, e.g. the IOwQ6N portion of /ts/IOwQ6N in the two urls in the embed code, and save that as the routeFurkotId in the new routes.json entry.</li>
	<li>"Back" your browser to the Furkot UI, export the trip <i>tracks</i> as <i>GPS exchange file (.gpx)</i>, and save it to your computer.</li>
</ol>

<h3>CREATE WAYPOINT COORDINATES JSON SNIPPET</h3>
<ol>
	<li>Access GPS Visualizer's Convert Input page (http://www.gpsvisualizer.com/convert_input), load the saved file, use <i>Plain Text</i> and <i>Plain text delimiter pipe(|)</i>, click the Convert button then copy the converted data.</li>
	<li>Open Excel and paste the converted data then on the Data menu use TextToColums to process the pipe(|)-delimited data. Change latitude and longitude header text for waypoints (W) to lat and lng. After lat and lng columns, add column with header "waypointType" and add a type value to each waypoint. Change header value "name" to "waypointName". See waypoint process example at end of this file.</li>
	<li>Copy the lat, lng, waypointType, and waypointName column headers and row values, not the TRACK rows at the this time, for any waypoints you actually want called out on the map.</li>
	<li>Using Mr Data Converter (https://shancarter.github.io/mr-data-converter/) (or similar), convert the waypoint data to JSON format.</li>
	<li>Copy the JSON formatted data and paste it into the routeWaypoints array of the data/routes.json for the new entry you're making.</li>
</ol>

TIP: if a route is In-and-Out, put the TURN-AROUND waypoint as the LAST waypoint in the waypoints listing.

<h3>CREATE HIGH DEF TRACK COORDINATES JSON</h3> 

** OPTIONAL -- This produces a much more "high def" or "on the road" version of the track. If you prefer to use the Furkot .gps, skip to next section. **

<ol>
	<li>In the RideWithGPS.com Route Planner, create the same route with <i>Follow Roads</i> selected, save it, and view the resultant route. After it is processed, view the route the export a GPX file using <i>more export options</i> and GPX Track (.gpx), and save it to your computer. </li>
	<li>Access GPS Visualizer's Convert Input page (http://www.gpsvisualizer.com/convert_input), load the saved .gpx file for the route, use <i>Plain Text</i> and <i>Plain text delimiter pipe(|)</i>, click the Convert button, then copy the converted data.</li>
	<li>Open Excel and paste the converted data then on the Data menu use TextToColums to process the pipe(|)-delimited data.</li>
</ol>

<em>Additional Notes</em>: the RideWithGPS.com route version can be deleted after you export the .gpx, if desired. If I use this high def version, I also update the lat/lon of the start and end waypoint with the start and end values from this .gpx file so that the waypoint markers are located with the route ends. Sadly, I imagine that once we have a lot of routes we'll have to back off from using the high def path versions for performance reasons. 
	
<h3>CONVERT ROUTE to COORDINATES</h3>
<ol>
	<li>In Excel, change latitude and longitude header text for tracks (T) to lat and lng.</li>
	<li>Copy the TRACK (T) lat and lng column header and row values.</li>
	<li>Using your data converter tool, convert the track data to a JSON format.</li>
	<li>Copy the JSON formatted data and paste it into a text file on your computer then save the file with the name of the route and with a .json extension in the data/routes directory.</li>
	<li>Add the name of the route file, minus the ".json", to the routes.json file for your new route entry, complete additional properties as desired, then upload the new data/routes/*.json file(s) and the updated date/routes.json file.</li>
</ol>

<hr>

<h5>ENTRY TEMPLATE</h5>
<pre>
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
</pre>

Usage
<ul>
	<li><i>routeTaken</i> = Y for yes (both of us), N for no (neither of us), U for undocumented or unknown, or 1 for yes (one of us)</li>
	<li><i>routeTags</i> = an array, e.g. ["tag1", "tag2"]</li>
	<li><i>routeType</i> = Through for can be accessed from either end, Loop for a closed loop, In-and-Out for "no outlet" / "turn around at the end and come back the way you went"</li>
	<li><i>waypointType</i> = end for an end waypoint or via for a routing-only waypoint; End is the default if not provided</li>
	<li><i>waypointName</i> = will be added to route name in each waypoint marker, e.g. Route Name (waypointName)</li>
</ul>
	
[BTW if you're not now, at least mentally if not aloud, chanting "One of us! One of us!" (<a href="https://movies.stackexchange.com/questions/24068/where-does-the-one-of-us-one-of-us-chant-originate">whatever your cultural reference for that might be</a>), you're dead to me.]

Example	 (note that example values do not necessarily correlate to one another, i.o.w. this probably isn't a "working example"!)
<pre>	
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
</pre>

<hr>

<h5>WAYPOINT PROCESSING EXAMPLES</h5>
		
You should have something like this (columns will vary depending on your tools):
<pre>	
type	time	lat	lng	waypointType	waypointName	desc	city	state	country
W	6/8/2019 12:00	38.153026	-107.760071	end	Ridgway		Ridgway	CO	United States
W	6/8/2019 14:18	37.691976	-108.031578	via	Rico		Rico	CO	United States
W	6/8/2019 17:03	37.288327	-107.880923	via	Durango		Durango	CO	United States
W	6/8/2019 19:50	38.153026	-107.760071	via	Ridgway		Ridgway	CO	United States
</pre>

Copy this section:
<pre>
lat	lng	waypointType	waypointName
38.153026	-107.760071	end	Ridgway
37.691976	-108.031578	via	Rico
37.288327	-107.880923	via	Durango
38.153026	-107.760071	via	Ridgway
</pre>

The result should be something like:
<pre>	
[{"lat":38.153026,"lng":-107.760071,"waypointType":"end","waypointName":"Ridgway"},
{"lat":37.691976,"lng":-108.031578,"waypointType":"via","waypointName":"Rico"},
{"lat":37.288327,"lng":-107.880923,"waypointType":"via","waypointName":"Durango"},
{"lat":38.153026,"lng":-107.760071,"waypointType":"via","waypointName":"Ridgway"}]
</pre>

<hr>

<h5>TRACK PROCESSING EXAMPLES</h5>

You should have something like this (columns will vary depending on your tools):
<pre>
type	time	lat	lng	name	desc	city	state	country
T	6/8/2019 12:00	38.153026	-107.760148	Day 1 - Sat, Jun 8, 2019				
T		38.153026	-107.760148					
T		38.151424	-107.760155					
T		38.151657	-107.765076					
T		38.156738	-107.769181	
</pre>
		
And should copy this section:
<pre>
lat	lng
38.153026	-107.760148
38.153026	-107.760148
38.151424	-107.760155
38.151657	-107.765076
38.156738	-107.769181
</pre>
		
The result should be something like:
<pre>
[{"lat":38.153026,"lng":-107.760148},
{"lat":38.153026,"lng":-107.760148},
{"lat":38.151424,"lng":-107.760155},
{"lat":38.151657,"lng":-107.765076},
{"lat":38.156738,"lng":-107.769181}]
</pre>