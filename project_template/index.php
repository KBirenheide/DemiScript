<?php

foreach (new DirectoryIterator('articles') as $fileInfo) {
    if($fileInfo->isDot()) continue;
    $filename = $fileInfo->getFilename();
    $articledb[$filename] = file_get_contents("articles/".$filename);
}

$demidoc = file_get_contents("demidoc/demidoc.json");
$demimeta = json_decode($demidoc);

?>
<!DOCTYPE html>
<html>
<head>

  <meta http-equiv="content-type" content="text/html; charset=utf-8" />
   <link rel="icon" href="favicon.png" type="image/x-icon">
   <link rel="shortcut icon" href="favicon.png" type="image/x-icon">
	<title>The Annual Festivals and Shrine Visits of Edo</title>
  <link href="js/jqueryui/jquery-ui.min.css" rel="stylesheet" type="text/css" />
  <link href="js/spectrum.css" rel="stylesheet" type="text/css" />
  <link href="css/project.css" rel="stylesheet" type="text/css" />
  <link href="css/demiscript.css" rel="stylesheet" type="text/css" />
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" type="text/css" />
  <script src="js/jquery.js" type="text/javascript"></script>
  <script src="js/jqueryui/jquery-ui.min.js" type="text/javascript"></script>
  <script src="js/spectrum.js" type="text/javascript"></script>
  <script src="js/fabric/fabric-4.5.0.js" type="text/javascript"></script>
  <script src="js/fabric/CJK-Fabric-Textbox.js" type="text/javascript"></script>
  <script src="js/openseadragon/openseadragon-fabricadapted-v2.4.2.js" type="text/javascript"></script>
  <script src="js/openseadragon/openseadragon-fabricjs-overlay-newest.js" type="text/javascript"></script>
  <script src="js/demiscript/demiscript.js" type="text/javascript"></script>

</head>
<body>
<?php include("projectbody/header.html"); ?>
<table style="width: 100%;">
  <tbody style="border: 0;">
  <tr>
    <td id="mapanchor" style="min-width: 20%;" ><b>White Overlay Slider:</b><div id='overlayslider' style="width: 95%; display: inline-block;"> </div></td>
    <td style="min-width: 30%; margin-left: 5px;" ><b>Map Rotation Slider:</b><div id='rotateslider' style="width: 95%; display: inline-block;"> </div></td>
    <td style=""><img id="showinstructions" src="images/howtouse_rest.png" onmouseover="this.src = 'images/howtouse_hover.png'" onmouseout="this.src = 'images/howtouse_rest.png'" onclick="setinstructions()" style="display: none; cursor: pointer;"/></td>
  </tr>
  </tbody>
</table>
<div id="viewwrapper">
  <div id="OSViewer" class="documentzoomwrapper" ></div>
  <div class="plaintextwrapper">

  </div>
</div>

<div style="clear: both; height: 3px;"></div>

<?php include("projectbody/footer.html"); ?>

<div style="display: none;" id="instructionmanual">

  <h1>How to Use</h1>
  <p>Welcome to DemiScript!</p>
  <p>You have the following options available when browsing the interactive <em>Bunken Edo oezu</em>:</p>
  <ul style="line-height: 1.5;">
  <b>Layout</b>
  <li>The center left area is the interactive map.</li>
  <li>The center right area is the article and image document area.</li>
  <li>Located above the map are the overlay and rotation sliders. As well as the guided tour.</li>
  <li>Located below the map is the map key.</li>
  <li>When hovering over the map, a navigation bar appears on the top left.</li>
  <li>When hovering over the map, a small full view appears on the top right.</li>
  <br>
  <b>Controls</b>
  <li>Clicking on the map, pressing the "+" key, or clicking on the plus sign on the navigation bar will zoom into an area.</li>
  <li>Pressing the "-" key, or clicking the minus sign on the navigation bar will zoom out again.</li>
  <li>The "+" and "-" keys can be held down to continually zoom in or out.</li>
  <li>The mouse wheel can also be used to zoom in or out.</li>
  <li>Clicking and holding the left mouse button down allows the dragging around of the map.</li>
  <li>Using the arrow keys likewise moves the map around.</li>
  <li>Clicking on the rotation buttons in the navigation bar will rotate the map 90°.</li>
  <li>Clicking the home icon in the navigation bar will return the zoom level to default.</li>
  <li>Clicking the full-screen icon in the navigation bar will open the map in full-screen mode.</li>
  <li>Moving the overlay slider above the map to the left will make the overlay between map and map objects more transparent and hide all objects when set to 0. <em>Note: turning opacity up will make it easier to spot marked locations.</em></li>
  <li>Moving the rotation slider above the map will rotate the map freely.</li>
  <li>Famous locations have been marked on the map with colored polygons.</li>
  <li>Clicking on a polygon will replace this view with zoomable woodblock print images of the location as well as descriptive articles.</li>
  <li>Zoomable images in the article and image document area use the same controls as the map.</li>
  <br>
  <b>Mobile Users</b>
  <li>Horizontal viewing is recommended but not strictly necessary.</li>
  <li>Gestures can be used to navigate the map and zoomable images.</li>
  <li>Touching locations will open articles and image documents.</li>
  <li>Touching the map or zoomable images with two fingers and then pinching them together or moving them apart will change the zoom level</li>

  </ul>

</div>
<div class="bleach" id="whitesheet"></div>

<div style="clear: both; height: 3px;"></div>

<script>

function setinstructions()
{
  jQuery(".plaintextwrapper").html(jQuery("#instructionmanual").html());
  jQuery("#showinstructions").hide("slow");
}

setinstructions();

jQuery( document ).ready(function() {

var demiviewer = new DemiScript("OSViewer", "js/demiscript/", false);

var obj = <?php echo $demidoc; ?>;

obj.DemiData.forEach(function(page){
  page.objects.forEach(function(object){
    object.hasControls = false;
    object.hasBorders = false;
    object.lockMovementX = true;
    object.lockMovementY = true;
    object.lockScalingX = true;
    object.lockScalingY = true;
    object.lockRotation = true;
    object.editable = false;
  });
});

var listenertype = "object";
var listenerfunction = function(o) {
            jQuery(".plaintextwrapper").scrollTop(0);

            var retrievecomment = o.get("comment");

            if (typeof retrievecomment === 'string' && retrievecomment !== "undefined" && retrievecomment !== "NaN" && retrievecomment !== "null" && retrievecomment.length !== 0)
            {
              console.log(retrievecomment);
              jQuery("#showinstructions").show("slow");
              var buildddtip = retrievecomment;
              var getarticle = retrievecomment.match(/\[article\](.*?)\[\/article\]/g);
              if( getarticle !== null)
               {
                  var articles = "";
                  getarticle.forEach(function(e){
                        var artid = e.replace(/\[article\]/, "");
                        artid = artid.replace(/\[\/article\]/, "");

                        var retrieved = articledb[artid + ".html"];
                        articles = articles + retrieved;
                      });
                      buildddtip = buildddtip.replace(/\[article\](.*?)\[\/article\]/g, "");

                      jQuery(".plaintextwrapper").html((buildddtip + articles).replace(/\[iiif\](.*?)\[\/iiif\]/g, "<iframe style='width: 90%; height: 500px; margin-left: 5%; border: 1px solid black;' src='viewer.php?iiif=$1' ></iframe>"));

                  }
                  else
                  {
                     jQuery(".plaintextwrapper").html(buildddtip.replace(/\[article\](.*?)\[\/article\]/g, ""));
                  }
            }
            else
            {
              setinstructions();
            }
        };

demiviewer.constructviewer(true, obj, function() {demiviewer.appendCanvasListener({listener: listenertype, function: listenerfunction}); });

              var active = "none";

              function htmlEntities(str)
                      {
                          return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
                      }

                      jQuery("#rotateslider").slider({
                      min: -180,
                      max: 180,
                      slide: function(event, ui) {
                          demiviewer.viewer.viewport.setRotation(ui.value);
                      }
                      });

                      jQuery( "#overlayslider" ).slider({
                                  step: 0.05,
                                  value: 1,
                                  max: 1,
                                  min: 0,
                                  orientation: "horizontal",
                                  slide: function( event, ui ) {

                                  jQuery( ".bleach" ).css("opacity", ui.value);

                                  if(ui.value == 0)
                                    {
                                    jQuery(".lower-canvas").hide();
                                    }
                                    else
                                    {
                                    jQuery(".lower-canvas").show();
                                    }
                                  }
                                  });

                                    var slide = jQuery( "#overlayslider" ).slider("value");
                                    var i = 1;
                                    while(i < 475)
                                    {
                                      defog(i);
                                      i++;
                                    }

                                  function defog(i)
                                  {
                                    setTimeout(function() {
                                      slide = slide - 0.002;
                                      jQuery( "#overlayslider" ).slider("value", slide);
                                      jQuery( ".bleach" ).css("opacity", slide);
                                    }, 1500 + 8 * i);
                                  }

             var articledb = <?php echo json_encode($articledb); ?>;

            var activeobject;

});
</script>
</body>
</html>
