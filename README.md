# cbsPoiMap
<h2>Chasing Blue Sky map showing our personal points of interest. </h2>

Live site at <a href="https://ChasingBlueSky.net/map">Chasing Blue Sky</a>. 
<br/><br/><i>2019-05-25 -- this is still under development, might not be working when you visit it. However, the code in GitHub is a working version and getting it to this point wins me major happiness points from, well, me!</i>

HTML5, javascript (v5), CSS

<h3>Working Functionality</h3>
<ul>
  <li>Generating base map as TERRAIN.</li>
  <li>Making some adjustments to default controls features and positioning.</li>
  <li>Adding some custom controls.
    <ul>
      <li>Credits control</li>
      <li>Location Info control
        <ul>
          <li>Click to get current location / start watching</li>
          <li>Click again to pan/zoom to current location</li>
       </ul>
      </li>
      <li>Testing On/Off control</li>
      <li>Traffic On/Off control</li>
    </ul>
  </li>
  <li>Adding custom markers from array in js file.</li>
  <li>Showing marker information in a side panel (vs. default popup window).</li>
  <li>Integration with Furkot Trip Planner (https://github.com/furkot/trip-planner).</li>
 </ul>
 
 <h3>TODOs Include (but are not limited to, and in no particular order)</h3>
 <ul>
  <li>Add markers to array from file or database instead of js file.
  <li>Create seperate function to process elevation data for markers in a file or database collection so do not need to pull that at runtime.</li>
  <li><a href="https://developers.google.com/maps/documentation/javascript/marker-clustering">Marker Clustering</a></li>
  <li>Pull strings out to ease maintenance.</li>
  <li>Hide marker info panel (a) by default, and (b) by click.</li>
  <li>Start showing/watching location by default. (Currently errors on page load because control is not yet present so deferring to user click to start.)
  <li>Adding some custom controls.
    <ul>
      <li>Filter on Categories control</li>
    </ul>
</ul>

<h3>References</h3> 
<ul>
  <li><b>Google Maps APIs</b>:
    <ul>
      <li><a href="https://developers.google.com/maps/documentation/javascript/tutorial">Maps JavaScript API</a></li>
      <li><a href="https://developers.google.com/maps/documentation/elevation/start">Maps Elevation API</a></li>
    </ul>
  </li>
    
<li><b>Fonts/Icons</b>:
  <ul>
    <li><a href="https://fontawesome.com/icons?d=gallery&m=free">Font Awesome Free</a></li>
    <li><a href="https://mapicons.mapsmarker.com/">Map Icons Collection</a></li>
    <li><a href="https://furkot.com/">Furkot</a> https://github.com/furkot/icon-fonts</li>
  </ul>
  </li>
  
  <li><b>User Messages</b>:
  <ul>
    <li><a href="http://izitoast.marcelodolza.com/">IziToast</a></li>
  </ul>
  </li>
  
 </ul>
<hr> 
<i>Note: This is my first time using GitHub and making something for potential public consumption, so be patient with me, it's very raw at this point.</i>

<hr>
<h3>License</h3>
Copyright (c) 2019

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.