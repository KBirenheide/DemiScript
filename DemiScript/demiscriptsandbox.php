<?php
/**
* DemiScript Sandbox Layout
* @copyright   Copyright (C) 2017 Koray Birenheide
*/

function addStyleSheet($ref)
{
echo "<link href='$ref' rel='stylesheet' />";
}
function addScript($ref)
{
echo "<script src='$ref'></script>";
}

$jqueryurl = '../sites/demiscript/js/jquery.js';
$spectrumurl = '../sites/demiscript/js/spectrum.js';
$spectrumcss = '../sites/demiscript/js/spectrum.css';
$jqueryurl = '../sites/demiscript/js/jquery.js';
$juiurl = '../sites/demiscript/js/jqueryui/jquery-ui.js';
$juiurlcss = '../sites/demiscript/js/jqueryui/jquery-ui.css';
$fabricurl = '../sites/demiscript/js/fabric/fabric-4.5.0.js';
$fabriccjk = '../sites/demiscript/js/fabric/CJK-Fabric-Textbox.js';
$seamainurl = '../sites/demiscript/js/openseadragon/openseadragon-fabricadapted-v2.4.2.js';
$sea5url = '../sites/demiscript/js/openseadragon/openseadragon-fabricjs-overlay-newest.js';
$edobunko = '../sites/demiscript/css/demiscript.css';
$edoiconurl = '../sites/demiscript/css/icons';
$googleicons = 'https://fonts.googleapis.com/icon?family=Material+Icons';
$demiscript = '../sites/demiscript/js/demiscript/demiscript.js';
$demisandbox = '../sites/demiscript/js/demiscript/demisandbox.js';
?>

<html>
<head>
    <?php
    addStyleSheet($spectrumcss);
  	addStyleSheet($googlefontskokoro);
  	addStyleSheet($googlefontshannari);
  	addStyleSheet($juiurlcss);
  	addStyleSheet($googleicons);
  	addStyleSheet($googlefontsawarbarimincho);
    addStyleSheet($edobunko);  	
    ?>
</head>
<body>
    <?php
    addScript($jqueryurl);
    addScript($juiurl);
    addScript($fabricurl);
    addScript($fabriccjk);
    addScript($seamainurl);
    addScript($sea5url);
    addScript($demiscript);
    addScript($spectrumurl);
    ?>

<p>
You can use this DemiScript editor to load IIIF image documents via a IIIF manifest and transcribe and annotate them directly, or load transcribed documents via a DemiScript manifest.
</p>

<h3>Load External IIIF Tile Source (<em>manifest.json</em>):<input type="text" id="tilesourcer" /><button id="tilesourcebtn">Load</button></h3>
<h3>Load DemiScript Overlay Manifest:<input type="file" id="demifest"></h3>
<table style="width: 100%;">
  <tbody style="border: 0;">
  <tr>
    <td style="min-width: 20%;" ><b>White Overlay Slider:</b><br><div id='overlayslider' style="width: 95%;"> </div></td>
    <td style="min-width: 20%; margin-left: 5px;" ><b><button id="resetrotation" class="btngreensingle" style="padding: 0;">0°</button> Canvas Rotation Slider:</b><br><div id='rotateslider' style="width: calc(95%);"> </div></td>
  </tr>
  </tbody>
</table>
<div id="whiteoverlay" class="bleach"></div>
<div id="demiscriptviewer" class="viewwrapper">

</div>

<div id="pagesthumb"></div>
<div style="width: 100%; height: 5vh;"></div>

<?php
addScript($demisandbox);
?>
</body>
</html>
